import { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Pencil, KeyRound, ToggleLeft, ToggleRight,
  Shield, UserCheck, AlertCircle, Eye, EyeOff, CheckCircle2,
} from 'lucide-react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import FormField, { Input, Select } from '../components/FormField';
import { usersApi } from '../api/users.api';
import { SkeletonList } from '../components/Skeleton';

export default function UserManagement() {
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [modal,       setModal]       = useState(null); // 'create' | 'edit' | 'password'
  const [selected,    setSelected]    = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [formError,   setFormError]   = useState('');
  const [successMsg,  setSuccessMsg]  = useState('');

  const [createForm, setCreateForm] = useState({
    name: '', email: '', password: '', role: 'supervisor', is_active: true,
  });
  const [editForm, setEditForm] = useState({
    name: '', email: '', role: 'supervisor', is_active: true,
  });
  const [pwForm, setPwForm] = useState({ password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await usersApi.getAll();
      setUsers(r.data.users || r.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function flash(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  }

  function openCreate() {
    setCreateForm({ name: '', email: '', password: '', role: 'supervisor', is_active: true });
    setFormError('');
    setShowPw(false);
    setModal('create');
  }

  function openEdit(user) {
    setSelected(user);
    setEditForm({ name: user.name, email: user.email, role: user.role, is_active: user.is_active });
    setFormError('');
    setModal('edit');
  }

  function openPassword(user) {
    setSelected(user);
    setPwForm({ password: '', confirm: '' });
    setFormError('');
    setShowPw(false);
    setShowConfirm(false);
    setModal('password');
  }

  function closeModal() {
    setModal(null);
    setSelected(null);
    setFormError('');
  }

  async function handleCreate() {
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password) {
      setFormError('Name, email, and password are required.');
      return;
    }
    if (createForm.password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await usersApi.create(createForm);
      await load();
      closeModal();
      flash('User created successfully');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit() {
    if (!editForm.name.trim() || !editForm.email.trim()) {
      setFormError('Name and email are required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await usersApi.update(selected.id, editForm);
      await load();
      closeModal();
      flash('User updated successfully');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordReset() {
    if (!pwForm.password) {
      setFormError('New password is required.');
      return;
    }
    if (pwForm.password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    if (pwForm.password !== pwForm.confirm) {
      setFormError('Passwords do not match.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await usersApi.resetPassword(selected.id, { password: pwForm.password });
      closeModal();
      flash('Password reset successfully');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(user) {
    try {
      await usersApi.toggleActive(user.id, !user.is_active);
      await load();
      flash(user.is_active ? 'User deactivated' : 'User activated');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user status');
    }
  }

  const admins      = users.filter(u => u.role === 'admin');
  const supervisors = users.filter(u => u.role === 'supervisor');
  const activeCount = users.filter(u => u.is_active).length;

  return (
    <Layout title="User Management" subtitle="Admin">
      {/* Success toast */}
      {successMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2 bg-success text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-modal animate-fade-in">
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-navy rounded-2xl flex items-center justify-center">
            <Users size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-black">{users.length} Users</p>
            <p className="text-xs text-gray-400">{activeCount} active</p>
          </div>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 btn-primary px-4 py-2.5 text-xs">
          <Plus size={15} />
          Add User
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-navy rounded-3xl p-4">
          <p className="section-label text-navy-light mb-2">Admins</p>
          <p className="text-2xl font-bold text-white">{admins.length}</p>
          <p className="text-navy-light text-xs mt-1">Full access</p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-card">
          <p className="section-label mb-2">Supervisors</p>
          <p className="text-2xl font-bold text-black">{supervisors.length}</p>
          <p className="text-gray-400 text-xs mt-1">Limited access</p>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 bg-danger-bg text-danger text-sm rounded-2xl px-4 py-3 mb-4">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* User list */}
      {loading ? (
        <SkeletonList count={4} />
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-navy-faint rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-navy-light" />
          </div>
          <p className="text-gray-500 font-semibold">No users found</p>
          <p className="text-gray-400 text-sm mt-1">Add your first user to get started</p>
          <button onClick={openCreate} className="btn-primary mt-4 px-6 py-3">
            Add First User
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(user => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={() => openEdit(user)}
              onPassword={() => openPassword(user)}
              onToggle={() => handleToggleActive(user)}
            />
          ))}
        </div>
      )}

      {/* Create User Modal */}
      <Modal isOpen={modal === 'create'} onClose={closeModal} title="Create New User">
        {formError && (
          <div className="flex items-center gap-2 bg-danger-bg text-danger text-sm rounded-2xl px-4 py-3 mb-4">
            <AlertCircle size={15} />
            {formError}
          </div>
        )}
        <FormField label="Full Name">
          <Input
            value={createForm.name}
            onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Ravi Kumar"
            autoComplete="off"
          />
        </FormField>
        <FormField label="Email Address">
          <Input
            type="email"
            value={createForm.email}
            onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
            placeholder="ravi@example.com"
            autoComplete="off"
          />
        </FormField>
        <FormField label="Password">
          <div className="relative">
            <Input
              type={showPw ? 'text' : 'password'}
              value={createForm.password}
              onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </FormField>
        <FormField label="Role">
          <Select
            value={createForm.role}
            onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
          >
            <option value="supervisor">Supervisor</option>
            <option value="admin">Admin</option>
          </Select>
        </FormField>
        <div className="flex items-center justify-between bg-app-bg rounded-2xl px-4 py-3 mb-4">
          <div>
            <p className="text-sm font-semibold text-black">Active</p>
            <p className="text-xs text-gray-400">User can log in immediately</p>
          </div>
          <button
            onClick={() => setCreateForm(f => ({ ...f, is_active: !f.is_active }))}
            className="flex-shrink-0"
          >
            {createForm.is_active
              ? <ToggleRight size={32} className="text-navy" />
              : <ToggleLeft size={32} className="text-gray-300" />
            }
          </button>
        </div>
        <button
          onClick={handleCreate}
          disabled={saving}
          className="w-full btn-primary"
        >
          {saving ? 'Creating...' : 'Create User'}
        </button>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={modal === 'edit'} onClose={closeModal} title={`Edit — ${selected?.name}`}>
        {formError && (
          <div className="flex items-center gap-2 bg-danger-bg text-danger text-sm rounded-2xl px-4 py-3 mb-4">
            <AlertCircle size={15} />
            {formError}
          </div>
        )}
        <FormField label="Full Name">
          <Input
            value={editForm.name}
            onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Full name"
          />
        </FormField>
        <FormField label="Email Address">
          <Input
            type="email"
            value={editForm.email}
            onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
            placeholder="email@example.com"
          />
        </FormField>
        <FormField label="Role">
          <Select
            value={editForm.role}
            onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
          >
            <option value="supervisor">Supervisor</option>
            <option value="admin">Admin</option>
          </Select>
        </FormField>
        <div className="flex items-center justify-between bg-app-bg rounded-2xl px-4 py-3 mb-4">
          <div>
            <p className="text-sm font-semibold text-black">Active Status</p>
            <p className="text-xs text-gray-400">
              {editForm.is_active ? 'User is active' : 'User is deactivated'}
            </p>
          </div>
          <button
            onClick={() => setEditForm(f => ({ ...f, is_active: !f.is_active }))}
          >
            {editForm.is_active
              ? <ToggleRight size={32} className="text-navy" />
              : <ToggleLeft size={32} className="text-gray-300" />
            }
          </button>
        </div>
        <button
          onClick={handleEdit}
          disabled={saving}
          className="w-full btn-primary"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={modal === 'password'} onClose={closeModal} title={`Reset Password — ${selected?.name}`}>
        {formError && (
          <div className="flex items-center gap-2 bg-danger-bg text-danger text-sm rounded-2xl px-4 py-3 mb-4">
            <AlertCircle size={15} />
            {formError}
          </div>
        )}
        <div className="flex items-center gap-3 bg-warning-bg rounded-2xl px-4 py-3 mb-5">
          <AlertCircle size={16} className="text-warning flex-shrink-0" />
          <p className="text-xs text-warning font-medium">
            The user will need to use this new password on their next login.
          </p>
        </div>
        <FormField label="New Password">
          <div className="relative">
            <Input
              type={showPw ? 'text' : 'password'}
              value={pwForm.password}
              onChange={e => setPwForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </FormField>
        <FormField label="Confirm Password">
          <div className="relative">
            <Input
              type={showConfirm ? 'text' : 'password'}
              value={pwForm.confirm}
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
              placeholder="Repeat password"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </FormField>
        <button
          onClick={handlePasswordReset}
          disabled={saving}
          className="w-full btn-primary"
        >
          {saving ? 'Resetting...' : 'Reset Password'}
        </button>
      </Modal>
    </Layout>
  );
}

function UserCard({ user, onEdit, onPassword, onToggle }) {
  return (
    <div className={`bg-white rounded-3xl p-4 shadow-card transition-all ${
      !user.is_active ? 'opacity-60' : ''
    }`}>
      {/* Top row */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
          user.role === 'admin' ? 'bg-navy' : 'bg-navy-faint'
        }`}>
          {user.role === 'admin'
            ? <Shield size={18} className="text-white" />
            : <UserCheck size={18} className="text-navy" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-black truncate">{user.name}</p>
            {!user.is_active && (
              <span className="badge bg-danger-bg text-danger">Inactive</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{user.email}</p>
          <span className={`badge mt-1 ${
            user.role === 'admin'
              ? 'bg-navy text-white'
              : 'bg-navy-faint text-navy'
          }`}>
            {user.role === 'admin' ? 'Admin' : 'Supervisor'}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onEdit}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-app-bg text-gray-600 text-xs font-semibold hover:bg-navy-faint hover:text-navy transition-all"
        >
          <Pencil size={13} />
          Edit
        </button>
        <button
          onClick={onPassword}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-app-bg text-gray-600 text-xs font-semibold hover:bg-warning-bg hover:text-warning transition-all"
        >
          <KeyRound size={13} />
          Password
        </button>
        <button
          onClick={onToggle}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
            user.is_active
              ? 'bg-danger-bg text-danger hover:bg-red-200'
              : 'bg-success-bg text-success hover:bg-green-200'
          }`}
        >
          {user.is_active
            ? <><ToggleLeft size={13} /> Deactivate</>
            : <><ToggleRight size={13} /> Activate</>
          }
        </button>
      </div>
    </div>
  );
}
