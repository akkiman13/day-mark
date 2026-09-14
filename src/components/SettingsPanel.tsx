// SettingsPanel — Data management (export, import, clear)

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SettingsPanelProps {
  onExport: () => string;
  onImport: (json: string) => void;
  onClear: () => void;
}

export function SettingsPanel({ onExport, onImport, onClear }: SettingsPanelProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = onExport();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "daytrack-backup.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = reader.result as string;
        onImport(json);
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
      } catch {
        setImportError("Invalid backup file. Please select a valid daytrack-backup.json file.");
      }
    };
    reader.readAsText(file);

    // Reset input so the same file can be imported again
    e.target.value = "";
  };

  const handleClear = () => {
    onClear();
    setShowClearConfirm(false);
  };

  return (
    <div className="notebook-settings">
      <h3 className="notebook-section-title">Settings</h3>

      <div className="notebook-settings-section">
        <h4 className="notebook-settings-label">Data</h4>
        <div className="notebook-settings-actions">
          <button
            onClick={handleExport}
            className="notebook-settings-btn"
          >
            📥 Export My Data
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="notebook-settings-btn"
          >
            📤 Import Data
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />

          <button
            onClick={() => setShowClearConfirm(true)}
            className="notebook-settings-btn danger"
          >
            🗑️ Clear All Data
          </button>
        </div>

        <AnimatePresence>
          {importError && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="notebook-settings-error"
            >
              {importError}
            </motion.p>
          )}
          {importSuccess && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="notebook-settings-success"
            >
              Data imported successfully!
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Clear confirmation dialog */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="notebook-overlay"
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="notebook-confirm-dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="notebook-confirm-title">Are you sure?</h4>
              <p className="notebook-confirm-text">
                This will permanently delete all DayTrack data.
              </p>
              <div className="notebook-confirm-actions">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="notebook-confirm-btn cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClear}
                  className="notebook-confirm-btn delete"
                >
                  Delete Everything
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
