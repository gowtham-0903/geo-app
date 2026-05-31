import { useState, useEffect } from 'react';
import { Users, Building2, Plus, BookOpen, AlertTriangle } from 'lucide-react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import FormField, { Input, Select } from '../components/FormField';
import { SkeletonList } from '../components/Skeleton';
import { paymentsApi } from '../api/payments.api';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

export default function Outstanding() {
  const [tab,       setTab]       = useState('customers');
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [payModal,  setPayModal]  = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [ledger,    setLedger]    = useState([]);
  const [payForm,   setPayForm]   = useState({
    date: new Date().toISOString().split('T')[0], amount: '', mode: 'cash', reference: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      paymentsApi.customerOutstanding(),
      paymentsApi.supplierOutstanding(),
    ]).then(([c, s]) => {
      setCustomers(c.data.data);
      setSuppliers(s.data.data);
    }).finally(() => setLoading(false));
  }, []);

  async function openLedger(item) {
    setSelected(item);
    const r = tab === 'customers'
      ? await paymentsApi.customerLedger(item.id)
      : await paymentsApi.supplierLedger(item.id);
    setLedger(r.data.data);
    setModal(true);
  }

  function openPay(item) {
    setSelected(item);
    setPayForm({ date: new Date().toISOString().split('T')[0], amount: '', mode: 'cash', reference: '' });
    setPayModal(true);
  }

  async function handlePay() {
    if (!payForm.amount) return;
    setSaving(true);
    try {
      if (tab === 'customers') {
        await paymentsApi.createReceived({ ...payForm, customer_id: selected.id });
      } else {
        await paymentsApi.createSupplier({ ...payForm, supplier_id: selected.id });
      }
      const [c, s] = await Promise.all([
        paymentsApi.customerOutstanding(),
        paymentsApi.supplierOutstanding(),
      ]);
      setCustomers(c.data.data);
      setSuppliers(s.data.data);
      setPayModal(false);
    } finally { setSaving(false); }
  }

  const items            = tab === 'customers' ? customers : suppliers;
  const totalOutstanding = items.reduce((s, i) => s + Number(i.outstanding), 0);

  return (
    <Layout title="Outstanding" subtitle="Admin">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { value: 'customers', label: 'Customers', icon: Users    },
          { value: 'suppliers', label: 'Suppliers', icon: Building2 },
        ].map(t => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition ${
              tab === t.value ? 'bg-navy text-white' : 'bg-white text-gray-500 shadow-card'
            }`}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* Total */}
      <div className="bg-navy rounded-3xl p-5 mb-6">
        <p className="section-label text-navy-light mb-2">Total Outstanding</p>
        <p className="text-3xl font-bold text-white">₹{fmt(totalOutstanding)}</p>
        <p className="text-navy-light text-xs mt-1">{items.length} {tab}</p>
      </div>

      {loading ? (
        <SkeletonList count={4} />
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <OutstandingCard
              key={item.id}
              item={item}
              tab={tab}
              onLedger={() => openLedger(item)}
              onPay={() => openPay(item)}
            />
          ))}
          {items.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-navy-faint rounded-3xl flex items-center justify-center mx-auto mb-4">
                {tab === 'customers'
                  ? <Users size={28} className="text-navy-light" />
                  : <Building2 size={28} className="text-navy-light" />
                }
              </div>
              <p className="text-gray-500 font-semibold">No {tab} found</p>
            </div>
          )}
        </div>
      )}

      {/* Ledger Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={`${selected?.name} — Ledger`}>
        <div className="space-y-2 pb-2">
          {ledger.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-4">No transactions found</p>
          )}
          {ledger.map((row, i) => (
            <div key={i} className={`flex items-center justify-between p-3 rounded-2xl ${
              row.type === 'sale' || row.type === 'purchase' ? 'bg-danger-bg' : 'bg-success-bg'
            }`}>
              <div>
                <p className="text-xs font-semibold text-black">{row.ref}</p>
                <p className="text-xs text-gray-500">{new Date(row.date).toLocaleDateString('en-IN')} · {row.type}</p>
              </div>
              <div className="text-right">
                {row.debit  > 0 && <p className="text-xs font-bold text-danger">+₹{fmt(row.debit)}</p>}
                {row.credit > 0 && <p className="text-xs font-bold text-success">-₹{fmt(row.credit)}</p>}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={payModal} onClose={() => setPayModal(false)}
        title={`Record Payment — ${selected?.name}`}>
        <FormField label="Date">
          <Input type="date" value={payForm.date}
            onChange={e => setPayForm(f => ({ ...f, date: e.target.value }))} />
        </FormField>
        <FormField label="Amount (₹)">
          <Input type="number" step="0.01" value={payForm.amount}
            onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
            placeholder="Enter amount" />
        </FormField>
        <FormField label="Mode">
          <Select value={payForm.mode}
            onChange={e => setPayForm(f => ({ ...f, mode: e.target.value }))}>
            <option value="cash">Cash</option>
            <option value="neft">NEFT</option>
            <option value="cheque">Cheque</option>
          </Select>
        </FormField>
        <FormField label="Reference (UTR / Cheque No)">
          <Input value={payForm.reference}
            onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))}
            placeholder="Optional" />
        </FormField>
        <button onClick={handlePay} disabled={saving || !payForm.amount}
          className="w-full btn-primary">
          {saving ? 'Saving...' : 'Record Payment'}
        </button>
      </Modal>
    </Layout>
  );
}

function OutstandingCard({ item, tab, onLedger, onPay }) {
  return (
    <div className="bg-white rounded-3xl p-4 shadow-card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-black">{item.name}</p>
          <p className="text-xs text-gray-400 capitalize mt-0.5">{item.type}</p>
        </div>
        <div className="text-right">
          <p className={`text-base font-bold ${
            Number(item.outstanding) > 0 ? 'text-danger' : 'text-success'
          }`}>
            ₹{fmt(item.outstanding)}
          </p>
          <p className="text-xs text-gray-400">outstanding</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-app-bg rounded-2xl p-2 text-center">
          <p className="text-xs font-bold text-black">₹{fmt(item.opening_balance)}</p>
          <p className="text-xs text-gray-400">Opening</p>
        </div>
        <div className="bg-app-bg rounded-2xl p-2 text-center">
          <p className="text-xs font-bold text-black">
            ₹{fmt(tab === 'customers' ? item.total_sales : item.total_purchases)}
          </p>
          <p className="text-xs text-gray-400">{tab === 'customers' ? 'Sales' : 'Purchases'}</p>
        </div>
        <div className="bg-app-bg rounded-2xl p-2 text-center">
          <p className="text-xs font-bold text-black">
            ₹{fmt(tab === 'customers' ? item.total_received : item.total_paid)}
          </p>
          <p className="text-xs text-gray-400">Paid</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onLedger}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-semibold bg-app-bg text-gray-600 hover:bg-navy-faint hover:text-navy transition">
          <BookOpen size={13} /> View Ledger
        </button>
        <button onClick={onPay}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-semibold bg-navy text-white hover:bg-navy-dark transition">
          <Plus size={13} /> Record Payment
        </button>
      </div>
    </div>
  );
}
