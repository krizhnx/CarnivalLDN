import { Event } from '../../types';

interface EventManagementProps {
  currentEvents: Event[];
  archivedEvents: Event[];
  onAddEvent: () => void;
  onEditEvent: (event: Event) => void;
  onArchiveToggle: (event: Event) => void;
  onDeleteEvent: (event: Event) => void;
}

const EventManagement = ({
  currentEvents,
  archivedEvents,
  onAddEvent,
  onEditEvent,
  onArchiveToggle,
  onDeleteEvent
}: EventManagementProps) => {


  const renderEventTable = (events: Event[], isArchived: boolean = false) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiers</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {events.map((ev) => (
              <tr key={ev.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 truncate max-w-[220px]">{ev.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ev.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-[180px]">{ev.venue}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ev.ticketTiers?.length || 0}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button onClick={() => onEditEvent(ev)} className="px-3 py-1 rounded-md border text-gray-700 hover:bg-gray-50">Edit</button>
                  <button onClick={() => onArchiveToggle(ev)} className="px-3 py-1 rounded-md border text-gray-700 hover:bg-gray-50">
                    {isArchived ? 'Unarchive' : 'Archive'}
                  </button>
                  <button onClick={() => onDeleteEvent(ev)} className="px-3 py-1 rounded-md border border-red-200 text-red-700 hover:bg-red-50">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Manage Events</h3>
        <button
          onClick={onAddEvent}
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-md text-sm"
        >
          Add Event
        </button>
      </div>

      {/* Current Events */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-semibold text-gray-800">Current Events</h4>
          <span className="text-sm text-gray-500">{currentEvents.length} events</span>
        </div>
        {renderEventTable(currentEvents, false)}
      </div>

      {/* Archived Events */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-semibold text-gray-800">Archived Events</h4>
          <span className="text-sm text-gray-500">{archivedEvents.length} events</span>
        </div>
        {renderEventTable(archivedEvents, true)}
      </div>
    </div>
  );
};

export default EventManagement;
