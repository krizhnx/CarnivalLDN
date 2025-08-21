# Ticket Scanner System - Carnival LDN

## Overview
The Ticket Scanner System allows event staff to scan QR codes from customer tickets to validate entry/exit and track attendance in real-time.

## Features
- **QR Code Scanning**: Scan tickets using device camera
- **Real-time Validation**: Instantly validate ticket authenticity
- **Entry/Exit Tracking**: Record both entry and exit scans
- **Location Tracking**: Specify entry points (Main Gate, VIP Entry, etc.)
- **Scan History**: View recent scans with validation results
- **Event Filtering**: Filter scans by specific events
- **Admin Integration**: Built into the admin dashboard

## How It Works

### 1. QR Code Generation
When customers complete payment, QR codes are automatically generated containing:
```json
{
  "orderId": "uuid",
  "ticketTierId": "tier_id",
  "quantity": 1,
  "customer": "customer@email.com"
}
```

### 2. Ticket Validation
The system validates tickets by checking:
- ✅ Payment status is 'completed'
- ✅ Event date hasn't passed
- ✅ Ticket tier is active
- ✅ Customer email matches order
- ✅ No duplicate entry scans (prevents fraud)

### 3. Scan Recording
Each scan records:
- Order and ticket details
- Scan type (entry/exit)
- Timestamp
- Location (entry point)
- Admin notes
- Staff member who scanned

## Database Schema

### New Table: `ticket_scans`
```sql
CREATE TABLE public.ticket_scans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  ticket_tier_id text NOT NULL,
  customer_email text NOT NULL,
  event_id uuid NOT NULL,
  scan_type text NOT NULL CHECK (scan_type = ANY (ARRAY['entry'::text, 'exit'::text])),
  scanned_at timestamp with time zone DEFAULT now(),
  scanned_by text,
  location text,
  notes text,
  CONSTRAINT ticket_scans_pkey PRIMARY KEY (id)
);
```

### Function: `check_ticket_validity`
Validates ticket before allowing entry/exit.

## Usage Instructions

### For Event Staff

1. **Access Scanner**: Go to Admin Dashboard → Ticket Scanner tab
2. **Configure Settings**:
   - Select event (optional filter)
   - Choose scan type (Entry/Exit)
   - Set location (e.g., "Main Gate", "VIP Entry")
   - Add notes if needed
3. **Scan Tickets**: Point camera at customer QR codes
4. **View Results**: See instant validation feedback
5. **Monitor History**: Check recent scans

### For Administrators

1. **View Analytics**: Track entry/exit patterns
2. **Export Data**: Download scan reports
3. **Monitor Events**: Real-time attendance tracking
4. **Security**: Prevent duplicate entries and fraud

## Security Features

- **Unique QR Codes**: Each ticket has a unique identifier
- **Duplicate Prevention**: System prevents multiple entry scans
- **Real-time Validation**: Checks payment status and event validity
- **Audit Trail**: Complete scan history with timestamps
- **Location Tracking**: Know where each scan occurred

## Technical Implementation

### Frontend Components
- `TicketScanner.tsx`: Main scanner interface
- `Dashboard.tsx`: Admin integration
- `DashboardHeader.tsx`: Navigation tabs

### Backend Functions
- `validateTicket()`: Ticket validation logic
- `recordTicketScan()`: Database recording
- Supabase RPC functions for complex queries

### Dependencies
- `html5-qrcode`: Modern QR code scanning
- `framer-motion`: Smooth animations
- `lucide-react`: Icons
- `react-hot-toast`: Notifications

## Setup Requirements

1. **Database**: Run the SQL schema updates
2. **Dependencies**: Install `html5-qrcode` package
3. **Permissions**: Ensure camera access for scanning
4. **Admin Access**: Login with admin credentials

## Troubleshooting

### Camera Issues
- Check browser permissions
- Ensure HTTPS (required for camera access)
- Try different browsers/devices

### Validation Errors
- Verify ticket payment status
- Check event date hasn't passed
- Confirm customer email matches

### Performance
- Scanner runs at 10 FPS for optimal performance
- QR box size: 250x250 pixels
- Automatic cleanup on component unmount

## Future Enhancements

- **Offline Mode**: Cache validation data
- **Bulk Import**: CSV ticket uploads
- **Advanced Analytics**: Heat maps, peak times
- **Mobile App**: Native iOS/Android scanner
- **API Integration**: Third-party ticketing systems

## Support

For technical support or feature requests, contact the development team.
