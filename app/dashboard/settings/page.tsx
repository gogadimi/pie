'use client';

import { useState } from 'react';
import { Save, Shield, Bell, Globe, Key, Moon, Sun } from 'lucide-react';

export default function SettingsPage() {
  const [rails, setRails] = useState({
    maxIncrease: 25, maxDecrease: 30, minMargin: 10, maxChangesPerDay: 5, requireApproval: true,
  });
  const [darkMode, setDarkMode] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    localStorage.setItem('pie-settings', JSON.stringify(rails));
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">⚙️ Settings</h1>
        <p className="text-slate-500 mt-1">Configure safety rails, alerts, and integrations</p>
      </div>

      {saved && <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">✅ Settings saved!</div>}

      {/* Safety Rails */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-indigo-500" /> Safety Rails
        </h2>
        <div className="space-y-4">
          {[
            { key: 'maxIncrease', label: 'Max Price Increase (%)', min: 0, max: 100 },
            { key: 'maxDecrease', label: 'Max Price Decrease (%)', min: 0, max: 100 },
            { key: 'minMargin', label: 'Minimum Margin Floor (%)', min: 0, max: 80 },
            { key: 'maxChangesPerDay', label: 'Max Price Changes per Day', min: 1, max: 50 },
          ].map((field: any) => (
            <div key={field.key} className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">{field.label}</label>
              <input type="number" value={(rails as any)[field.key]} onChange={e => setRails({ ...rails, [field.key]: Number(e.target.value) })} className="w-24 px-3 py-2 text-right border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
          ))}
          <div className="flex items-center justify-between py-2">
            <label className="text-sm font-medium text-slate-700">Require Human Approval</label>
            <button onClick={() => setRails({ ...rails, requireApproval: !rails.requireApproval })} className={`relative w-12 h-6 rounded-full transition-colors ${rails.requireApproval ? 'bg-indigo-600' : 'bg-slate-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${rails.requireApproval ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Alert Channels */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-indigo-500" /> Alert Channels
        </h2>
        {['Email', 'Slack', 'Telegram', 'Webhook'].map(ch => (
          <div key={ch} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
            <span className="text-sm font-medium text-slate-700">{ch}</span>
            <button className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100">Configure →</button>
          </div>
        ))}
      </div>

      <button onClick={handleSave} className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors">
        <Save className="w-4 h-4" /> Save Settings
      </button>
    </div>
  );
}
