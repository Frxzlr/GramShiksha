import { env } from '../config/env.js'

// Fallback lesson used when no AI key is configured or the AI call fails,
// so the teacher's screen never breaks.
const demoLesson = {
  mocked: true,
  title: 'Force and Motion',
  summary:
    'A force is a push or a pull that can change the motion or shape of an object. Friction is a resistive force that opposes motion between surfaces sliding against each other. Gravity pulls objects toward the center of the Earth and gives them weight. Balanced forces keep an object at rest or moving at a constant speed.',
  summary_hi:
    'बल एक धक्का या खिंचाव है जो किसी वस्तु की गति या आकार को बदल सकता है। घर्षण एक विरोधी बल है जो एक दूसरे के संपर्क में आने वाली सतहों की गति को रोकता है। गुरुत्वाकर्षण वस्तुओं को पृथ्वी के केंद्र की ओर खींचता है और उन्हें भार देता है। संतुलित बल किसी वस्तु को स्थिर या एक समान गति में रखते हैं।',
  quiz: [
    { q: 'What is a force?', options: ['A push or a pull', 'Only heat', 'Sound energy'], answer: 0 },
    { q: 'Which force slows down a moving bicycle when you stop pedaling?', options: ['Magnetic force', 'Friction', 'Electric force'], answer: 1 },
    { q: 'What force pulls dropped objects toward the ground?', options: ['Friction', 'Tension', 'Gravity'], answer: 2 },
    { q: 'What happens when balanced forces act on a stationary rock?', options: ['It remains at rest', 'It flies upward', 'It explodes'], answer: 0 },
    { q: 'Why do rough surfaces produce more friction than smooth surfaces?', options: ['They are colder', 'Microscopic bumps interlock more', 'They have less mass'], answer: 1 },
  ],
}

const AI_TIMEOUT_MS = 20_000

const buildPrompt = (text) => `Act as a teacher for rural Indian students in classes 6-8 and reply with ONLY valid JSON of this exact shape:
{"title": "string", "summary": "string (4-5 simple sentences, easy English)", "summary_hi": "string (same summary in simple Hindi)",
 "quiz": [{"q": "string", "options": ["string", "string", "string"], "answer": 0}]}
The quiz must contain exactly 5 questions with exactly 3 options each; answer is the index 0, 1 or 2 of the correct option. No markdown, no text outside the JSON.

Chapter text:
${text}`

async function callAi(prompt, signal) {
  if (env.GEMINI_API_KEY) {
    // The key goes in a header, not the URL, so it never appears in logs.
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    })
    if (!res.ok) throw new Error(`Gemini API status ${res.status}`)
    return (await res.json())?.candidates?.[0]?.content?.parts?.[0]?.text
  }
  if (env.ANTHROPIC_API_KEY) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal,
      headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }),
    })
    if (!res.ok) throw new Error(`Anthropic API status ${res.status}`)
    return (await res.json())?.content?.[0]?.text
  }
  return null
}

function parseLesson(raw) {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end <= start) throw new Error('No JSON object in AI output')
  const p = JSON.parse(raw.slice(start, end + 1))
  const ok =
    typeof p?.title === 'string' && p.title.trim() &&
    typeof p?.summary === 'string' && p.summary.trim() &&
    typeof p?.summary_hi === 'string' && p.summary_hi.trim() &&
    Array.isArray(p?.quiz) && p.quiz.length === 5 &&
    p.quiz.every((q) =>
      typeof q?.q === 'string' && q.q.trim() &&
      Array.isArray(q?.options) && q.options.length === 3 &&
      q.options.every((o) => typeof o === 'string' && o.trim()) &&
      Number.isInteger(q?.answer) && q.answer >= 0 && q.answer <= 2)
  if (!ok) throw new Error('AI output failed validation')
  return {
    title: p.title.trim(),
    summary: p.summary.trim(),
    summary_hi: p.summary_hi.trim(),
    quiz: p.quiz.map((q) => ({ q: q.q.trim(), options: q.options.map((o) => o.trim()), answer: q.answer })),
  }
}

export async function generateLesson(text) {
  // Never wait on the AI provider forever: abort after 20 s and use the demo.
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)
  try {
    const raw = await callAi(buildPrompt(text.slice(0, 8000)), controller.signal)
    if (!raw) return demoLesson
    return parseLesson(raw)
  } catch (err) {
    console.error('[ai] generation failed, using demo lesson:', err.message)
    return demoLesson
  } finally {
    clearTimeout(timer)
  }
}
