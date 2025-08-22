# Guestlist Functionality Documentation

## Overview

The guestlist functionality allows event organizers to create group bookings where multiple tickets are represented by a single QR code. This is particularly useful for:
- Bank transfer payments where someone buys multiple tickets
- Corporate bookings
- Group reservations
- VIP table bookings

## How It Works

### 1. Guestlist Creation
- **Admin creates a guestlist** from the event management dashboard
- **Single QR code generated** for the entire group
- **QR code can be scanned multiple times** (equal to the number of tickets purchased)
- **Email sent to the group leader** with the QR code and details

### 2. Entry Process
- **Group leader shares QR code** with all group members
- **Each person scans the same QR code** at entry
- **Scanner tracks remaining scans** and prevents over-scanning
- **All scans recorded** for audit purposes

## Database Schema

### New Tables

#### `guestlists`
```sql
CREATE TABLE guestlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  lead_name TEXT NOT NULL,
  lead_email TEXT NOT NULL,
  lead_phone TEXT,
  total_tickets INTEGER NOT NULL,
  notes TEXT,
  qr_code_data TEXT NOT NULL,
  remaining_scans INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `guestlist_scans`
```sql
CREATE TABLE guestlist_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guestlist_id UUID REFERENCES guestlists(id),
  event_id UUID NOT NULL,
  scanned_at TIMESTAMP DEFAULT NOW(),
  scan_type TEXT DEFAULT 'entry'
);
```

### Database Functions

#### `decrement_guestlist_scans(guestlist_uuid)`
- Decrements the `remaining_scans` count
- Prevents count from going below 0
- Returns the new count

#### `can_scan_guestlist(guestlist_uuid)`
- Checks if a guestlist has remaining scans
- Returns boolean indicating if scan is allowed

## Frontend Components

### GuestlistModal
- **Location**: `src/components/GuestlistModal.tsx`
- **Purpose**: Create new guestlists
- **Fields**:
  - Lead Name
  - Lead Email
  - Lead Phone
  - Number of Tickets
  - Notes
- **Actions**: Create guestlist, navigate to management view

### GuestlistManagement
- **Location**: `src/components/GuestlistManagement.tsx`
- **Purpose**: View and manage existing guestlists
- **Features**:
  - List all guestlists for an event
  - Display statistics (total guestlists, tickets, usage)
  - Resend QR codes via email
  - Delete guestlists
- **Actions**: Resend QR, Delete, Create new

## Backend API Endpoints

### Create Guestlist
- **Endpoint**: `POST /api/create-guestlist`
- **Purpose**: Create a new guestlist and generate QR code
- **Payload**:
  ```json
  {
    "eventId": "uuid",
    "leadName": "string",
    "leadEmail": "string",
    "leadPhone": "string",
    "totalTickets": "number",
    "notes": "string"
  }
  ```

### Fetch Guestlists
- **Endpoint**: `GET /api/guestlists?eventId=uuid`
- **Purpose**: Retrieve all guestlists for a specific event

### Resend QR Code
- **Endpoint**: `POST /api/resend-guestlist-qr`
- **Purpose**: Resend the QR code email to the group leader
- **Payload**:
  ```json
  {
    "guestlistId": "uuid"
  }
  ```

### Delete Guestlist
- **Endpoint**: `DELETE /api/guestlists/[id]`
- **Purpose**: Remove a guestlist and all associated data

## QR Code Structure

### Guestlist QR Code Data
```json
{
  "type": "guestlist",
  "guestlistId": "uuid",
  "eventId": "uuid",
  "totalTickets": 5,
  "leadEmail": "leader@example.com",
  "leadName": "John Doe"
}
```

### Regular Ticket QR Code Data
```json
{
  "type": "ticket",
  "ticketId": "uuid",
  "eventId": "uuid"
}
```

## Email Service

### Guestlist Email Features
- **PDF Attachment**: Contains the QR code and booking details
- **Large QR Code**: Centered and easily scannable
- **Booking Summary**: All relevant details included
- **Professional Formatting**: Branded with event/organization details

### Email Content
- **Subject**: "Your Guestlist Confirmation - [Event Name]"
- **Body**: Includes lead name, event details, ticket count, and notes
- **Attachment**: PDF with QR code and complete booking information

## Ticket Scanner Integration

### Scan Processing
1. **QR Code Detection**: Scanner reads QR code data
2. **Type Identification**: Determines if it's a guestlist or regular ticket
3. **Validation**: Checks if scan is allowed
4. **Recording**: Logs the scan and updates remaining count
5. **Feedback**: Shows appropriate success/error messages

### Guestlist Validation
- Verifies guestlist exists
- Checks remaining scans > 0
- Validates event date hasn't passed
- Prevents duplicate scans for the same person

## Admin Dashboard Integration

### Event Management
- **Guestlist Button**: Added to each event row
- **Modal Integration**: Seamless switching between creation and management
- **Real-time Updates**: Dashboard refreshes after guestlist operations

### Navigation Flow
1. **Event Management** → Click "Guestlist" button
2. **Guestlist Modal** → Create new guestlist
3. **Guestlist Management** → View and manage existing guestlists
4. **Back to Creation** → Easy navigation between views

## Usage Examples

### Example 1: Corporate Table Booking
1. **Admin creates guestlist** for "TechCorp" with 8 tickets
2. **QR code generated** and sent to corporate contact
3. **Contact shares QR code** with all 8 employees
4. **Each employee scans** the same QR code at entry
5. **Scanner tracks** remaining scans (8 → 7 → 6... → 0)

### Example 2: Bank Transfer Group
1. **Customer pays** for 5 tickets via bank transfer
2. **Admin creates guestlist** with customer details
3. **QR code emailed** to customer
4. **Customer shares** QR code with friends
5. **All 5 can enter** using the same code

## Security Features

### Validation Checks
- **Event Existence**: Verifies event is valid
- **Scan Limits**: Prevents over-scanning
- **Date Validation**: Ensures event hasn't passed
- **Unique Tracking**: Records each scan individually

### Data Integrity
- **Foreign Key Constraints**: Maintains referential integrity
- **Transaction Safety**: Database operations are atomic
- **Audit Trail**: Complete scan history maintained

## Technical Implementation

### State Management
- **Zustand Store**: Centralized state for guestlist operations
- **Real-time Updates**: Dashboard reflects changes immediately
- **Error Handling**: Comprehensive error states and user feedback

### Type Safety
- **TypeScript Interfaces**: Full type definitions for all data structures
- **API Contracts**: Consistent data shapes across frontend and backend
- **Validation**: Runtime and compile-time type checking

## Future Enhancements

### Potential Features
- **Bulk Guestlist Creation**: Import from CSV/Excel
- **Advanced Analytics**: Guestlist usage statistics
- **Custom Email Templates**: Branded email designs
- **Mobile App Integration**: QR code sharing via mobile
- **Real-time Notifications**: Live updates on scan activity

### Scalability Considerations
- **Database Indexing**: Optimized queries for large datasets
- **Caching**: Frequently accessed data caching
- **Rate Limiting**: API endpoint protection
- **Monitoring**: Performance and usage metrics

## Troubleshooting

### Common Issues

#### QR Code Not Scanning
- **Check**: Ensure QR code is properly generated
- **Verify**: Guestlist exists and has remaining scans
- **Confirm**: Event date hasn't passed

#### Email Not Received
- **Check**: Email address is correct
- **Verify**: Email service configuration
- **Confirm**: Check spam/junk folders

#### Scanner Errors
- **Check**: QR code data format
- **Verify**: Database connectivity
- **Confirm**: Scanner permissions

### Debug Information
- **Console Logs**: Frontend debugging information
- **Database Logs**: Backend operation tracking
- **Email Logs**: Delivery confirmation details

## Support

For technical support or questions about the guestlist functionality:
1. **Check this documentation** for common solutions
2. **Review console logs** for error details
3. **Verify database state** for data consistency
4. **Contact development team** for complex issues

---

*This documentation covers the complete guestlist functionality implementation. For additional details, refer to the individual component files and API endpoints.*
