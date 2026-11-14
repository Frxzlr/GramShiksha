import { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Minus,
  Search,
  AlertCircle,
} from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { Skeleton } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from '../components/Table'

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
      <div className="w-full space-y-5 text-left">
        <Skeleton className="h-10 w-64 rounded-[6px]" />
        <Skeleton className="h-12 w-full rounded-[8px]" />
        <Skeleton className="h-96 w-full rounded-[8px]" />
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
          <Button variant="secondary" onClick={fetchData}>
            Retry Data Load
          </Button>
        }
      />
    )
  }

  const totalShortages = resources.filter((r) => (r.needed ?? 0) > (r.stock ?? 0)).length

  return (
    <div className="w-full space-y-5 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08] dark:border-white/[0.08] border-zinc-200">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight text-white dark:text-white text-zinc-900">
            Resource Inventory
          </h2>
          <p className="text-[13px] text-zinc-400 dark:text-zinc-400 text-zinc-600 mt-0.5">
            Audit equipment, digital tablets, and instructional materials across rural clusters
          </p>
        </div>

        <div className="flex items-center gap-2">
          {totalShortages > 0 ? (
            <Badge variant="red" size="sm" dot>
              {totalShortages} {totalShortages === 1 ? 'Deficit' : 'Deficits'} Active
            </Badge>
          ) : (
            <Badge variant="emerald" size="sm" dot>
              All Optimal
            </Badge>
          )}
          <Badge variant="neutral" size="sm">
            {resources.length} Items Total
          </Badge>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-[#111214] dark:bg-[#111214] bg-white border border-white/[0.08] dark:border-white/[0.08] border-zinc-200 rounded-[8px]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-400 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search equipment or school..."
            className="w-full h-9 bg-transparent rounded-[6px] pl-9 pr-3 text-[13px] text-white dark:text-white text-zinc-900 placeholder:text-zinc-500 border border-transparent focus:border-white/[0.14] dark:focus:border-white/[0.14] focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            id="school-filter"
            value={selectedSchoolId}
            onChange={(e) => setSelectedSchoolId(e.target.value)}
            className="h-9 bg-[#16181c] dark:bg-[#16181c] bg-zinc-100 border border-white/[0.08] dark:border-white/[0.08] border-zinc-200 rounded-[6px] px-3 text-[13px] text-white dark:text-white text-zinc-900 focus:outline-none focus:border-white/[0.16] cursor-pointer"
            aria-label="Filter by school"
          >
            <option value="">All Schools ({schools.length})</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dense Data Table */}
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Institution</TableHeaderCell>
              <TableHeaderCell>Equipment Item</TableHeaderCell>
              <TableHeaderCell className="text-center">Live Stock</TableHeaderCell>
              <TableHeaderCell className="text-center">Required</TableHeaderCell>
              <TableHeaderCell className="text-right">Balance</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {filteredResources.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-[13px] text-zinc-500">
                  No equipment records matching the selected filter.
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
                  <TableRow key={resource.id} isShortage={hasGap}>
                    {/* School */}
                    <TableCell className="font-medium text-white dark:text-white text-zinc-900 whitespace-nowrap">
                      {schoolName}
                    </TableCell>

                    {/* Item */}
                    <TableCell className="text-zinc-300 dark:text-zinc-300 text-zinc-700 capitalize whitespace-nowrap">
                      {itemName}
                    </TableCell>

                    {/* Stock Stepper */}
                    <TableCell className="text-center whitespace-nowrap">
                      <div className="inline-flex items-center justify-center gap-1 bg-[#16181c] dark:bg-[#16181c] bg-zinc-100 p-0.5 rounded-[6px] border border-white/[0.08] dark:border-white/[0.08] border-zinc-200">
                        <button
                          type="button"
                          onClick={() => handleStockChange(resource.id, -1)}
                          disabled={stock <= 0}
                          className="w-6 h-6 rounded-[4px] bg-transparent hover:bg-white/[0.08] dark:hover:bg-white/[0.08] hover:bg-zinc-200 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                          aria-label="Decrease stock"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <span className="w-8 text-center font-mono tabular-nums font-semibold text-white dark:text-white text-zinc-900 text-xs">
                          {stock}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleStockChange(resource.id, 1)}
                          className="w-6 h-6 rounded-[4px] bg-transparent hover:bg-white/[0.08] dark:hover:bg-white/[0.08] hover:bg-zinc-200 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Increase stock"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </TableCell>

                    {/* Needed */}
                    <TableCell mono className="text-center font-medium text-zinc-400">
                      {needed}
                    </TableCell>

                    {/* Balance */}
                    <TableCell className="text-right whitespace-nowrap">
                      {hasGap ? (
                        <Badge variant="red" size="sm" dot className="font-mono font-medium">
                          Deficit: -{gap}
                        </Badge>
                      ) : (
                        <Badge variant="emerald" size="sm" dot className="font-mono font-medium">
                          Surplus: +{stock - needed}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
