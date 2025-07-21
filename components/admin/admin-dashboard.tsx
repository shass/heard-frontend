'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAdminDashboardStats } from '@/lib/api/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/loading-states'
import {
  PlusCircle,
  BarChart3,
  Users,
  FileText,
  TrendingUp,
  Eye,
  Settings
} from 'lucide-react'
import { SurveyManagement } from './survey-management'
import { WhitelistManagement } from './whitelist-management'
import { AdminRoute } from '@/components/auth/admin-route'

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  const { data: stats, loading, error } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: getAdminDashboardStats,
    refetchInterval: 60000 // Refresh every minute
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Dashboard</h1>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage surveys, whitelists, and monitor platform activity
                </p>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('surveys')}
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  New Survey
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">
                <BarChart3 className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="surveys">
                <FileText className="w-4 h-4 mr-2" />
                Surveys
              </TabsTrigger>
              <TabsTrigger value="whitelists">
                <Users className="w-4 h-4 mr-2" />
                Whitelists
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Surveys</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalSurveys || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.activeSurveys || 0} active
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalResponses || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.monthlyResponses || 0} this month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Registered users
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Surveys</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.activeSurveys || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Currently available
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Top Surveys */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Surveys</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats?.topSurveys?.map((survey) => (
                      <div key={survey.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{survey.name}</h4>
                          <p className="text-sm text-gray-600">{survey.responseCount} responses</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">
                            {survey.rewardAmount} ETH
                          </Badge>
                        </div>
                      </div>
                    )) || (
                      <p className="text-center text-gray-500 py-8">No surveys data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Surveys Tab */}
            <TabsContent value="surveys">
              <SurveyManagement />
            </TabsContent>

            {/* Whitelists Tab */}
            <TabsContent value="whitelists">
              <WhitelistManagement />
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-4 border-b">
                      <div>
                        <h4 className="font-medium">Default HeardPoints Reward</h4>
                        <p className="text-sm text-gray-600">Default points awarded for survey completion</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                    <div className="flex items-center justify-between py-4 border-b">
                      <div>
                        <h4 className="font-medium">Survey Approval Required</h4>
                        <p className="text-sm text-gray-600">Require admin approval for new surveys</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                    <div className="flex items-center justify-between py-4">
                      <div>
                        <h4 className="font-medium">Email Notifications</h4>
                        <p className="text-sm text-gray-600">Send notifications for admin events</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminRoute>
  )
}
