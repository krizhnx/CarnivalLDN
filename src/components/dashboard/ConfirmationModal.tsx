import { Event } from '../../types';

interface ConfirmationModalProps {
  confirm: { type: 'archive' | 'delete'; event: Event } | null;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmationModal = ({ confirm, onClose, onConfirm }: ConfirmationModalProps) => {
  if (!confirm) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {confirm.type === 'delete' ? 'Delete Event' : confirm.event.isArchived ? 'Unarchive Event' : 'Archive Event'}
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          {confirm.type === 'delete'
            ? 'This will permanently delete the event and related data (if archived). This action cannot be undone.'
            : confirm.event.isArchived
              ? 'This will unarchive the event and make it visible again.'
              : 'This will archive the event and hide it from public view.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md border text-gray-700">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md text-white ${
              confirm.type === 'delete' 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-gray-900 hover:bg-gray-800'
            }`}
          >
            {confirm.type === 'delete' ? 'Delete' : (confirm.event.isArchived ? 'Unarchive' : 'Archive')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
