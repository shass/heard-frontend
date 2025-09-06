import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function SettingsTab() {
  return (
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
  )
}