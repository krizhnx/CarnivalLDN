import React, { useState } from 'react';
import { AlertCircle, ClipboardList, Minus, Plus, Send } from 'lucide-react';
import { Event, GuestlistFormData } from '../types';
import { cn } from '../lib/utils';
import { AdminModal } from './admin/Modal';
import { Button, Field, Input, Textarea } from './admin/ui';

interface GuestlistModalProps {
  event: Event;
  onClose: () => void;
  onSuccess: (guestlist: any) => void;
  onManageGuestlists?: () => void;
}

const CATEGORIES = [
  { value: 'free', label: 'Free', hint: 'Free entry' },
  { value: 'GL', label: 'GL', hint: 'Guestlist' },
  { value: 'tables', label: 'Tables', hint: 'Table booking' },
  { value: 'other', label: 'Other', hint: 'Anything else' },
] as const;

const GuestlistModal: React.FC<GuestlistModalProps> = ({ event, onClose, onSuccess, onManageGuestlists }) => {
  const [formData, setFormData] = useState<GuestlistFormData>({
    leadName: '',
    leadEmail: '',
    leadPhone: '',
    totalTickets: 1,
    notes: '',
    category: 'free',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.leadName || !formData.leadEmail || formData.totalTickets < 1) {
      setError('Please fill in all required fields and ensure at least 1 ticket.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/create-guestlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, ...formData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create guestlist');
      }

      const result = await response.json();
      onSuccess(result.guestlist);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof GuestlistFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <AdminModal
      open
      onClose={onClose}
      closeOnBackdrop={false}
      dismissable={!isSubmitting}
      size="md"
      icon={ClipboardList}
      title="New guestlist"
      description={event.title}
      headerActions={
        onManageGuestlists && (
          <Button size="sm" variant="ghost" onClick={onManageGuestlists}>
            View guestlists
          </Button>
        )
      }
      footer={
        <>
          <p className="mr-auto text-xs text-zinc-500">One QR code, scannable {formData.totalTickets}×, emailed to the lead.</p>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="guestlist-form" icon={Send} loading={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create & send QR'}
          </Button>
        </>
      }
    >
      <form id="guestlist-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Lead name" htmlFor="gl-name">
            <Input id="gl-name" value={formData.leadName} onChange={(e) => handleInputChange('leadName', e.target.value)} placeholder="e.g. John Smith" required autoFocus />
          </Field>
          <Field label="Lead email" htmlFor="gl-email">
            <Input id="gl-email" type="email" value={formData.leadEmail} onChange={(e) => handleInputChange('leadEmail', e.target.value)} placeholder="john@example.com" required />
          </Field>
          <Field label="Lead phone" optional htmlFor="gl-phone" className="sm:col-span-2">
            <Input id="gl-phone" type="tel" value={formData.leadPhone} onChange={(e) => handleInputChange('leadPhone', e.target.value)} placeholder="+44 7…" />
          </Field>
        </div>

        <Field label="Category">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CATEGORIES.map((c) => {
              const active = formData.category === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => handleInputChange('category', c.value)}
                  className={cn(
                    'rounded-xl border px-3 py-2.5 text-left transition-all',
                    active ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm' : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                  )}
                >
                  <span className="block text-sm font-semibold">{c.label}</span>
                  <span className={cn('block text-xs', active ? 'text-zinc-300' : 'text-zinc-500')}>{c.hint}</span>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Number of guests" hint={`The QR code can be scanned ${formData.totalTickets} time${formData.totalTickets === 1 ? '' : 's'} for entry.`}>
          <div className="inline-flex items-center rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => handleInputChange('totalTickets', Math.max(1, formData.totalTickets - 1))}
              disabled={formData.totalTickets <= 1}
              className="grid h-9 w-9 place-items-center rounded-lg text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
              aria-label="Fewer guests"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              min={1}
              value={formData.totalTickets}
              onChange={(e) => handleInputChange('totalTickets', Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 bg-transparent text-center text-lg font-semibold tabular-nums text-zinc-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => handleInputChange('totalTickets', formData.totalTickets + 1)}
              className="grid h-9 w-9 place-items-center rounded-lg text-zinc-600 hover:bg-zinc-100"
              aria-label="More guests"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </Field>

        <Field label="Notes" optional htmlFor="gl-notes">
          <Textarea
            id="gl-notes"
            rows={3}
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="e.g. VIP table, arrival time…"
          />
        </Field>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
      </form>
    </AdminModal>
  );
};

export default GuestlistModal;
