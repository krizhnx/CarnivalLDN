import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CalendarDays, ImageOff, Pencil, Plus, Ticket } from 'lucide-react';
import { useAppStore } from '../store/supabaseStore';
import { Event, EventFormData, TicketTier } from '../types';
import TicketTierForm from './TicketTierForm';
import { AdminModal } from './admin/Modal';
import { Badge, Button, Field, Input, Select, Textarea } from './admin/ui';
import { money } from './admin/format';

interface EventFormProps {
  event?: Event | null;
  onClose: () => void;
}

const gradientOptions = [
  { value: 'from-gray-600 to-gray-800', label: 'Gray' },
  { value: 'from-gray-700 to-gray-900', label: 'Dark Gray' },
  { value: 'from-gray-800 to-black', label: 'Black' },
  { value: 'from-gray-500 to-gray-700', label: 'Light Gray' },
  { value: 'from-blue-600 to-blue-800', label: 'Blue' },
  { value: 'from-green-600 to-green-800', label: 'Green' },
  { value: 'from-purple-600 to-purple-800', label: 'Purple' },
  { value: 'from-red-600 to-red-800', label: 'Red' },
];

const SectionTitle = ({ title, description }: { title: string; description?: string }) => (
  <div className="md:col-span-2">
    <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
    {description && <p className="text-[13px] text-zinc-500">{description}</p>}
  </div>
);

const EventForm = ({ event, onClose }: EventFormProps) => {
  const { addEvent, updateEvent } = useAppStore();
  const [showTicketTierForm, setShowTicketTierForm] = useState(false);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>(event?.ticketTiers || []);
  const [imageFailed, setImageFailed] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EventFormData>();

  useEffect(() => {
    if (event) {
      reset({
        title: event.title,
        date: event.date,
        time: event.time,
        venue: event.venue,
        description: event.description,
        capacity: event.capacity,
        tags: event.tags.join(', '),
        gradient: event.gradient,
        image: event.image,
        bookingUrl: event.bookingUrl,
      });
    }
  }, [event, reset]);

  const image = watch('image');
  useEffect(() => setImageFailed(false), [image]);

  const onSubmit = (data: EventFormData) => {
    // Ensure ticket tiers have the correct eventId
    const updatedTicketTiers = ticketTiers.map((tier) => ({
      ...tier,
      eventId: event?.id || 'new_event',
    }));

    // Derive display price from the lowest active ticket tier
    const activeTiers = updatedTicketTiers.filter((t) => t.isActive !== false && typeof t.price === 'number');
    const minPrice = activeTiers.length > 0 ? Math.min(...activeTiers.map((t) => t.price)) : 0;
    const derivedPriceLabel = minPrice > 0 ? `From £${(minPrice / 100).toFixed(0)}` : 'Free';

    const eventData = {
      ...data,
      price: derivedPriceLabel,
      ticketTiers: updatedTicketTiers,
    };

    if (event) {
      updateEvent(event.id, eventData);
    } else {
      addEvent(eventData);
    }
    onClose();
  };

  const handleTicketTiersSave = (tiers: TicketTier[]) => {
    setTicketTiers(tiers);
    setShowTicketTierForm(false);
  };

  const sortedTiers = [...ticketTiers].sort((a, b) => a.price - b.price);

  return (
    <AdminModal
      open
      onClose={onClose}
      closeOnBackdrop={false}
      size="lg"
      icon={event ? Pencil : CalendarDays}
      title={event ? 'Edit event' : 'New event'}
      description={event ? event.title : 'Publish a new event to the site'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="event-form">
            {event ? 'Save changes' : 'Create event'}
          </Button>
        </>
      }
    >
      <form id="event-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
        <SectionTitle title="Basics" />
        <Field label="Event title" htmlFor="ev-title" error={errors.title?.message} className="md:col-span-2">
          <Input id="ev-title" {...register('title', { required: 'Title is required' })} placeholder="e.g. Carnival LDN: Diwali Night" invalid={!!errors.title} />
        </Field>
        <Field label="Description" htmlFor="ev-desc" error={errors.description?.message} className="md:col-span-2">
          <Textarea
            id="ev-desc"
            rows={4}
            {...register('description', { required: 'Description is required' })}
            placeholder="What should people expect?"
            invalid={!!errors.description}
          />
        </Field>

        <div className="border-t border-zinc-100 md:col-span-2" />
        <SectionTitle title="When & where" />
        <Field label="Date" htmlFor="ev-date" error={errors.date?.message} hint="Shown as written, e.g. Saturday, 1 November 2026">
          <Input id="ev-date" {...register('date', { required: 'Date is required' })} placeholder="e.g. Saturday, 1 November 2026" invalid={!!errors.date} />
        </Field>
        <Field label="Time" htmlFor="ev-time" error={errors.time?.message}>
          <Input id="ev-time" {...register('time', { required: 'Time is required' })} placeholder="e.g. 10:00 PM - 3:00 AM" invalid={!!errors.time} />
        </Field>
        <Field label="Venue" htmlFor="ev-venue" error={errors.venue?.message}>
          <Input id="ev-venue" {...register('venue', { required: 'Venue is required' })} placeholder="Venue name" invalid={!!errors.venue} />
        </Field>
        <Field label="Capacity" htmlFor="ev-cap" error={errors.capacity?.message}>
          <Input id="ev-cap" {...register('capacity', { required: 'Capacity is required' })} placeholder="e.g. 200" invalid={!!errors.capacity} />
        </Field>

        <div className="border-t border-zinc-100 md:col-span-2" />
        <SectionTitle title="Look & listing" />
        <div className="flex gap-4 md:col-span-2">
          <div className="grid h-[104px] w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200">
            {image && !imageFailed ? (
              <img src={image} alt="" className="h-full w-full object-cover" onError={() => setImageFailed(true)} />
            ) : (
              <ImageOff className="h-5 w-5 text-zinc-400" />
            )}
          </div>
          <Field
            label="Poster image URL"
            htmlFor="ev-image"
            error={errors.image?.message}
            hint="External URL (https://…) or a path in /public, e.g. /palace.png"
            className="flex-1"
          >
            <Input
              id="ev-image"
              {...register('image', {
                required: 'Image URL is required',
                pattern: {
                  value: /^(https?:\/\/.+|\/.+)/,
                  message: 'Use a URL starting with http(s):// or a path starting with /',
                },
              })}
              placeholder="https://… or /palace.png"
              invalid={!!errors.image}
            />
          </Field>
        </div>
        <Field label="Tags" htmlFor="ev-tags" error={errors.tags?.message} hint="Comma-separated">
          <Input id="ev-tags" {...register('tags', { required: 'Tags are required' })} placeholder="e.g. Bollywood, Club night" invalid={!!errors.tags} />
        </Field>
        <Field label="Colour theme" htmlFor="ev-gradient" error={errors.gradient?.message}>
          <Select id="ev-gradient" {...register('gradient', { required: 'Gradient is required' })}>
            {gradientOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="border-t border-zinc-100 md:col-span-2" />
        <div className="flex items-end justify-between gap-4 md:col-span-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Ticket tiers</h3>
            <p className="text-[13px] text-zinc-500">The lowest active price becomes the “From £X” label.</p>
          </div>
          <Button size="sm" icon={ticketTiers.length ? Ticket : Plus} onClick={() => setShowTicketTierForm(true)}>
            {ticketTiers.length ? 'Manage tiers' : 'Add tiers'}
          </Button>
        </div>
        <div className="md:col-span-2">
          {sortedTiers.length > 0 ? (
            <div className="overflow-hidden rounded-xl ring-1 ring-zinc-200">
              {sortedTiers.map((tier) => {
                const left = tier.capacity - tier.soldCount;
                return (
                  <div key={tier.id} className="flex items-center justify-between gap-4 border-b border-zinc-100 px-4 py-3 last:border-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900">{tier.name}</p>
                      <p className="text-xs text-zinc-500">
                        {tier.price === 0 ? 'Free' : money(tier.price)} · {tier.capacity} capacity
                        {tier.lastEntryTime ? ` · last entry ${tier.lastEntryTime}` : ''}
                      </p>
                    </div>
                    {tier.isActive === false ? (
                      <Badge tone="amber">Sales off</Badge>
                    ) : left <= 0 ? (
                      <Badge tone="red">Sold out</Badge>
                    ) : (
                      <Badge>{left} left</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowTicketTierForm(true)}
              className="flex w-full flex-col items-center gap-1 rounded-xl border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:bg-zinc-50"
            >
              <Ticket className="h-5 w-5 text-zinc-400" />
              No ticket tiers yet — add pricing options
            </button>
          )}
        </div>

        <Field label="External booking URL" optional htmlFor="ev-booking" error={errors.bookingUrl?.message} hint="Leave blank to use on-site checkout" className="md:col-span-2">
          <Input id="ev-booking" type="url" {...register('bookingUrl')} placeholder="https://example.com/book/event" />
        </Field>
      </form>

      {showTicketTierForm && (
        <TicketTierForm
          ticketTiers={ticketTiers}
          eventId={event?.id || 'new_event'}
          onSave={handleTicketTiersSave}
          onClose={() => setShowTicketTierForm(false)}
        />
      )}
    </AdminModal>
  );
};

export default EventForm;
