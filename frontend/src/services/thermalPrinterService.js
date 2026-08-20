/**
 * Thermal Printer Service for ESC/POS 58mm / 80mm Bluetooth Printers
 * Supports Web Bluetooth API and canvas-based thermal receipt rendering.
 */

// Format line text to fit column width (e.g., 32 cols for 58mm, 48 cols for 80mm)
export function formatTwoColumns(leftText, rightText, width = 32) {
  const leftStr = String(leftText || '');
  const rightStr = String(rightText || '');
  const maxLeft = width - rightStr.length - 1;
  const truncatedLeft = leftStr.length > maxLeft ? leftStr.substring(0, maxLeft) : leftStr;
  const padding = width - truncatedLeft.length - rightStr.length;
  return truncatedLeft + ' '.repeat(Math.max(1, padding)) + rightStr;
}

export function generateReceiptText(receiptData, paperWidth = '58mm') {
  const cols = paperWidth === '80mm' ? 48 : 32;
  const lineDivider = '-'.repeat(cols);
  const doubleDivider = '='.repeat(cols);

  let lines = [];

  // ── Header ──
  lines.push('*** SALES RECEIPT ***'.padStart((cols + 21) / 2));
  lines.push(receiptData.nurseryName || 'GREEN VANYX NURSERY');
  if (receiptData.nurseryAddress) lines.push(receiptData.nurseryAddress);
  if (receiptData.nurseryPhone) lines.push(`Phone: ${receiptData.nurseryPhone}`);
  lines.push(doubleDivider);

  // ── Meta Info ──
  lines.push(formatTwoColumns(`Bill No: ${receiptData.bill_no || receiptData.id || 'N/A'}`, receiptData.date || '', cols));
  if (receiptData.customer_name) {
    lines.push(`Customer: ${receiptData.customer_name}`);
  }
  if (receiptData.payment_mode) {
    lines.push(`Payment: ${receiptData.payment_mode}`);
  }
  lines.push(lineDivider);

  // ── Items ──
  if (cols === 32) {
    lines.push(formatTwoColumns('Item/Qty x Rate', 'Amount (₹)', cols));
  } else {
    lines.push(formatTwoColumns('Item Description', 'Qty x Rate   Amount', cols));
  }
  lines.push(lineDivider);

  const items = receiptData.items || [];
  let subtotal = 0;

  items.forEach((item) => {
    const name = item.plant_name || item.name || 'Plant';
    const qty = Number(item.quantity || 1);
    const rate = Number(item.rate || item.price || 0);
    const amount = Number(item.amount || qty * rate);
    subtotal += amount;

    lines.push(name);
    const detailStr = `  ${qty} ${item.unit || 'pcs'} x ₹${rate.toFixed(2)}`;
    lines.push(formatTwoColumns(detailStr, `₹${amount.toFixed(2)}`, cols));
  });

  lines.push(lineDivider);

  // ── Financials ──
  const total = Number(receiptData.total_amount || subtotal);
  const discount = Number(receiptData.discount || 0);
  const paid = Number(receiptData.paid_amount || total);
  const balance = Number(receiptData.balance_amount || total - paid);

  if (discount > 0) {
    lines.push(formatTwoColumns('Subtotal:', `₹${subtotal.toFixed(2)}`, cols));
    lines.push(formatTwoColumns('Discount:', `-₹${discount.toFixed(2)}`, cols));
  }
  lines.push(formatTwoColumns('TOTAL AMOUNT:', `₹${total.toFixed(2)}`, cols));
  lines.push(formatTwoColumns('Amount Paid:', `₹${paid.toFixed(2)}`, cols));

  if (balance > 0) {
    lines.push(formatTwoColumns('BALANCE DUE:', `₹${balance.toFixed(2)}`, cols));
  }

  lines.push(doubleDivider);
  lines.push('Thank you for your business!'.padStart((cols + 27) / 2));
  lines.push('Visit Again!'.padStart((cols + 12) / 2));
  lines.push('\n\n');

  return lines.join('\n');
}

// ── Web Bluetooth ESC/POS Print Connector ──
export async function printViaWebBluetooth(receiptData, paperWidth = '58mm') {
  if (!navigator.bluetooth) {
    throw new Error('Web Bluetooth is not supported on this browser or platform.');
  }

  const textContent = generateReceiptText(receiptData, paperWidth);

  // Request Bluetooth Device
  const device = await navigator.bluetooth.requestDevice({
    filters: [
      { services: ['000018f0-0000-1000-8000-00805f9b34fb'] },
      { namePrefix: 'RP' },
      { namePrefix: 'POS' },
      { namePrefix: 'BT' },
      { namePrefix: 'Thermal' },
      { namePrefix: 'Printer' },
    ],
    optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2', 0x18f0],
  });

  const server = await device.gatt.connect();

  // Find printing characteristic
  const services = await server.getPrimaryServices();
  let printChar = null;

  for (const service of services) {
    const chars = await service.getCharacteristics();
    for (const c of chars) {
      if (c.properties.write || c.properties.writeWithoutResponse) {
        printChar = c;
        break;
      }
    }
    if (printChar) break;
  }

  if (!printChar) {
    throw new Error('No writable Bluetooth printing characteristic found on device.');
  }

  // ESC/POS Initialization Command
  const encoder = new TextEncoder();
  const initCmd = new Uint8Array([0x1b, 0x40]); // ESC @
  await printChar.writeValue(initCmd);

  // Send Text Data in chunks
  const textBytes = encoder.encode(textContent);
  const chunkSize = 100;
  for (let i = 0; i < textBytes.length; i += chunkSize) {
    const chunk = textBytes.slice(i, i + chunkSize);
    await printChar.writeValue(chunk);
  }

  // Feed & Cut Command
  const cutCmd = new Uint8Array([0x1d, 0x56, 0x41, 0x03]); // GS V A 3
  await printChar.writeValue(cutCmd);

  device.gatt.disconnect();
  return true;
}
