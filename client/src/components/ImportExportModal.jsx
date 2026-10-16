import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  FileJson,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export function ImportExportModal({
  isOpen,
  onClose,
  totalNotes,
  onExportAll,
  onBulkImport,
  showToast,
}) {
  const [importStatus, setImportStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewCount, setPreviewCount] = useState(0);
  const [parsedNotes, setParsedNotes] = useState([]);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportStatus(null);

    try {
      const text = await file.text();
      let imported = [];

      if (file.name.endsWith('.json')) {
        const json = JSON.parse(text);
        imported = Array.isArray(json) ? json : (Array.isArray(json.notes) ? json.notes : []);
      } else if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        // Parse markdown file into a single note
        const title = file.name.replace(/\.[^/.]+$/, '');
        imported = [{
          title,
          content: text,
          category: 'Personal',
          tags: ['imported'],
        }];
      } else {
        throw new Error('Unsupported format. Please upload a .json or .md file.');
      }

      if (imported.length === 0) {
        throw new Error('No valid notes found in the file.');
      }

      setParsedNotes(imported);
      setPreviewCount(imported.length);
      setImportStatus({
        type: 'ready',
        message: `Found ${imported.length} note${imported.length === 1 ? '' : 's'} ready for import.`
      });
    } catch (err) {
      setImportStatus({
        type: 'error',
        message: err.message || 'Failed to read file.'
      });
      setParsedNotes([]);
      setPreviewCount(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (parsedNotes.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await onBulkImport(parsedNotes);
      if (res && res.success) {
        onClose();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        className="modal-dialog modal-medium"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-export-title"
      >
        <div className="modal-header">
          <div className="modal-header-left">
            <h2 id="import-export-title">Import & Export Notes</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close modal dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Export Section */}
          <section className="io-section">
            <div className="io-section-header">
              <Download size={18} className="io-icon" />
              <div>
                <h3 className="io-title">Export Workspace</h3>
                <p className="io-desc">
                  Download a complete JSON backup of your active notes ({totalNotes} notes).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onExportAll}
              className="btn-secondary"
            >
              <FileJson size={16} />
              <span>Download JSON Backup</span>
            </button>
          </section>

          <hr className="io-divider" />

          {/* Import Section */}
          <section className="io-section">
            <div className="io-section-header">
              <Upload size={18} className="io-icon" />
              <div>
                <h3 className="io-title">Import Notes</h3>
                <p className="io-desc">
                  Upload a previously exported NoteFlow JSON backup or any Markdown (.md) document.
                </p>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,.md,.txt"
              style={{ display: 'none' }}
            />

            <div
              className="dropzone-box"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  fileInputRef.current?.click();
                }
              }}
            >
              <FileText size={24} className="dropzone-icon" />
              <div className="dropzone-text">
                <strong>Click to select file</strong> or drag & drop here
              </div>
              <div className="dropzone-sub">Supports .json, .md, .txt files</div>
            </div>

            {isProcessing && (
              <div className="io-status-box loading">
                <Loader2 size={16} className="spinner" />
                <span>Processing file...</span>
              </div>
            )}

            {importStatus && (
              <div className={`io-status-box ${importStatus.type}`}>
                {importStatus.type === 'ready' ? (
                  <CheckCircle size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                <span>{importStatus.message}</span>
              </div>
            )}

            {previewCount > 0 && (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isProcessing}
                className="btn-primary"
                style={{ marginTop: 'var(--space-3)', width: '100%', justifyContent: 'center' }}
              >
                <Upload size={15} />
                <span>Import {previewCount} Note{previewCount === 1 ? '' : 's'} to Database</span>
              </button>
            )}
          </section>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportExportModal;
