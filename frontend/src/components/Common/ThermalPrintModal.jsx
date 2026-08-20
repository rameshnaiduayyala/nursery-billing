import React, { useState } from 'react';
import { Modal, Button, Form, Alert, ButtonGroup } from 'react-bootstrap';
import { generateReceiptText, printViaWebBluetooth } from '../../services/thermalPrinterService';
import { shareFileOrText, showNativeToast } from '../../services/capacitorService';

export default function ThermalPrintModal({ show, onHide, receiptData }) {
  const [paperWidth, setPaperWidth] = useState('58mm');
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!receiptData) return null;

  const receiptText = generateReceiptText(receiptData, paperWidth);

  const handleBluetoothPrint = async () => {
    setError('');
    setSuccess('');
    try {
      setPrinting(true);
      await printViaWebBluetooth(receiptData, paperWidth);
      setSuccess('Receipt sent to thermal Bluetooth printer successfully!');
      showNativeToast('Printing started…');
    } catch (err) {
      console.error('Thermal print error:', err);
      setError(err.message || 'Failed to connect or print via Bluetooth.');
    } finally {
      setPrinting(false);
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(receiptText);
      showNativeToast('Receipt text copied to clipboard!');
      setSuccess('Receipt text copied!');
    } catch (e) {
      setError('Could not copy text.');
    }
  };

  const handleShare = async () => {
    try {
      await shareFileOrText({
        title: `Receipt #${receiptData.bill_no || receiptData.id || ''}`,
        text: receiptText,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const handleStandardPrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt ${receiptData.bill_no || receiptData.id || ''}</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 12px;
              width: ${paperWidth === '80mm' ? '80mm' : '58mm'};
              margin: 0 auto;
              padding: 10px;
              white-space: pre-wrap;
            }
            @media print {
              @page { margin: 0; size: auto; }
              body { width: 100%; margin: 0; padding: 5px; }
            }
          </style>
        </head>
        <body>${receiptText.replace(/\n/g, '<br>')}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Modal show={show} onHide={onHide} centered size="md" className="thermal-print-modal">
      <Modal.Header closeButton className="bg-success text-white py-2">
        <Modal.Title className="h6 mb-0">
          <i className="bi bi-printer-fill me-2" />
          Mobile Thermal Printer Receipt
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-light">
        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
        {success && <Alert variant="success" className="py-2 small">{success}</Alert>}

        <div className="d-flex justify-content-between align-items-center mb-2">
          <label className="fw-semibold small mb-0">Paper Size:</label>
          <ButtonGroup size="sm">
            <Button
              variant={paperWidth === '58mm' ? 'primary' : 'outline-primary'}
              onClick={() => setPaperWidth('58mm')}
            >
              58mm (2-inch / 32 col)
            </Button>
            <Button
              variant={paperWidth === '80mm' ? 'primary' : 'outline-primary'}
              onClick={() => setPaperWidth('80mm')}
            >
              80mm (3-inch / 48 col)
            </Button>
          </ButtonGroup>
        </div>

        {/* Live Thermal Receipt Canvas Preview */}
        <div
          className="receipt-preview p-3 my-2 border rounded bg-white font-monospace shadow-sm"
          style={{
            maxWidth: paperWidth === '80mm' ? '360px' : '270px',
            margin: '0 auto',
            fontSize: '11px',
            lineHeight: '1.3',
            color: '#111',
            whiteSpace: 'pre-wrap',
            fontFamily: "'Courier New', Courier, monospace",
            borderStyle: 'dashed !important',
          }}
        >
          {receiptText}
        </div>
      </Modal.Body>
      <Modal.Footer className="bg-white justify-content-between">
        <div className="d-flex gap-1">
          <Button variant="outline-secondary" size="sm" onClick={handleCopyText} title="Copy receipt text">
            <i className="bi bi-clipboard me-1" /> Copy
          </Button>

          <Button variant="outline-info" size="sm" onClick={handleShare} title="Share Receipt">
            <i className="bi bi-share me-1" /> Share
          </Button>
        </div>

        <div className="d-flex gap-2">
          <Button variant="outline-dark" size="sm" onClick={handleStandardPrint}>
            <i className="bi bi-printer me-1" /> Web Print
          </Button>
          <Button variant="success" size="sm" onClick={handleBluetoothPrint} disabled={printing}>
            <i className="bi bi-bluetooth me-1" />
            {printing ? 'Connecting…' : 'BT Print'}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
