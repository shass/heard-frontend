'use client'

import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/loading-states'
import { BarChart3, Users, FileText, Settings } from 'lucide-react'
import { SurveyManagement } from '../SurveyManagement'
import { AdminAuthWrapper } from '@/components/admin/admin-auth-wrapper'
import { DashboardHeader } from './DashboardHeader'
import { OverviewTab } from './OverviewTab'
import { SettingsTab } from './SettingsTab'
import { useAdminDashboard } from './hooks/useAdminDashboard'

export function AdminDashboard() {
  const {
    activeTab,
    setActiveTab,
    stats,
    loading,
    error
  } = useAdminDashboard()

  // Loading and error states are handled by the wrapper during auth check
  // This loading state is only for dashboard data
  if (loading) {
    return (
      <AdminAuthWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </AdminAuthWrapper>
    )
  }

  if (error) {
    return (
      <AdminAuthWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Dashboard</h1>
            <p className="text-gray-600">{error.message}</p>
          </div>
        </div>
      </AdminAuthWrapper>
    )
  }

  return (
    <AdminAuthWrapper>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <DashboardHeader />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="surveys">
                <FileText className="w-4 h-4 mr-2" />
                Surveys
              </TabsTrigger>
              <TabsTrigger value="overview">
                <BarChart3 className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <OverviewTab stats={stats} />
            </TabsContent>

            {/* Surveys Tab */}
            <TabsContent value="surveys">
              <SurveyManagement />
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <SettingsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminAuthWrapper>
  )
}