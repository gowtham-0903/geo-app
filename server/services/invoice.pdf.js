// server/services/invoice.pdf.js
const PDFDocument = require('pdfkit');

async function generateInvoicePDF(sale) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      info: {
        Title: `Invoice ${sale.invoice_display}`,
        Author: 'GEO PACKS',
      },
    });

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = 595.28;
    const H = 841.89;
    const M = 28;
    const IW = W - M * 2;
    const halfW = IW / 2;
    const MidX = M + halfW;

    // ── Helpers ────────────────────────────────────────────
    const line = (x1, y1, x2, y2, color = '#000', w = 0.5) => {
      doc.save().strokeColor(color).lineWidth(w).moveTo(x1, y1).lineTo(x2, y2).stroke().restore();
    };
    const rect = (x, y, w, h, stroke = '#000', sw = 0.5) => {
      doc.save().lineWidth(sw).rect(x, y, w, h).stroke(stroke).restore();
    };
    const text = (str, x, y, opts = {}) => {
      doc.save();
      let font = 'Times-Roman';
      if (opts.bold && opts.italic) font = 'Times-BoldItalic';
      else if (opts.bold) font = 'Times-Bold';
      else if (opts.italic) font = 'Times-Italic';

      doc.font(font).fontSize(opts.size || 9).fillColor(opts.color || '#000');
      doc.text(String(str || ''), x, y, {
        width: opts.width || IW,
        align: opts.align || 'left',
        lineBreak: opts.lineBreak !== undefined ? opts.lineBreak : false,
      });
      doc.restore();
    };

    const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtQty = (n) => Number(n || 0).toLocaleString('en-IN');
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const co  = sale.company;
    const cust = sale.customer;

    const netAmt   = Number(sale.net_amount || 0);
    const gstAmt   = Number(sale.gst_amount || 0);
    const cgst     = gstAmt / 2;
    const sgst     = gstAmt / 2;
    const billAmt  = Number(sale.bill_amount || 0);
    const roundOff = billAmt - (netAmt + gstAmt);

    // ── Outer Border ──────────────────────────────────────
    rect(M, M, IW, H - M * 2);

    // ── TAX INVOICE Header ────────────────────────────────
    text('TAX INVOICE', M, M + 4, { bold: true, italic: true, size: 12, align: 'center', width: IW });
    const yTop = M + 18; // 46
    line(M, yTop, M + IW, yTop);

    // ── LEFT COLUMN: Company, Consignee, Buyer ────────────
    line(MidX, yTop, MidX, yTop + 252); // Vertical split

    // Company Block (Y = 46 to 160)
    let ly = yTop;
    text(co.company_name || 'GEO PACKS', M + 4, ly + 4, { bold: true, italic: true, size: 11 });
    ly += 16;
    if (co.address_line1) { text(co.address_line1, M + 4, ly, { italic: true, size: 9 }); ly += 10.5; }
    if (co.address_line2) { text(co.address_line2, M + 4, ly, { italic: true, size: 9 }); ly += 10.5; }
    text(`${co.city || 'UDUMALPET'}-${co.pincode || '642122'}`, M + 4, ly, { italic: true, size: 9 }); ly += 10.5;
    text(co.state || 'TAMILNADU', M + 4, ly, { italic: true, size: 9 }); ly += 10.5;
    text(`GSTIN/UIN: ${co.gstin || ''}`, M + 4, ly, { bold: true, italic: true, size: 9 }); ly += 10.5;
    text(`State Name : ${co.state || ''}, Code : ${co.state_code || ''}`, M + 4, ly, { italic: true, size: 9 }); ly += 10.5;
    text(`Contact : ${co.phone1 || ''}${co.phone2 ? ',' + co.phone2 : ''}`, M + 4, ly, { bold: true, italic: true, size: 9 }); ly += 10.5;
    text(`E-Mail ${co.email || ''}`, M + 4, ly, { italic: true, size: 9 });

    // Consignee Block (Y = 160 to 226)
    line(M, 160, MidX, 160);
    text('Consignee', M + 2, 162, { italic: true, size: 8 });
    text(cust.name || '', M + 2, 172, { bold: true, italic: true, size: 10 });
    text(cust.billing_address || cust.address || '', M + 2, 184, { italic: true, size: 9, width: halfW - 4, lineBreak: true });
    text(`GSTIN/UIN:`, M + 2, 204, { bold: true, italic: true, size: 9 });
    if (cust.gstin) text(cust.gstin, M + 60, 204, { bold: true, italic: true, size: 9 });
    text(`State Name :`, M + 2, 215, { italic: true, size: 9 });
    text(`${cust.state || ''}, Code : ${cust.state_code || ''}`, M + 55, 215, { bold: true, italic: true, size: 9 });

    // Buyer Block (Y = 226 to 298)
    line(M, 226, MidX, 226);
    text('Buyer (if other than consignee)', M + 2, 228, { italic: true, size: 8 });
    text(cust.name || '', M + 2, 238, { bold: true, italic: true, size: 10 });
    text(`GSTIN/UIN:`, M + 2, 265, { bold: true, italic: true, size: 9 });
    if (cust.gstin) text(cust.gstin, M + 60, 265, { bold: true, italic: true, size: 9 });
    text(`State Name :`, M + 2, 276, { italic: true, size: 9 });
    text(`${cust.state || ''}, Code : ${cust.state_code || ''}`, M + 55, 276, { bold: true, italic: true, size: 9 });
    text(`Place of Supply :`, M + 2, 287, { italic: true, size: 9 });
    text(`${sale.place_of_supply || cust.state || ''}`, M + 65, 287, { italic: true, size: 9 });

    // ── RIGHT COLUMN: Meta Info ───────────────────────────
    const qW = halfW / 2;
    const qX = MidX + qW;
    line(qX, yTop, qX, 262); // Vertical split for top 6 rows
    for(let i=1; i<=6; i++) line(MidX, yTop + i*36, M + IW, yTop + i*36);

    const drawBox = (label, val, x, y, w, isBold = false) => {
      text(label, x + 2, y + 2, { italic: true, size: 8 });
      if (val) text(val, x + 2, y + 14, { bold: isBold, italic: isBold, size: isBold ? 10 : 9, width: w - 4 });
    };

    drawBox('Invoice No.', sale.invoice_display, MidX, 46, qW, true);
    drawBox('Dated', formatDate(sale.date), qX, 46, qW, true);
    drawBox('Delivery Note', '', MidX, 82, qW);
    drawBox('Mode/Terms of Payment', '', qX, 82, qW);
    drawBox("Supplier's Ref.", sale.invoice_no || '', MidX, 118, qW);
    drawBox('Other Reference(s)', '', qX, 118, qW);
    drawBox("Buyer's Order No.", '', MidX, 154, qW);
    drawBox('Dated', '', qX, 154, qW);
    drawBox('Despatch Document No.', '', MidX, 190, qW);
    drawBox('Delivery Note Date', '', qX, 190, qW);
    drawBox('Despatched through', sale.sale_type === 'despatch' ? 'By Truck' : 'Direct', MidX, 226, qW);
    drawBox('Destination', cust.city || cust.state || '', qX, 226, qW);
    drawBox('Terms of Delivery', '', MidX, 262, halfW);

    // ── ITEMS TABLE ───────────────────────────────────────
    const tY = 298;
    line(M, tY, M + IW, tY);
    
    const cDesc = M, wDesc = 250;
    const cHsn = M + 250, wHsn = 60;
    const cQty = M + 310, wQty = 60;
    const cRate = M + 370, wRate = 50;
    const cPer = M + 420, wPer = 30;
    const cAmt = M + 450, wAmt = IW - 450;

    [cHsn, cQty, cRate, cPer, cAmt].forEach(x => line(x, tY, x, 641.89));

    const th = (str, x, w) => text(str, x, tY + 3, { bold: true, italic: true, size: 9, align: 'center', width: w });
    th('Description of Goods', cDesc, wDesc);
    th('HSN/SAC', cHsn, wHsn);
    th('Quantity', cQty, wQty);
    th('Rate', cRate, wRate);
    th('per', cPer, wPer);
    th('Amount', cAmt, wAmt);
    line(M, tY + 16, M + IW, tY + 16);

    let iy = tY + 20;
    sale.items.forEach(item => {
      text(item.bottle_name || item.description || '', cDesc + 4, iy, { bold: true, italic: true, size: 9, width: wDesc - 8 });
      text(item.hsn_code || co.default_hsn || '39233090', cHsn, iy, { italic: true, size: 9, align: 'center', width: wHsn });
      text(fmtQty(item.quantity), cQty - 4, iy, { bold: true, size: 10, align: 'right', width: wQty });
      text(fmt(item.rate), cRate - 4, iy, { bold: true, size: 10, align: 'right', width: wRate });
      text('Nos.', cPer, iy, { italic: true, size: 9, align: 'center', width: wPer });
      text(fmt(item.amount), cAmt - 4, iy, { bold: true, size: 10, align: 'right', width: wAmt });
      iy += 16;
    });

    // Tax rows at bottom of items
    const taxLines = [];
    taxLines.push({ label: 'CGST- 9%', rate: '9', amt: cgst });
    taxLines.push({ label: 'SGST- 9%', rate: '9', amt: sgst });
    if (Math.abs(roundOff) > 0.001) taxLines.push({ label: 'ROUND OFF', rate: '', amt: roundOff });
    
    let currentY = 625.89 - (taxLines.length * 14);
    taxLines.forEach(t => {
      text(t.label, cDesc + 4, currentY, { bold: true, italic: true, size: 9, align: 'right', width: wDesc - 8 });
      if (t.rate) {
        text(t.rate, cRate - 4, currentY, { italic: true, size: 9, align: 'right', width: wRate });
        text('%', cPer, currentY, { italic: true, size: 9, align: 'center', width: wPer });
      }
      text(fmt(t.amt), cAmt - 4, currentY, { bold: true, size: 10, align: 'right', width: wAmt });
      currentY += 14;
    });

    line(M, 625.89, M + IW, 625.89);
    text('Total', cDesc + 4, 625.89 + 3, { italic: true, size: 9, align: 'right', width: wDesc - 8 });
    const totalQty = sale.items.reduce((s, it) => s + Number(it.quantity || 0), 0);
    text(fmtQty(totalQty), cQty - 4, 625.89 + 3, { bold: true, size: 10, align: 'right', width: wQty });
    text(fmt(billAmt), cAmt - 4, 625.89 + 3, { bold: true, size: 10, align: 'right', width: wAmt });

    // ── Amount in Words ───────────────────────────────────
    line(M, 641.89, M + IW, 641.89);
    text('Amount Chargeable (in words)', M + 2, 641.89 + 2, { italic: true, size: 8 });
    text(`INR ${numberToWords(Math.round(billAmt)).toUpperCase()} RUPEES ONLY`, M + 2, 641.89 + 12, { bold: true, italic: true, size: 9 });
    text('E. & O.E', M + IW - 40, 641.89 + 12, { italic: true, size: 8 });

    // ── Tax Summary Table ─────────────────────────────────
    line(M, 665.89, M + IW, 665.89);
    line(M, 713.89, M + IW, 713.89);
    const sumY = 665.89;
    const tW1 = 100, tW2 = 140, tW3 = 140, tW4 = IW - 380, tRateW = 40;
    
    line(M + tW1, sumY, M + tW1, sumY + 48);
    line(M + tW1 + tW2, sumY, M + tW1 + tW2, sumY + 48);
    line(M + tW1 + tW2 + tW3, sumY, M + tW1 + tW2 + tW3, sumY + 48);
    line(M + tW1, sumY + 12, M + tW1 + tW2 + tW3, sumY + 12);
    line(M + tW1 + tRateW, sumY + 12, M + tW1 + tRateW, sumY + 48);
    line(M + tW1 + tW2 + tRateW, sumY + 12, M + tW1 + tW2 + tRateW, sumY + 48);

    const txtH = (str, x, y, w) => text(str, x, y, { bold: true, italic: true, size: 8, align: 'center', width: w });
    txtH('Taxable', M, sumY + 2, tW1); txtH('Value', M, sumY + 14, tW1);
    txtH('Central Tax', M + tW1, sumY + 2, tW2);
    txtH('State Tax', M + tW1 + tW2, sumY + 2, tW3);
    txtH('Total', M + tW1 + tW2 + tW3, sumY + 2, tW4);
    txtH('Tax Amount', M + tW1 + tW2 + tW3, sumY + 14, tW4);
    txtH('Rate', M + tW1, sumY + 14, tRateW); txtH('Amount', M + tW1 + tRateW, sumY + 14, tW2 - tRateW);
    txtH('Rate', M + tW1 + tW2, sumY + 14, tRateW); txtH('Amount', M + tW1 + tW2 + tRateW, sumY + 14, tW3 - tRateW);

    const dY = sumY + 24;
    const txtD = (str, x, w) => text(str, x - 2, dY + 2, { bold: true, italic: true, size: 9, align: 'right', width: w });
    txtD(fmt(netAmt), M, tW1);
    txtD('9%', M + tW1, tRateW); txtD(fmt(cgst), M + tW1 + tRateW, tW2 - tRateW);
    txtD('9%', M + tW1 + tW2, tRateW); txtD(fmt(sgst), M + tW1 + tW2 + tRateW, tW3 - tRateW);
    txtD(fmt(gstAmt), M + tW1 + tW2 + tW3, tW4);

    line(M, sumY + 36, M + IW, sumY + 36);
    const totY = sumY + 36;
    const txtTot = (str, x, w) => text(str, x - 2, totY + 2, { bold: true, italic: true, size: 9, align: 'right', width: w });
    text('Total:', M, totY + 2, { bold: true, italic: true, size: 9, align: 'right', width: tW1 - 40 });
    txtTot(fmt(netAmt), M, tW1);
    txtTot(fmt(cgst), M + tW1 + tRateW, tW2 - tRateW);
    txtTot(fmt(sgst), M + tW1 + tW2 + tRateW, tW3 - tRateW);
    txtTot(fmt(gstAmt), M + tW1 + tW2 + tW3, tW4);

    // ── Tax Amount in Words ───────────────────────────────
    line(M, 729.89, M + IW, 729.89);
    text('Tax Amount (in words) :', M + 2, 713.89 + 3, { italic: true, size: 8 });
    text(`INR ${numberToWords(Math.round(gstAmt)).toUpperCase()} RUPEES ONLY`, M + 100, 713.89 + 3, { bold: true, italic: true, size: 9 });

    // ── Footer ────────────────────────────────────────────
    line(MidX, 729.89, MidX, 799.89);
    line(M, 799.89, M + IW, 799.89);

    text("Company's PAN :", M + 2, 729.89 + 4, { italic: true, size: 8 });
    text(co.pan || '', M + 70, 729.89 + 4, { bold: true, italic: true, size: 9 });
    text("Declaration", M + 2, 729.89 + 16, { italic: true, size: 8 });
    text("We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.", M + 2, 729.89 + 26, { italic: true, size: 8, width: halfW - 8, lineBreak: true });

    text("Company's Bank Details", MidX + 4, 729.89 + 4, { italic: true, size: 8 });
    text("Bank Name. ", MidX + 4, 729.89 + 16, { italic: true, size: 8 });
    text(co.bank_name || 'CANARA BANK', MidX + 55, 729.89 + 16, { bold: true, italic: true, size: 9 });
    text("A/c No.: ", MidX + 4, 729.89 + 28, { italic: true, size: 8 });
    text(co.bank_account || '', MidX + 40, 729.89 + 28, { italic: true, size: 9 });
    text("Branch & IFS Code: ", MidX + 4, 729.89 + 40, { italic: true, size: 8 });
    text(co.bank_ifsc || '', MidX + 80, 729.89 + 40, { italic: true, size: 9 });

    text(`for ${co.company_name || 'GEO PACKS'}`, MidX + 4, 729.89 + 52, { bold: true, italic: true, size: 10, align: 'right', width: halfW - 8 });
    text("Authorised Signatory", MidX + 4, 799.89 - 10, { italic: true, size: 8, align: 'right', width: halfW - 8 });

    // ── Jurisdiction ──────────────────────────────────────
    text(`SUBJECT TO ${(co.jurisdiction || 'UDUMALPET').toUpperCase()} JURISDICTION`, M, 799.89 + 4, { italic: true, size: 8, align: 'center', width: IW });

    doc.end();
  });
}

function numberToWords(n) {
  if (n === 0) return 'zero';
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
    'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
    'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  function convert(num) {
    if (num === 0) return '';
    if (num < 20) return ones[num] + ' ';
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '') + ' ';
    if (num < 1000) return ones[Math.floor(num / 100)] + ' HUNDRED AND ' + convert(num % 100);
    if (num < 100000) return convert(Math.floor(num / 1000)) + 'THOUSAND ' + convert(num % 1000);
    if (num < 10000000) return convert(Math.floor(num / 100000)) + 'LAKH ' + convert(num % 100000);
    return convert(Math.floor(num / 10000000)) + 'CRORE ' + convert(num % 10000000);
  }

  return convert(n).trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(w => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

module.exports = { generateInvoicePDF };
