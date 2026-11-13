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
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium text-sm">Loading resource tracker...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <div className="bg-white p-6 md:p-8 rounded-xl shadow max-w-md w-full border border-red-100 text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
            !
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Failed to Load Resources</h2>
          <p className="text-sm text-red-600 mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-left">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Resource Tracker</h2>
            <p className="text-sm text-gray-600 mt-1">
              Track educational inventory, identify shortages, and adjust supplies in real time.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <label htmlFor="school-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              School:
            </label>
            <select
              id="school-filter"
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm cursor-pointer"
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

        {/* Resources Table Card */}
        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/75 text-xs uppercase tracking-wider text-gray-600">
                  <th scope="col" className="px-6 py-3.5 font-semibold">School</th>
                  <th scope="col" className="px-6 py-3.5 font-semibold">Item</th>
                  <th scope="col" className="px-6 py-3.5 font-semibold text-center">Stock</th>
                  <th scope="col" className="px-6 py-3.5 font-semibold text-center">Needed</th>
                  <th scope="col" className="px-6 py-3.5 font-semibold text-center">Gap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredResources.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
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
                          hasGap ? 'bg-red-50 hover:bg-red-100/60' : 'hover:bg-gray-50'
                        }`}
                      >
                        {/* School */}
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                          {schoolName}
                        </td>

                        {/* Item */}
                        <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                          {itemName}
                        </td>

                        {/* Stock with inline +/- buttons */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleStockChange(resource.id, -1)}
                              disabled={stock <= 0}
                              className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-700 font-bold hover:bg-gray-100 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-xs"
                              aria-label="Decrease stock"
                            >
                              -
                            </button>
                            <span className="w-10 text-center font-semibold text-gray-900 tabular-nums">
                              {stock}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleStockChange(resource.id, 1)}
                              className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-700 font-bold hover:bg-gray-100 active:scale-95 transition cursor-pointer shadow-xs"
                              aria-label="Increase stock"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Needed */}
                        <td className="px-6 py-4 text-center font-medium text-gray-700 whitespace-nowrap tabular-nums">
                          {needed}
                        </td>

                        {/* Gap */}
                        <td className="px-6 py-4 text-center whitespace-nowrap tabular-nums">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              hasGap
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
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
    </div>
  )
}
