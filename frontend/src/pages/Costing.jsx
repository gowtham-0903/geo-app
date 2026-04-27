// frontend/src/pages/Costing.jsx — UPDATED v2
// - Bulk raw material rate update (update all bottles of same supplier at once)
// - Per-bottle blowing + cap cost editable in same modal
// - History timeline per bottle
// - Visual cost breakdown cards

import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import FormField, { Input } from '../components/FormField';
import { costingApi } from '../api/costing.api';
import { mastersApi } from '../api/masters.api';

const fmt4 = (n) => Number(n || 0).toFixed(4);
const fmt2 = (n) => Number(n || 0).toFixed(2);

export default function Costing() {
  const [items,    setItems]    = useState([]);
  const [modal,    setModal]    = useState(false);
  const [bulkModal,setBulkModal]= useState(false);
  const [histModal,setHistModal]= useState(false);
  const [selected, setSelected] = useState(null);
  const [history,  setHistory]  = useState([]);
  const [form,     setForm]     = useState({
    raw_material_rate: '', wastage_pct: '2',
    blowing_cost: '', cap_cost: '0',
    gst_pct: '18', effective_from: new Date().toISOString().split('T')[0],
  });
  const [bulkRate,  setBulkRate] = useState('');
  const [bulkFrom,  setBulkFrom] = useState(new Date().toISOString().split('T')[0]);
  const [saving,   setSaving]   = useState(false);
  const [preview,  setPreview]  = useState(null);
  const [filter,   setFilter]   = useState('');

  const load = useCallback(async () => {
    const r = await costingApi.getLatest();
    setItems(r.data.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  function calcPreview(f, bt) {
    if (!bt) return null;
    const rawR = parseFloat(f.raw_material_rate) || 0;
    const wPct = parseFloat(f.wastage_pct) || 2;
    const blowC = parseFloat(f.blowing_cost) || 0;
    const capC  = parseFloat(f.cap_cost) || 0;
    const gPct  = parseFloat(f.gst_pct) || 18;
    const wt    = parseFloat(bt.weight_grams) / 1000;
    const finalR = rawR * (1 + wPct / 100);
    const matC   = finalR * wt;
    const basic  = matC + blowC;
    const gst    = basic * (gPct / 100);
    const total  = basic + gst;
    const withCap = total + capC;
    return { finalR, matC, basic, gst, total, withCap };
  }

  function setF(f, v) {
    setForm(p => {
      const next = { ...p, [f]: v };
      setPreview(calcPreview(next, selected));
      return next;
    });
  }

  function openEdit(item) {
    setSelected(item);
    setForm({
      raw_material_rate: item.raw_material_rate ?? '',
      wastage_pct:       item.wastage_pct ?? '2',
      blowing_cost:      item.blowing_cost ?? '',
      cap_cost:          item.cap_cost ?? '0',
      gst_pct:           item.gst_pct ?? '18',
      effective_from:    new Date().toISOString().split('T')[0],
    });
    setPreview(calcPreview({
      raw_material_rate: item.raw_material_rate,
      wastage_pct: item.wastage_pct || 2,
      blowing_cost: item.blowing_cost,
      cap_cost: item.cap_cost || 0,
      gst_pct: item.gst_pct || 18,
    }, item));
    setModal(true);
  }

  async function openHistory(item) {
    setSelected(item);
    const r = await costingApi.getHistory(item.bottle_type_id);
    setHistory(r.data.data);
    setHistModal(true);
  }

  async function handleSave() {
    if (!form.raw_material_rate || !form.blowing_cost) return;
    setSaving(true);
    try {
      await costingApi.create({ ...form, bottle_type_id: selected.bottle_type_id });
      await load();
      setModal(false);
    } finally { setSaving(false); }
  }

  // BULK: update all items with same raw_material_rate keeping each bottle's own blowing/cap
  async function handleBulkSave() {
    if (!bulkRate) return;
    setSaving(true);
    try {
      await Promise.all(
        filteredItems.map(item =>
          costingApi.create({
            bottle_type_id:    item.bottle_type_id,
            raw_material_rate: bulkRate,
            wastage_pct:       item.wastage_pct || 2,
            blowing_cost:      item.blowing_cost || 0.75,
            cap_cost:          item.cap_cost || 0,
            gst_pct:           item.gst_pct || 18,
            effective_from:    bulkFrom,
          })
        )
      );
      await load();
      setBulkModal(false);
      setBulkRate('');
    } finally { setSaving(false); }
  }

  const filteredItems = filter
    ? items.filter(i => i.bottle_name?.toLowerCase().includes(filter.toLowerCase()))
    : items;

  const grouped = filteredItems.reduce((acc, item) => {
    const cat = item.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const catOrder = ['water', 'oil', 'uutru', 'amla', 'specialty', 'other'];

  return (
    <Layout title="Bottle Costing" subtitle="Admin">

      {/* Top actions */}
      <div className="flex gap-2 mb-6">
        <input
          type="text" placeholder="🔍 Filter bottles..."
          value={filter} onChange={e => setFilter(e.target.value)}
          className="flex-1 bg-white border-0 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-light"
        />
        <button
          onClick={() => { setBulkRate(''); setBulkFrom(new Date().toISOString().split('T')[0]); setBulkModal(true); }}
          className="bg-navy text-white text-xs font-semibold px-4 py-2 rounded-2xl whitespace-nowrap hover:bg-opacity-90">
          Bulk Update
        </button>
      </div>

      <p className="text-xs text-gray-400 mb-4">
        Tap a bottle to update its rate revision. Each update is saved with effective date — history preserved.
      </p>

      {/* Grouped by category */}
      {catOrder.map(cat => {
        const catItems = grouped[cat];
        if (!catItems?.length) return null;
        return (
          <div key={cat} className="mb-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-navy text-white rounded-lg flex items-center justify-center text-xs">
                {cat === 'water' ? '💧' : cat === 'oil' ? '🛢️' : cat === 'uutru' ? '🍾' : cat === 'amla' ? '🌿' : '📦'}
              </span>
              {cat}
            </p>
            <div className="space-y-3">
              {catItems.map(item => (
                <CostingCard key={item.id} item={item} onEdit={() => openEdit(item)} onHistory={() => openHistory(item)} />
              ))}
            </div>
          </div>
        );
      })}

      {items.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🧮</p>
          <p className="text-gray-500 font-medium">No costing data yet</p>
          <p className="text-gray-400 text-sm mt-1">Add costing from Masters → Bottle Types first</p>
        </div>
      )}

      {/* ── SINGLE UPDATE MODAL ─────────────────────────────── */}
      <Modal isOpen={modal} onClose={() => setModal(false)}
        title={`Update — ${selected?.bottle_name}`}>

        {/* Bottle info strip */}
        <div className="bg-app-bg rounded-2xl p-3 mb-4 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-gray-500">Weight: <span className="font-bold text-black">{selected?.weight_grams}g</span></p>
            <p className="text-xs text-gray-500 mt-0.5">Category: <span className="font-semibold text-black capitalize">{selected?.category}</span></p>
          </div>
          <button onClick={() => { setModal(false); openHistory(selected); }}
            className="text-xs font-semibold text-navy bg-navy/10 px-3 py-1.5 rounded-xl">
            📋 History
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Raw Material Rate (₹/kg)">
            <Input type="number" step="0.01" value={form.raw_material_rate}
              onChange={e => setF('raw_material_rate', e.target.value)} placeholder="158" />
          </FormField>
          <FormField label="Wastage %">
            <Input type="number" step="0.1" value={form.wastage_pct}
              onChange={e => setF('wastage_pct', e.target.value)} placeholder="2" />
          </FormField>
          <FormField label="Blowing Cost (₹)">
            <Input type="number" step="0.0001" value={form.blowing_cost}
              onChange={e => setF('blowing_cost', e.target.value)} placeholder="0.75" />
          </FormField>
          <FormField label="Cap Cost (₹)">
            <Input type="number" step="0.0001" value={form.cap_cost}
              onChange={e => setF('cap_cost', e.target.value)} placeholder="0 or 0.45" />
          </FormField>
          <FormField label="GST %">
            <Input type="number" step="0.1" value={form.gst_pct}
              onChange={e => setF('gst_pct', e.target.value)} placeholder="18" />
          </FormField>
          <FormField label="Effective From">
            <Input type="date" value={form.effective_from}
              onChange={e => setF('effective_from', e.target.value)} />
          </FormField>
        </div>

        {/* Live preview */}
        {preview && (
          <div className="bg-navy rounded-2xl p-4 mb-4 space-y-1.5">
            <p className="text-navy-light text-xs font-semibold uppercase tracking-wider mb-2">Live Cost Breakdown</p>
            <PreviewRow label="Final Material Rate" value={`₹${fmt4(preview.finalR)}/kg`} />
            <PreviewRow label={`Material Cost (${selected?.weight_grams}g)`} value={`₹${fmt4(preview.matC)}`} />
            <PreviewRow label="+ Blowing Cost" value={`₹${fmt4(parseFloat(form.blowing_cost) || 0)}`} />
            <PreviewRow label="Basic Cost" value={`₹${fmt4(preview.basic)}`} bold />
            <PreviewRow label="+ GST 18%" value={`₹${fmt4(preview.gst)}`} />
            <PreviewRow label="Total with GST" value={`₹${fmt4(preview.total)}`} bold />
            {Number(form.cap_cost || 0) > 0 && (
              <PreviewRow label="+ Cap Cost" value={`₹${fmt4(parseFloat(form.cap_cost))}`} />
            )}
            <div className="border-t border-navy-light/30 pt-2 mt-2">
              <PreviewRow
                label={Number(form.cap_cost || 0) > 0 ? 'Total with Cap' : 'Final Cost'}
                value={`₹${fmt4(Number(form.cap_cost || 0) > 0 ? preview.withCap : preview.total)}`}
                big
              />
            </div>
          </div>
        )}

        <button onClick={handleSave} disabled={saving || !form.raw_material_rate || !form.blowing_cost}
          className="w-full bg-navy text-white font-semibold py-4 rounded-2xl disabled:opacity-40 transition text-sm">
          {saving ? 'Saving...' : 'Save Rate Revision'}
        </button>
      </Modal>

      {/* ── BULK UPDATE MODAL ───────────────────────────────── */}
      <Modal isOpen={bulkModal} onClose={() => setBulkModal(false)} title="Bulk Rate Update">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4">
          <p className="text-xs font-semibold text-amber-700">
            ⚠️ This updates {filteredItems.length} bottle{filteredItems.length !== 1 ? 's' : ''} with a new raw material rate.
            Each bottle keeps its own blowing and cap cost. {filter ? `Filtered by "${filter}".` : ''}
          </p>
        </div>

        <FormField label="New Raw Material Rate (₹/kg)">
          <Input type="number" step="0.01" value={bulkRate}
            onChange={e => setBulkRate(e.target.value)} placeholder="158.00" />
        </FormField>
        <FormField label="Effective From">
          <Input type="date" value={bulkFrom} onChange={e => setBulkFrom(e.target.value)} />
        </FormField>

        {/* Preview table */}
        {bulkRate && (
          <div className="bg-app-bg rounded-2xl p-3 mb-4 max-h-48 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-500 mb-2">Preview new costs:</p>
            {filteredItems.map(item => {
              const rawR   = parseFloat(bulkRate);
              const wPct   = parseFloat(item.wastage_pct) || 2;
              const blowC  = parseFloat(item.blowing_cost) || 0.75;
              const wt     = parseFloat(item.weight_grams) / 1000;
              const finalR = rawR * (1 + wPct / 100);
              const matC   = finalR * wt;
              const basic  = matC + blowC;
              const total  = basic * 1.18;
              return (
                <div key={item.id} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                  <span className="text-xs text-black font-medium">{item.bottle_name}</span>
                  <span className="text-xs text-navy font-bold">₹{fmt4(total)}</span>
                </div>
              );
            })}
          </div>
        )}

        <button onClick={handleBulkSave} disabled={saving || !bulkRate}
          className="w-full bg-navy text-white font-semibold py-4 rounded-2xl disabled:opacity-40 transition text-sm">
          {saving ? 'Updating...' : `Update ${filteredItems.length} Bottles`}
        </button>
      </Modal>

      {/* ── HISTORY MODAL ───────────────────────────────────── */}
      <Modal isOpen={histModal} onClose={() => setHistModal(false)}
        title={`History — ${selected?.bottle_name}`}>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {history.map((rev, i) => (
            <div key={rev.id} className={`rounded-2xl p-3 ${i === 0 ? 'bg-navy' : 'bg-app-bg'}`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-xs font-bold ${i === 0 ? 'text-white' : 'text-black'}`}>
                  {new Date(rev.effective_from).toLocaleDateString('en-IN')}
                  {i === 0 && <span className="ml-2 bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">Current</span>}
                </p>
                <p className={`text-sm font-bold ${i === 0 ? 'text-white' : 'text-navy'}`}>
                  ₹{fmt4(rev.total_cost_with_cap || rev.total_cost_with_gst)}
                </p>
              </div>
              <div className={`grid grid-cols-3 gap-2 text-xs ${i === 0 ? 'text-navy-light' : 'text-gray-500'}`}>
                <span>Raw: ₹{fmt2(rev.raw_material_rate)}/kg</span>
                <span>Blow: ₹{fmt4(rev.blowing_cost)}</span>
                <span>Cap: ₹{fmt4(rev.cap_cost || 0)}</span>
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-6">No history found</p>
          )}
        </div>
      </Modal>
    </Layout>
  );
}

// ── Sub-components ────────────────────────────────────────────

function CostingCard({ item, onEdit, onHistory }) {
  const hasCapCost = Number(item.cap_cost || 0) > 0;
  const finalCost = hasCapCost ? item.total_cost_with_cap : item.total_cost_with_gst;

  return (
    <div className="bg-white rounded-3xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-black">{item.bottle_name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {item.weight_grams}g · eff. {new Date(item.effective_from).toLocaleDateString('en-IN')}
          </p>
        </div>
        <div className="flex gap-1.5">
          <button onClick={onHistory}
            className="bg-app-bg text-gray-500 text-xs font-semibold px-2.5 py-1.5 rounded-xl hover:bg-gray-200 transition">
            📋
          </button>
          <button onClick={onEdit}
            className="bg-navy text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-opacity-90 transition">
            Update
          </button>
        </div>
      </div>

      {/* Cost breakdown mini-bar */}
      <div className="grid grid-cols-4 gap-2">
        <CostBox label="Raw/kg" value={`₹${Number(item.raw_material_rate || 0).toFixed(2)}`} />
        <CostBox label="Material" value={`₹${fmt4(item.material_cost_per_bottle)}`} />
        <CostBox label="+GST" value={`₹${fmt4(item.total_cost_with_gst)}`} />
        <CostBox label={hasCapCost ? '+Cap' : 'Final'} value={`₹${fmt4(finalCost)}`} accent />
      </div>
    </div>
  );
}

function CostBox({ label, value, accent }) {
  return (
    <div className={`rounded-2xl p-2 text-center ${accent ? 'bg-navy' : 'bg-app-bg'}`}>
      <p className={`text-xs font-bold leading-tight ${accent ? 'text-white' : 'text-black'}`}>{value}</p>
      <p className={`text-xs mt-0.5 ${accent ? 'text-navy-light' : 'text-gray-400'}`}>{label}</p>
    </div>
  );
}

function PreviewRow({ label, value, bold, big }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-navy-light ${big ? 'text-sm font-bold' : 'text-xs'}`}>{label}</span>
      <span className={`text-white ${big ? 'text-base font-bold' : bold ? 'text-sm font-semibold' : 'text-xs'}`}>{value}</span>
    </div>
  );
}