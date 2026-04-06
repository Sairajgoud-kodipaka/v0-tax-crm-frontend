'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    companyName: 'TaxCRM Professional Services',
    email: 'info@taxcrm.com',
    phone: '(555) 123-4567',
    address: '123 Tax Street, Finance City, ST 12345',
    taxSeasonStart: 1,
    taxSeasonEnd: 4,
    workingDays: [1, 2, 3, 4, 5],
  });

  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const handleChange = (field: string, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setUnsavedChanges(true);
  };

  const handleSave = () => {
    setUnsavedChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your company and system settings</p>
        </div>
        {unsavedChanges && (
          <Button className="bg-primary text-primary-foreground gap-2" onClick={handleSave}>
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        )}
      </div>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Your business details and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Company Name</label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Phone</label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Address</label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tax Season Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Season Configuration</CardTitle>
          <CardDescription>Set your tax season dates and working days</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Season Start (Month)</label>
              <select
                value={settings.taxSeasonStart}
                onChange={(e) => handleChange('taxSeasonStart', parseInt(e.target.value))}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                  <option key={month} value={month}>
                    {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Season End (Month)</label>
              <select
                value={settings.taxSeasonEnd}
                onChange={(e) => handleChange('taxSeasonEnd', parseInt(e.target.value))}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                  <option key={month} value={month}>
                    {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">Working Days</label>
            <div className="flex gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                <button
                  key={day}
                  onClick={() => {
                    const dayNum = index + 1 === 7 ? 0 : index + 1;
                    if (settings.workingDays.includes(dayNum)) {
                      handleChange('workingDays', settings.workingDays.filter((d) => d !== dayNum));
                    } else {
                      handleChange('workingDays', [...settings.workingDays, dayNum]);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    settings.workingDays.includes(index + 1 === 7 ? 0 : index + 1)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Configure how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Email Notifications', description: 'Receive updates via email' },
            { label: 'Desktop Notifications', description: 'Pop-up alerts in browser' },
            { label: 'SMS Alerts', description: 'Critical updates via text message' },
            { label: 'Weekly Reports', description: 'Summary emails on Fridays' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div>
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions that affect your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="text-destructive hover:text-destructive w-full justify-start">
            Export All Data
          </Button>
          <Button variant="outline" className="text-destructive hover:text-destructive w-full justify-start">
            Clear Audit Logs
          </Button>
          <Button variant="outline" className="text-destructive hover:text-destructive w-full justify-start">
            Reset to Default Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
