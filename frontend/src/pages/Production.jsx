import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Sunrise, Moon, Settings, Loader2, PackageCheck, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import FormField, { Input, Select } from '../components/FormField';
import { SkeletonList } from '../components/Skeleton';
import { productionApi } from '../api/production.api';
import { mastersApi } from '../api/masters.api';
import { useAuth } from '../context/AuthContext';

const today = () => new Date().toISOString().split('T')[0];
const fmt   = (n) => Number(n || 0).toLocaleString('en-IN');

const emptyForm = {
  date: today(), shift: 'morning', machine_id: '', bottle_type_id: '',
  opening_preform_stock: '', preforms_received: '0', preforms_used: '',
  bottles_produced: '', preform_waste: '0', bottle_damage: '0',
};

export default function Production() {
  const { user } = useAuth();
  const isAdmin  = user?.role === 'admin';

  const [entries,      setEntries]      = useState([]);
  const [machines,     setMachines]     = useState([]);
  const [bottleTypes,  setBottleTypes]  = useState([]);
  const [modal,        setModal]        = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [form,         setForm]         = useState(emptyForm);
  const [saving,       setSaving]       = useState(false);
  const [saveError,    setSaveError]    = useState('');
  const [loading,      setLoading]      = useState(true);
  const [filterDate,   setFilterDate]   = useState(today());
  const [stockLoading, setStockLoading] = useState(false);
  const [stockBalance, setStockBalance] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await productionApi.getAll({ date: filterDate });
      setEntries(r.data.data);
    } finally { setLoading(false); }
  }, [filterDate]);

  useEffect(() => {
    load();
    mastersApi.getMachines().then(r => setMachines(r.data.data.filter(m => m.is_active)));
    mastersApi.getBottleTypes().then(r => setBottleTypes(r.data.data.filter(b => b.is_active)));
  }, [load]);

  async function handleBottleTypeChange(bottleTypeId) {
    set('bottle_type_id', bottleTypeId);
    if (!bottleTypeId || editing) return;
    setStockBalance(null);
    setStockLoading(true);
    try {
      const r = await productionApi.preformBalance(bottleTypeId);
      const balance = r.data.balance;
      setStockBalance(balance);
      setForm(f => ({ ...f, bottle_type_id: bottleTypeId, opening_preform_stock: String(balance) }));
    } catch { /* silent — supervisor types manually */ }
    finally { setStockLoading(false); }
  }

  function openAdd() {
    setEditing(null); setForm(emptyForm);
    setStockBalance(null); setSaveError(''); setModal(true);
  }

  function openEdit(entry) {
    setEditing(entry); setStockBalance(null); setSaveError('');
    setForm({
      date:                  entry.date?.split('T')[0] || today(),
      shift:                 entry.shift,
      machine_id:            entry.machine_id,
      bottle_type_id:        entry.bottle_type_id,
      opening_preform_stock: entry.opening_preform_stock,
      preforms_received:     entry.preforms_received,
      preforms_used:         entry.preforms_used,
      bottles_produced:      entry.bottles_produced,
      preform_waste:         entry.preform_waste,
      bottle_damage:         entry.bottle_damage,
    });
    setModal(true);
  }

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  const closingStock =
    (parseInt(form.opening_preform_stock) || 0) +
    (parseInt(form.preforms_received)     || 0) -
    (parseInt(form.preforms_used)         || 0) -
    (parseInt(form.preform_waste)         || 0);

  async function handleSave() {
    if (!form.machine_id || !form.bottle_type_id) return;
    setSaving(true); setSaveError('');
    try {
      if (editing) await productionApi.update(editing.id, form);
      else         await productionApi.create(form);
      await load();
      setModal(false);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save entry');
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this entry?')) return;
    await productionApi.remove(id);
    await load();
  }

  const morning = entries.filter(e => e.shift === 'morning');
  const night   = entries.filter(e => e.shift === 'night');
  const totalBottles = entries.reduce((s, e) => s + (parseInt(e.bottles_produced) || 0), 0);

  return (
    <Layout title="Production" subtitle="Supervisor">

      {/* Date filter + Add */}
      <div className="flex items-center gap-2 mb-6 min-w-0">
        <div className="flex-1 min-w-0">
          <input type="date" value={filterDate}
            onChange={e => setFilterDate(e.target.value)} className="input-base" />
        </div>
        <div className="hidden lg:flex">
          <button onClick={openAdd} className="flex items-center gap-2 btn-primary px-5 py-3">
            <Plus size={16} /> Add Entry
          </button>
        </div>
      </div>

      {/* Mobile FAB */}
      <div className="lg:hidden fixed bottom-20 right-4 z-[45]">
        <button onClick={openAdd}
          className="w-14 h-14 rounded-full bg-navy text-white flex items-center justify-center shadow-fab">
          <Plus size={24} />
        </button>
      </div>

      {/* Summary bar */}
      {!loading && entries.length > 0 && (
        <div className="bg-navy rounded-3xl p-5 mb-6">
          <p className="section-label text-navy-light mb-3">
            {filterDate === today() ? "Today's" : filterDate} Production
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-3xl font-bold text-white">{fmt(totalBottles)}</p>
              <p className="text-navy-light text-xs mt-1">Bottles Made</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">
                {fmt(entries.reduce((s, e) => s + (parseInt(e.preform_waste) || 0), 0))}
              </p>
              <p className="text-navy-light text-xs mt-1">Preform Waste</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">
                {fmt(entries.reduce((s, e) => s + (parseInt(e.bottle_damage) || 0), 0))}
              </p>
              <p className="text-navy-light text-xs mt-1">Bottle Damage</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <SkeletonList count={3} />
      ) : (
        <>
          {/* ── Desktop table ──────────────────────────────────── */}
          {entries.length > 0 && (
            <div className="hidden lg:block bg-white rounded-3xl overflow-hidden shadow-card mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-app-bg">
                    <th className="text-left px-4 py-3 section-label">Shift</th>
                    <th className="text-left px-4 py-3 section-label">Machine</th>
                    <th className="text-left px-4 py-3 section-label">Bottle Type</th>
                    <th className="text-right px-4 py-3 section-label">Produced</th>
                    <th className="text-right px-4 py-3 section-label">Preform Used</th>
                    <th className="text-right px-4 py-3 section-label">Waste</th>
                    <th className="text-right px-4 py-3 section-label">Damage</th>
                    <th className="text-right px-4 py-3 section-label">Closing Stock</th>
                    {isAdmin && <th className="text-right px-4 py-3 section-label">Prod/hr</th>}
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {entries.map(entry => (
                    <tr key={entry.id} className="hover:bg-app-bg/40 transition">
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-gray-600">
                          {entry.shift === 'morning'
                            ? <Sunrise size={13} className="text-amber-400" />
                            : <Moon     size={13} className="text-indigo-400" />}
                          <span className="capitalize text-xs font-medium">{entry.shift}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">M{entry.machine_number}</td>
                      <td className="px-4 py-3 font-semibold text-black">{entry.bottle_name}</td>
                      <td className="px-4 py-3 text-right font-bold text-navy">{fmt(entry.bottles_produced)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{fmt(entry.preforms_used)}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${entry.preform_waste > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                        {fmt(entry.preform_waste)}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${entry.bottle_damage > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {fmt(entry.bottle_damage)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{fmt(entry.closing_preform_stock)}</td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right text-gray-600">
                          {entry.production_per_hour > 0
                            ? `${Number(entry.production_per_hour).toFixed(0)}/hr`
                            : '—'}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button onClick={() => openEdit(entry)}
                            className="icon-btn bg-app-bg text-gray-500 hover:bg-navy-faint hover:text-navy">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(entry.id)}
                            className="icon-btn bg-danger-bg text-danger hover:bg-red-100">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Mobile cards ───────────────────────────────────── */}
          <div className="lg:hidden space-y-6">
            {morning.length > 0 && (
              <ShiftSection label="Morning Shift" icon={Sunrise}
                entries={morning} onEdit={openEdit} onDelete={handleDelete} isAdmin={isAdmin} />
            )}
            {night.length > 0 && (
              <ShiftSection label="Night Shift" icon={Moon}
                entries={night} onEdit={openEdit} onDelete={handleDelete} isAdmin={isAdmin} />
            )}
          </div>

          {entries.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-navy-faint rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Settings size={28} className="text-navy-light" />
              </div>
              <p className="text-gray-500 font-semibold">No entries for this date</p>
              <p className="text-gray-400 text-sm mt-1">Tap + to add an entry</p>
            </div>
          )}
        </>
      )}

      {/* ── Form Modal ─────────────────────────────────────────── */}
      <Modal isOpen={modal} onClose={() => setModal(false)}
        title={editing ? 'Edit Entry' : 'New Production Entry'}>

        {/* Stock/save error */}
        {saveError && (
          <div className="flex items-start gap-2 bg-danger-bg text-danger text-sm rounded-2xl px-4 py-3 mb-4">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            <span>{saveError}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date">
            <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </FormField>
          <FormField label="Shift">
            <div className="flex gap-2 mt-1">
              {[
                { value: 'morning', label: 'Morning', icon: Sunrise },
                { value: 'night',   label: 'Night',   icon: Moon    },
              ].map(s => (
                <button key={s.value} onClick={() => set('shift', s.value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-semibold transition ${
                    form.shift === s.value ? 'bg-navy text-white' : 'bg-app-bg text-gray-500'
                  }`}>
                  <s.icon size={13} /> {s.label}
                </button>
              ))}
            </div>
          </FormField>
        </div>

        <FormField label="Machine">
          <div className="flex gap-2 flex-wrap">
            {machines.map(m => (
              <button key={m.id} onClick={() => set('machine_id', m.id)}
                className={`px-4 py-2.5 rounded-2xl text-sm font-semibold transition min-h-[44px] ${
                  form.machine_id === m.id ? 'bg-navy text-white' : 'bg-app-bg text-gray-500'
                }`}>
                M{m.machine_number}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Bottle Type">
          <Select value={form.bottle_type_id} onChange={e => handleBottleTypeChange(e.target.value)}>
            <option value="">Select bottle type...</option>
            {bottleTypes.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
        </FormField>

        {/* Preform Details */}
        <p className="section-label mb-3 mt-2">Preform Details</p>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Opening Stock">
            <div className="flex items-center justify-between bg-navy-faint rounded-2xl px-4 py-3 min-h-[44px]">
              {stockLoading ? (
                <Loader2 size={14} className="text-navy animate-spin" />
              ) : (
                <span className="text-sm font-bold text-navy">
                  {fmt(form.opening_preform_stock || 0)}
                </span>
              )}
              <PackageCheck size={14} className="text-navy-light flex-shrink-0" />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {editing ? 'From saved entry' : 'From purchase records'}
            </p>
          </FormField>
          <FormField label="Received">
            <Input type="number" value={form.preforms_received}
              onChange={e => set('preforms_received', e.target.value)} placeholder="0" />
          </FormField>
          <FormField label="Used for Prod">
            <Input type="number" value={form.preforms_used}
              onChange={e => set('preforms_used', e.target.value)} placeholder="0" />
          </FormField>
          <FormField label="Preform Waste">
            <Input type="number" value={form.preform_waste}
              onChange={e => set('preform_waste', e.target.value)} placeholder="0" />
          </FormField>
        </div>

        <div className="bg-navy-faint rounded-2xl px-4 py-3 mb-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-navy">Closing Preform Stock</span>
          <span className={`text-lg font-bold ${closingStock < 0 ? 'text-red-500' : 'text-navy'}`}>
            {fmt(closingStock)}
          </span>
        </div>

        <p className="section-label mb-3">Bottle Details</p>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Bottles Produced">
            <Input type="number" value={form.bottles_produced}
              onChange={e => set('bottles_produced', e.target.value)} placeholder="0" />
          </FormField>
          <FormField label="Bottle Damage">
            <Input type="number" value={form.bottle_damage}
              onChange={e => set('bottle_damage', e.target.value)} placeholder="0" />
          </FormField>
        </div>

        <button onClick={handleSave}
          disabled={saving || !form.machine_id || !form.bottle_type_id}
          className="w-full btn-primary">
          {saving ? 'Saving…' : editing ? 'Update Entry' : 'Save Entry'}
        </button>
      </Modal>
    </Layout>
  );
}

// ── Shift section (mobile only) ────────────────────────────────
function ShiftSection({ label, icon: Icon, entries, onEdit, onDelete, isAdmin }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className="text-gray-400" />
        <p className="text-sm font-bold text-black">{label}</p>
        <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full shadow-card">
          {entries.length} entries
        </span>
      </div>
      <div className="space-y-3">
        {entries.map(entry => (
          <ProductionCard key={entry.id} entry={entry}
            onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry.id)}
            isAdmin={isAdmin} />
        ))}
      </div>
    </div>
  );
}

// ── Mobile production card ─────────────────────────────────────
function ProductionCard({ entry, onEdit, onDelete, isAdmin }) {
  const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
  return (
    <div className="bg-white rounded-3xl p-4 shadow-card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-black">{entry.bottle_name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Machine {entry.machine_number} · {entry.entered_by_name}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit}
            className="icon-btn bg-app-bg text-gray-500 hover:bg-navy-faint hover:text-navy">
            <Pencil size={14} />
          </button>
          <button onClick={onDelete}
            className="icon-btn bg-danger-bg text-danger hover:bg-red-100">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className={`grid gap-2 ${isAdmin ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
        <StatBox label="Produced"     value={entry.bottles_produced} accent />
        <StatBox label="Preform Used" value={entry.preforms_used} />
        {isAdmin && <StatBox label="Waste"  value={entry.preform_waste}  warn={entry.preform_waste > 0} />}
        {isAdmin && <StatBox label="Damage" value={entry.bottle_damage}  warn={entry.bottle_damage > 0} />}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <span className="text-xs text-gray-400">
          Closing Preform: <span className="font-semibold text-black">{fmt(entry.closing_preform_stock)}</span>
        </span>
        {isAdmin && entry.production_per_hour > 0 && (
          <span className="text-xs text-gray-400">
            <span className="font-semibold text-black">
              {Number(entry.production_per_hour).toFixed(0)}/hr
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, accent, warn }) {
  return (
    <div className={`rounded-2xl p-2 text-center ${
      accent ? 'bg-navy' : warn && value > 0 ? 'bg-danger-bg' : 'bg-app-bg'
    }`}>
      <p className={`text-base font-bold ${
        accent ? 'text-white' : warn && value > 0 ? 'text-danger' : 'text-black'
      }`}>{Number(value || 0).toLocaleString('en-IN')}</p>
      <p className={`text-xs mt-0.5 leading-tight ${
        accent ? 'text-navy-light' : 'text-gray-400'
      }`}>{label}</p>
    </div>
  );
}
