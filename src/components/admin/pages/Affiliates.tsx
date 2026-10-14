import { useMemo, useState } from 'react';
import { Eye, Link2, MousePointerClick, Pencil, PoundSterling, Plus, Ticket, Trash2, Users } from 'lucide-react';
import type { AffiliateSociety, AffiliateStats, SocietyPerformance } from '../../../types';
import { cn } from '../../../lib/utils';
import { Avatar, Button, Card, EmptyState, IconButton, SearchInput, Stat, td, th } from '../ui';
import { moneyWhole, num } from '../format';

const Affiliates = ({
  stats,
  societies,
  performance,
  onAddSociety,
  onGenerateLinks,
  onView,
  onLinks,
  onEdit,
  onDelete,
}: {
  stats: AffiliateStats | null;
  societies: AffiliateSociety[];
  performance: SocietyPerformance[];
  onAddSociety: () => void;
  onGenerateLinks: () => void;
  onView: (s: AffiliateSociety) => void;
  onLinks: (s: AffiliateSociety) => void;
  onEdit: (s: AffiliateSociety) => void;
  onDelete: (s: AffiliateSociety) => void;
}) => {
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...performance]
      .filter(
        (p) =>
          !q ||
          p.society.name.toLowerCase().includes(q) ||
          p.society.code.toLowerCase().includes(q) ||
          p.society.university?.toLowerCase().includes(q)
      )
      .sort((a, b) => b.revenue - a.revenue || b.clicks - a.clicks);
  }, [performance, search]);

  const maxRevenue = Math.max(1, ...performance.map((p) => p.revenue));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Active societies" icon={Users} value={num(stats?.totalSocieties || 0)} />
        <Stat label="Link clicks" icon={MousePointerClick} value={num(stats?.totalClicks || 0)} />
        <Stat label="Tickets via affiliates" icon={Ticket} value={num(stats?.totalTicketsSold || 0)} />
        <Stat label="Affiliate revenue" icon={PoundSterling} value={moneyWhole(stats?.totalRevenue || 0)} />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight text-zinc-900">Society performance</h3>
            <p className="text-[13px] text-zinc-500">Clicks, tickets and revenue tracked per society</p>
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Search societies" className="w-64" />
        </div>

        {societies.length === 0 ? (
          <div className="border-t border-zinc-100">
            <EmptyState
              icon={Users}
              title="No societies yet"
              description="Add a university society, then generate tracking links for your events."
              action={
                <div className="flex gap-2">
                  <Button variant="primary" icon={Plus} onClick={onAddSociety}>
                    Add society
                  </Button>
                  <Button icon={Link2} onClick={onGenerateLinks}>
                    Generate links
                  </Button>
                </div>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-y border-zinc-100 bg-zinc-50/70">
                <tr>
                  <th className={th}>Society</th>
                  <th className={th}>University</th>
                  <th className={cn(th, 'text-right')}>Clicks</th>
                  <th className={cn(th, 'text-right')}>Tickets</th>
                  <th className={cn(th, 'w-[22%]')}>Revenue</th>
                  <th className={cn(th, 'text-right')}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-zinc-400">
                      No matching societies
                    </td>
                  </tr>
                )}
                {rows.map(({ society, clicks, ticketsSold, revenue }) => (
                  <tr key={society.id} className="transition-colors hover:bg-zinc-50/70">
                    <td className={td}>
                      <button type="button" onClick={() => onView(society)} className="flex items-center gap-3 text-left">
                        <Avatar name={society.name} size="sm" />
                        <span className="min-w-0">
                          <span className="block max-w-[240px] truncate font-medium text-zinc-900">{society.name}</span>
                          <span className="block font-mono text-xs text-zinc-500">{society.code}</span>
                        </span>
                      </button>
                    </td>
                    <td className={td}>{society.university || <span className="text-zinc-400">—</span>}</td>
                    <td className={cn(td, 'text-right tabular-nums')}>{num(clicks)}</td>
                    <td className={cn(td, 'text-right tabular-nums')}>{num(ticketsSold)}</td>
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                          <div className="h-full rounded-full bg-violet-500" style={{ width: `${(revenue / maxRevenue) * 100}%` }} />
                        </div>
                        <span className="w-16 shrink-0 text-right font-medium tabular-nums text-zinc-900">{moneyWhole(revenue)}</span>
                      </div>
                    </td>
                    <td className={td}>
                      <div className="flex items-center justify-end gap-0.5">
                        <IconButton icon={Eye} label="View details" size="sm" onClick={() => onView(society)} />
                        <IconButton icon={Link2} label="Tracking links" size="sm" onClick={() => onLinks(society)} />
                        <IconButton icon={Pencil} label="Edit society" size="sm" onClick={() => onEdit(society)} />
                        <IconButton icon={Trash2} label="Delete society" size="sm" variant="danger-subtle" onClick={() => onDelete(society)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Affiliates;
