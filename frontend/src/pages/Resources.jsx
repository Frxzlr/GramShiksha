import { useState, useEffect, useMemo } from 'react'

const fetchApi = async (url, options) => {
  try {
    const res = await fetch(url, options)
    const ct = res.headers.get('content-type') || ''
    if (res.ok && (ct.includes('application/json') || options?.method === 'PATCH')) return res
  } catch {
    // fallback
  }
  return fetch(`http://localhost:4000${url}`, options)
}

export default function Resources() {
  const [resources, setResources] = useState([])
  const [schools, setSchools] = useState([])
  const [selectedSchoolId, setSelectedSchoolId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [resResources, resSchools] = await Promise.all([
        fetchApi('/api/resources'),
        fetchApi('/api/schools')
      ])

      if (!resResources.ok) {
        throw new Error(`Failed to fetch resources (Status ${resResources.status})`)
      }
      if (!resSchools.ok) {
        throw new Error(`Failed to fetch schools (Status ${resSchools.status})`)
      }

      const [resourcesData, schoolsData] = await Promise.all([
        resResources.json(),
        resSchools.json()
      ])

      setResources(Array.isArray(resourcesData) ? resourcesData : [])
      setSchools(Array.isArray(schoolsData) ? schoolsData : [])
    } catch (err) {
      console.error('Error fetching resource data:', err)
      setError(err.message || 'Unable to load resource data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false
    const loadData = async () => {
      try {
        const [resResources, resSchools] = await Promise.all([
          fetchApi('/api/resources'),
          fetchApi('/api/schools')
        ])

        if (!resResources.ok) {
          throw new Error(`Failed to fetch resources (Status ${resResources.status})`)
        }
        if (!resSchools.ok) {
          throw new Error(`Failed to fetch schools (Status ${resSchools.status})`)
        }

        const [resourcesData, schoolsData] = await Promise.all([
          resResources.json(),
          resSchools.json()
        ])

        if (!ignore) {
          setResources(Array.isArray(resourcesData) ? resourcesData : [])
          setSchools(Array.isArray(schoolsData) ? schoolsData : [])
          setLoading(false)
        }
      } catch (err) {
        if (!ignore) {
          console.error('Error fetching resource data:', err)
          setError(err.message || 'Unable to load resource data')
          setLoading(false)
        }
      }
    }

    loadData()
    return () => {
      ignore = true
    }
  }, [])

  // Create lookup map from school ID to school name
  const schoolMap = useMemo(() => {
    const map = {}
    schools.forEach((school) => {
      map[school.id] = school.name
    })
    return map
  }, [schools])

  // Filter resources client-side by selected school ID
  const filteredResources = useMemo(() => {
    if (!selectedSchoolId) return resources
    return resources.filter((item) => String(item.schoolId) === String(selectedSchoolId))
  }, [resources, selectedSchoolId])

  // Handle stock increment/decrement with optimistic UI updates
  const handleStockChange = async (id, delta) => {
    const currentItem = resources.find((item) => item.id === id)
    if (!currentItem) return

    const previousStock = currentItem.stock ?? 0
    const newStock = Math.max(0, previousStock + delta)

    if (newStock === previousStock) return

    // Optimistic UI update
    setResources((prev) =>
      prev.map((item) => (item.id === id ? { ...item, stock: newStock } : item))
    )

    try {
      const response = await fetchApi(`/api/resources/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stock: newStock })
      })

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`)
      }
    } catch (err) {
      console.error('Failed to update stock on server:', err)
      // Revert optimistic update on failure
      setResources((prev) =>
        prev.map((item) => (item.id === id ? { ...item, stock: previousStock } : item))
      )
    }
  }

  if (loading) {
    return (
      <div className="w-full py-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-700 font-semibold text-base">Loading resource tracker...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full my-8 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-red-200 text-center space-y-4">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
          !
        </div>
        <h2 className="text-xl font-bold text-gray-900">Failed to Load Resources</h2>
        <p className="text-base text-red-600">{error}</p>
        <button
          onClick={fetchData}
          className="min-h-[44px] px-6 py-2.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-semibold rounded-xl text-base transition cursor-pointer shadow-xs"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6 text-left">
      {/* Header & Filter Card */}
      <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 border border-green-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Resource Tracker</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Track educational inventory, identify shortages, and adjust supplies in real time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <label htmlFor="school-filter" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
            School:
          </label>
          <select
            id="school-filter"
            value={selectedSchoolId}
            onChange={(e) => setSelectedSchoolId(e.target.value)}
            className="min-h-[44px] bg-white border border-gray-300 rounded-xl px-4 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-xs cursor-pointer font-medium"
          >
            <option value="">All Schools</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resources Table Card: horizontal scroll on small screens, striped rows, red-tinted rows for gaps */}
      <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[560px]">
            <thead>
              <tr className="border-b border-gray-200 bg-green-100/60 text-xs sm:text-sm uppercase tracking-wider text-green-950 font-bold">
                <th scope="col" className="px-5 py-4">School</th>
                <th scope="col" className="px-5 py-4">Item</th>
                <th scope="col" className="px-5 py-4 text-center">Stock</th>
                <th scope="col" className="px-5 py-4 text-center">Needed</th>
                <th scope="col" className="px-5 py-4 text-center">Gap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-base">
              {filteredResources.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500 text-base">
                    No resources found for the selected filter.
                  </td>
                </tr>
              ) : (
                filteredResources.map((resource) => {
                  const schoolName =
                    schoolMap[resource.schoolId] || resource.schoolName || `School #${resource.schoolId}`
                  const itemName = resource.item || resource.name || 'Unnamed Resource'
                  const stock = resource.stock ?? 0
                  const needed = resource.needed ?? 0
                  const gap = needed - stock
                  const hasGap = gap > 0

                  return (
                    <tr
                      key={resource.id}
                      className={`transition-colors ${
                        hasGap
                          ? 'bg-red-50/80 hover:bg-red-100/70 border-l-4 border-l-red-500'
                          : 'even:bg-gray-50/50 hover:bg-green-50/40'
                      }`}
                    >
                      {/* School */}
                      <td className="px-5 py-4 font-semibold text-gray-900 whitespace-nowrap">
                        {schoolName}
                      </td>

                      {/* Item */}
                      <td className="px-5 py-4 text-gray-800 capitalize whitespace-nowrap">
                        {itemName}
                      </td>

                      {/* Stock with inline +/- buttons: large tap targets (min 44px) */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStockChange(resource.id, -1)}
                            disabled={stock <= 0}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-800 font-bold hover:bg-green-50 hover:border-green-500 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed text-lg shadow-xs transition cursor-pointer"
                            aria-label="Decrease stock"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-bold text-gray-900 tabular-nums text-lg">
                            {stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStockChange(resource.id, 1)}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-800 font-bold hover:bg-green-50 hover:border-green-500 active:scale-95 text-lg shadow-xs transition cursor-pointer"
                            aria-label="Increase stock"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Needed */}
                      <td className="px-5 py-4 text-center font-semibold text-gray-800 whitespace-nowrap tabular-nums text-base">
                        {needed}
                      </td>

                      {/* Gap */}
                      <td className="px-5 py-4 text-center whitespace-nowrap tabular-nums">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold min-h-[30px] ${
                            hasGap
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : 'bg-green-100 text-green-800 border border-green-300'
                          }`}
                        >
                          {gap}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
