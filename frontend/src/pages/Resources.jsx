import { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Minus,
  Search,
  Filter,
  AlertCircle,
  Building,
} from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { Skeleton } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [resResources, resSchools] = await Promise.all([
        fetchApi('/api/resources'),
        fetchApi('/api/schools'),
      ])

      if (!resResources.ok) {
        throw new Error(`Failed to fetch resources (Status ${resResources.status})`)
      }
      if (!resSchools.ok) {
        throw new Error(`Failed to fetch schools (Status ${resSchools.status})`)
      }

      const [resourcesData, schoolsData] = await Promise.all([
        resResources.json(),
        resSchools.json(),
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
          fetchApi('/api/schools'),
        ])

        if (!resResources.ok) {
          throw new Error(`Failed to fetch resources (Status ${resResources.status})`)
        }
        if (!resSchools.ok) {
          throw new Error(`Failed to fetch schools (Status ${resSchools.status})`)
        }

        const [resourcesData, schoolsData] = await Promise.all([
          resResources.json(),
          resSchools.json(),
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

  // Filter resources client-side by school ID and search query
  const filteredResources = useMemo(() => {
    return resources.filter((item) => {
      const matchSchool = selectedSchoolId
        ? String(item.schoolId) === String(selectedSchoolId)
        : true

      const itemName = (item.item || item.name || '').toLowerCase()
      const schoolName = (schoolMap[item.schoolId] || '').toLowerCase()
      const query = searchQuery.trim().toLowerCase()

      const matchQuery = query ? itemName.includes(query) || schoolName.includes(query) : true

      return matchSchool && matchQuery
    })
  }, [resources, selectedSchoolId, searchQuery, schoolMap])

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
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stock: newStock }),
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
      <div className="w-full space-y-6 text-left">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Failed to Load Resources"
        description={error}
        action={
          <Button variant="primary" onClick={fetchData}>
            Retry Data Load
          </Button>
        }
      />
    )
  }

  const totalShortages = resources.filter((r) => (r.needed ?? 0) > (r.stock ?? 0)).length

  return (
    <div className="w-full space-y-6 text-left">
      {/* Header & Filter Card */}
      <div className="glass-card gradient-border rounded-2xl p-5 sm:p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="cyan" size="sm" dot>
                Inventory Engine
              </Badge>
              {totalShortages > 0 && (
                <Badge variant="red" size="sm">
                  {totalShortages} Deficits Active
                </Badge>
              )}
            </div>
            <h2 className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight dark:text-white text-slate-900">
              School Resource & Equipment Tracker
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Audit lab apparatus, tablets, and textbooks. Optimistic stock steppers synchronize immediately.
            </p>
          </div>

          {/* Pill Controls: Search & School Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Pill */}
            <div className="relative min-w-[180px] sm:min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search equipment..."
                className="w-full min-h-[44px] bg-white/[0.04] dark:bg-white/[0.04] bg-slate-100 rounded-full pl-9 pr-4 py-2 text-xs sm:text-sm dark:text-white text-slate-900 border border-white/10 dark:border-white/10 border-slate-300 focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-500"
              />
            </div>

            {/* School Filter Pill */}
            <div className="relative">
              <select
                id="school-filter"
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="min-h-[44px] bg-white/[0.04] dark:bg-white/[0.04] bg-slate-100 border border-white/10 dark:border-white/10 border-slate-300 rounded-full px-4 py-2 text-xs sm:text-sm dark:text-white text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer font-medium appearance-none pr-8 shadow-xs"
                aria-label="Filter by school"
              >
                <option value="" className="bg-[#111a2e] text-white">
                  All Schools ({schools.length})
                </option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id} className="bg-[#111a2e] text-white">
                    {school.name}
                  </option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Modern Data Table Card with Sticky Header */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[620px]">
            {/* Sticky Header */}
            <thead className="sticky top-0 z-20 bg-[#111a2e]/95 dark:bg-[#111a2e]/95 bg-slate-100/95 backdrop-blur-md border-b border-white/[0.08] dark:border-white/[0.08] border-slate-200">
              <tr className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th scope="col" className="px-5 py-3.5">
                  Institution
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Item Description
                </th>
                <th scope="col" className="px-5 py-3.5 text-center">
                  Live Stock Level
                </th>
                <th scope="col" className="px-5 py-3.5 text-center">
                  Required
                </th>
                <th scope="col" className="px-5 py-3.5 text-center">
                  Status
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-white/[0.04] dark:divide-white/[0.04] divide-slate-100 text-sm">
              {filteredResources.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No equipment records matching the selected query.
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
                      className={`transition-colors duration-150 ${
                        hasGap
                          ? 'bg-rose-500/[0.04] dark:bg-rose-500/[0.04] bg-rose-50/50 hover:bg-rose-500/[0.08]'
                          : 'hover:bg-white/[0.02] dark:hover:bg-white/[0.02] hover:bg-slate-50'
                      }`}
                    >
                      {/* School */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="font-medium dark:text-white text-slate-900">
                            {schoolName}
                          </span>
                        </div>
                      </td>

                      {/* Item */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-medium text-slate-300 dark:text-slate-300 text-slate-800 capitalize">
                          {itemName}
                        </span>
                      </td>

                      {/* Stock Stepper */}
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <div className="inline-flex items-center justify-center gap-1.5 bg-white/[0.04] dark:bg-white/[0.04] bg-slate-100/80 p-1 rounded-xl border border-white/10 dark:border-white/10 border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleStockChange(resource.id, -1)}
                            disabled={stock <= 0}
                            className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
                            aria-label="Decrease stock"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <span className="w-10 text-center font-heading font-bold dark:text-white text-slate-900 tabular-nums text-sm">
                            {stock}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleStockChange(resource.id, 1)}
                            className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                            aria-label="Increase stock"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Needed */}
                      <td className="px-5 py-4 text-center whitespace-nowrap font-semibold text-slate-400 tabular-nums">
                        {needed}
                      </td>

                      {/* Gap / Shortage Chip */}
                      <td className="px-5 py-4 text-center whitespace-nowrap tabular-nums">
                        {hasGap ? (
                          <Badge variant="red" size="sm" className="font-bold">
                            Shortage: {gap}
                          </Badge>
                        ) : (
                          <Badge variant="emerald" size="sm" className="font-medium">
                            Optimal
                          </Badge>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
