'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useRoles } from '@/hooks/use-roles'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, RotateCcw } from 'lucide-react'

interface EvaluationFiltersProps {
  defaultRoleId?: string | null
  defaultSessionId?: string | null
}

export function EvaluationFilters({ defaultRoleId, defaultSessionId }: EvaluationFiltersProps) {
  const { roles } = useRoles()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [selectedRole, setSelectedRole] = useState(defaultRoleId || 'all')
  const [scoreRange, setScoreRange] = useState('all')
  const [sortBy, setSortBy] = useState('score_desc')

  const applyFilters = () => {
    const params = new URLSearchParams()
    
    if (selectedRole && selectedRole !== 'all') params.set('role', selectedRole)
    if (defaultSessionId) params.set('session', defaultSessionId)
    if (scoreRange !== 'all') params.set('score', scoreRange)
    if (sortBy !== 'score_desc') params.set('sort', sortBy)

    router.push(`/dashboard/results?${params.toString()}`)
  }

  const clearFilters = () => {
    setSelectedRole('all')
    setScoreRange('all')
    setSortBy('score_desc')
    router.push('/dashboard/results')
  }

  useEffect(() => {
    const role = searchParams.get('role')
    const score = searchParams.get('score')
    const sort = searchParams.get('sort')
    
    if (role) setSelectedRole(role)
    if (score) setScoreRange(score)
    if (sort) setSortBy(sort)
  }, [searchParams])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Filter className="mr-2 h-5 w-5" />
          Filter & Sort Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Role Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Job Role</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Score Range */}
          <div>
            <label className="text-sm font-medium mb-2 block">Score Range</label>
            <Select value={scoreRange} onValueChange={setScoreRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All scores</SelectItem>
                <SelectItem value="90-100">Excellent (90-100)</SelectItem>
                <SelectItem value="80-89">Very Good (80-89)</SelectItem>
                <SelectItem value="70-79">Good (70-79)</SelectItem>
                <SelectItem value="60-69">Average (60-69)</SelectItem>
                <SelectItem value="0-59">Below Average (0-59)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-sm font-medium mb-2 block">Sort By</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score_desc">Highest Score</SelectItem>
                <SelectItem value="score_asc">Lowest Score</SelectItem>
                <SelectItem value="date_desc">Newest First</SelectItem>
                <SelectItem value="date_asc">Oldest First</SelectItem>
                <SelectItem value="name_asc">Name A-Z</SelectItem>
                <SelectItem value="name_desc">Name Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-end space-x-2">
            <Button onClick={applyFilters} className="flex-1">
              Apply
            </Button>
            <Button onClick={clearFilters} variant="outline" size="icon">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}