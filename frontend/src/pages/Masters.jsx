import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import FormField, { Input, Select } from '../components/FormField';
import { mastersApi } from '../api/masters.api';

const TABS = ['Bottle Types', 'Machines', 'Suppliers', 'Customers', 'Expense Categories'];

export default function Masters() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Layout title="Masters" subtitle="Admin">
      {/* Tabs */}
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
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && <BottleTypesTab />}
      {activeTab === 1 && <MachinesTab />}
      {activeTab === 2 && <SuppliersTab />}
      {activeTab === 3 && <CustomersTab />}
      {activeTab === 4 && <ExpenseCategoriesTab />}
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
          <button
            onClick={onAdd}
            className="flex items-center gap-2 bg-navy text-white text-sm font-semibold px-4 py-2 rounded-2xl hover:bg-opacity-90 transition"
          >
            + Add
          </button>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// ─── SHARED ROW ───────────────────────────────────────────────
function MasterRow({ title, subtitle, is_active, onEdit, onToggle }) {
  return (
    <div className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${is_active ? 'text-black' : 'text-gray-400'}`}>
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2 ml-3">
        {onEdit && (
          <button
            onClick={onEdit}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-app-bg text-gray-500 hover:bg-navy-light transition text-xs"
          >✏️</button>
        )}
        <button
          onClick={onToggle}
          className={`w-8 h-8 flex items-center justify-center rounded-xl transition text-xs ${
            is_active
              ? 'bg-green-100 text-green-600 hover:bg-red-100 hover:text-red-500'
              : 'bg-red-100 text-red-500 hover:bg-green-100 hover:text-green-600'
          }`}
        >
          {is_active ? '✓' : '✕'}
        </button>
      </div>
    </div>
  );
}

// ─── BOTTLE TYPES ─────────────────────────────────────────────
function BottleTypesTab() {
  const [items,   setItems]   = useState([]);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({ name: '', size_ml: '', weight_grams: '', category: 'water' });
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async () => {
    const r = await mastersApi.getBottleTypes();
    setItems(r.data.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setForm({ name: '', size_ml: '', weight_grams: '', category: 'water' });
    setModal(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({ name: item.name, size_ml: item.size_ml, weight_grams: item.weight_grams, category: item.category });
    setModal(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) await mastersApi.updateBottleType(editing.id, form);
      else await mastersApi.createBottleType(form);
      await load();
      setModal(false);
    } finally { setSaving(false); }
  }

  async function handleToggle(item) {
    await mastersApi.toggleBottleType(item.id, !item.is_active);
    await load();
  }

  const categories = ['water', 'oil', 'uutru', 'amla', 'specialty'];

  return (
    <>
      <MasterList title={`${items.length} bottle types`} onAdd={openAdd}>
        {items.map(item => (
          <MasterRow
            key={item.id}
            title={item.name}
            subtitle={`${item.size_ml}ml · ${item.weight_grams}g · ${item.category}`}
            is_active={item.is_active}
            onEdit={() => openEdit(item)}
            onToggle={() => handleToggle(item)}
          />
        ))}
      </MasterList>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Bottle Type' : 'Add Bottle Type'}>
        <FormField label="Name">
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. 500ML WATER" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Size (ml)">
            <Input type="number" value={form.size_ml} onChange={e => setForm(f => ({ ...f, size_ml: e.target.value }))} placeholder="500" />
          </FormField>
          <FormField label="Weight (g)">
            <Input type="number" step="0.1" value={form.weight_grams} onChange={e => setForm(f => ({ ...f, weight_grams: e.target.value }))} placeholder="13" />
          </FormField>
        </div>
        <FormField label="Category">
          <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </FormField>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-navy text-white font-semibold py-3 rounded-2xl mt-2 disabled:opacity-50 transition"
        >
          {saving ? 'Saving...' : editing ? 'Update' : 'Add Bottle Type'}
        </button>
      </Modal>
    </>
  );
}

// ─── MACHINES ─────────────────────────────────────────────────
function MachinesTab() {
  const [items,   setItems]   = useState([]);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [name,    setName]    = useState('');
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async () => {
    const r = await mastersApi.getMachines();
    setItems(r.data.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openEdit(item) {
    setEditing(item);
    setName(item.name || '');
    setModal(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await mastersApi.updateMachine(editing.id, { name });
      await load();
      setModal(false);
    } finally { setSaving(false); }
  }

  async function handleToggle(item) {
    await mastersApi.toggleMachine(item.id, !item.is_active);
    await load();
  }

  return (
    <>
      <MasterList title="5 blowing machines">
        {items.map(item => (
          <MasterRow
            key={item.id}
            title={`Machine ${item.machine_number}`}
            subtitle={item.name}
            is_active={item.is_active}
            onEdit={() => openEdit(item)}
            onToggle={() => handleToggle(item)}
          />
        ))}
      </MasterList>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Edit Machine">
        <FormField label="Label">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Blow-1" />
        </FormField>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-navy text-white font-semibold py-3 rounded-2xl mt-2 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Update Machine'}
        </button>
      </Modal>
    </>
  );
}

// ─── SUPPLIERS ────────────────────────────────────────────────
function SuppliersTab() {
  const [items,   setItems]   = useState([]);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({ name: '', type: 'preform', contact: '', gstin: '' });
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async () => {
    const r = await mastersApi.getSuppliers();
    setItems(r.data.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setForm({ name: '', type: 'preform', contact: '', gstin: '' });
    setModal(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({ name: item.name, type: item.type, contact: item.contact || '', gstin: item.gstin || '' });
    setModal(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) await mastersApi.updateSupplier(editing.id, form);
      else await mastersApi.createSupplier(form);
      await load();
      setModal(false);
    } finally { setSaving(false); }
  }

  async function handleToggle(item) {
    await mastersApi.toggleSupplier(item.id, !item.is_active);
    await load();
  }

  return (
    <>
      <MasterList title={`${items.length} suppliers`} onAdd={openAdd}>
        {items.map(item => (
          <MasterRow
            key={item.id}
            title={item.name}
            subtitle={`${item.type} · OB: ₹${Number(item.opening_balance).toLocaleString('en-IN')}`}
            is_active={item.is_active}
            onEdit={() => openEdit(item)}
            onToggle={() => handleToggle(item)}
          />
        ))}
      </MasterList>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'}>
        <FormField label="Name">
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Supplier name" />
        </FormField>
        <FormField label="Type">
          <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            <option value="preform">Preform</option>
            <option value="caps">Caps</option>
            <option value="polybag">Poly Bag</option>
            <option value="engineering">Engineering</option>
            <option value="other">Other</option>
          </Select>
        </FormField>
        <FormField label="Contact">
          <Input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="Phone number" />
        </FormField>
        <FormField label="GSTIN (optional)">
          <Input value={form.gstin} onChange={e => setForm(f => ({ ...f, gstin: e.target.value }))} placeholder="GST number" />
        </FormField>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-navy text-white font-semibold py-3 rounded-2xl mt-2 disabled:opacity-50"
        >
          {saving ? 'Saving...' : editing ? 'Update' : 'Add Supplier'}
        </button>
      </Modal>
    </>
  );
}

// ─── CUSTOMERS ────────────────────────────────────────────────
function CustomersTab() {
  const [items,   setItems]   = useState([]);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({ name: '', type: 'local', contact: '', address: '', gstin: '' });
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async () => {
    const r = await mastersApi.getCustomers();
    setItems(r.data.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setForm({ name: '', type: 'local', contact: '', address: '', gstin: '' });
    setModal(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({ name: item.name, type: item.type, contact: item.contact || '', address: item.address || '', gstin: item.gstin || '' });
    setModal(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) await mastersApi.updateCustomer(editing.id, form);
      else await mastersApi.createCustomer(form);
      await load();
      setModal(false);
    } finally { setSaving(false); }
  }

  async function handleToggle(item) {
    await mastersApi.toggleCustomer(item.id, !item.is_active);
    await load();
  }

  return (
    <>
      <MasterList title={`${items.length} customers`} onAdd={openAdd}>
        {items.map(item => (
          <MasterRow
            key={item.id}
            title={item.name}
            subtitle={`${item.type} · OB: ₹${Number(item.opening_balance).toLocaleString('en-IN')}`}
            is_active={item.is_active}
            onEdit={() => openEdit(item)}
            onToggle={() => handleToggle(item)}
          />
        ))}
      </MasterList>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <FormField label="Name">
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Customer name" />
        </FormField>
        <FormField label="Type">
          <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            <option value="local">Local (Walk-in)</option>
            <option value="despatch">Despatch (Truck)</option>
          </Select>
        </FormField>
        <FormField label="Contact">
          <Input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="Phone number" />
        </FormField>
        <FormField label="Address (for despatch)">
          <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Delivery address" />
        </FormField>
        <FormField label="GSTIN (optional)">
          <Input value={form.gstin} onChange={e => setForm(f => ({ ...f, gstin: e.target.value }))} placeholder="GST number" />
        </FormField>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-navy text-white font-semibold py-3 rounded-2xl mt-2 disabled:opacity-50"
        >
          {saving ? 'Saving...' : editing ? 'Update' : 'Add Customer'}
        </button>
      </Modal>
    </>
  );
}

// ─── EXPENSE CATEGORIES ───────────────────────────────────────
function ExpenseCategoriesTab() {
  const [items,   setItems]   = useState([]);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [name,    setName]    = useState('');
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async () => {
    const r = await mastersApi.getExpenseCategories();
    setItems(r.data.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditing(null); setName(''); setModal(true); }
  function openEdit(item) { setEditing(item); setName(item.name); setModal(true); }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) await mastersApi.updateExpenseCategory(editing.id, { name });
      else await mastersApi.createExpenseCategory({ name });
      await load();
      setModal(false);
    } finally { setSaving(false); }
  }

  async function handleToggle(item) {
    await mastersApi.toggleExpenseCategory(item.id, !item.is_active);
    await load();
  }

  return (
    <>
      <MasterList title={`${items.length} categories`} onAdd={openAdd}>
        {items.map(item => (
          <MasterRow
            key={item.id}
            title={item.name}
            is_active={item.is_active}
            onEdit={() => openEdit(item)}
            onToggle={() => handleToggle(item)}
          />
        ))}
      </MasterList>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Category' : 'Add Category'}>
        <FormField label="Category Name">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Electricity" />
        </FormField>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-navy text-white font-semibold py-3 rounded-2xl mt-2 disabled:opacity-50"
        >
          {saving ? 'Saving...' : editing ? 'Update' : 'Add Category'}
        </button>
      </Modal>
    </>
  );
}