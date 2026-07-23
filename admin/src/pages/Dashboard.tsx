import { useEffect, useState } from 'react';
import { api } from '../api';
import { Flame, Thermometer, Snowflake, Package, Users, TrendingUp, MessageSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-slate-400 text-sm">{label}</p>
        <p className="text-white text-2xl font-bold">{value ?? '—'}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400 p-8">Loading dashboard...</div>;
  if (!data) return <div className="text-red-400 p-8">Failed to load dashboard.</div>;

  const { leads, packages, recentLeads, topInterests } = data;

  // Group recentLeads by date for chart
  const chartData: Record<string, any> = {};
  (recentLeads || []).forEach((r: any) => {
    const d = r.date?.slice(0, 10);
    if (!chartData[d]) chartData[d] = { date: d, hot: 0, warm: 0, cold: 0 };
    chartData[d][r.score_band] = (chartData[d][r.score_band] || 0) + parseInt(r.count);
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Hot Leads 🔥" value={leads.hot_leads} icon={Flame} color="bg-red-500/80" />
        <StatCard label="Warm Leads 🌤" value={leads.warm_leads} icon={Thermometer} color="bg-orange-500/80" />
        <StatCard label="Cold Leads ❄️" value={leads.cold_leads} icon={Snowflake} color="bg-blue-500/80" />
        <StatCard label="Total Leads" value={leads.total_leads} icon={Users} color="bg-emerald-600/80" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Packages" value={packages.active_packages} icon={Package} color="bg-purple-500/80" />
        <StatCard label="Converted" value={leads.converted} icon={TrendingUp} color="bg-teal-500/80" />
        <StatCard label="New Leads" value={leads.new_leads} icon={MessageSquare} color="bg-sky-500/80" />
        <StatCard label="Contacted" value={leads.contacted} icon={Users} color="bg-indigo-500/80" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by day chart */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Leads — Last 7 Days</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={Object.values(chartData)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => v?.slice(5)} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Bar dataKey="hot" fill="#ef4444" radius={[4,4,0,0]} name="Hot" />
              <Bar dataKey="warm" fill="#f97316" radius={[4,4,0,0]} name="Warm" />
              <Bar dataKey="cold" fill="#3b82f6" radius={[4,4,0,0]} name="Cold" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top interests */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Top Destination Interests</h2>
          <div className="space-y-3">
            {topInterests?.length === 0 && <p className="text-slate-500 text-sm">No data yet.</p>}
            {(topInterests || []).map((t: any) => (
              <div key={t.primary_interest} className="flex items-center gap-3">
                <span className="text-slate-300 text-sm w-24 truncate">{t.primary_interest}</span>
                <div className="flex-1 bg-white/5 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${Math.min(100, (t.count / (topInterests[0]?.count || 1)) * 100)}%` }} />
                </div>
                <span className="text-slate-400 text-sm w-8 text-right">{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
