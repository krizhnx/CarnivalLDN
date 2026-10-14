import { useState } from 'react';
import { Plus, Ticket, Trash2, X } from 'lucide-react';
import { TicketTier } from '../types';
import { AdminModal } from './admin/Modal';
import { Badge, Button, Field, IconButton, Input, Switch, Textarea } from './admin/ui';
import { money } from './admin/format';

interface TicketTierFormProps {
  ticketTiers: TicketTier[];
  eventId: string;
  onSave: (tiers: TicketTier[]) => void;
  onClose: () => void;
}

const emptyTier = (): Partial<TicketTier> => ({
  name: '',
  price: undefined,
  originalPrice: undefined,
  capacity: undefined,
  soldCount: 0,
  availableFrom: new Date(),
  availableUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  description: '',
  benefits: [],
  isActive: true,
  lastEntryTime: '',
});

const toDateInput = (d?: Date) => {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
};

const TicketTierForm = ({ ticketTiers, eventId, onSave, onClose }: TicketTierFormProps) => {
  const [tiers, setTiers] = useState<TicketTier[]>(ticketTiers || []);
  const [newTier, setNewTier] = useState<Partial<TicketTier>>(emptyTier());
  const [showNew, setShowNew] = useState((ticketTiers || []).length === 0);

  const canAdd =
    (newTier.name || '').toString().trim().length > 0 &&
    newTier.price !== undefined &&
    newTier.price >= 0 &&
    newTier.capacity !== undefined &&
    newTier.capacity > 0;

  const addTier = () => {
    if (!canAdd) return;
    const tier: TicketTier = {
      id: `tier_${Date.now()}`,
      eventId: eventId,
      name: newTier.name || '',
      price: (newTier.price || 0) * 100, // Convert to pence
      originalPrice: newTier.originalPrice !== undefined ? (newTier.originalPrice || 0) * 100 : undefined,
      capacity: newTier.capacity || 0,
      soldCount: 0,
      availableFrom: newTier.availableFrom!,
      availableUntil: newTier.availableUntil!,
      description: newTier.description || '',
      benefits: (newTier.benefits || []).filter((b) => b.trim()),
      isActive: newTier.isActive !== false,
      lastEntryTime: newTier.lastEntryTime || undefined,
    };
    setTiers([...tiers, tier]);
    setNewTier(emptyTier());
    setShowNew(false);
  };

  const removeTier = (id: string) => setTiers(tiers.filter((tier) => tier.id !== id));

  const updateTier = (id: string, updates: Partial<TicketTier>) =>
    setTiers(tiers.map((tier) => (tier.id === id ? { ...tier, ...updates } : tier)));

  const addBenefit = (tierId: string) => {
    const tier = tiers.find((t) => t.id === tierId);
    if (tier) updateTier(tierId, { benefits: [...(tier.benefits || []), ''] });
  };

  const updateBenefit = (tierId: string, index: number, value: string) => {
    const tier = tiers.find((t) => t.id === tierId);
    if (tier) {
      const newBenefits = [...(tier.benefits || [])];
      newBenefits[index] = value;
      updateTier(tierId, { benefits: newBenefits });
    }
  };

  const removeBenefit = (tierId: string, index: number) => {
    const tier = tiers.find((t) => t.id === tierId);
    if (tier) updateTier(tierId, { benefits: (tier.benefits || []).filter((_, i) => i !== index) });
  };

  const handleSave = () => {
    onSave(tiers);
    onClose();
  };

  const numberValue = (v: string, parse: (s: string) => number) => (v === '' ? undefined : parse(v) || 0);

  return (
    <AdminModal
      open
      onClose={onClose}
      closeOnBackdrop={false}
      size="xl"
      icon={Ticket}
      title="Ticket tiers"
      description={`${tiers.length} tier${tiers.length === 1 ? '' : 's'} · prices in £, saved when you save the event`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Apply tiers
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {tiers.map((tier) => {
          const left = tier.capacity - tier.soldCount;
          return (
            <div key={tier.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="mb-4 flex items-center gap-2">
                <p className="flex-1 truncate text-sm font-semibold text-zinc-900">{tier.name || 'Untitled tier'}</p>
                <span className="text-xs tabular-nums text-zinc-500">
                  {tier.soldCount} sold · {Math.max(0, left)} of {tier.capacity} left
                </span>
                {left <= 0 && <Badge tone="red">Sold out by capacity</Badge>}
                <IconButton icon={Trash2} label="Remove tier" size="sm" variant="danger-ghost" onClick={() => removeTier(tier.id)} />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Field label="Name" className="md:col-span-2">
                  <Input value={tier.name} onChange={(e) => updateTier(tier.id, { name: e.target.value })} placeholder="Tier name" />
                </Field>
                <Field label="Price (£)">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={tier.price / 100}
                    onChange={(e) => updateTier(tier.id, { price: (parseFloat(e.target.value) || 0) * 100 })}
                  />
                </Field>
                <Field label="Capacity">
                  <Input type="number" min={0} value={tier.capacity} onChange={(e) => updateTier(tier.id, { capacity: parseInt(e.target.value) || 0 })} />
                </Field>
                <Field label="Last entry" optional className="md:col-span-2" hint="When entry closes for this tier">
                  <Input value={tier.lastEntryTime || ''} onChange={(e) => updateTier(tier.id, { lastEntryTime: e.target.value })} placeholder="e.g. 11:00 PM" />
                </Field>
                <div className="flex items-end pb-2 md:col-span-2">
                  <Switch
                    checked={tier.isActive === false}
                    disabled={left <= 0}
                    onChange={(v) => updateTier(tier.id, { isActive: !v })}
                    label="Mark as sold out"
                    description="Stops sales for this tier"
                  />
                </div>
              </div>

              <div className="mt-4 border-t border-zinc-100 pt-4">
                <p className="mb-2 text-[13px] font-medium text-zinc-700">Benefits</p>
                <div className="space-y-2">
                  {(tier.benefits || []).map((benefit, index) => (
                    <div key={index} className="flex gap-2">
                      <Input value={benefit} onChange={(e) => updateBenefit(tier.id, index, e.target.value)} placeholder="Benefit" className="h-9" />
                      <IconButton icon={X} label="Remove benefit" size="md" onClick={() => removeBenefit(tier.id, index)} />
                    </div>
                  ))}
                  <Button size="sm" variant="ghost" icon={Plus} onClick={() => addBenefit(tier.id)} className="-ml-2">
                    Add benefit
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
                <span>Price {tier.price === 0 ? 'Free' : money(tier.price)}</span>
                {tier.originalPrice && tier.originalPrice > tier.price && <span className="line-through">{money(tier.originalPrice)}</span>}
              </div>
            </div>
          );
        })}

        {showNew ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/60 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-900">New tier</p>
                <p className="text-xs text-zinc-500">e.g. “Early Bird” at £15, “General” at £25, “VIP” at £50</p>
              </div>
              {tiers.length > 0 && <IconButton icon={X} label="Cancel new tier" size="sm" onClick={() => setShowNew(false)} />}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Field label="Name" className="md:col-span-2">
                <Input value={newTier.name} onChange={(e) => setNewTier({ ...newTier, name: e.target.value })} placeholder="e.g. Early Bird" autoFocus />
              </Field>
              <Field label="Price (£)">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={newTier.price ?? ''}
                  onChange={(e) => setNewTier({ ...newTier, price: numberValue(e.target.value, parseFloat) })}
                  placeholder="25"
                />
              </Field>
              <Field label="Capacity">
                <Input
                  type="number"
                  min={1}
                  value={newTier.capacity ?? ''}
                  onChange={(e) => setNewTier({ ...newTier, capacity: numberValue(e.target.value, parseInt) })}
                  placeholder="100"
                />
              </Field>
              <Field label="Original price (£)" optional hint="Shows as a discount">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={newTier.originalPrice ?? ''}
                  onChange={(e) => setNewTier({ ...newTier, originalPrice: numberValue(e.target.value, parseFloat) })}
                  placeholder="35"
                />
              </Field>
              <Field label="On sale from">
                <Input type="date" value={toDateInput(newTier.availableFrom)} onChange={(e) => setNewTier({ ...newTier, availableFrom: new Date(e.target.value) })} />
              </Field>
              <Field label="On sale until">
                <Input type="date" value={toDateInput(newTier.availableUntil)} onChange={(e) => setNewTier({ ...newTier, availableUntil: new Date(e.target.value) })} />
              </Field>
              <Field label="Last entry" optional>
                <Input value={newTier.lastEntryTime || ''} onChange={(e) => setNewTier({ ...newTier, lastEntryTime: e.target.value })} placeholder="e.g. 11:00 PM" />
              </Field>
              <Field label="Description" optional className="md:col-span-4">
                <Textarea
                  rows={2}
                  value={newTier.description}
                  onChange={(e) => setNewTier({ ...newTier, description: e.target.value })}
                  className="min-h-[64px]"
                />
              </Field>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
              <Switch checked={newTier.isActive !== false} onChange={(v) => setNewTier({ ...newTier, isActive: v })} label="On sale" description="Allow sales right away" />
              <Button variant="primary" icon={Plus} onClick={addTier} disabled={!canAdd}>
                Add tier
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowNew(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 px-4 py-4 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-900"
          >
            <Plus className="h-4 w-4" />
            Add another tier
          </button>
        )}
      </div>
    </AdminModal>
  );
};

export default TicketTierForm;
