import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

/**
 * ConfirmModal – modal de confirmation stylisé, identique au système.
 *
 * Props :
 *   open        : boolean
 *   title       : string  – ex: "Supprimer l'appartement"
 *   message     : string  – ex: "Cette action est irréversible."
 *   confirmLabel: string  – ex: "Supprimer"  (défaut: "Confirmer")
 *   cancelLabel : string  – ex: "Annuler"    (défaut: "Annuler")
 *   onConfirm   : () => void
 *   onCancel    : () => void
 */
export default function ConfirmModal({
  open,
  title = 'Confirmation',
  message = 'Êtes-vous sûr de vouloir continuer ?',
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <p className="px-6 pb-6 text-sm text-slate-500 leading-relaxed">{message}</p>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-all"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
