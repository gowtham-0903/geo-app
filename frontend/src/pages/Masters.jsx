// frontend/src/pages/Masters.jsx — UPDATED v2
// Adds: Tab 7 = Company Settings
// Updates: Customer modal with state, email, billing_address, credit_days
// Updates: Bottle Types modal with hsn_code, default_blowing_cost, default_cap_cost

import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import FormField, { Input, Select } from '../components/FormField';
import { mastersApi } from '../api/masters.api';
import CompanySettingsTab from './CompanySettings';

const TABS = ['Bottle Types', 'Machines', 'Suppliers', 'Customers', 'Expense Categories', 'Company'];

const INDIAN_STATES = [
  ['Andhra Pradesh','28'],['Arunachal Pradesh','12'],['Assam','18'],
  ['Bihar','10'],['Chhattisgarh','22'],['Goa','30'],['Gujarat','24'],
  ['Haryana','06'],['Himachal Pradesh','02'],['Jharkhand','20'],
  ['Karnataka','29'],['Kerala','32'],['Madhya Pradesh','23'],
  ['Maharashtra','27'],['Manipur','14'],['Meghalaya','17'],
  ['Mizoram','15'],['Nagaland','13'],['Odisha','21'],['Punjab','03'],
  ['Rajasthan','08'],['Sikkim','11'],['Tamil Nadu','33'],
  ['Telangana','36'],['Tripura','16'],['Uttar Pradesh','09'],
  ['Uttarakhand','05'],['West Bengal','19'],
  ['Delhi','07'],['Jammu & Kashmir','01'],['Ladakh','38'],
];

export default function Masters() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Layout title="Masters" subtitle="Admin">
      {/* Tabs — scrollable */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-[4px]">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-semibold transition-all ${
              activeTab === i
                ? 'bg-navy text-white'
                : 'bg-white text-gray-500 hover:bg-gray-100'
            }`}
          >
            {i === 5 ? '🏢 ' : ''}{tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && <BottleTypesTab />}
      {activeTab === 1 && <MachinesTab />}
      {activeTab === 2 && <SuppliersTab />}
      {activeTab === 3 && <CustomersTab />}
      {activeTab === 4 && <ExpenseCategoriesTab />}
      {activeTab === 5 && <CompanySettingsTab />}
    </Layout>
  );
}

// ─── SHARED LIST WRAPPER ──────────────────────────────────────
function MasterList({ title, onAdd, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-500">{title}</p>
        {onAdd && (
          <button onClick={onAdd}
            className="flex items-center gap-2 bg-navy text-white text-sm font-semibold px-4 py-2 rounded-2xl hover:bg-opacity-90 transition">
            + Add
          </button>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function MasterRow({ title, subtitle, is_active, onEdit, onToggle }) {
  return (
    <div className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${is_active ? 'text-black' : 'text-gray-400'}`}>{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 ml-3">
        {onEdit && (
          <button onClick={onEdit}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-app-bg text-gray-500 hover:bg-navy-light transition text-xs">✏️</button>
        )}
        <button onClick={onToggle}
          className={`w-8 h-8 flex items-center justify-center rounded-xl transition text-xs ${
            is_active ? 'bg-green-100 text-green-600 hover:bg-red-100 hover:text-red-500'
                      : 'bg-red-100 text-red-500 hover:bg-green-100 hover:text-green-600'
          }`}>
          {is_active ? '✓' : '✕'}
        </button>
      </div>
    </div>
  );
}

// ─── BOTTLE TYPES ─────────────────────────────────────────────
function BottleTypesTab() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', size_ml: '', weight_grams: '', category: 'water',
    hsn_code: '39233090', default_blowing_cost: '0.75', default_cap_cost: '0'
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const r = await mastersApi.getBottleTypes();
    setItems(r.data.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setForm({ name: '', size_ml: '', weight_grams: '', category: 'water', hsn_code: '39233090', default_blowing_cost: '0.75', default_cap_cost: '0' });
    setModal(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      name: item.name, size_ml: item.size_ml, weight_grams: item.weight_grams,
      category: item.category, hsn_code: item.hsn_code || '39233090',
      default_blowing_cost: item.default_blowing_cost || '0.75',
      default_cap_cost: item.default_cap_cost || '0'
    });
    setModal(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) await mastersApi.updateBottleType(editing.id, form);
      else await mastersApi.createBottleType(form);
      await load(); setModal(false);
    } finally { setSaving(false); }
  }

  const categories = ['water', 'oil', 'uutru', 'amla', 'specialty'];

  return (
    <>
      <MasterList title={`${items.length} bottle types`} onAdd={openAdd}>
        {items.map(item => (
          <MasterRow key={item.id} title={item.name}
            subtitle={`${item.size_ml}ml · ${item.weight_grams}g · HSN ${item.hsn_code || '39233090'} · Blow ₹${Number(item.default_blowing_cost || 0.75).toFixed(4)}`}
            is_active={item.is_active} onEdit={() => openEdit(item)} onToggle={async () => { await mastersApi.toggleBottleType(item.id, !item.is_active); load(); }} />
        ))}
      </MasterList>
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Bottle Type' : 'Add Bottle Type'}>
        <FormField label="Name">
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. 500ML WATER" />
        </FormField>
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Size (ml)">
            <Input type="number" value={form.size_ml} onChange={e => setForm(f => ({ ...f, size_ml: e.target.value }))} placeholder="500" />
          </FormField>
          <FormField label="Weight (g)">
            <Input type="number" step="0.1" value={form.weight_grams} onChange={e => setForm(f => ({ ...f, weight_grams: e.target.value }))} placeholder="13" />
          </FormField>
          <FormField label="HSN Code">
            <Input value={form.hsn_code} onChange={e => setForm(f => ({ ...f, hsn_code: e.target.value }))} placeholder="39233090" />
          </FormField>
        </div>
        <FormField label="Category">
          <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Default Blowing Cost (₹)">
            <Input type="number" step="0.0001" value={form.default_blowing_cost} onChange={e => setForm(f => ({ ...f, default_blowing_cost: e.target.value }))} placeholder="0.75" />
          </FormField>
          <FormField label="Default Cap Cost (₹)">
            <Input type="number" step="0.0001" value={form.default_cap_cost} onChange={e => setForm(f => ({ ...f, default_cap_cost: e.target.value }))} placeholder="0 or 0.45" />
          </FormField>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="w-full bg-navy text-white font-semibold py-3 rounded-2xl mt-2 disabled:opacity-50">
          {saving ? 'Saving...' : editing ? 'Update' : 'Add Bottle Type'}
        </button>
      </Modal>
    </>
  );
}

// ─── MACHINES ─────────────────────────────────────────────────
function MachinesTab() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const r = await mastersApi.getMachines();
    setItems(r.data.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <MasterList title="5 blowing machines">
        {items.map(item => (
          <MasterRow key={item.id} title={`Machine ${item.machine_number}`} subtitle={item.name}
            is_active={item.is_active}
            onEdit={() => { setEditing(item); setName(item.name || ''); setModal(true); }}
            onToggle={async () => { await mastersApi.toggleMachine(item.id, !item.is_active); load(); }} />
        ))}
      </MasterList>
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Edit Machine">
        <FormField label="Label">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Blow-1" />
        </FormField>
        <button onClick={async () => { setSaving(true); await mastersApi.updateMachine(editing.id, { name }); await load(); setModal(false); setSaving(false); }}
          disabled={saving} className="w-full bg-navy text-white font-semibold py-3 rounded-2xl mt-2 disabled:opacity-50">
          {saving ? 'Saving...' : 'Update Machine'}
        </button>
      </Modal>
    </>
  );
}

// ─── SUPPLIERS ────────────────────────────────────────────────
function SuppliersTab() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'preform', contact: '', gstin: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const r = await mastersApi.getSuppliers();
    setItems(r.data.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <MasterList title={`${items.length} suppliers`} onAdd={() => { setEditing(null); setForm({ name: '', type: 'preform', contact: '', gstin: '' }); setModal(true); }}>
        {items.map(item => (
          <MasterRow key={item.id} title={item.name}
            subtitle={`${item.type} · OB: ₹${Number(item.opening_balance).toLocaleString('en-IN')}`}
            is_active={item.is_active}
            onEdit={() => { setEditing(item); setForm({ name: item.name, type: item.type, contact: item.contact || '', gstin: item.gstin || '' }); setModal(true); }}
            onToggle={async () => { await mastersApi.toggleSupplier(item.id, !item.is_active); load(); }} />
        ))}
      </MasterList>
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'}>
        <FormField label="Name"><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Supplier name" /></FormField>
        <FormField label="Type">
          <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            <option value="preform">Preform</option><option value="caps">Caps</option>
            <option value="polybag">Poly Bag</option><option value="engineering">Engineering</option>
            <option value="other">Other</option>
          </Select>
        </FormField>
        <FormField label="Contact"><Input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="Phone number" /></FormField>
        <FormField label="GSTIN (optional)"><Input value={form.gstin} onChange={e => setForm(f => ({ ...f, gstin: e.target.value }))} placeholder="GST number" /></FormField>
        <button onClick={async () => { setSaving(true); if (editing) await mastersApi.updateSupplier(editing.id, form); else await mastersApi.createSupplier(form); await load(); setModal(false); setSaving(false); }}
          disabled={saving} className="w-full bg-navy text-white font-semibold py-3 rounded-2xl mt-2 disabled:opacity-50">
          {saving ? 'Saving...' : editing ? 'Update' : 'Add Supplier'}
        </button>
      </Modal>
    </>
  );
}

// ─── CUSTOMERS (UPDATED with extra fields) ────────────────────
function CustomersTab() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', type: 'local', contact: '', address: '', gstin: '',
    state: 'Tamil Nadu', state_code: '33', email: '', billing_address: '', credit_days: '0'
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const r = await mastersApi.getCustomers();
    setItems(r.data.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  function setF(f, v) {
    setForm(p => {
      const next = { ...p, [f]: v };
      if (f === 'state') {
        const match = INDIAN_STATES.find(([s]) => s === v);
        if (match) next.state_code = match[1];
      }
      return next;
    });
  }

  function openAdd() {
    setEditing(null);
    setForm({ name: '', type: 'local', contact: '', address: '', gstin: '', state: 'Tamil Nadu', state_code: '33', email: '', billing_address: '', credit_days: '0' });
    setModal(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      name: item.name, type: item.type, contact: item.contact || '',
      address: item.address || '', gstin: item.gstin || '',
      state: item.state || 'Tamil Nadu', state_code: item.state_code || '33',
      email: item.email || '', billing_address: item.billing_address || '',
      credit_days: String(item.credit_days || 0)
    });
    setModal(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) await mastersApi.updateCustomer(editing.id, form);
      else await mastersApi.createCustomer(form);
      await load(); setModal(false);
    } finally { setSaving(false); }
  }

  return (
    <>
      <MasterList title={`${items.length} customers`} onAdd={openAdd}>
        {items.map(item => (
          <MasterRow key={item.id} title={item.name}
            subtitle={`${item.type} · ${item.state || 'TN'} · OB: ₹${Number(item.opening_balance).toLocaleString('en-IN')}`}
            is_active={item.is_active}
            onEdit={() => openEdit(item)}
            onToggle={async () => { await mastersApi.toggleCustomer(item.id, !item.is_active); load(); }} />
        ))}
      </MasterList>
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <FormField label="Name"><Input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Customer name" /></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Type">
            <Select value={form.type} onChange={e => setF('type', e.target.value)}>
              <option value="local">🏪 Local (Walk-in)</option>
              <option value="despatch">🚛 Despatch (Truck)</option>
            </Select>
          </FormField>
          <FormField label="Credit Days">
            <Input type="number" value={form.credit_days} onChange={e => setF('credit_days', e.target.value)} placeholder="0" />
          </FormField>
        </div>
        <FormField label="Contact">
          <Input value={form.contact} onChange={e => setF('contact', e.target.value)} placeholder="Phone number" />
        </FormField>
        <FormField label="Email (optional)">
          <Input type="email" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="customer@email.com" />
        </FormField>
        <FormField label="GSTIN (optional)">
          <Input value={form.gstin} onChange={e => setF('gstin', e.target.value)} placeholder="GST number" />
        </FormField>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <FormField label="State">
              <Select value={form.state} onChange={e => setF('state', e.target.value)}>
                {INDIAN_STATES.map(([s, c]) => <option key={c} value={s}>{s}</option>)}
              </Select>
            </FormField>
          </div>
          <FormField label="Code">
            <Input value={form.state_code} onChange={e => setF('state_code', e.target.value)} placeholder="33" />
          </FormField>
        </div>
        <FormField label="Delivery Address">
          <Input value={form.address} onChange={e => setF('address', e.target.value)} placeholder="Delivery address" />
        </FormField>
        <FormField label="Billing Address (if different)">
          <Input value={form.billing_address} onChange={e => setF('billing_address', e.target.value)} placeholder="Billing address" />
        </FormField>
        <button onClick={handleSave} disabled={saving}
          className="w-full bg-navy text-white font-semibold py-3 rounded-2xl mt-2 disabled:opacity-50">
          {saving ? 'Saving...' : editing ? 'Update' : 'Add Customer'}
        </button>
      </Modal>
    </>
  );
}

// ─── EXPENSE CATEGORIES ───────────────────────────────────────
function ExpenseCategoriesTab() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const r = await mastersApi.getExpenseCategories();
    setItems(r.data.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <MasterList title={`${items.length} categories`} onAdd={() => { setEditing(null); setName(''); setModal(true); }}>
        {items.map(item => (
          <MasterRow key={item.id} title={item.name} is_active={item.is_active}
            onEdit={() => { setEditing(item); setName(item.name); setModal(true); }}
            onToggle={async () => { await mastersApi.toggleExpenseCategory(item.id, !item.is_active); load(); }} />
        ))}
      </MasterList>
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Category' : 'Add Category'}>
        <FormField label="Category Name">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Electricity" />
        </FormField>
        <button onClick={async () => { setSaving(true); if (editing) await mastersApi.updateExpenseCategory(editing.id, { name }); else await mastersApi.createExpenseCategory({ name }); await load(); setModal(false); setSaving(false); }}
          disabled={saving} className="w-full bg-navy text-white font-semibold py-3 rounded-2xl mt-2 disabled:opacity-50">
          {saving ? 'Saving...' : editing ? 'Update' : 'Add Category'}
        </button>
      </Modal>
    </>
  );
}