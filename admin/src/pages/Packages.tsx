import { useEffect, useState } from 'react';
import { api, uploadImage } from '../api';
import { Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight, X, Save, Upload, Loader2 } from 'lucide-react';

const EMPTY_PKG = {
  name: '', destination: '', category: 'family', days: 5,
  price_per_person: 0, child_price: '', hotel_category: '3-star',
  meals_included: 'breakfast', food_preference: 'any',
  inclusions: '', exclusions: '', itinerary: '', image_url: '', status: 'active',
};

export default function Packages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editPkg, setEditPkg] = useState<any | null>(null);
  const [form, setForm] = useState(EMPTY_PKG);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const fetchPackages = async () => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    setPackages(await api.getPackages(params));
  };

  useEffect(() => { fetchPackages(); }, []);
  useEffect(() => { const t = setTimeout(fetchPackages, 400); return () => clearTimeout(t); }, [search]);

  const openEdit = async (pkg: any) => {
    const full = await api.getPackage(pkg.id);
    setEditPkg(full);
    setForm({
      ...full,
      inclusions: Array.isArray(full.inclusions) ? full.inclusions.join('\n') : full.inclusions || '',
      exclusions: Array.isArray(full.exclusions) ? full.exclusions.join('\n') : full.exclusions || '',
      itinerary: Array.isArray(full.itinerary) ? full.itinerary.map((d: any) => `Day ${d.day}: ${d.title} — ${d.desc}`).join('\n') : '',
    });
    setShowForm(true);
  };

  const openNew = () => { setEditPkg(null); setForm(EMPTY_PKG); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditPkg(null); setError(''); };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const imageUrl = await uploadImage(file);
      setForm(f => ({ ...f, image_url: imageUrl }));
    } catch (err: any) {
      setError(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        days: Number(form.days),
        price_per_person: Number(form.price_per_person),
        child_price: form.child_price ? Number(form.child_price) : null,
        inclusions: form.inclusions.split('\n').map((s: string) => s.trim()).filter(Boolean),
        exclusions: form.exclusions.split('\n').map((s: string) => s.trim()).filter(Boolean),
        itinerary: form.itinerary.split('\n').map((line: string, i: number) => {
          const match = line.match(/^Day\s*\d+:\s*(.+?)\s*—\s*(.+)$/i);
          return match ? { day: i+1, title: match[1], desc: match[2] } : { day: i+1, title: line, desc: '' };
        }),
      };
      if (editPkg) await api.updatePackage(editPkg.id, payload);
      else await api.createPackage(payload);
      closeForm();
      fetchPackages();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (pkg: any) => {
    await api.updatePackage(pkg.id, { status: pkg.status === 'active' ? 'inactive' : 'active' });
    fetchPackages();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this package?')) return;
    await api.deletePackage(id);
    fetchPackages();
  };

  const field = (key: string) => ({
    value: (form as any)[key],
    onChange: (e: any) => setForm(f => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Packages</h1>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium text-sm transition-all">
          <Plus size={16}/> Add Package
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search packages..."
          className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-emerald-500 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {packages.map(pkg => (
          <div key={pkg.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            {pkg.image_url && <img src={pkg.image_url} alt={pkg.name} className="w-full h-36 object-cover"/>}
            <div className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-white font-semibold">{pkg.name}</p>
                  <p className="text-slate-400 text-xs">{pkg.destination} · {pkg.days} Days · {pkg.category}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pkg.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
                  {pkg.status}
                </span>
              </div>
              <p className="text-emerald-400 font-bold">₹{Number(pkg.price_per_person).toLocaleString()}<span className="text-slate-500 font-normal text-xs"> / person</span></p>
              <div className="flex gap-2 pt-1">
                <button onClick={() => openEdit(pkg)} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs transition-all"><Edit2 size={12}/> Edit</button>
                <button onClick={() => toggleStatus(pkg)} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs transition-all">
                  {pkg.status === 'active' ? <ToggleRight size={12} className="text-emerald-400"/> : <ToggleLeft size={12}/>}
                  {pkg.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => handleDelete(pkg.id)} className="p-1.5 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-all"><Trash2 size={12}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Package Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-end p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">{editPkg ? 'Edit Package' : 'New Package'}</h2>
              <button onClick={closeForm}><X size={20} className="text-slate-400 hover:text-white"/></button>
            </div>
            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm">{error}</div>}

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Package Name', key: 'name', span: 2 },
                { label: 'Destination', key: 'destination' },
                { label: 'Days', key: 'days', type: 'number' },
                { label: 'Price/Person (₹)', key: 'price_per_person', type: 'number' },
                { label: 'Child Price (₹)', key: 'child_price', type: 'number' },
                { label: 'Hotel Category', key: 'hotel_category' },
                { label: 'Meals Included', key: 'meals_included' },
              ].map(f => (
                <div key={f.key} className={f.span === 2 ? 'col-span-2' : ''}>
                  <label className="text-slate-400 text-xs mb-1 block">{f.label}</label>
                  <input type={f.type || 'text'} {...field(f.key)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-lg py-2 px-3 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              ))}

              {/* Package Image Upload & URL */}
              <div className="col-span-2 space-y-2">
                <label className="text-slate-400 text-xs block font-medium">Package Image</label>
                <div className="flex items-center gap-3">
                  <label className={`flex-1 flex items-center justify-center gap-2 border border-dashed border-white/20 hover:border-emerald-500 bg-white/5 hover:bg-white/10 rounded-xl p-3 cursor-pointer text-slate-300 text-sm transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {uploading ? <Loader2 size={16} className="animate-spin text-emerald-400" /> : <Upload size={16} className="text-emerald-400" />}
                    <span>{uploading ? 'Uploading...' : 'Upload Image File'}</span>
                    <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                  </label>
                </div>
                
                {form.image_url && (
                  <div className="relative rounded-xl overflow-hidden border border-white/10 h-28 bg-black/40 flex items-center justify-center">
                    <img src={form.image_url} alt="Package preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setForm(f => ({ ...f, image_url: '' }))} className="absolute top-2 right-2 p-1 bg-slate-900/80 hover:bg-red-600 text-white rounded-full transition-all">
                      <X size={14} />
                    </button>
                  </div>
                )}

                <div>
                  <label className="text-slate-500 text-[11px] block mb-1">Or paste Image URL directly</label>
                  <input type="text" {...field('image_url')} placeholder="https://..."
                    className="w-full bg-white/5 border border-white/10 text-white rounded-lg py-1.5 px-3 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {[{ label: 'Category', key: 'category', opts: ['honeymoon','family','adventure','pilgrimage','budget','luxury','group'] },
                { label: 'Food Preference', key: 'food_preference', opts: ['veg','non-veg','any'] },
                { label: 'Status', key: 'status', opts: ['active','inactive'] }].map(f => (
                <div key={f.key}>
                  <label className="text-slate-400 text-xs mb-1 block">{f.label}</label>
                  <select {...field(f.key)} className="w-full bg-slate-800 border border-white/10 text-white rounded-lg py-2 px-3 text-sm outline-none focus:border-emerald-500">
                    {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>

            {[{ label: 'Inclusions (one per line)', key: 'inclusions' },
              { label: 'Exclusions (one per line)', key: 'exclusions' },
              { label: 'Itinerary (Day 1: Title — Description, one per line)', key: 'itinerary' }].map(f => (
              <div key={f.key}>
                <label className="text-slate-400 text-xs mb-1 block">{f.label}</label>
                <textarea {...field(f.key)} rows={4} className="w-full bg-white/5 border border-white/10 text-white rounded-lg py-2 px-3 text-sm outline-none focus:border-emerald-500 resize-none"/>
              </div>
            ))}

            <button onClick={handleSave} disabled={saving || uploading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
              <Save size={16}/> {saving ? 'Saving...' : 'Save Package'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

