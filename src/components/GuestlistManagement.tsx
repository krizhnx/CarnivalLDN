import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, Mail, Phone, Plus, Send, Ticket, Trash2, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { Event, Guestlist } from '../types';
import { cn } from '../lib/utils';
import { ConfirmDialog } from './admin/Modal';
import { Avatar, Badge, Button, Card, EmptyState, IconButton, Progress, SearchInput, Segmented, Skeleton, Stat, td, th, type Tone } from './admin/ui';
import { num, shortDate } from './admin/format';

type Category = 'free' | 'GL' | 'tables' | 'other';

const CATEGORIES: { value: Category; label: string; tone: Tone }[] = [
  { value: 'free', label: 'Free', tone: 'blue' },
  { value: 'GL', label: 'GL', tone: 'violet' },
  { value: 'tables', label: 'Tables', tone: 'green' },
  { value: 'other', label: 'Other', tone: 'neutral' },
];

const categoryOf = (g: Guestlist): Category => (CATEGORIES.some((c) => c.value === g.category) ? (g.category as Category) : 'other');

interface GuestlistManagementProps {
  event: Event;
  onCreateNew?: () => void;
  /** Bump to force a refetch (e.g. after creating a guestlist). */
  refreshKey?: number;
}

const GuestlistManagement = ({ event, onCreateNew, refreshKey = 0 }: GuestlistManagementProps) => {
  const [guestlists, setGuestlists] = useState<Guestlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | Category>('all');
  const [search, setSearch] = useState('');
  const [resending, setResending] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Guestlist | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchGuestlists = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/guestlists?eventId=${event.id}`);
      if (!response.ok) throw new Error('Failed to fetch guestlists');
      const data = await response.json();
      setGuestlists(data.guestlists || []);
    } catch (err) {
      console.error('Error fetching guestlists:', err);
      toast.error('Could not load guestlists');
      setGuestlists([]);
    } finally {
      setIsLoading(false);
    }
  }, [event.id]);

  useEffect(() => {
    void fetchGuestlists();
  }, [fetchGuestlists, refreshKey]);

  const resendQRCode = async (guestlistId: string) => {
    setResending(guestlistId);
    try {
      const response = await fetch('/api/resend-guestlist-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestlistId }),
      });
      if (!response.ok) throw new Error('Failed to resend QR code');
      toast.success('QR code resent');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend QR code');
    } finally {
      setResending(null);
    }
  };

  const deleteGuestlist = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/guestlists/${toDelete.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete guestlist');
      setGuestlists((prev) => prev.filter((g) => g.id !== toDelete.id));
      toast.success('Guestlist deleted');
      setToDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete guestlist');
    } finally {
      setDeleting(false);
    }
  };

  const updateGuestlistCategory = async (guestlistId: string, newCategory: Category) => {
    try {
      const response = await fetch(`/api/guestlists/${guestlistId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCategory }),
      });
      if (!response.ok) throw new Error('Failed to update category');
      setGuestlists((prev) => prev.map((g) => (g.id === guestlistId ? { ...g, category: newCategory } : g)));
      toast.success('Category updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update category');
    }
  };

  const totals = useMemo(() => {
    const tickets = guestlists.reduce((s, g) => s + g.totalTickets, 0);
    const used = guestlists.reduce((s, g) => s + (g.totalTickets - g.remainingScans), 0);
    const byCat: Record<string, number> = {};
    guestlists.forEach((g) => (byCat[categoryOf(g)] = (byCat[categoryOf(g)] || 0) + 1));
    return { tickets, used, byCat };
  }, [guestlists]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return guestlists.filter((g) => {
      if (filter !== 'all' && categoryOf(g) !== filter) return false;
      if (!q) return true;
      return g.leadName?.toLowerCase().includes(q) || g.leadEmail?.toLowerCase().includes(q) || g.notes?.toLowerCase().includes(q);
    });
  }, [guestlists, filter, search]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Guestlists" icon={ClipboardList} value={isLoading ? '—' : num(guestlists.length)} />
        <Stat label="Guest tickets" icon={Ticket} value={isLoading ? '—' : num(totals.tickets)} />
        <Stat
          label="Checked in"
          icon={UserCheck}
          value={
            isLoading ? (
              '—'
            ) : (
              <>
                {num(totals.used)}
                <span className="text-base font-medium text-zinc-400"> / {num(totals.tickets)}</span>
              </>
            )
          }
          footer={!isLoading && <Progress value={totals.tickets ? (totals.used / totals.tickets) * 100 : 0} tone="zinc" />}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all' as const, label: 'All', count: guestlists.length },
              ...CATEGORIES.map((c) => ({ value: c.value, label: c.label, count: totals.byCat[c.value] || 0 })),
            ]}
          />
          <div className="ml-auto flex items-center gap-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Search guests" className="w-60" />
            {onCreateNew && (
              <Button variant="primary" icon={Plus} onClick={onCreateNew}>
                New guestlist
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 border-t border-zinc-100 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="border-t border-zinc-100">
            <EmptyState
              icon={ClipboardList}
              title={guestlists.length ? 'No matching guestlists' : 'No guestlists yet'}
              description={guestlists.length ? undefined : 'Create a guestlist to send a group QR code that can be scanned multiple times.'}
              action={
                !guestlists.length && onCreateNew ? (
                  <Button variant="primary" icon={Plus} onClick={onCreateNew}>
                    New guestlist
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-y border-zinc-100 bg-zinc-50/70">
                <tr>
                  <th className={th}>Group lead</th>
                  <th className={th}>Contact</th>
                  <th className={th}>Category</th>
                  <th className={cn(th, 'w-[20%]')}>Checked in</th>
                  <th className={th}>Created</th>
                  <th className={cn(th, 'text-right')}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((g) => {
                  const used = g.totalTickets - g.remainingScans;
                  const cat = categoryOf(g);
                  return (
                    <tr key={g.id} className="transition-colors hover:bg-zinc-50/70">
                      <td className={td}>
                        <div className="flex items-center gap-3">
                          <Avatar name={g.leadName} size="sm" />
                          <div className="min-w-0">
                            <p className="max-w-[220px] truncate font-medium text-zinc-900">{g.leadName}</p>
                            {g.notes && (
                              <p className="max-w-[260px] truncate text-xs text-zinc-500" title={g.notes}>
                                {g.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={td}>
                        <p className="flex items-center gap-1.5 text-[13px] text-zinc-700">
                          <Mail className="h-3.5 w-3.5 text-zinc-400" />
                          {g.leadEmail}
                        </p>
                        {g.leadPhone && (
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
                            <Phone className="h-3.5 w-3.5 text-zinc-400" />
                            {g.leadPhone}
                          </p>
                        )}
                      </td>
                      <td className={td}>
                        <select
                          value={cat}
                          onChange={(e) => void updateGuestlistCategory(g.id, e.target.value as Category)}
                          className="h-7 cursor-pointer rounded-md border border-transparent bg-zinc-100 px-2 text-xs font-medium text-zinc-700 outline-none hover:border-zinc-200 focus:border-zinc-300"
                          title="Change category"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className={td}>
                        <div className="flex items-center gap-3">
                          <Progress value={g.totalTickets ? (used / g.totalTickets) * 100 : 0} tone={g.remainingScans === 0 ? 'green' : 'violet'} className="flex-1" />
                          <span className="w-12 shrink-0 text-right text-xs tabular-nums text-zinc-500">
                            {used}/{g.totalTickets}
                          </span>
                        </div>
                        <div className="mt-1">
                          {g.remainingScans === 0 ? (
                            <Badge tone="green">All in</Badge>
                          ) : used > 0 ? (
                            <Badge tone="amber">{g.remainingScans} to come</Badge>
                          ) : (
                            <Badge>Not arrived</Badge>
                          )}
                        </div>
                      </td>
                      <td className={cn(td, 'text-zinc-500')}>{g.createdAt ? shortDate(g.createdAt) : '—'}</td>
                      <td className={td}>
                        <div className="flex items-center justify-end gap-0.5">
                          <IconButton
                            icon={Send}
                            label="Resend QR code"
                            size="sm"
                            disabled={resending === g.id}
                            className={cn(resending === g.id && 'animate-pulse')}
                            onClick={() => void resendQRCode(g.id)}
                          />
                          <IconButton icon={Trash2} label="Delete guestlist" size="sm" variant="danger-subtle" onClick={() => setToDelete(g)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={deleteGuestlist}
        loading={deleting}
        tone="danger"
        title="Delete this guestlist?"
        description="The group QR code will stop working. This cannot be undone."
        confirmLabel="Delete guestlist"
      >
        {toDelete && (
          <p className="text-sm text-zinc-700">
            <span className="font-medium">{toDelete.leadName}</span> · {toDelete.totalTickets} tickets
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
};

export default GuestlistManagement;
