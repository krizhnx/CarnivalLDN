import { useState, useEffect } from 'react';
import { Check, CheckCircle2, Copy, ExternalLink, Link2 } from 'lucide-react';
import { AffiliateSociety, AffiliateLink, Event } from '../types';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { AdminModal } from './admin/Modal';
import { Avatar, Button, Field, IconButton, Select } from './admin/ui';

interface AffiliateLinkGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateLinks: (societyIds: string[], eventId: string) => Promise<void>;
  societies: AffiliateSociety[];
  events: Event[];
}

const linkFor = (eventId?: string, code?: string) => `https://carnivalldn.com/events?event=${eventId}&ref=${code}`;

const AffiliateLinkGenerator = ({ isOpen, onClose, onGenerateLinks, societies, events }: AffiliateLinkGeneratorProps) => {
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedSocieties, setSelectedSocieties] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLinks, setGeneratedLinks] = useState<AffiliateLink[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedEvent('');
      setSelectedSocieties([]);
      setGeneratedLinks([]);
    }
  }, [isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!selectedEvent || selectedSocieties.length === 0) {
      toast.error('Please select an event and at least one society');
      return;
    }

    setIsLoading(true);
    try {
      await onGenerateLinks(selectedSocieties, selectedEvent);
      toast.success(`Generated ${selectedSocieties.length} tracking link${selectedSocieties.length === 1 ? '' : 's'}`);

      const event = events.find((ev) => ev.id === selectedEvent);
      setGeneratedLinks(
        selectedSocieties.map((societyId) => {
          const society = societies.find((s) => s.id === societyId);
          return {
            id: `link-${societyId}-${selectedEvent}`,
            societyId,
            eventId: selectedEvent,
            linkCode: `${society?.code}-${event?.id}`,
            customUrl: undefined,
            isActive: true,
            createdAt: new Date(),
          };
        })
      );
    } catch (error) {
      console.error('Error generating links:', error);
      toast.error('Failed to generate tracking links');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success('Link copied');
  };

  const toggleSociety = (societyId: string) =>
    setSelectedSocieties((prev) => (prev.includes(societyId) ? prev.filter((id) => id !== societyId) : [...prev, societyId]));

  const allSelected = societies.length > 0 && selectedSocieties.length === societies.length;
  const activeEvents = events.filter((e) => !e.isArchived);
  const archived = events.filter((e) => e.isArchived);

  return (
    <AdminModal
      open={isOpen}
      onClose={onClose}
      size="lg"
      icon={Link2}
      title="Generate tracking links"
      description={generatedLinks.length ? `${generatedLinks.length} link${generatedLinks.length === 1 ? '' : 's'} ready to share` : 'One link per society, per event'}
      footer={
        generatedLinks.length === 0 ? (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void handleSubmit()} loading={isLoading} disabled={!selectedEvent || selectedSocieties.length === 0}>
              {isLoading ? 'Generating…' : `Generate ${selectedSocieties.length || ''} link${selectedSocieties.length === 1 ? '' : 's'}`}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setGeneratedLinks([]);
                setSelectedEvent('');
                setSelectedSocieties([]);
              }}
            >
              Generate more
            </Button>
            <Button variant="primary" onClick={onClose}>
              Done
            </Button>
          </>
        )
      }
    >
      {generatedLinks.length === 0 ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Field label="Event">
            <Select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} required>
              <option value="">Choose an event…</option>
              {activeEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} · {event.date}
                </option>
              ))}
              {archived.length > 0 && (
                <optgroup label="Archived">
                  {archived.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} · {event.date}
                    </option>
                  ))}
                </optgroup>
              )}
            </Select>
          </Field>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-zinc-700">
                Societies <span className="font-normal text-zinc-400">· {selectedSocieties.length} selected</span>
              </p>
              <Button size="sm" variant="ghost" onClick={() => setSelectedSocieties(allSelected ? [] : societies.map((s) => s.id))} disabled={!societies.length}>
                {allSelected ? 'Clear all' : 'Select all'}
              </Button>
            </div>
            {societies.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500">Add a society first.</p>
            ) : (
              <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {societies.map((society) => {
                  const on = selectedSocieties.includes(society.id);
                  return (
                    <button
                      key={society.id}
                      type="button"
                      onClick={() => toggleSociety(society.id)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                        on ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900' : 'border-zinc-200 hover:border-zinc-300'
                      )}
                    >
                      <Avatar name={society.name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-zinc-900">{society.name}</span>
                        <span className="block truncate text-xs text-zinc-500">
                          {society.university ? `${society.university} · ` : ''}
                          <span className="font-mono">{society.code}</span>
                        </span>
                      </span>
                      <span
                        className={cn(
                          'grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors',
                          on ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300 bg-white'
                        )}
                      >
                        {on && <Check className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedEvent && selectedSocieties.length > 0 && (
            <div className="space-y-2">
              <p className="text-[13px] font-medium text-zinc-700">Preview</p>
              <div className="divide-y divide-zinc-100 rounded-xl bg-zinc-50 ring-1 ring-inset ring-zinc-200">
                {selectedSocieties.slice(0, 6).map((societyId) => {
                  const society = societies.find((s) => s.id === societyId);
                  return (
                    <div key={societyId} className="px-3 py-2 text-xs">
                      <span className="font-medium text-zinc-800">{society?.name}</span>
                      <span className="mt-0.5 block truncate font-mono text-zinc-500">{linkFor(selectedEvent, society?.code).replace('https://', '')}</span>
                    </div>
                  );
                })}
                {selectedSocieties.length > 6 && <p className="px-3 py-2 text-xs text-zinc-500">+{selectedSocieties.length - 6} more</p>}
              </div>
            </div>
          )}
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-200">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            Links created. Copy and share them with each society.
          </div>
          <div className="divide-y divide-zinc-100 overflow-hidden rounded-xl ring-1 ring-zinc-200">
            {generatedLinks.map((link) => {
              const society = societies.find((s) => s.id === link.societyId);
              const event = events.find((e) => e.id === link.eventId);
              const fullUrl = linkFor(event?.id, society?.code);
              return (
                <div key={link.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={society?.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900">{society?.name}</p>
                    <p className="truncate font-mono text-xs text-zinc-500">{fullUrl}</p>
                  </div>
                  <IconButton icon={Copy} label="Copy link" size="sm" onClick={() => copyToClipboard(fullUrl)} />
                  <a
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                    title="Open link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AdminModal>
  );
};

export default AffiliateLinkGenerator;
