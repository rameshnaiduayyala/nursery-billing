import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Form, Modal, Alert, Spinner } from 'react-bootstrap';
import { useToast } from '../../context/ToastContext';
import { backupService } from '../../services/backupService';

export default function BackupRestorePage() {
  const { showToast } = useToast();

  const [statusInfo, setStatusInfo] = useState(null);
  const [backups, setBackups] = useState([]);
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState({
    backup_auto_enabled: true,
    backup_frequency: 'daily',
    backup_time: '02:00',
    backup_retention_count: 30,
  });

  const [loading, setLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [downloadingExport, setDownloadingExport] = useState(null);

  // Restore Modal State
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedRestoreBackup, setSelectedRestoreBackup] = useState(null);
  const [restoreUploadFile, setRestoreUploadFile] = useState(null);
  const [confirmInput, setConfirmInput] = useState('');
  const [restoring, setRestoring] = useState(false);

  const fetchBackupData = useCallback(async () => {
    try {
      setLoading(true);
      const [statusRes, listRes] = await Promise.all([
        backupService.getStatus(),
        backupService.getList(),
      ]);

      if (statusRes.success) {
        setStatusInfo(statusRes.data);
      }

      if (listRes.success) {
        setBackups(listRes.data.backups || []);
        setStats(listRes.data.stats || null);
        if (listRes.data.settings) {
          setSettings(listRes.data.settings);
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to load backup details', 'danger');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchBackupData();
  }, [fetchBackupData]);

  const handleCreateBackup = async () => {
    try {
      setCreatingBackup(true);
      const res = await backupService.createBackup();
      if (res.success) {
        showToast(`✓ Backup created successfully! File: ${res.data.filename}`, 'success');
        fetchBackupData();
      }
    } catch (err) {
      showToast(err.message || 'Backup creation failed', 'danger');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDownloadBackup = async (id, filename) => {
    try {
      await backupService.downloadBackupFile(id, filename);
      showToast(`Downloading ${filename}...`, 'info');
    } catch (err) {
      showToast(err.message || 'Download failed', 'danger');
    }
  };

  const handleDeleteBackup = async (id, filename) => {
    if (!window.confirm(`Are you sure you want to delete backup file: ${filename}?`)) {
      return;
    }
    try {
      const res = await backupService.deleteBackup(id);
      if (res.success) {
        showToast('Backup deleted successfully', 'success');
        fetchBackupData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete backup', 'danger');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const res = await backupService.updateSettings(settings);
      if (res.success) {
        showToast('✓ Backup settings saved successfully', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to save settings', 'danger');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleExport = async (type) => {
    try {
      setDownloadingExport(type);
      await backupService.downloadExportFile(type);
      showToast(`Exported ${type.replace('_', ' ')} successfully`, 'success');
    } catch (err) {
      showToast(err.message || 'Export failed', 'danger');
    } finally {
      setDownloadingExport(null);
    }
  };

  const handleOpenRestoreModal = (backup = null) => {
    setSelectedRestoreBackup(backup);
    setRestoreUploadFile(null);
    setConfirmInput('');
    setShowRestoreModal(true);
  };

  const handleExecuteRestore = async () => {
    if (confirmInput.trim() !== 'RESTORE DATABASE') {
      showToast('Please type exact text "RESTORE DATABASE" to confirm.', 'warning');
      return;
    }

    try {
      setRestoring(true);
      let res;
      if (restoreUploadFile) {
        const formData = new FormData();
        formData.append('file', restoreUploadFile);
        res = await backupService.restoreBackup(formData);
      } else if (selectedRestoreBackup) {
        res = await backupService.restoreBackup({ backup_id: selectedRestoreBackup.id });
      } else {
        showToast('Please select a backup file to restore.', 'warning');
        setRestoring(false);
        return;
      }

      if (res.success) {
        showToast('✓ Database restored successfully!', 'success');
        setShowRestoreModal(false);
        fetchBackupData();
      }
    } catch (err) {
      showToast(err.message || 'Database restoration failed', 'danger');
    } finally {
      setRestoring(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes <= 0) return '0 B';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(1)} KB`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const latestSuccessBackup = backups.find((b) => b.status === 'SUCCESS');

  if (loading) {
    return (
      <Container fluid className="p-4 text-center py-5">
        <Spinner animation="border" variant="success" />
        <p className="mt-2 text-muted">Loading Backup & Recovery System...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="p-3 p-md-4">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-2 border-bottom">
        <div>
          <h3 className="fw-bold mb-1 text-dark">
            <i className="bi bi-database-fill-gear text-success me-2"></i>
            BACKUP & RESTORE
          </h3>
          <p className="text-muted small mb-0">
            System Disaster Recovery, MySQL Database Dumps, and Business Financial Data Exports
          </p>
        </div>
        <div className="mt-3 mt-md-0 d-flex gap-2">
          <Button variant="outline-primary" size="sm" onClick={fetchBackupData}>
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh Status
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleOpenRestoreModal(null)}>
            <i className="bi bi-exclamation-triangle-fill me-1"></i> Restore Database
          </Button>
        </div>
      </div>

      {/* System Diagnostic Status Bar */}
      <Row className="g-3 mb-4">
        <Col xs={12} md={4}>
          <Card className="border-0 shadow-sm bg-white h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="fs-1 me-3 text-success">
                <i className="bi bi-database-check"></i>
              </div>
              <div>
                <div className="text-muted small fw-semibold text-uppercase">Database Connection</div>
                <h5 className="fw-bold mb-0 text-success">
                  🟢 Connected
                </h5>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} md={4}>
          <Card className="border-0 shadow-sm bg-white h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="fs-1 me-3 text-primary">
                <i className="bi bi-shield-check"></i>
              </div>
              <div>
                <div className="text-muted small fw-semibold text-uppercase">Backup Storage</div>
                <h5 className="fw-bold mb-0 text-primary">
                  {statusInfo?.backup_directory_writable ? '🟢 Ready & Secure' : '🔴 Storage Error'}
                </h5>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} md={4}>
          <Card className="border-0 shadow-sm bg-white h-100">
            <Card.Body className="d-flex align-items-center">
              <div className={`fs-1 me-3 ${statusInfo?.mysqldump_available ? 'text-success' : 'text-warning'}`}>
                <i className="bi bi-terminal-fill"></i>
              </div>
              <div>
                <div className="text-muted small fw-semibold text-uppercase">Dump Engine</div>
                <h5 className={`fw-bold mb-0 ${statusInfo?.mysqldump_available ? 'text-success' : 'text-warning'}`}>
                  {statusInfo?.mysqldump_available ? '🟢 mysqldump Available' : '🟡 PHP Dumper Active'}
                </h5>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Warn if mysqldump is missing */}
      {!statusInfo?.mysqldump_available && (
        <Alert variant="warning" className="shadow-sm mb-4">
          <i className="bi bi-info-circle-fill me-2"></i>
          <strong>Hosting Engine Note:</strong> Server does not provide CLI <code>mysqldump</code> binary. The system is automatically using the built-in <strong>High-Precision PHP MySQL Dumper</strong> for full table structure and data backups.
        </Alert>
      )}

      <Row className="g-4 mb-4">
        {/* Section 1: DATABASE BACKUP */}
        <Col xs={12} lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-dark text-white fw-bold py-3 d-flex justify-content-between align-items-center">
              <span>
                <i className="bi bi-database-down me-2 text-success"></i>
                DATABASE BACKUP
              </span>
              <Badge bg="success" className="px-2 py-1">Full SQL Dump</Badge>
            </Card.Header>
            <Card.Body className="d-flex flex-column justify-content-between">
              <div>
                <p className="text-muted">
                  Create a complete SQL backup of the MySQL database for complete disaster recovery.
                </p>
                <div className="bg-light rounded p-3 mb-3 border">
                  <div className="fw-semibold text-dark mb-2 small text-uppercase">Includes Complete Tables & Data:</div>
                  <Row className="g-2 text-dark small">
                    <Col xs={6}><i className="bi bi-check-circle-fill text-success me-1"></i> Farmers</Col>
                    <Col xs={6}><i className="bi bi-check-circle-fill text-success me-1"></i> Customers</Col>
                    <Col xs={6}><i className="bi bi-check-circle-fill text-success me-1"></i> Transactions</Col>
                    <Col xs={6}><i className="bi bi-check-circle-fill text-success me-1"></i> Sales</Col>
                    <Col xs={6}><i className="bi bi-check-circle-fill text-success me-1"></i> Farmer Payments</Col>
                    <Col xs={6}><i className="bi bi-check-circle-fill text-success me-1"></i> Expenses</Col>
                    <Col xs={6}><i className="bi bi-check-circle-fill text-success me-1"></i> Orders</Col>
                    <Col xs={6}><i className="bi bi-check-circle-fill text-success me-1"></i> Inventory</Col>
                    <Col xs={6}><i className="bi bi-check-circle-fill text-success me-1"></i> Users</Col>
                    <Col xs={6}><i className="bi bi-check-circle-fill text-success me-1"></i> Settings</Col>
                    <Col xs={12}><i className="bi bi-check-circle-fill text-success me-1"></i> All future database tables & triggers</Col>
                  </Row>
                </div>

                <div className="p-3 bg-light rounded border mb-3">
                  <Row className="g-2 small">
                    <Col xs={6}>
                      <span className="text-muted">Last Backup:</span>
                      <div className="fw-bold text-dark">{formatDate(stats?.last_backup?.created_at)}</div>
                    </Col>
                    <Col xs={6}>
                      <span className="text-muted">Backup Size:</span>
                      <div className="fw-bold text-dark">{formatSize(stats?.last_backup?.file_size)}</div>
                    </Col>
                    <Col xs={6}>
                      <span className="text-muted">Backup Count:</span>
                      <div className="fw-bold text-dark">{stats?.total_count || 0} File(s)</div>
                    </Col>
                    <Col xs={6}>
                      <span className="text-muted">Status:</span>
                      <div>
                        {latestSuccessBackup ? (
                          <Badge bg="success">🟢 Backup Available</Badge>
                        ) : (
                          <Badge bg="danger">🔴 No Backup Yet</Badge>
                        )}
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 pt-2">
                <Button
                  variant="success"
                  className="fw-bold flex-grow-1"
                  onClick={handleCreateBackup}
                  disabled={creatingBackup}
                >
                  {creatingBackup ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Creating database backup...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-download me-2"></i>
                      Create Backup Now
                    </>
                  )}
                </Button>

                {latestSuccessBackup && (
                  <Button
                    variant="outline-secondary"
                    className="fw-bold"
                    onClick={() => handleDownloadBackup(latestSuccessBackup.id, latestSuccessBackup.filename)}
                  >
                    <i className="bi bi-file-earmark-arrow-down me-1"></i>
                    Download Latest Backup
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Section 3: AUTOMATIC BACKUP */}
        <Col xs={12} lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-dark text-white fw-bold py-3">
              <i className="bi bi-clock-history me-2 text-primary"></i>
              AUTOMATIC BACKUP SCHEDULE
            </Card.Header>
            <Card.Body className="d-flex flex-column justify-content-between">
              <Form onSubmit={handleSaveSettings}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="enable-auto-backup"
                    label={<strong className="text-dark">Enable Automatic Backup (cPanel Cron)</strong>}
                    checked={settings.backup_auto_enabled}
                    onChange={(e) => setSettings({ ...settings, backup_auto_enabled: e.target.checked })}
                  />
                  <Form.Text className="text-muted">
                    Automated background backup via scheduled cPanel Cron script.
                  </Form.Text>
                </Form.Group>

                <Row className="g-3 mb-3">
                  <Col xs={12} sm={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small text-muted">Frequency</Form.Label>
                      <Form.Select
                        value={settings.backup_frequency}
                        onChange={(e) => setSettings({ ...settings, backup_frequency: e.target.value })}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col xs={12} sm={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small text-muted">Scheduled Backup Time</Form.Label>
                      <Form.Control
                        type="text"
                        value={settings.backup_time}
                        placeholder="02:00 AM"
                        onChange={(e) => setSettings({ ...settings, backup_time: e.target.value })}
                      />
                    </Form.Group>
                  </Col>

                  <Col xs={12}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small text-muted">Retention Policy (Keep Backups)</Form.Label>
                      <Form.Select
                        value={settings.backup_retention_count}
                        onChange={(e) => setSettings({ ...settings, backup_retention_count: parseInt(e.target.value, 10) })}
                      >
                        <option value={7}>Keep last 7 backups</option>
                        <option value={15}>Keep last 15 backups</option>
                        <option value={30}>Keep last 30 backups</option>
                        <option value={60}>Keep last 60 backups</option>
                        <option value={90}>Keep last 90 backups</option>
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Older backups exceeding retention limit are safely purged. The system will never delete the last remaining backup.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Button
                  type="submit"
                  variant="primary"
                  className="fw-bold w-100"
                  disabled={savingSettings}
                >
                  {savingSettings ? 'Saving Settings...' : 'Save Backup Settings'}
                </Button>
              </Form>

              <div className="mt-3 p-3 bg-light rounded border small text-muted">
                <i className="bi bi-info-square-fill me-1 text-primary"></i>
                <strong>cPanel Cron Command:</strong>
                <code className="d-block mt-1 p-2 bg-white rounded border text-dark">
                  0 2 * * * php {statusInfo?.backup_directory ? `${statusInfo.backup_directory}/../api/backups/cron-backup.php` : '/path/to/backend/api/backups/cron-backup.php'}
                </code>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Section 2: BUSINESS DATA EXPORT */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-dark text-white fw-bold py-3 d-flex justify-content-between align-items-center">
          <span>
            <i className="bi bi-file-earmark-spreadsheet me-2 text-info"></i>
            BUSINESS DATA EXPORT
          </span>
          <Badge bg="info">CSV / Excel Compatible</Badge>
        </Card.Header>
        <Card.Body>
          <p className="text-muted small mb-3">
            Export specific financial ledgers and operational data tables as individual CSV spreadsheets, or export everything into a unified ZIP file.
          </p>

          <Row className="g-2">
            {[
              { label: 'Export Farmers', type: 'farmers', icon: 'bi-person-lines-fill' },
              { label: 'Export Customers', type: 'customers', icon: 'bi-people-fill' },
              { label: 'Export Transactions', type: 'transactions', icon: 'bi-journal-text' },
              { label: 'Export Sales', type: 'sales', icon: 'bi-cart-check-fill' },
              { label: 'Export Expenses', type: 'expenses', icon: 'bi-truck' },
              { label: 'Export Inventory', type: 'inventory', icon: 'bi-box-seam' },
              { label: 'Export Farmer Ledgers', type: 'farmer_ledgers', icon: 'bi-journal-bookmark-fill' },
              { label: 'Export Customer Ledgers', type: 'customer_ledgers', icon: 'bi-journal-bookmark' },
              { label: 'Export Profit & Loss', type: 'profit_loss', icon: 'bi-calculator-fill' },
            ].map((item) => (
              <Col xs={12} sm={6} md={4} lg={3} key={item.type}>
                <Button
                  variant="outline-dark"
                  size="sm"
                  className="w-100 text-start py-2 px-3 fw-semibold border shadow-xs"
                  onClick={() => handleExport(item.type)}
                  disabled={downloadingExport === item.type}
                >
                  {downloadingExport === item.type ? (
                    <Spinner animation="border" size="sm" className="me-2" />
                  ) : (
                    <i className={`bi ${item.icon} text-primary me-2`}></i>
                  )}
                  {item.label}
                </Button>
              </Col>
            ))}

            <Col xs={12} sm={6} md={4} lg={3}>
              <Button
                variant="success"
                size="sm"
                className="w-100 py-2 px-3 fw-bold shadow-sm"
                onClick={() => handleExport('everything')}
                disabled={downloadingExport === 'everything'}
              >
                {downloadingExport === 'everything' ? (
                  <Spinner animation="border" size="sm" className="me-2" />
                ) : (
                  <i className="bi bi-file-earmark-zip-fill me-2"></i>
                )}
                Export Everything (ZIP)
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Section 4: BACKUP HISTORY */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-dark text-white fw-bold py-3">
          <i className="bi bi-clock-history me-2"></i>
          BACKUP HISTORY & LOGS
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover align="middle" className="mb-0">
            <thead className="table-light text-uppercase small">
              <tr>
                <th>Date & Time</th>
                <th>Filename</th>
                <th>Size</th>
                <th>Type</th>
                <th>Created By</th>
                <th>Status</th>
                <th className="text-end pe-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {backups.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    No backup logs recorded yet. Click "Create Backup Now" to create your first dump.
                  </td>
                </tr>
              ) : (
                backups.map((item) => (
                  <tr key={item.id}>
                    <td className="fw-semibold text-dark">{formatDate(item.created_at)}</td>
                    <td>
                      <code className="text-primary small">{item.filename}</code>
                    </td>
                    <td>{formatSize(item.file_size)}</td>
                    <td>
                      <Badge bg={item.backup_type === 'AUTOMATIC' ? 'info' : 'dark'}>
                        {item.backup_type}
                      </Badge>
                    </td>
                    <td>{item.creator_name}</td>
                    <td>
                      {item.status === 'SUCCESS' ? (
                        <Badge bg="success">Success</Badge>
                      ) : (
                        <Badge bg="danger" title={item.error_message || 'Failed'}>
                          Failed
                        </Badge>
                      )}
                    </td>
                    <td className="text-end pe-3">
                      {item.status === 'SUCCESS' && (
                        <>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="me-1 py-1 px-2"
                            onClick={() => handleDownloadBackup(item.id, item.filename)}
                            title="Download SQL Backup"
                          >
                            <i className="bi bi-download"></i>
                          </Button>
                          <Button
                            variant="outline-warning"
                            size="sm"
                            className="me-1 py-1 px-2"
                            onClick={() => handleOpenRestoreModal(item)}
                            title="Restore this backup"
                          >
                            <i className="bi bi-arrow-counterclockwise"></i>
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="py-1 px-2"
                        onClick={() => handleDeleteBackup(item.id, item.filename)}
                        title="Delete Backup"
                      >
                        <i className="bi bi-trash-fill"></i>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* RESTORE DATABASE MODAL */}
      <Modal show={showRestoreModal} onHide={() => !restoring && setShowRestoreModal(false)} size="lg" centered>
        <Modal.Header closeButton={!restoring} className="bg-danger text-white">
          <Modal.Title className="fw-bold">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            RESTORE DATABASE CONFIRMATION
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Alert variant="danger" className="border-danger border-2">
            <h5 className="alert-heading fw-bold">
              <i className="bi bi-shield-slash-fill me-2"></i>
              CRITICAL WARNING
            </h5>
            <p className="mb-0">
              Restoring a database will <strong>OVERWRITE & REPLACE</strong> all current application data with the content from the selected backup file. This action cannot be undone.
            </p>
          </Alert>

          <div className="p-3 bg-light rounded border mb-3">
            <h6 className="fw-bold text-dark mb-2">Selected Restore File Source:</h6>
            {selectedRestoreBackup ? (
              <div>
                <strong>From Backup History:</strong> <code className="text-primary">{selectedRestoreBackup.filename}</code> ({formatDate(selectedRestoreBackup.created_at)})
              </div>
            ) : (
              <Form.Group>
                <Form.Label className="fw-semibold text-dark">Upload SQL Backup File (.sql):</Form.Label>
                <Form.Control
                  type="file"
                  accept=".sql"
                  onChange={(e) => setRestoreUploadFile(e.target.files[0] || null)}
                />
              </Form.Group>
            )}
          </div>

          <div className="p-3 bg-light rounded border mb-3">
            <Form.Label className="fw-bold text-dark">
              To proceed, please type: <code className="text-danger">RESTORE DATABASE</code>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="RESTORE DATABASE"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              disabled={restoring}
            />
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={() => setShowRestoreModal(false)} disabled={restoring}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="fw-bold"
            disabled={confirmInput.trim() !== 'RESTORE DATABASE' || restoring}
            onClick={handleExecuteRestore}
          >
            {restoring ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Restoring Database...
              </>
            ) : (
              <>
                <i className="bi bi-arrow-counterclockwise me-1"></i>
                Restore Database
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
