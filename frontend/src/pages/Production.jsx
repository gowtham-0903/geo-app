import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Sunrise, Moon, Settings, AlertTriangle } from 'lucide-react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import FormField, { Input, Select } from '../components/FormField';
import { SkeletonList } from '../components/Skeleton';
import { productionApi } from '../api/production.api';
import { mastersApi } from '../api/masters.api';

const today = () => new Date().toISOString().split('T')[0];

const emptyForm = {
  date: today(), shift: 'morning', machine_id: '', bottle_type_id: '',
  opening_preform_stock: '', preforms_received: '', preforms_used: '',
  bottles_produced: '', preform_waste: '', bottle_damage: '', working_hours: '',
};

export default function Production() {
  const [entries,     setEntries]     = useState([]);
  const [machines,    setMachines]    = useState([]);
  const [bottleTypes, setBottleTypes] = useState([]);
  const [modal,       setModal]       = useState(false);
  const [editing,     setEditing]     = useState(null);
  const [form,        setForm]        = useState(emptyForm);
  const [saving,      setSaving]      = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [filterDate,  setFilterDate]  = useState(today());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await productionApi.getAll({ date: filterDate });
      setEntries(r.data.data);
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  useEffect(() => {
    load();
    mastersApi.getMachines().then(r =>
      setMachines(r.data.data.filter(m => m.is_active))
    );
    mastersApi.getBottleTypes().then(r =>
      setBottleTypes(r.data.data.filter(b => b.is_active))
    );
  }, [load]);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setModal(true);
  }

  function openEdit(entry) {
    setEditing(entry);
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
      working_hours:         entry.working_hours,
    });
    setModal(true);
  }

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  const closingStock =
    (parseInt(form.opening_preform_stock) || 0) +
    (parseInt(form.preforms_received)     || 0) -
    (parseInt(form.preforms_used)         || 0) -
    (parseInt(form.preform_waste)         || 0);

  const prodPerHour = form.working_hours > 0
    ? ((parseInt(form.bottles_produced) || 0) / parseFloat(form.working_hours)).toFixed(1)
    : '—';

  async function handleSave() {
    if (!form.machine_id || !form.bottle_type_id) return;
    setSaving(true);
    try {
      if (editing) await productionApi.update(editing.id, form);
      else await productionApi.create(form);
      await load();
      setModal(false);
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this entry?')) return;
    await productionApi.remove(id);
    await load();
  }

  const morning = entries.filter(e => e.shift === 'morning');
  const night   = entries.filter(e => e.shift === 'night');

  return (
    <Layout title="Production" subtitle="Supervisor">
      {/* Date filter + Add button */}
      <div className="flex items-center gap-2 mb-6 min-w-0">
        <div className="flex-1 min-w-0">
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="input-base"
          />
        </div>
        <div className="hidden lg:flex">
          <button onClick={openAdd} className="flex items-center gap-2 btn-primary px-5 py-3">
            <Plus size={16} /> Add Entry
          </button>
        </div>
      </div>

      {/* Mobile FAB */}
      <div className="lg:hidden fixed bottom-20 right-4 z-[45]">
        <button
          onClick={openAdd}
          className="w-14 h-14 rounded-full bg-navy text-white flex items-center justify-center shadow-fab"
          aria-label="Add production entry"
        >
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
              <p className="text-3xl font-bold text-white">
                {entries.reduce((s, e) => s + (parseInt(e.bottles_produced) || 0), 0).toLocaleString('en-IN')}
              </p>
              <p className="text-navy-light text-xs mt-1">Bottles Made</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">
                {entries.reduce((s, e) => s + (parseInt(e.preform_waste) || 0), 0).toLocaleString('en-IN')}
              </p>
              <p className="text-navy-light text-xs mt-1">Preform Waste</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">
                {entries.reduce((s, e) => s + (parseInt(e.bottle_damage) || 0), 0).toLocaleString('en-IN')}
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
          {morning.length > 0 && (
            <ShiftSection label="Morning Shift" icon={Sunrise} entries={morning} onEdit={openEdit} onDelete={handleDelete} />
          )}
          {night.length > 0 && (
            <ShiftSection label="Night Shift" icon={Moon} entries={night} onEdit={openEdit} onDelete={handleDelete} />
          )}
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

      {/* Form Modal */}
      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Edit Entry' : 'New Production Entry'}
      >
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
                <button
                  key={s.value}
                  onClick={() => set('shift', s.value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-semibold transition ${
                    form.shift === s.value
                      ? 'bg-navy text-white'
                      : 'bg-app-bg text-gray-500'
                  }`}
                >
                  <s.icon size={13} />
                  {s.label}
                </button>
              ))}
            </div>
          </FormField>
        </div>

        <FormField label="Machine">
          <div className="flex gap-2 flex-wrap">
            {machines.map(m => (
              <button
                key={m.id}
                onClick={() => set('machine_id', m.id)}
                className={`px-4 py-2 rounded-2xl text-sm font-semibold transition ${
                  form.machine_id === m.id ? 'bg-navy text-white' : 'bg-app-bg text-gray-500'
                }`}
              >
                M{m.machine_number}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Bottle Type">
          <Select value={form.bottle_type_id} onChange={e => set('bottle_type_id', e.target.value)}>
            <option value="">Select bottle type...</option>
            {bottleTypes.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
        </FormField>

        <p className="section-label mb-3 mt-2">Preform Details</p>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Opening Stock">
            <Input type="number" value={form.opening_preform_stock}
              onChange={e => set('opening_preform_stock', e.target.value)} placeholder="0" />
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
            {closingStock}
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
          <FormField label="Working Hours">
            <Input type="number" step="0.5" value={form.working_hours}
              onChange={e => set('working_hours', e.target.value)} placeholder="8" />
          </FormField>
          <div className="flex flex-col justify-end pb-4">
            <p className="section-label mb-2">Prod / Hour</p>
            <div className="bg-app-bg rounded-2xl px-4 py-3">
              <span className="text-sm font-bold text-navy">{prodPerHour}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !form.machine_id || !form.bottle_type_id}
          className="w-full btn-primary"
        >
          {saving ? 'Saving...' : editing ? 'Update Entry' : 'Save Entry'}
        </button>
      </Modal>
    </Layout>
  );
}

function ShiftSection({ label, icon: Icon, entries, onEdit, onDelete }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} className="text-gray-400" />
        <p className="text-sm font-bold text-black">{label}</p>
        <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full shadow-card">
          {entries.length} entries
        </span>
      </div>
      <div className="space-y-3">
        {entries.map(entry => (
          <ProductionCard
            key={entry.id}
            entry={entry}
            onEdit={() => onEdit(entry)}
            onDelete={() => onDelete(entry.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ProductionCard({ entry, onEdit, onDelete }) {
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
          <button
            onClick={onEdit}
            className="icon-btn bg-app-bg text-gray-500 hover:bg-navy-faint hover:text-navy"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="icon-btn bg-danger-bg text-danger hover:bg-red-100"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatBox label="Produced" value={entry.bottles_produced} accent />
        <StatBox label="Preform Used" value={entry.preforms_used} />
        <StatBox label="Waste" value={entry.preform_waste} warn={entry.preform_waste > 0} />
        <StatBox label="Damage" value={entry.bottle_damage} warn={entry.bottle_damage > 0} />
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <span className="text-xs text-gray-400">
          Closing Stock: <span className="font-semibold text-black">{entry.closing_preform_stock}</span>
        </span>
        <span className="text-xs text-gray-400">
          {entry.working_hours}h · <span className="font-semibold text-black">{
            entry.production_per_hour > 0
              ? Number(entry.production_per_hour).toFixed(0) + '/hr'
              : '—'
          }</span>
        </span>
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
      }`}>{value}</p>
      <p className={`text-xs mt-0.5 leading-tight ${
        accent ? 'text-navy-light' : 'text-gray-400'
      }`}>{label}</p>
    </div>
  );
}
