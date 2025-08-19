'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Users, AlertCircle } from 'lucide-react'

export default function CandidatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Candidates</h1>
        <p className="text-gray-600 mt-1">
          View and manage evaluated candidates
        </p>
      </div>

      <Card>
        <CardContent className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates yet</h3>
          <p className="text-gray-600 mb-4">
            Candidates will appear here after resume evaluation
          </p>
          <div className="flex items-center justify-center text-amber-600 bg-amber-50 p-3 rounded-lg">
            <AlertCircle className="mr-2 h-4 w-4" />
            <span className="text-sm">Feature requires upload system implementation</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}