import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import FormField, { Input } from '../components/FormField';
import { costingApi } from '../api/costing.api';

const fmt4 = (n) => Number(n || 0).toFixed(4);
const fmt2 = (n) => Number(n || 0).toFixed(2);

export default function Costing() {
  const [items,   setItems]   = useState([]);
  const [modal,   setModal]   = useState(false);
  const [selected, setSelected] = useState(null);
  const [form,    setForm]    = useState({
    raw_material_rate: '', wastage_pct: '2',
    blowing_cost: '', cap_cost: '0',
    gst_pct: '18', effective_from: new Date().toISOString().split('T')[0],
  });
  const [saving,  setSaving]  = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    costingApi.getLatest().then(r => setItems(r.data.data));
  }, []);

  function set(f, v) {
    setForm(p => {
      const next = { ...p, [f]: v };
      // live preview
      if (selected) {
        const rawR  = parseFloat(next.raw_material_rate) || 0;
        const parsedWPct = parseFloat(next.wastage_pct);
        const wPct  = Number.isNaN(parsedWPct) ? 2 : parsedWPct;
        const blowC = parseFloat(next.blowing_cost) || 0;
        const capC  = parseFloat(next.cap_cost) || 0;
        const parsedGPct = parseFloat(next.gst_pct);
        const gPct  = Number.isNaN(parsedGPct) ? 18 : parsedGPct;
        const wt    = parseFloat(selected.weight_grams) / 1000;
        const finalR = rawR * (1 + wPct / 100);
        const matC   = finalR * wt;
        const basic  = matC + blowC;
        const gst    = basic * (gPct / 100);
        const total  = basic + gst;
        const withCap = total + capC;
        setPreview({ finalR, matC, basic, gst, total, withCap });
      }
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
    setPreview(null);
    setModal(true);
  }

  async function handleSave() {
    if (!form.raw_material_rate || !form.blowing_cost) return;
    setSaving(true);
    try {
      await costingApi.create({ ...form, bottle_type_id: selected.bottle_type_id });
      const r = await costingApi.getLatest();
      setItems(r.data.data);
      setModal(false);
    } finally { setSaving(false); }
  }

  return (
    <Layout title="Bottle Costing" subtitle="Admin">
      <p className="text-xs text-gray-400 mb-6">
        Tap any bottle to update raw material rate. Each revision is saved with effective date.
      </p>

      <div className="space-y-3">
        {items.map(item => {
          const hasCapCost = Number(item.cap_cost || 0) > 0;
          return (
          <div key={item.id} className="bg-white rounded-3xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-black">{item.bottle_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.weight_grams}g · Effective: {new Date(item.effective_from).toLocaleDateString('en-IN')}
                </p>
              </div>
              <button onClick={() => openEdit(item)}
                className="bg-navy text-white text-xs font-semibold px-3 py-2 rounded-2xl hover:bg-opacity-90 transition">
                Update Rate
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-app-bg rounded-2xl p-2 text-center">
                <p className="text-xs font-bold text-black">₹{fmt4(item.raw_material_rate)}</p>
                <p className="text-xs text-gray-400">Raw/kg</p>
              </div>
              <div className="bg-app-bg rounded-2xl p-2 text-center">
                <p className="text-xs font-bold text-black">₹{fmt4(item.basic_cost)}</p>
                <p className="text-xs text-gray-400">Basic</p>
              </div>
              <div className="bg-app-bg rounded-2xl p-2 text-center">
                <p className="text-xs font-bold text-black">₹{fmt4(item.total_cost_with_gst)}</p>
                <p className="text-xs text-gray-400">+GST</p>
              </div>
              <div className="bg-navy rounded-2xl p-2 text-center">
                {hasCapCost ? (
                  <>
                    <p className="text-xs font-bold text-white">₹{fmt4(item.total_cost_with_cap)}</p>
                    <p className="text-xs text-navy-light">+Cap</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold text-white">No Cap</p>
                    <p className="text-xs text-navy-light">No cap cost included</p>
                  </>
                )}
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🧮</p>
          <p className="text-gray-500 font-medium">No costing data yet</p>
          <p className="text-gray-400 text-sm mt-1">Add costing from Masters → Bottle Types first</p>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)}
        title={`Update Costing — ${selected?.bottle_name}`}>
        <div className="bg-app-bg rounded-2xl p-3 mb-4">
          <p className="text-xs text-gray-500">Weight: <span className="font-bold text-black">{selected?.weight_grams}g</span></p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Raw Material Rate (₹/kg)">
            <Input type="number" step="0.01" value={form.raw_material_rate}
              onChange={e => set('raw_material_rate', e.target.value)} placeholder="158" />
          </FormField>
          <FormField label="Wastage %">
            <Input type="number" step="0.1" value={form.wastage_pct}
              onChange={e => set('wastage_pct', e.target.value)} placeholder="2" />
          </FormField>
          <FormField label="Blowing Cost (₹)">
            <Input type="number" step="0.01" value={form.blowing_cost}
              onChange={e => set('blowing_cost', e.target.value)} placeholder="0.75" />
          </FormField>
          <FormField label="Cap Cost (₹)">
            <Input type="number" step="0.01" value={form.cap_cost}
              onChange={e => set('cap_cost', e.target.value)} placeholder="0.45" />
          </FormField>
          <FormField label="GST %">
            <Input type="number" step="0.1" value={form.gst_pct}
              onChange={e => set('gst_pct', e.target.value)} placeholder="18" />
          </FormField>
          <FormField label="Effective From">
            <Input type="date" value={form.effective_from}
              onChange={e => set('effective_from', e.target.value)} />
          </FormField>
        </div>

        {/* Live preview */}
        {preview && (
          <div className="bg-navy rounded-2xl p-4 mb-4 space-y-1">
            <p className="text-navy-light text-xs font-semibold uppercase tracking-wider mb-2">Live Preview</p>
            <div className="flex justify-between text-sm">
              <span className="text-navy-light">Final Material Rate</span>
              <span className="text-white font-semibold">₹{fmt4(preview.finalR)}/kg</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-navy-light">Material Cost/Bottle</span>
              <span className="text-white font-semibold">₹{fmt4(preview.matC)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-navy-light">Basic Cost</span>
              <span className="text-white font-semibold">₹{fmt4(preview.basic)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-navy-light">GST Amount</span>
              <span className="text-white font-semibold">₹{fmt4(preview.gst)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-navy-light/30 pt-2">
              <span className="text-navy-light font-bold">
                {Number(form.cap_cost || 0) > 0 ? 'Total with Cap' : 'No cap cost included'}
              </span>
              <span className="text-white font-bold text-base">
                {Number(form.cap_cost || 0) > 0 ? `₹${fmt4(preview.withCap)}` : '-'}
              </span>
            </div>
          </div>
        )}

        <button onClick={handleSave} disabled={saving || !form.raw_material_rate || !form.blowing_cost}
          className="w-full bg-navy text-white font-semibold py-4 rounded-2xl disabled:opacity-40 transition text-sm">
          {saving ? 'Saving...' : 'Save Rate Revision'}
        </button>
      </Modal>
    </Layout>
  );
}