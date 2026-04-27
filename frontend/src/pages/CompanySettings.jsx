// frontend/src/pages/CompanySettings.jsx
// Tab 7 inside Masters — editable company details used in invoices
import { useState, useEffect } from 'react';
import FormField, { Input, Select } from '../components/FormField';
import api from '../api/axios';

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

export default function CompanySettingsTab() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/company').then(r => setForm(r.data.data));
  }, []);

  function set(f, v) {
    setForm(p => ({ ...p, [f]: v }));
    // Auto-fill state_code when state changes
    if (f === 'state') {
      const match = INDIAN_STATES.find(([s]) => s === v);
      if (match) setForm(p => ({ ...p, state: v, state_code: match[1] }));
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.put('/company', form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  }

  if (!form) return <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Company Info */}
      <Section title="Company Information">
        <FormField label="Company Name">
          <Input value={form.company_name || ''} onChange={e => set('company_name', e.target.value)} placeholder="GEO PACKS" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="GSTIN">
            <Input value={form.gstin || ''} onChange={e => set('gstin', e.target.value)} placeholder="33AAOFG1270C1ZT" />
          </FormField>
          <FormField label="PAN">
            <Input value={form.pan || ''} onChange={e => set('pan', e.target.value)} placeholder="AAOFG1270C" />
          </FormField>
        </div>
        <FormField label="Email">
          <Input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="geopacks2015@gmail.com" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Phone 1">
            <Input value={form.phone1 || ''} onChange={e => set('phone1', e.target.value)} placeholder="9047046565" />
          </FormField>
          <FormField label="Phone 2">
            <Input value={form.phone2 || ''} onChange={e => set('phone2', e.target.value)} placeholder="9751546565" />
          </FormField>
        </div>
      </Section>

      {/* Address */}
      <Section title="Address">
        <FormField label="Address Line 1">
          <Input value={form.address_line1 || ''} onChange={e => set('address_line1', e.target.value)} placeholder="2/127, A-KANNAN VALAGAM" />
        </FormField>
        <FormField label="Address Line 2">
          <Input value={form.address_line2 || ''} onChange={e => set('address_line2', e.target.value)} placeholder="RUKKUMANIAMMAL NAGAR" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="City">
            <Input value={form.city || ''} onChange={e => set('city', e.target.value)} placeholder="UDUMALPET" />
          </FormField>
          <FormField label="Pincode">
            <Input value={form.pincode || ''} onChange={e => set('pincode', e.target.value)} placeholder="642122" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="State">
            <Select value={form.state || 'Tamil Nadu'} onChange={e => set('state', e.target.value)}>
              {INDIAN_STATES.map(([s, c]) => (
                <option key={c} value={s}>{s} ({c})</option>
              ))}
            </Select>
          </FormField>
          <FormField label="State Code">
            <Input value={form.state_code || ''} onChange={e => set('state_code', e.target.value)} placeholder="33" />
          </FormField>
        </div>
        <FormField label="Jurisdiction (for invoice footer)">
          <Input value={form.jurisdiction || ''} onChange={e => set('jurisdiction', e.target.value)} placeholder="UDUMALPET" />
        </FormField>
      </Section>

      {/* Bank */}
      <Section title="Bank Details">
        <FormField label="Bank Name">
          <Input value={form.bank_name || ''} onChange={e => set('bank_name', e.target.value)} placeholder="CANARA BANK" />
        </FormField>
        <FormField label="Account Number">
          <Input value={form.bank_account || ''} onChange={e => set('bank_account', e.target.value)} placeholder="Account number" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="IFSC Code">
            <Input value={form.bank_ifsc || ''} onChange={e => set('bank_ifsc', e.target.value)} placeholder="CNRB0001234" />
          </FormField>
          <FormField label="Branch">
            <Input value={form.bank_branch || ''} onChange={e => set('bank_branch', e.target.value)} placeholder="Udumalpet" />
          </FormField>
        </div>
      </Section>

      {/* Invoice Settings */}
      <Section title="Invoice Settings">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Invoice Prefix">
            <Input value={form.invoice_prefix || ''} onChange={e => set('invoice_prefix', e.target.value)} placeholder="GEO" />
          </FormField>
          <div className="bg-app-bg rounded-2xl p-3">
            <p className="text-xs text-gray-400 mb-1">Next Invoice</p>
            <p className="text-lg font-bold text-navy">
              {form.invoice_prefix || 'GEO'}-{String(form.next_invoice_no || 1).padStart(4, '0')}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          ⚠️ Invoice numbers auto-increment on each sale. The prefix appears on all invoices.
        </p>
      </Section>

      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full font-semibold py-4 rounded-2xl transition text-sm ${
          saved
            ? 'bg-green-500 text-white'
            : 'bg-navy text-white disabled:opacity-40'
        }`}
      >
        {saving ? 'Saving...' : saved ? '✓ Settings Saved!' : 'Save Company Settings'}
      </button>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-3xl p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{title}</p>
      {children}
    </div>
  );
}
