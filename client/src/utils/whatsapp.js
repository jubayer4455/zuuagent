export function formatBdPhone(rawPhone) {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('880')) return digits;
  if (digits.startsWith('01')) return `88${digits}`;
  return digits;
}

export function openWhatsAppChat(rawPhone, messageText) {
  let cleanPhone = formatBdPhone(rawPhone);
  if (!cleanPhone) {
    const prompted = window.prompt('Enter Customer / Party WhatsApp Mobile No. (e.g. 01755112233):', '01818524712');
    if (!prompted) return false;
    cleanPhone = formatBdPhone(prompted);
  }
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

export function buildWhatsAppInvoiceText({
  shop = {},
  title = 'SALES INVOICE',
  invoiceId = '',
  date = '',
  customerName = '',
  mobile = '',
  items = [],
  totalAmount = 0,
  discount = 0,
  netPayable = 0,
  paidAmount = 0,
  dueAmount = 0
}) {
  const shopName = shop.branch_name || 'HAZI TRADERS';
  const shopAddr = shop.address || 'Motijheel Commercial Area, Dhaka';
  const shopPhone = shop.phone || '01818524712, 01402338209';
  const footer = shop.invoice_footer || 'Thank you for doing business with us!';

  const itemLines = items.map((it, idx) => {
    const name = it.product_description || it.product_name || 'Item';
    const sn = it.serial_no ? ` [SL: ${it.serial_no}]` : '';
    const qty = it.qty || 1;
    const price = Number(it.unit_price || 0).toFixed(2);
    const tot = Number(it.total_price || (qty * Number(it.unit_price || 0))).toFixed(2);
    return `${idx + 1}. ${name}${sn} — ${qty} x ${price} = BDT ${tot}`;
  }).join('\n');

  return [
    `*${shopName}*`,
    `${shopAddr}`,
    `Tel: ${shopPhone}`,
    `----------------------------`,
    `*${title}*`,
    `Invoice/Voucher No: *${invoiceId || 'NEW'}*`,
    `Date: ${date}`,
    `Customer: *${customerName || 'Walk-in Customer'}*`,
    mobile ? `Mobile: ${mobile}` : '',
    `----------------------------`,
    itemLines || '1. General Bill / Voucher Entry',
    `----------------------------`,
    `Total Amount: BDT ${Number(totalAmount || 0).toFixed(2)}`,
    Number(discount) ? `Discount: BDT ${Number(discount).toFixed(2)}` : '',
    `*Net Payable: BDT ${Number(netPayable || 0).toFixed(2)}*`,
    `Paid / Collected: BDT ${Number(paidAmount || 0).toFixed(2)}`,
    `*Balance Due: BDT ${Number(dueAmount || 0).toFixed(2)}*`,
    `----------------------------`,
    footer
  ].filter(Boolean).join('\n');
}

export function buildWhatsAppDueText({
  shop = {},
  customerName = '',
  mobile = '',
  dueAmount = 0,
  voucherNo = ''
}) {
  const shopName = shop.branch_name || 'HAZI TRADERS';
  const shopPhone = shop.phone || '01818524712, 01402338209';
  return [
    `Assalamu Alaikum *${customerName || 'Valued Customer'}*,`,
    `Greetings from *${shopName}*!`,
    voucherNo ? `Reference Invoice/Voucher: *${voucherNo}*` : '',
    `Your current outstanding balance / due with us is *BDT ${Number(dueAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}*.`,
    `Kindly arrange payment at your earliest convenience. If already paid, please disregard this reminder.`,
    `----------------------------`,
    `*${shopName}*`,
    `Hotline: ${shopPhone}`
  ].filter(Boolean).join('\n');
}
