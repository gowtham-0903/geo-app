import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Pencil, Check, X, Database, Cpu, Truck, Users,
  Tag, Store, Shield, UserCheck, KeyRound, ToggleLeft, ToggleRight,
  AlertCircle, Eye, EyeOff, CheckCircle2,
} from 'lucide-react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import FormField, { Input, Select, GstinInput } from '../components/FormField';
import { SkeletonList } from '../components/Skeleton';
import { mastersApi } from '../api/masters.api';
import { usersApi } from '../api/users.api';
import CompanySettingsTab from './CompanySettings';

const TABS = [
  { label: 'Bottle Types',       icon: Database },
  { label: 'Machines',           icon: Cpu      },
  { label: 'Suppliers',          icon: Truck    },
  { label: 'Customers',          icon: Users    },
  { label: 'Expense Categories', icon: Tag      },
  { label: 'Company',            icon: Store    },
  { label: 'Users',              icon: Shield   },
];

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
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-1">
        {TABS.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(i)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
              activeTab === i ? 'bg-navy text-white' : 'bg-white text-gray-500 hover:bg-gray-100 shadow-card'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 0 && <BottleTypesTab />}
      {activeTab === 1 && <MachinesTab />}
      {activeTab === 2 && <SuppliersTab />}
      {activeTab === 3 && <CustomersTab />}
      {activeTab === 4 && <ExpenseCategoriesTab />}
      {activeTab === 5 && <CompanySettingsTab />}
      {activeTab === 6 && <UsersTab />}
    </Layout>
  );
}

function MasterList({ title, onAdd, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-500">{title}</p>
        {onAdd && (
          <button onClick={onAdd}
            className="flex items-center gap-1.5 btn-primary px-4 py-2 text-xs">
            <Plus size={14} /> Add
          </button>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function MasterRow({ title, subtitle, is_active, onEdit, onToggle }) {
  return (
    <div className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-card">
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${is_active ? 'text-black' : 'text-gray-400'}`}>{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 ml-3">
        {onEdit && (
          <button onClick={onEdit}
            className="icon-btn bg-app-bg text-gray-500 hover:bg-navy-faint hover:text-navy">
            <Pencil size={14} />
          </button>
        )}
        <button onClick={onToggle}
          className={`icon-btn transition ${
            is_active
              ? 'bg-success-bg text-success hover:bg-danger-bg hover:text-danger'
              : 'bg-danger-bg text-danger hover:bg-success-bg hover:text-success'
          }`}>
          {is_active ? <Check size={14} /> : <X size={14} />}
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
    hsn_code: '39233090', default_blowing_cost: '0.75', default_cap_cost: '0',
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
      default_cap_cost: item.default_cap_cost || '0',
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

  return (
    <>
      <MasterList title={`${items.length} bottle types`} onAdd={openAdd}>
        {items.map(item => (
          <MasterRow key={item.id} title={item.name}
            subtitle={`${item.size_ml}ml · ${item.weight_grams}g · HSN ${item.hsn_code || '39233090'} · Blow ₹${Number(item.default_blowing_cost || 0.75).toFixed(4)}`}
            is_active={item.is_active} onEdit={() => openEdit(item)}
            onToggle={async () => { await mastersApi.toggleBottleType(item.id, !item.is_active); load(); }} />
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
            {['water','oil','uutru','amla','specialty'].map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Default Blowing Cost (₹)">
            <Input type="number" step="0.0001" value={form.default_blowing_cost} onChange={e => setForm(f => ({ ...f, default_blowing_cost: e.target.value }))} placeholder="0.75" />
          </FormField>
          <FormField label="Default Cap Cost (₹)">
            <Input type="number" step="0.0001" value={form.default_cap_cost} onChange={e => setForm(f => ({ ...f, default_cap_cost: e.target.value }))} placeholder="0" />
          </FormField>
        </div>
        <button onClick={handleSave} disabled={saving} className="w-full btn-primary">
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
  const [form,    setForm]    = useState({ machine_number: '', name: '' });
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async () => {
    const r = await mastersApi.getMachines();
    setItems(r.data.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setForm({ machine_number: '', name: '' });
    setModal(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({ machine_number: item.machine_number, name: item.name || '' });
    setModal(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) await mastersApi.updateMachine(editing.id, { name: form.name });
      else await mastersApi.createMachine(form);
      await load(); setModal(false);
    } finally { setSaving(false); }
  }

  return (
    <>
      <MasterList title={`${items.length} machines`} onAdd={openAdd}>
        {items.map(item => (
          <MasterRow key={item.id} title={`Machine ${item.machine_number}`} subtitle={item.name}
            is_active={item.is_active}
            onEdit={() => openEdit(item)}
            onToggle={async () => { await mastersApi.toggleMachine(item.id, !item.is_active); load(); }} />
        ))}
      </MasterList>
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Machine' : 'Add Machine'}>
        {!editing && (
          <FormField label="Machine Number">
            <Input type="number" value={form.machine_number}
              onChange={e => setForm(f => ({ ...f, machine_number: e.target.value }))}
              placeholder="e.g. 3" />
          </FormField>
        )}
        <FormField label="Label">
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Blow-3" />
        </FormField>
        <button onClick={handleSave} disabled={saving} className="w-full btn-primary">
          {saving ? 'Saving...' : editing ? 'Update Machine' : 'Add Machine'}
        </button>
      </Modal>
    </>
  );
}

// ─── SUPPLIERS ────────────────────────────────────────────────
const emptySupplier = { name: '', type: 'preform', contact: '', gstin: '', address: '', pincode: '' };

function SuppliersTab() {
  const [items,   setItems]   = useState([]);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(emptySupplier);
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async () => {
    const r = await mastersApi.getSuppliers();
    setItems(r.data.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null); setForm(emptySupplier); setModal(true);
  }
  function openEdit(item) {
    setEditing(item);
    setForm({
      name: item.name, type: item.type, contact: item.contact || '',
      gstin: item.gstin || '', address: item.address || '', pincode: item.pincode || '',
    });
    setModal(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) await mastersApi.updateSupplier(editing.id, form);
      else await mastersApi.createSupplier(form);
      await load(); setModal(false);
    } finally { setSaving(false); }
  }

  return (
    <>
      <MasterList title={`${items.length} suppliers`} onAdd={openAdd}>
        {items.map(item => (
          <MasterRow key={item.id} title={item.name}
            subtitle={`${item.type}${item.pincode ? ' · ' + item.pincode : ''} · OB: ₹${Number(item.opening_balance).toLocaleString('en-IN')}`}
            is_active={item.is_active}
            onEdit={() => openEdit(item)}
            onToggle={async () => { await mastersApi.toggleSupplier(item.id, !item.is_active); load(); }} />
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
        <FormField label="GSTIN">
          <GstinInput value={form.gstin} onChange={e => setForm(f => ({ ...f, gstin: e.target.value }))} />
        </FormField>
        <FormField label="Address">
          <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Street / locality" />
        </FormField>
        <FormField label="Pin Code">
          <Input value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} placeholder="e.g. 641001" />
        </FormField>
        <button onClick={handleSave} disabled={saving} className="w-full btn-primary">
          {saving ? 'Saving...' : editing ? 'Update' : 'Add Supplier'}
        </button>
      </Modal>
    </>
  );
}

// ─── CUSTOMERS ────────────────────────────────────────────────
const emptyCustomer = {
  name: '', type: 'local', contact: '', address: '', gstin: '', pincode: '',
  state: 'Tamil Nadu', state_code: '33', email: '', billing_address: '', credit_days: '0',
};

function CustomersTab() {
  const [items,   setItems]   = useState([]);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(emptyCustomer);
  const [saving,  setSaving]  = useState(false);

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
    setEditing(null); setForm(emptyCustomer); setModal(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      name: item.name, type: item.type, contact: item.contact || '',
      address: item.address || '', gstin: item.gstin || '', pincode: item.pincode || '',
      state: item.state || 'Tamil Nadu', state_code: item.state_code || '33',
      email: item.email || '', billing_address: item.billing_address || '',
      credit_days: String(item.credit_days || 0),
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
            subtitle={`${item.type} · ${item.state || 'TN'}${item.pincode ? ' ' + item.pincode : ''} · OB: ₹${Number(item.opening_balance).toLocaleString('en-IN')}`}
            is_active={item.is_active}
            onEdit={() => openEdit(item)}
            onToggle={async () => { await mastersApi.toggleCustomer(item.id, !item.is_active); load(); }} />
        ))}
      </MasterList>
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <FormField label="Name">
          <Input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Customer name" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Type">
            <Select value={form.type} onChange={e => setF('type', e.target.value)}>
              <option value="local">Local (Walk-in)</option>
              <option value="despatch">Despatch (Truck)</option>
            </Select>
          </FormField>
          <FormField label="Credit Days">
            <Input type="number" value={form.credit_days} onChange={e => setF('credit_days', e.target.value)} placeholder="0" />
          </FormField>
        </div>
        <FormField label="Contact">
          <Input value={form.contact} onChange={e => setF('contact', e.target.value)} placeholder="Phone number" />
        </FormField>
        <FormField label="Email">
          <Input type="email" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="customer@email.com" />
        </FormField>
        <FormField label="GSTIN">
          <GstinInput value={form.gstin} onChange={e => setF('gstin', e.target.value)} />
        </FormField>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <FormField label="State">
              <Select value={form.state} onChange={e => setF('state', e.target.value)}>
                {INDIAN_STATES.map(([s, c]) => <option key={c} value={s}>{s}</option>)}
              </Select>
            </FormField>
          </div>
          <FormField label="State Code">
            <Input value={form.state_code} onChange={e => setF('state_code', e.target.value)} placeholder="33" />
          </FormField>
        </div>
        <FormField label="Pin Code">
          <Input value={form.pincode} onChange={e => setF('pincode', e.target.value)} placeholder="e.g. 641001" />
        </FormField>
        <FormField label="Delivery Address">
          <Input value={form.address} onChange={e => setF('address', e.target.value)} placeholder="Delivery address" />
        </FormField>
        <FormField label="Billing Address">
          <Input value={form.billing_address} onChange={e => setF('billing_address', e.target.value)} placeholder="Billing address (if different)" />
        </FormField>
        <button onClick={handleSave} disabled={saving} className="w-full btn-primary">
          {saving ? 'Saving...' : editing ? 'Update' : 'Add Customer'}
        </button>
      </Modal>
    </>
  );
}

// ─── USERS ────────────────────────────────────────────────────
function UsersTab() {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [modal,      setModal]      = useState(null);
  const [selected,   setSelected]   = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [formError,  setFormError]  = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'supervisor', is_active: true });
  const [editForm,   setEditForm]   = useState({ name: '', email: '', role: 'supervisor', is_active: true });
  const [pwForm,     setPwForm]     = useState({ password: '', confirm: '' });

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await usersApi.getAll();
      setUsers(r.data.users || r.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function flash(msg) { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); }
  function closeModal() { setModal(null); setSelected(null); setFormError(''); }

  function openCreate() {
    setCreateForm({ name: '', email: '', password: '', role: 'supervisor', is_active: true });
    setFormError(''); setShowPw(false); setModal('create');
  }
  function openEdit(user) {
    setSelected(user);
    setEditForm({ name: user.name, email: user.email, role: user.role, is_active: user.is_active });
    setFormError(''); setModal('edit');
  }
  function openPassword(user) {
    setSelected(user);
    setPwForm({ password: '', confirm: '' });
    setFormError(''); setShowPw(false); setShowConfirm(false); setModal('password');
  }

  async function handleCreate() {
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password) {
      setFormError('Name, email, and password are required.'); return;
    }
    if (createForm.password.length < 6) { setFormError('Password must be at least 6 characters.'); return; }
    setSaving(true); setFormError('');
    try {
      await usersApi.create(createForm);
      await load(); closeModal(); flash('User created successfully');
    } catch (err) { setFormError(err.response?.data?.message || 'Failed to create user'); }
    finally { setSaving(false); }
  }

  async function handleEdit() {
    if (!editForm.name.trim() || !editForm.email.trim()) { setFormError('Name and email are required.'); return; }
    setSaving(true); setFormError('');
    try {
      await usersApi.update(selected.id, editForm);
      await load(); closeModal(); flash('User updated successfully');
    } catch (err) { setFormError(err.response?.data?.message || 'Failed to update user'); }
    finally { setSaving(false); }
  }

  async function handlePasswordReset() {
    if (!pwForm.password) { setFormError('New password is required.'); return; }
    if (pwForm.password.length < 6) { setFormError('Password must be at least 6 characters.'); return; }
    if (pwForm.password !== pwForm.confirm) { setFormError('Passwords do not match.'); return; }
    setSaving(true); setFormError('');
    try {
      await usersApi.resetPassword(selected.id, { password: pwForm.password });
      closeModal(); flash('Password reset successfully');
    } catch (err) { setFormError(err.response?.data?.message || 'Failed to reset password'); }
    finally { setSaving(false); }
  }

  async function handleToggleActive(user) {
    try {
      await usersApi.toggleActive(user.id, !user.is_active);
      await load(); flash(user.is_active ? 'User deactivated' : 'User activated');
    } catch (err) { setError(err.response?.data?.message || 'Failed to update'); }
  }

  return (
    <>
      {successMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2 bg-success text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-modal">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-500">{users.length} users</p>
        <button onClick={openCreate} className="flex items-center gap-1.5 btn-primary px-4 py-2 text-xs">
          <Plus size={14} /> Add User
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-danger-bg text-danger text-sm rounded-2xl px-4 py-3 mb-4">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {loading ? <SkeletonList count={3} /> : (
        <div className="space-y-2">
          {users.map(user => (
            <div key={user.id} className={`bg-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-card ${!user.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${user.role === 'admin' ? 'bg-navy' : 'bg-navy-faint'}`}>
                  {user.role === 'admin'
                    ? <Shield size={15} className="text-white" />
                    : <UserCheck size={15} className="text-navy" />
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-black truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                <button onClick={() => openEdit(user)} className="icon-btn bg-app-bg text-gray-500 hover:bg-navy-faint hover:text-navy">
                  <Pencil size={13} />
                </button>
                <button onClick={() => openPassword(user)} className="icon-btn bg-app-bg text-gray-500 hover:bg-warning-bg hover:text-warning">
                  <KeyRound size={13} />
                </button>
                <button onClick={() => handleToggleActive(user)}
                  className={`icon-btn transition ${user.is_active ? 'bg-success-bg text-success hover:bg-danger-bg hover:text-danger' : 'bg-danger-bg text-danger hover:bg-success-bg hover:text-success'}`}>
                  {user.is_active ? <Check size={13} /> : <X size={13} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={modal === 'create'} onClose={closeModal} title="Create New User">
        {formError && <div className="flex items-center gap-2 bg-danger-bg text-danger text-sm rounded-2xl px-4 py-3 mb-4"><AlertCircle size={15} />{formError}</div>}
        <FormField label="Full Name">
          <Input value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Ravi Kumar" autoComplete="off" />
        </FormField>
        <FormField label="Email Address">
          <Input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="ravi@example.com" autoComplete="off" />
        </FormField>
        <FormField label="Password">
          <div className="relative">
            <Input type={showPw ? 'text' : 'password'} value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 6 characters" autoComplete="new-password" />
            <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </FormField>
        <FormField label="Role">
          <Select value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}>
            <option value="supervisor">Supervisor</option>
            <option value="admin">Admin</option>
          </Select>
        </FormField>
        <button onClick={handleCreate} disabled={saving} className="w-full btn-primary">
          {saving ? 'Creating...' : 'Create User'}
        </button>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={modal === 'edit'} onClose={closeModal} title={`Edit — ${selected?.name}`}>
        {formError && <div className="flex items-center gap-2 bg-danger-bg text-danger text-sm rounded-2xl px-4 py-3 mb-4"><AlertCircle size={15} />{formError}</div>}
        <FormField label="Full Name">
          <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
        </FormField>
        <FormField label="Email Address">
          <Input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
        </FormField>
        <FormField label="Role">
          <Select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
            <option value="supervisor">Supervisor</option>
            <option value="admin">Admin</option>
          </Select>
        </FormField>
        <button onClick={handleEdit} disabled={saving} className="w-full btn-primary">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </Modal>

      {/* Password Modal */}
      <Modal isOpen={modal === 'password'} onClose={closeModal} title={`Reset Password — ${selected?.name}`}>
        {formError && <div className="flex items-center gap-2 bg-danger-bg text-danger text-sm rounded-2xl px-4 py-3 mb-4"><AlertCircle size={15} />{formError}</div>}
        <FormField label="New Password">
          <div className="relative">
            <Input type={showPw ? 'text' : 'password'} value={pwForm.password} onChange={e => setPwForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 6 characters" autoComplete="new-password" />
            <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </FormField>
        <FormField label="Confirm Password">
          <div className="relative">
            <Input type={showConfirm ? 'text' : 'password'} value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Repeat password" autoComplete="new-password" />
            <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </FormField>
        <button onClick={handlePasswordReset} disabled={saving} className="w-full btn-primary">
          {saving ? 'Resetting...' : 'Reset Password'}
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
      <MasterList title={`${items.length} categories`}
        onAdd={() => { setEditing(null); setName(''); setModal(true); }}>
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
        <button
          onClick={async () => {
            setSaving(true);
            if (editing) await mastersApi.updateExpenseCategory(editing.id, { name });
            else await mastersApi.createExpenseCategory({ name });
            await load(); setModal(false); setSaving(false);
          }}
          disabled={saving} className="w-full btn-primary">
          {saving ? 'Saving...' : editing ? 'Update' : 'Add Category'}
        </button>
      </Modal>
    </>
  );
}
