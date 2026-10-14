import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/supabaseStore';
import { AffiliateFormData, AffiliateSociety, Event, Order, SocietyPerformance } from '../types';
import EventForm from './EventForm';
import AffiliateSocietyModal from './AffiliateSocietyModal';
import AffiliateLinkGenerator from './AffiliateLinkGenerator';
import SocietyDetailsModal from './SocietyDetailsModal';
import SocietyLinksModal from './SocietyLinksModal';
import GuestlistModal from './GuestlistModal';
import { exportCustomerData, exportEventData } from './dashboard/CSVExport';
import AdminLayout, { ADMIN_TABS, type AdminTab } from './admin/AdminLayout';
import { ConfirmDialog } from './admin/Modal';
import OrderDrawer from './admin/OrderDrawer';
import { Button, Segmented, Select } from './admin/ui';
import { money, parseLooseDate } from './admin/format';
import Overview, { type Timeframe } from './admin/pages/Overview';
import EventOverview from './admin/pages/EventOverview';
import EventsPage from './admin/pages/Events';
import OrdersPage from './admin/pages/Orders';
import GuestlistsPage from './admin/pages/Guestlists';
import AffiliatesPage from './admin/pages/Affiliates';

const parseTab = (value: string | null): AdminTab => {
  if (value === 'analytics') return 'overview';
  if (value === 'affiliate') return 'affiliates';
  return ADMIN_TABS.some((t) => t.id === value) ? (value as AdminTab) : 'overview';
};

const byDate = (dir: 1 | -1) => (a: Event, b: Event) => {
  const da = parseLooseDate(a.date);
  const db = parseLooseDate(b.date);
  if (!da && !db) return 0;
  if (!da) return 1;
  if (!db) return -1;
  return (da.getTime() - db.getTime()) * dir;
};

const Dashboard = () => {
  const {
    events,
    orders,
    affiliateSocieties,
    affiliateStats,
    getEvents,
    getOrders,
    deleteOrder,
    deleteEvent,
    archiveEvent,
    getAffiliateSocieties,
    addAffiliateSociety,
    updateAffiliateSociety,
    deleteAffiliateSociety,
    createAffiliateLinks,
    getAffiliateLinks,
    getAffiliateStats,
    getSocietyPerformance,
  } = useAppStore();

  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseTab(searchParams.get('tab'));
  const eventParam = searchParams.get('event') || undefined;

  const [timeframe, setTimeframe] = useState<Timeframe>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Events
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [confirm, setConfirm] = useState<{ type: 'archive' | 'delete'; event: Event } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  // Orders
  const [openOrder, setOpenOrder] = useState<Order | null>(null);
  const [orderDeleteConfirm, setOrderDeleteConfirm] = useState<Order | null>(null);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);

  // Guestlists
  const [guestlistEvent, setGuestlistEvent] = useState<Event | null>(null);
  const [guestlistRefreshKey, setGuestlistRefreshKey] = useState(0);

  // Affiliates
  const [isSocietyModalOpen, setIsSocietyModalOpen] = useState(false);
  const [isLinkGeneratorOpen, setIsLinkGeneratorOpen] = useState(false);
  const [editingSociety, setEditingSociety] = useState<AffiliateSociety | null>(null);
  const [societyPerformance, setSocietyPerformance] = useState<SocietyPerformance[]>([]);
  const [viewingSociety, setViewingSociety] = useState<AffiliateSociety | null>(null);
  const [isSocietyDetailsOpen, setIsSocietyDetailsOpen] = useState(false);
  const [isSocietyLinksOpen, setIsSocietyLinksOpen] = useState(false);
  const [societyToDelete, setSocietyToDelete] = useState<AffiliateSociety | null>(null);
  const [deletingSociety, setDeletingSociety] = useState(false);

  const loadingRef = useRef(false);

  const loadDashboardData = useCallback(
    async (silent = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      if (silent) setIsRefreshing(true);
      else setIsLoading(true);

      // Never leave the UI stuck on a loading state
      const timeoutId = setTimeout(() => {
        setIsLoading(false);
        setIsRefreshing(false);
      }, 10000);

      try {
        await Promise.all([getEvents(), getOrders(), getAffiliateSocieties(), getAffiliateLinks(), getAffiliateStats()]);
        setSocietyPerformance(await getSocietyPerformance());
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error('Some dashboard data failed to load');
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
        setIsRefreshing(false);
        loadingRef.current = false;
      }
    },
    [getEvents, getOrders, getAffiliateSocieties, getAffiliateLinks, getAffiliateStats, getSocietyPerformance]
  );

  useEffect(() => {
    void loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshSocieties = async () => setSocietyPerformance(await getSocietyPerformance());

  /* ---------------------------- navigation ---------------------------- */

  const navigate = useCallback(
    (nextTab: AdminTab, eventId?: string | null) => {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.set('tab', nextTab);
          if (eventId) p.set('event', eventId);
          else if (eventId === null || (nextTab !== 'overview' && nextTab !== 'guestlists')) p.delete('event');
          return p;
        },
        { replace: false }
      );
      window.scrollTo({ top: 0 });
    },
    [setSearchParams]
  );

  /* ------------------------------ derived ----------------------------- */

  const allEvents = events || [];
  const allOrders = (orders || []) as Order[];
  const currentEvents = useMemo(() => allEvents.filter((e) => !e.isArchived).sort(byDate(1)), [allEvents]);
  const archivedEvents = useMemo(() => allEvents.filter((e) => e.isArchived).sort(byDate(-1)), [allEvents]);
  const selectedEvent = tab === 'overview' && eventParam ? allEvents.find((e) => e.id === eventParam) : undefined;
  const drawerEvent = openOrder ? allEvents.find((e) => e.id === openOrder.eventId) : null;

  /* ------------------------------ actions ----------------------------- */

  const openEventForm = (event: Event | null) => {
    setEditingEvent(event);
    setIsEventFormOpen(true);
  };

  const handleExportCustomers = () => {
    if (!allOrders.length) return toast.error('No orders to export yet');
    exportCustomerData(allOrders, allEvents, timeframe);
    toast.success('Customer data exported');
  };

  const handleExportEventData = (eventId: string) => {
    const event = allEvents.find((e) => e.id === eventId);
    if (event) {
      exportEventData(event, allOrders, timeframe);
      toast.success(`${event.title} data exported`);
    }
  };

  const handleSaveSociety = async (societyData: AffiliateFormData) => {
    try {
      if (editingSociety) await updateAffiliateSociety(editingSociety.id, societyData);
      else await addAffiliateSociety(societyData);
      setIsSocietyModalOpen(false);
      setEditingSociety(null);
      await refreshSocieties();
    } catch (error) {
      console.error('Error saving society:', error);
    }
  };

  const handleGenerateTrackingLinks = async (societyIds: string[], eventId: string) => {
    try {
      await createAffiliateLinks(societyIds, eventId);
      const [, performance] = await Promise.all([getAffiliateLinks(), getSocietyPerformance()]);
      setSocietyPerformance(performance);
    } catch (error) {
      console.error('Error generating tracking links:', error);
    }
  };

  /* ------------------------------- header ----------------------------- */

  let title: React.ReactNode = 'Overview';
  let description: React.ReactNode = 'Sales and activity across all events';
  let actions: React.ReactNode = null;

  const eventPicker = (
    <Select size="sm" value={selectedEvent?.id || 'all'} onChange={(e) => navigate('overview', e.target.value === 'all' ? null : e.target.value)} className="w-56">
      <option value="all">All events</option>
      {currentEvents.length > 0 && (
        <optgroup label="Current">
          {currentEvents.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </optgroup>
      )}
      {archivedEvents.length > 0 && (
        <optgroup label="Archived">
          {archivedEvents.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </optgroup>
      )}
    </Select>
  );

  switch (tab) {
    case 'overview':
      if (selectedEvent) {
        title = selectedEvent.title;
        description = 'Event performance · all time';
        actions = eventPicker;
      } else {
        actions = (
          <>
            {eventPicker}
            <Segmented
              value={timeframe}
              onChange={setTimeframe}
              options={[
                { value: '7d', label: '7D' },
                { value: '30d', label: '30D' },
                { value: '90d', label: '90D' },
              ]}
            />
          </>
        );
      }
      break;
    case 'events':
      title = 'Events';
      description = `${currentEvents.length} current · ${archivedEvents.length} archived`;
      actions = (
        <Button variant="primary" icon={Plus} onClick={() => openEventForm(null)}>
          New event
        </Button>
      );
      break;
    case 'orders':
      title = 'Orders';
      description = 'Every order across all events';
      break;
    case 'guestlists':
      title = 'Guestlists';
      description = 'Group QR codes for free entry, GL and tables';
      break;
    case 'affiliates':
      title = 'Affiliates';
      description = 'University society tracking links';
      actions = (
        <>
          <Button
            icon={Plus}
            onClick={() => {
              setEditingSociety(null);
              setIsSocietyModalOpen(true);
            }}
          >
            Add society
          </Button>
          <Button variant="primary" icon={Link2} onClick={() => setIsLinkGeneratorOpen(true)}>
            Generate links
          </Button>
        </>
      );
      break;
  }

  return (
    <AdminLayout
      tab={tab}
      onTabChange={(t) => navigate(t)}
      title={title}
      description={description}
      actions={actions}
      counts={{ events: currentEvents.length, orders: allOrders.length }}
      refreshing={isRefreshing || isLoading}
      onRefresh={() => void loadDashboardData(true)}
    >
      {tab === 'overview' &&
        (selectedEvent ? (
          <EventOverview
            event={selectedEvent}
            orders={allOrders}
            onBack={() => navigate('overview', null)}
            onEdit={openEventForm}
            onGuestlists={(e) => navigate('guestlists', e.id)}
            onExportEventData={handleExportEventData}
            onOpenOrder={setOpenOrder}
            onDeleteOrder={setOrderDeleteConfirm}
          />
        ) : (
          <Overview
            events={allEvents}
            orders={allOrders}
            timeframe={timeframe}
            loading={isLoading}
            onOpenOrder={setOpenOrder}
            onSelectEvent={(id) => navigate('overview', id)}
            onViewOrders={() => navigate('orders')}
            onCreateEvent={() => openEventForm(null)}
            onExportCustomers={handleExportCustomers}
          />
        ))}

      {tab === 'events' && (
        <EventsPage
          currentEvents={currentEvents}
          archivedEvents={archivedEvents}
          orders={allOrders}
          onAdd={() => openEventForm(null)}
          onEdit={openEventForm}
          onArchiveToggle={(event) => setConfirm({ type: 'archive', event })}
          onDelete={(event) => setConfirm({ type: 'delete', event })}
          onGuestlists={(e) => navigate('guestlists', e.id)}
          onOpenStats={(id) => navigate('overview', id)}
        />
      )}

      {tab === 'orders' && <OrdersPage orders={allOrders} events={allEvents} onOpen={setOpenOrder} onDelete={setOrderDeleteConfirm} />}

      {tab === 'guestlists' && (
        <GuestlistsPage
          currentEvents={currentEvents}
          archivedEvents={archivedEvents}
          selectedId={eventParam}
          onSelect={(id) => navigate('guestlists', id)}
          onCreate={setGuestlistEvent}
          refreshKey={guestlistRefreshKey}
        />
      )}

      {tab === 'affiliates' && (
        <AffiliatesPage
          stats={affiliateStats}
          societies={affiliateSocieties}
          performance={societyPerformance}
          onAddSociety={() => {
            setEditingSociety(null);
            setIsSocietyModalOpen(true);
          }}
          onGenerateLinks={() => setIsLinkGeneratorOpen(true)}
          onView={(s) => {
            setViewingSociety(s);
            setIsSocietyDetailsOpen(true);
          }}
          onLinks={(s) => {
            setViewingSociety(s);
            setIsSocietyLinksOpen(true);
          }}
          onEdit={(s) => {
            setEditingSociety(s);
            setIsSocietyModalOpen(true);
          }}
          onDelete={setSocietyToDelete}
        />
      )}

      {/* ----------------------------- overlays ----------------------------- */}

      {isEventFormOpen && (
        <EventForm
          event={editingEvent}
          onClose={() => {
            setIsEventFormOpen(false);
            setEditingEvent(null);
            void loadDashboardData(true);
          }}
        />
      )}

      <OrderDrawer order={openOrder} event={drawerEvent} open={!!openOrder} onClose={() => setOpenOrder(null)} onDelete={setOrderDeleteConfirm} />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        loading={confirmBusy}
        tone={confirm?.type === 'delete' ? 'danger' : 'default'}
        title={confirm?.type === 'delete' ? 'Delete event?' : confirm?.event.isArchived ? 'Unarchive event?' : 'Archive event?'}
        description={
          confirm?.type === 'delete'
            ? 'This permanently deletes the event and its related data. This cannot be undone.'
            : confirm?.event.isArchived
              ? 'The event will be visible on the site again.'
              : 'The event will be hidden from the public site. You can unarchive it any time.'
        }
        confirmLabel={confirm?.type === 'delete' ? 'Delete event' : confirm?.event.isArchived ? 'Unarchive' : 'Archive'}
        onConfirm={async () => {
          if (!confirm) return;
          setConfirmBusy(true);
          try {
            if (confirm.type === 'delete') await deleteEvent(confirm.event.id);
            else await archiveEvent(confirm.event.id, !confirm.event.isArchived);
            setConfirm(null);
          } finally {
            setConfirmBusy(false);
          }
        }}
      >
        {confirm && <p className="text-sm font-medium text-zinc-800">{confirm.event.title}</p>}
      </ConfirmDialog>

      <ConfirmDialog
        open={!!orderDeleteConfirm}
        onClose={() => setOrderDeleteConfirm(null)}
        loading={isDeletingOrder}
        tone="danger"
        title="Delete order permanently?"
        description="This removes the order, its tickets and scan history from the database. It cannot be undone."
        confirmLabel="Delete permanently"
        onConfirm={async () => {
          if (!orderDeleteConfirm) return;
          setIsDeletingOrder(true);
          try {
            await deleteOrder(orderDeleteConfirm.id);
            if (openOrder?.id === orderDeleteConfirm.id) setOpenOrder(null);
            setOrderDeleteConfirm(null);
            void loadDashboardData(true);
          } catch {
            // toast handled in store
          } finally {
            setIsDeletingOrder(false);
          }
        }}
      >
        {orderDeleteConfirm && (
          <div className="rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700 ring-1 ring-inset ring-zinc-200">
            <p className="font-medium text-zinc-900">{orderDeleteConfirm.customerName || 'Customer'}</p>
            <p className="text-zinc-500">
              {orderDeleteConfirm.customerEmail} · {money(orderDeleteConfirm.totalAmount)} ·{' '}
              <span className="font-mono text-xs">{orderDeleteConfirm.id.slice(0, 8)}</span>
            </p>
          </div>
        )}
      </ConfirmDialog>

      {guestlistEvent && (
        <GuestlistModal
          event={guestlistEvent}
          onClose={() => setGuestlistEvent(null)}
          onSuccess={(guestlist) => {
            setGuestlistEvent(null);
            setGuestlistRefreshKey((k) => k + 1);
            toast.success(`Guestlist created — QR code sent to ${guestlist.leadEmail}`);
          }}
          onManageGuestlists={() => {
            const id = guestlistEvent.id;
            setGuestlistEvent(null);
            navigate('guestlists', id);
          }}
        />
      )}

      <AffiliateSocietyModal
        isOpen={isSocietyModalOpen}
        onClose={() => {
          setIsSocietyModalOpen(false);
          setEditingSociety(null);
        }}
        onSave={handleSaveSociety}
        editingSociety={editingSociety}
      />

      <AffiliateLinkGenerator
        isOpen={isLinkGeneratorOpen}
        onClose={() => setIsLinkGeneratorOpen(false)}
        onGenerateLinks={handleGenerateTrackingLinks}
        societies={affiliateSocieties}
        events={allEvents}
      />

      <SocietyDetailsModal
        society={viewingSociety}
        isOpen={isSocietyDetailsOpen}
        onClose={() => {
          setIsSocietyDetailsOpen(false);
          setViewingSociety(null);
        }}
      />

      <SocietyLinksModal
        society={viewingSociety}
        isOpen={isSocietyLinksOpen}
        onClose={() => {
          setIsSocietyLinksOpen(false);
          setViewingSociety(null);
        }}
      />

      <ConfirmDialog
        open={!!societyToDelete}
        onClose={() => setSocietyToDelete(null)}
        loading={deletingSociety}
        tone="danger"
        title={`Delete ${societyToDelete?.name ?? 'society'}?`}
        description="This removes the society and cannot be undone."
        confirmLabel="Delete society"
        onConfirm={async () => {
          if (!societyToDelete) return;
          setDeletingSociety(true);
          try {
            await deleteAffiliateSociety(societyToDelete.id);
            setSocietyToDelete(null);
            await refreshSocieties();
          } catch (error) {
            console.error('Error deleting society:', error);
          } finally {
            setDeletingSociety(false);
          }
        }}
      />
    </AdminLayout>
  );
};

export default Dashboard;
