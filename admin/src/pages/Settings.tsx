import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Save, Bot, Sliders } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [rules, setRules] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [savingRule, setSavingRule] = useState<number | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.getSettings().then(setSettings);
    api.getScoringRules().then(setRules);
  }, []);

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      await api.updateSettings(settings);
      setMsg('Settings saved successfully!');
    } catch { setMsg('Failed to save.'); }
    finally { setSaving(false); }
  };

  const updateRule = async (rule: any, pts: number, enabled: boolean) => {
    setSavingRule(rule.id);
    await api.updateScoringRule(rule.id, { points: pts, enabled });
    setRules(r => r.map(x => x.id === rule.id ? { ...x, points: pts, enabled } : x));
    setSavingRule(null);
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setSettings(s => ({ ...s, [key]: e.target.value }));

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* Bot Persona */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2">
          <Bot size={18}/> Bot Persona
        </div>
        {[
          { label: 'Agent Name', key: 'agent_name', type: 'input' },
          { label: 'Agency Name', key: 'agency_name', type: 'input' },
          { label: 'Business Hours', key: 'business_hours', type: 'input' },
          { label: 'Tone & Style', key: 'tone', type: 'input' },
          { label: 'Greeting Message', key: 'greeting_message', type: 'textarea' },
          { label: 'Escalation Keywords (JSON array)', key: 'escalation_keywords', type: 'input' },
        ].map(f => (
          <div key={f.key}>
            <label className="text-slate-400 text-sm mb-1 block">{f.label}</label>
            {f.type === 'textarea'
              ? <textarea value={settings[f.key] || ''} onChange={set(f.key)} rows={3} className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 text-sm outline-none focus:border-emerald-500 resize-none"/>
              : <input value={settings[f.key] || ''} onChange={set(f.key)} className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-2.5 px-3 text-sm outline-none focus:border-emerald-500"/>
            }
          </div>
        ))}
        {msg && <p className={`text-sm ${msg.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>{msg}</p>}
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-50">
          <Save size={16}/> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Scoring Rules */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2">
          <Sliders size={18}/> Lead Scoring Rules
        </div>
        <p className="text-slate-500 text-sm">Adjust point values for each lead signal. Changes apply to future scoring.</p>
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
              <input type="checkbox" checked={!!rule.enabled}
                onChange={e => updateRule(rule, rule.points, e.target.checked)}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
              <div className="flex-1">
                <p className="text-white text-sm">{rule.label}</p>
              </div>
              <div className="flex items-center gap-1">
                <input type="number" value={rule.points}
                  onChange={e => updateRule(rule, Number(e.target.value), rule.enabled)}
                  className="w-16 bg-slate-800 border border-white/10 text-white rounded-lg py-1 px-2 text-sm text-center outline-none focus:border-emerald-500"
                />
                <span className="text-slate-500 text-xs">pts</span>
              </div>
              {savingRule === rule.id && <span className="text-emerald-400 text-xs">Saving...</span>}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          {[['hot_lead_threshold', 'Hot Lead Score (≥)'], ['warm_lead_threshold', 'Warm Lead Score (≥)']].map(([k, l]) => (
            <div key={k}>
              <label className="text-slate-400 text-xs mb-1 block">{l}</label>
              <input type="number" value={settings[k] || ''} onChange={set(k)}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-2 px-3 text-sm outline-none focus:border-emerald-500"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
