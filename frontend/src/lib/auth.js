// Client side of sign-in.
// - The access token lives ONLY in this module's memory (not localStorage),
//   so injected scripts can't read it from storage and it vanishes on reload.
// - The refresh token is an httpOnly cookie the browser sends to /api only;
//   this code never sees it. On reload we call /auth/refresh to get a new
//   access token from it.

let accessToken = null
let currentUser = null
const listeners = new Set()
const FLAG = 'gs_has_session' // "a refresh cookie probably exists"

const notify = () => listeners.forEach((fn) => fn(currentUser))

export const getUser = () => currentUser

export function onAuthChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function setFlag(on) {
  try {
    if (on) localStorage.setItem(FLAG, '1')
    else localStorage.removeItem(FLAG)
  } catch {}
}

function setSession(data) {
  accessToken = data.accessToken
  currentUser = data.user
  setFlag(true)
  notify()
}

function clearSession() {
  accessToken = null
  currentUser = null
  setFlag(false)
  notify()
}

const post = (url, body) =>
  fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

export async function errorMessage(res, fallback = 'Something went wrong') {
  try {
    const data = await res.json()
    return data.error || fallback
  } catch {
    return fallback
  }
}

export async function login(email, password) {
  const res = await post('/api/v1/auth/login', { email, password })
  if (!res.ok) throw new Error(await errorMessage(res, 'Sign in failed'))
  setSession(await res.json())
  return currentUser
}

let refreshing = null
// Several requests may get a 401 at once; they all share one refresh call.
export function refreshSession() {
  if (!refreshing) {
    refreshing = post('/api/v1/auth/refresh')
      .then(async (res) => {
        if (!res.ok) {
          clearSession()
          return false
        }
        setSession(await res.json())
        return true
      })
      .catch(() => false)
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

// Called once when the app starts: silently restore a session if one exists.
export async function restoreSession() {
  let hasFlag = false
  try {
    hasFlag = localStorage.getItem(FLAG) === '1'
  } catch {}
  if (hasFlag) await refreshSession()
}

export async function logout() {
  try {
    await post('/api/v1/auth/logout')
  } finally {
    clearSession()
  }
}

// fetch() that adds "Authorization: Bearer <token>" when signed in. If the
// access token has expired (401), it refreshes once and retries.
export async function authFetch(url, options = {}) {
  const send = () =>
    fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.headers || {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    })

  let res = await send()
  if (res.status === 401 && accessToken && (await refreshSession())) {
    res = await send()
  }
  return res
}
