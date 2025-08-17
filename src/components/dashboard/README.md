# Dashboard Components

This directory contains the modularized components that make up the Dashboard. The original monolithic Dashboard component has been broken down into smaller, focused components for better maintainability and reusability.

## Components

### DashboardHeader
- **Purpose**: Header section with title, filters, and navigation tabs
- **Props**: 
  - `selectedTimeframe`: Current selected time period
  - `selectedEvent`: Currently selected event filter
  - `events`: List of all events for the dropdown
  - `activeTab`: Currently active tab
  - `onTimeframeChange`: Callback for timeframe changes
  - `onEventChange`: Callback for event filter changes
  - `onTabChange`: Callback for tab changes
  - `onRefresh`: Callback for refresh button

### DashboardStats
- **Purpose**: Displays key metrics cards (Revenue, Orders, Tickets, Conversion Rate)
- **Props**:
  - `stats`: Dashboard statistics object containing the metrics data

### DashboardCharts
- **Purpose**: Revenue trend chart and top performing events
- **Props**:
  - `stats`: Dashboard statistics object containing chart data

### RecentOrdersTable
- **Purpose**: Table displaying recent orders
- **Props**:
  - `orders`: Array of recent orders
  - `events`: Array of events for reference

### QuickEventCreation
- **Purpose**: Quick event creation buttons for different event types
- **Props**:
  - `creatingEvents`: Array of event types currently being created
  - `onCreateEvent`: Callback for creating test events

### EventManagement
- **Purpose**: Event management section with current and archived events
- **Props**:
  - `currentEvents`: Array of active events
  - `archivedEvents`: Array of archived events
  - `onAddEvent`: Callback for adding new events
  - `onEditEvent`: Callback for editing events
  - `onArchiveToggle`: Callback for archiving/unarchiving events
  - `onDeleteEvent`: Callback for deleting events

### OrdersTable
- **Purpose**: Table displaying all orders
- **Props**:
  - `orders`: Array of all orders
  - `events`: Array of events for reference

### ConfirmationModal
- **Purpose**: Modal for confirming destructive actions
- **Props**:
  - `confirm`: Confirmation object with type and event
  - `onClose`: Callback for closing the modal
  - `onConfirm`: Callback for confirming the action

## Benefits of Modularization

1. **Maintainability**: Each component has a single responsibility
2. **Reusability**: Components can be reused in other parts of the application
3. **Testing**: Easier to write unit tests for individual components
4. **Performance**: Components can be optimized individually
5. **Code Organization**: Clearer structure and easier to navigate
6. **Team Development**: Multiple developers can work on different components simultaneously

## Usage

The main Dashboard component imports and uses these components:

```tsx
import {
  DashboardHeader,
  DashboardStats,
  DashboardCharts,
  RecentOrdersTable,
  QuickEventCreation,
  EventManagement,
  OrdersTable,
  ConfirmationModal
} from './dashboard/index';
```

## File Structure

```
dashboard/
├── index.ts              # Export file for all components
├── README.md            # This documentation
├── DashboardHeader.tsx  # Header component
├── DashboardStats.tsx   # Stats cards component
├── DashboardCharts.tsx  # Charts component
├── RecentOrdersTable.tsx # Recent orders table
├── QuickEventCreation.tsx # Quick event creation buttons
├── EventManagement.tsx  # Event management section
├── OrdersTable.tsx      # All orders table
└── ConfirmationModal.tsx # Confirmation modal
```
