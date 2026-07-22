import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import './ConfirmModal.css';

export default function ConfirmModal({
  isOpen,
  title = 'Delete Record',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
}) {
  if (!isOpen) return null;

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return createPortal(
    <div className="confirm-modal-backdrop" onClick={handleBackdrop}>
      <div className="confirm-modal-box animate-scale-in" role="dialog" aria-modal="true">
        <button
          className="confirm-modal-close"
          onClick={onClose}
          disabled={isLoading}
          title="Close"
        >
          <X size={18} />
        </button>

        <div className="confirm-modal-header">
          <div className={`confirm-icon-wrap variant-${confirmVariant}`}>
            {confirmVariant === 'danger' ? (
              <Trash2 size={24} className="confirm-icon" />
            ) : (
              <AlertTriangle size={24} className="confirm-icon" />
            )}
          </div>
          <h3 className="confirm-modal-title">{title}</h3>
        </div>

        <div className="confirm-modal-body">
          <p className="confirm-modal-message">{message}</p>
        </div>

        <div className="confirm-modal-footer">
          <button
            type="button"
            className="confirm-cancel-btn"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`confirm-action-btn variant-${confirmVariant}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="confirm-btn-spinner" />
            ) : (
              <>
                <Trash2 size={16} />
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
