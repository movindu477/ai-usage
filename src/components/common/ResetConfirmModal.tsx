import React from 'react';
import { Trash2 } from 'lucide-react';

interface ResetConfirmModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  onCancel,
  onConfirm,
}) => {
  return (
    <div
      className="absolute inset-0 z-50 bg-[var(--color-bg-card)]/95 backdrop-blur-md p-3 flex flex-col justify-center items-center gap-2 rounded-[20px] text-center border border-[var(--border-strong)]"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Trash2 className="w-6 h-6 text-red-400 mb-1" />
      <div className="text-[11px] font-bold text-[var(--color-text-1)]">Reset Local Database?</div>
      <div className="text-[9.5px] text-[var(--color-text-3)] max-w-[200px]">
        This will clear cached events and reset preferences. Your files and credentials are never touched.
      </div>
      <div className="flex items-center gap-2 mt-2 w-full">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-6 rounded bg-[var(--surface-2)] text-[var(--color-text-2)] text-[10px] font-medium cursor-pointer hover:bg-[var(--surface-1)]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 h-6 rounded bg-red-600 text-white text-[10px] font-bold cursor-pointer hover:bg-red-500"
        >
          Reset All
        </button>
      </div>
    </div>
  );
};
