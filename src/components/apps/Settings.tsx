
import { useState } from 'react';
import { Monitor, Palette, User, Shield, Wifi, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

export const Settings = () => {
  const [activeTab, setActiveTab] = useState('appearance');
  const [settings, setSettings] = useState({
    theme: 'dark',
    wallpaper: 'gradient',
    fontSize: 14,
    notifications: true,
    autoSave: true,
    aiAssistance: true,
  });

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'system', label: 'System', icon: Monitor },
    { id: 'account', label: 'Account', icon: User },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Theme</h3>
              <Select value={settings.theme} onValueChange={(value) => updateSetting('theme', value)}>
                <SelectTrigger className="bg-slate-800 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="auto">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Wallpaper</h3>
              <div className="grid grid-cols-3 gap-3">
                {['gradient', 'space', 'abstract'].map((wallpaper) => (
                  <button
                    key={wallpaper}
                    onClick={() => updateSetting('wallpaper', wallpaper)}
                    className={`aspect-video rounded-lg border-2 transition-all ${
                      settings.wallpaper === wallpaper 
                        ? 'border-blue-500 ring-2 ring-blue-500/20' 
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className={`w-full h-full rounded-md ${
                      wallpaper === 'gradient' 
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                        : wallpaper === 'space'
                        ? 'bg-gradient-to-br from-indigo-900 to-black'
                        : 'bg-gradient-to-br from-pink-500 to-yellow-500'
                    }`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Font Size</h3>
              <div className="space-y-3">
                <Slider
                  value={[settings.fontSize]}
                  onValueChange={(value) => updateSetting('fontSize', value[0])}
                  min={12}
                  max={20}
                  step={1}
                  className="w-full"
                />
                <p className="text-sm text-slate-400">Current size: {settings.fontSize}px</p>
              </div>
            </div>
          </div>
        );

      case 'system':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Auto-save files</h3>
                <p className="text-sm text-slate-400">Automatically save changes to files</p>
              </div>
              <Switch
                checked={settings.autoSave}
                onCheckedChange={(checked) => updateSetting('autoSave', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">AI Assistance</h3>
                <p className="text-sm text-slate-400">Enable AI features throughout the system</p>
              </div>
              <Switch
                checked={settings.aiAssistance}
                onCheckedChange={(checked) => updateSetting('aiAssistance', checked)}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">System Information</h3>
              <div className="bg-slate-800 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Version:</span>
                  <span>NeuraOS v1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Browser:</span>
                  <span>{navigator.userAgent.split(' ')[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Memory:</span>
                  <span>Available</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Enable Notifications</h3>
                <p className="text-sm text-slate-400">Receive system and app notifications</p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) => updateSetting('notifications', checked)}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Notification Types</h3>
              {[
                'File operations',
                'AI responses',
                'System updates',
                'App notifications'
              ].map((type) => (
                <div key={type} className="flex items-center justify-between">
                  <span>{type}</span>
                  <Switch defaultChecked />
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center text-slate-400 py-12">
            <p>Settings for {activeTab} coming soon...</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex bg-slate-900 text-white">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-700 p-4">
        <h2 className="text-xl font-semibold mb-6">Settings</h2>
        <nav className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 p-8">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold mb-8 capitalize">{activeTab}</h1>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};
