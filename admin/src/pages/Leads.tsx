import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Search, Flame, Thermometer, Snowflake, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

const BAND_CONFIG: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  hot:  { label: 'Hot',  icon: <Flame size={14}/>,       cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
  warm: { label: 'Warm', icon: <Thermometer size={14}/>, cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  cold: { label: 'Cold', icon: <Snowflake size={14}/>,   cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
};

const STATUS_COLORS: Record<string, string> = {
  new: 'text-emerald-400', contacted: 'text-yellow-400',
  converted: 'text-teal-400', lost: 'text-slate-500',
};

export default function Leads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [band, setBand] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: '20' };
    if (search) params.search = search;
    if (band) params.band = band;
    const res = await api.getLeads(params);
    setLeads(res.leads);
    setTotal(res.total);
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, [page, band]);
  useEffect(() => { const t = setTimeout(fetchLeads, 400); return () => clearTimeout(t); }, [search]);

  const openDetail = async (lead: any) => {
    setSelected(lead);
    const d = await api.getLead(lead.id);
    setDetail(d);
  };

  const updateStatus = async (id: string, status: string) => {
    await api.updateLead(id, { status });
    fetchLeads();
    if (detail?.lead?.id === id) setDetail((prev: any) => ({ ...prev, lead: { ...prev.lead, status } }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Leads</h1>
        <div className="flex gap-2 flex-wrap">
          {['', 'hot', 'warm', 'cold'].map(b => (
            <button key={b} onClick={() => { setBand(b); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${band === b ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
              {b || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or phone..."
          className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-emerald-500 text-sm"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-white/10">
              <th className="text-left py-3 px-3">Lead</th>
              <th className="text-left py-3 px-3">Score</th>
              <th className="text-left py-3 px-3">Interest</th>
              <th className="text-left py-3 px-3">Status</th>
              <th className="text-left py-3 px-3">Date</th>
              <th className="text-left py-3 px-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading && <tr><td colSpan={6} className="py-8 text-center text-slate-500">Loading...</td></tr>}
            {!loading && leads.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-slate-500">No leads found.</td></tr>}
            {leads.map(lead => {
              const bc = BAND_CONFIG[lead.score_band] || BAND_CONFIG.cold;
              return (
                <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3">
                    <p className="text-white font-medium">{lead.name || <span className="text-slate-500">Anonymous</span>}</p>
                    <p className="text-slate-500 text-xs">{lead.phone_number || 'No phone'}</p>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${bc.cls}`}>
                      {bc.icon} {lead.score} · {bc.label}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400">{lead.primary_interest || '—'}</td>
                  <td className="py-3 px-3">
                    <select value={lead.status} onChange={e => updateStatus(lead.id, e.target.value)}
                      className={`bg-transparent border border-white/10 rounded-lg px-2 py-1 text-xs outline-none cursor-pointer ${STATUS_COLORS[lead.status]}`}>
                      {['new','contacted','converted','lost'].map(s => <option key={s} value={s} className="bg-slate-800">{s}</option>)}
                    </select>
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-xs">{lead.created_at?.slice(0,10)}</td>
                  <td className="py-3 px-3">
                    <button onClick={() => openDetail(lead)} className="text-emerald-400 hover:text-emerald-300"><Eye size={16}/></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>{total} total leads</span>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="p-1 hover:text-white disabled:opacity-30"><ChevronLeft size={18}/></button>
          <span>Page {page}</span>
          <button onClick={() => setPage(p => p+1)} disabled={page * 20 >= total} className="p-1 hover:text-white disabled:opacity-30"><ChevronRight size={18}/></button>
        </div>
      </div>

      {/* Lead Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-end p-4" onClick={() => { setSelected(null); setDetail(null); }}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl h-full max-h-[95vh] overflow-y-auto p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-white text-xl font-bold">{detail?.lead.name || 'Anonymous Lead'}</h2>
                <p className="text-slate-400">{detail?.lead.phone_number || 'No phone'}</p>
              </div>
              <button onClick={() => { setSelected(null); setDetail(null); }} className="text-slate-500 hover:text-white text-2xl leading-none">×</button>
            </div>

            {detail && (
              <>
                {/* Score breakdown */}
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Score Breakdown</p>
                  <p className="text-white text-2xl font-bold">{detail.lead.score} <span className="text-base font-normal text-slate-400">→ {detail.lead.score_band?.toUpperCase()}</span></p>
                  {detail.lead.score_breakdown && (
                    <div className="mt-2 space-y-1">
                      {Object.entries(typeof detail.lead.score_breakdown === 'string' ? JSON.parse(detail.lead.score_breakdown) : detail.lead.score_breakdown).map(([k, v]: any) => (
                        <div key={k} className="flex justify-between text-xs text-slate-400">
                          <span>{k.replace(/_/g,' ')}</span>
                          <span className={v > 0 ? 'text-emerald-400' : 'text-red-400'}>{v > 0 ? '+' : ''}{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Summary */}
                {detail.lead.ai_summary && (
                  <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-4">
                    <p className="text-emerald-400 text-xs uppercase tracking-wider mb-1">AI Summary</p>
                    <p className="text-slate-300 text-sm">{detail.lead.ai_summary}</p>
                  </div>
                )}

                {/* Conversation */}
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Conversation</p>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                    {detail.messages?.filter((m: any) => m.role === 'user' || m.role === 'assistant').map((m: any, i: number) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${m.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-white/10 text-slate-300'}`}>
                          {m.content}
                        </div>
                      </div>
                    ))}
                    {(!detail.messages || detail.messages.length === 0) && <p className="text-slate-500 text-sm">No messages yet.</p>}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Notes</p>
                  <textarea defaultValue={detail.lead.notes || ''} rows={3}
                    onBlur={e => api.updateLead(detail.lead.id, { notes: e.target.value })}
                    placeholder="Add notes about this lead..."
                    className="w-full bg-white/5 border border-white/10 text-slate-300 rounded-xl p-3 text-sm outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
              </>
            )}
            {!detail && <p className="text-slate-500 text-center py-8">Loading detail...</p>}
          </div>
        </div>
      )}
    </div>
  );
}
