import { useState, useEffect } from 'react';
import { Users, Building2, Plus, BookOpen } from 'lucide-react';
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
  const [ledgerModal, setLedgerModal] = useState(false);
  const [payModal,  setPayModal]  = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [ledger,    setLedger]    = useState([]);
  const [payForm,   setPayForm]   = useState({
    date: new Date().toISOString().split('T')[0],
    customer_id: '', supplier_id: '',
    amount: '', mode: 'cash', reference: '',
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
    setLedgerModal(true);
  }

  function openPayGlobal() {
    const items = tab === 'customers' ? customers : suppliers;
    setPayForm({
      date: new Date().toISOString().split('T')[0],
      customer_id: items[0]?.id || '',
      supplier_id: items[0]?.id || '',
      amount: '', mode: 'cash', reference: '',
    });
    setSelected(null);
    setPayModal(true);
  }

  async function handlePay() {
    const items   = tab === 'customers' ? customers : suppliers;
    const entityId = tab === 'customers' ? payForm.customer_id : payForm.supplier_id;
    if (!payForm.amount || !entityId) return;
    setSaving(true);
    try {
      if (tab === 'customers') {
        await paymentsApi.createReceived({ ...payForm, customer_id: entityId });
      } else {
        await paymentsApi.createSupplier({ ...payForm, supplier_id: entityId });
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

  const items  = tab === 'customers' ? customers : suppliers;
  const txKey  = tab === 'customers' ? 'total_sales'    : 'total_purchases';
  const paidKey = tab === 'customers' ? 'total_received' : 'total_paid';

  const totalSales   = items.reduce((s, i) => s + Number(i[txKey]     || 0), 0);
  const totalPaid    = items.reduce((s, i) => s + Number(i[paidKey]   || 0), 0);
  const totalDue     = items.reduce((s, i) => s + Number(i.outstanding || 0), 0);

  const selectedEntityId = tab === 'customers' ? payForm.customer_id : payForm.supplier_id;

  return (
    <Layout title="Outstanding" subtitle="Admin">

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { value: 'customers', label: 'Customers', icon: Users     },
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

      {/* Ledger card */}
      <div className="bg-white rounded-3xl shadow-card overflow-hidden">

        {/* Card header */}
        <div className="flex items-start justify-between px-5 py-5 border-b border-gray-100">
          <div>
            <p className="text-xl font-bold text-black">
              {tab === 'customers' ? 'Customer Ledger' : 'Supplier Ledger'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Opening + {tab === 'customers' ? 'Sales' : 'Purchases'} − Payments
            </p>
          </div>
          <button onClick={openPayGlobal}
            className="flex items-center gap-2 btn-primary px-5 py-2.5 text-sm">
            <Plus size={15} /> Record Payment
          </button>
        </div>

        {loading ? (
          <div className="p-6">
            <SkeletonList count={4} />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            {tab === 'customers'
              ? <Users size={28} className="text-gray-200 mx-auto mb-3" />
              : <Building2 size={28} className="text-gray-200 mx-auto mb-3" />
            }
            <p className="text-gray-500 font-semibold">No {tab} found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr>
                  <th className="text-left px-5 py-3.5 section-label bg-gray-50/60">
                    {tab === 'customers' ? 'Customer' : 'Supplier'}
                  </th>
                  <th className="text-left px-5 py-3.5 section-label bg-gray-50/60">Type</th>
                  <th className="text-right px-5 py-3.5 section-label bg-gray-50/60">Opening</th>
                  <th className="text-right px-5 py-3.5 section-label bg-gray-50/60">
                    {tab === 'customers' ? 'Sales' : 'Purchases'}
                  </th>
                  <th className="text-right px-5 py-3.5 section-label bg-gray-50/60">Payments</th>
                  <th className="text-right px-5 py-3.5 section-label bg-gray-50/60">Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr
                    key={item.id}
                    onClick={() => openLedger(item)}
                    className="border-t border-gray-50 hover:bg-blue-50/30 cursor-pointer transition"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <BookOpen size={13} className="text-gray-300 flex-shrink-0" />
                        <span className="text-sm font-semibold text-black">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <TypeBadge type={item.type} />
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-gray-500">
                      ₹{fmt(item.opening_balance)}
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-semibold text-emerald-600">
                      ₹{fmt(item[txKey])}
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-semibold text-blue-600">
                      ₹{fmt(item[paidKey])}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {Number(item.outstanding) <= 0 ? (
                        <span className="text-sm font-bold text-emerald-600">✓ Settled</span>
                      ) : (
                        <span className="text-sm font-bold text-red-500">₹{fmt(item.outstanding)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Totals footer */}
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td className="px-5 py-4 text-sm text-gray-400 font-semibold">Total</td>
                  <td />
                  <td />
                  <td className="px-5 py-4 text-right text-sm font-bold text-black">
                    {tab === 'customers' ? 'Sales' : 'Purchases'}: ₹{fmt(totalSales)}
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-bold text-black">
                    Paid: ₹{fmt(totalPaid)}
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-bold text-red-500">
                    Due: ₹{fmt(totalDue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Ledger Modal */}
      <Modal isOpen={ledgerModal} onClose={() => setLedgerModal(false)}
        title={`${selected?.name} — Ledger`}>
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
                <p className="text-xs text-gray-500">
                  {new Date(row.date).toLocaleDateString('en-IN')} · {row.type}
                </p>
              </div>
              <div className="text-right">
                {row.debit  > 0 && <p className="text-xs font-bold text-danger">+₹{fmt(row.debit)}</p>}
                {row.credit > 0 && <p className="text-xs font-bold text-success">−₹{fmt(row.credit)}</p>}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={payModal} onClose={() => setPayModal(false)} title="Record Payment">
        <FormField label={tab === 'customers' ? 'Customer' : 'Supplier'}>
          <Select
            value={selectedEntityId}
            onChange={e => setPayForm(f => ({
              ...f,
              [tab === 'customers' ? 'customer_id' : 'supplier_id']: e.target.value,
            }))}
          >
            <option value="">Select...</option>
            {items.map(i => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </Select>
        </FormField>
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
        <button onClick={handlePay} disabled={saving || !payForm.amount || !selectedEntityId}
          className="w-full btn-primary">
          {saving ? 'Saving...' : 'Record Payment'}
        </button>
      </Modal>
    </Layout>
  );
}

function TypeBadge({ type }) {
  const isLocal = type === 'local';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      isLocal ? 'bg-blue-50 text-blue-600' : 'text-gray-500'
    }`}>
      {type || '—'}
    </span>
  );
}
