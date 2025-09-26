import { motion } from 'framer-motion';
import { CheckCircle, Ticket } from 'lucide-react';
import { Order } from '../types';
// COMMENTED OUT: Unused imports after removing download functionality
// import { useAppStore } from '../store/supabaseStore';
// import { supabase } from '../lib/supabase';
// import jsPDF from 'jspdf';
// import QRCode from 'qrcode';

interface PaymentSuccessProps {
  order: Order;
  onClose: () => void;
}

const PaymentSuccess = ({ order, onClose }: PaymentSuccessProps) => {
  // Safely handle missing tickets data
  const totalTickets = order.tickets?.reduce((sum, ticket) => sum + (ticket.quantity || 0), 0) || 0;

  // Handle click outside modal to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // COMMENTED OUT: Unused after removing download functionality
  // const { events } = useAppStore();

  // COMMENTED OUT: Download functionality removed - tickets are now email-only
  // const handleDownload = async () => {
  //   try {
  //     // Fetch the actual order data from the database to ensure we have the correct ticket_tier_id
  //     const { data: dbOrder, error: orderError } = await supabase
  //       .from('orders')
  //       .select(`
  //         *,
  //         order_tickets (
  //           *,
  //           ticket_tiers (
  //             id,
  //             name,
  //             price
  //           )
  //         )
  //       `)
  //       .eq('id', order.id)
  //       .single();

  //     if (orderError || !dbOrder) {
  //       console.error('Error fetching order from database:', orderError);
  //       // Fallback to frontend order data
  //       console.log('Falling back to frontend order data');
  //     }

  //     const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  //     const pageWidth = doc.internal.pageSize.getWidth();
  //     const pageHeight = doc.internal.pageSize.getHeight();
  //     const margin = 40;
  //     let y = margin;

  //     // Header bar
  //     doc.setFillColor(17, 24, 39); // gray-900
  //     doc.rect(0, 0, pageWidth, 90, 'F');
  //     doc.setTextColor(255, 255, 255);
  //     doc.setFont('helvetica', 'bold');
  //     doc.setFontSize(22);
  //     doc.text('Carnival LDN - Tickets', pageWidth / 2, 40, { align: 'center' });

  //     const eventTitle = events?.find(e => e.id === order.eventId)?.title || 'Your Event';
  //     doc.setFont('helvetica', 'normal');
  //     doc.setFontSize(13);
  //     doc.text(eventTitle, pageWidth / 2, 62, { align: 'center' });

  //     y = 110;
  //     doc.setTextColor(55, 65, 81); // gray-700
  //     doc.setFontSize(12);
  //     doc.text(`Order: ${order.id}`, margin, y); y += 16;
  //     doc.text(`Name: ${order.customerName || ''}`, margin, y); y += 16;
  //     doc.text(`Email: ${order.customerEmail || ''}`, margin, y); y += 16;
  //     doc.text(`Status: ${order.status}`, margin, y); y += 16;
  //     doc.text(`Total: £${((order.totalAmount || 0) / 100).toFixed(2)}`, margin, y); y += 20;

  //     // Use database order tickets if available, otherwise fallback to frontend order tickets
  //     const tickets = dbOrder?.order_tickets || order.tickets || [];
      
  //     for (let i = 0; i < tickets.length; i++) {
  //       const t = tickets[i];
  //       // Page break check
  //       if (y + 180 > pageHeight - margin) {
  //         doc.addPage();
  //         y = margin;
  //       }

  //       // Get tier name - use database data if available
  //       const tierName = dbOrder?.order_tickets?.[i]?.ticket_tiers?.name || 
  //         (() => {
  //           const ev = events?.find(e => e.id === order.eventId);
  //           const tier = ev?.ticketTiers?.find(tt => tt.id === t.ticketTierId);
  //           return tier?.name || t.ticketTierId;
  //         })();

  //       // Ticket card
  //       const cardX = margin;
  //       const cardW = pageWidth - margin * 2;
  //       const cardH = 150;
  //       doc.setDrawColor(229, 231, 235); // gray-200 border
  //       doc.setFillColor(249, 250, 251); // gray-50 bg
  //       doc.rect(cardX, y, cardW, cardH, 'FD');

  //       // Left column text
  //       let ty = y + 24;
  //       doc.setTextColor(31, 41, 55); // gray-800
  //       doc.setFont('helvetica', 'bold');
  //       doc.setFontSize(14);
  //       doc.text(`Ticket ${i + 1}`, cardX + 16, ty); ty += 18;
  //       doc.setFont('helvetica', 'normal');
  //       doc.setFontSize(12);
  //       doc.text(`Tier: ${tierName}`, cardX + 16, ty); ty += 14;
  //       doc.text(`Quantity: ${t.quantity}`, cardX + 16, ty); ty += 14;
  //       doc.text(`Unit: £${((t.unit_price || t.unitPrice || 0) / 100).toFixed(2)}   Total: £${((t.total_price || t.totalPrice || 0) / 100).toFixed(2)}`, cardX + 16, ty); ty += 18;
  //       doc.setTextColor(75, 85, 99); // gray-600
  //       doc.text(`Order Ref: ${order.id?.slice(0, 8)}...`, cardX + 16, ty);

  //       // Use the correct ticket_tier_id from database if available
  //       const correctTicketTierId = dbOrder?.order_tickets?.[i]?.ticket_tier_id || t.ticketTierId;
        
  //       const qrPayload = JSON.stringify({
  //         orderId: order.id,
  //         ticketTierId: correctTicketTierId,
  //         quantity: t.quantity,
  //         customer: order.customerEmail,
  //       });
        
  //       // Debug: Log the QR payload to help troubleshoot
  //       console.log('🔍 Website Download QR Payload:', qrPayload);
  //       console.log('🔍 Correct Ticket Tier ID:', correctTicketTierId);
  //       console.log('🔍 Database Order:', dbOrder);
  //       console.log('🔍 Frontend Order:', order);

  //       const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 120, margin: 1, color: { dark: '#111827', light: '#FFFFFFFF' } });
  //       doc.addImage(qrDataUrl, 'PNG', pageWidth - margin - 136, y + 15, 120, 120);

  //       y += cardH + 14;
  //     }

  //     doc.save(`tickets_${order.id}.pdf`);
  //   } catch (e) {
  //     console.error('Failed to generate PDF:', e);
  //   }
  // };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center"
      >
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600">
            Your tickets have been purchased successfully! Check your email for the confirmation and attached PDF tickets.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Order ID:</span>
              <span className="font-mono text-gray-600">{order.id?.slice(0, 8) || 'N/A'}...</span>
            </div>
            <div className="flex justify-between">
              <span>Total Tickets:</span>
              <span className="font-semibold">{totalTickets}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Amount:</span>
              <span className="font-semibold">£{((order.totalAmount || 0) / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-green-600 font-semibold capitalize">{order.status || 'completed'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            Confirmation & tickets sent to <span className="font-semibold text-black">{order.customerEmail || 'your email'}</span>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Ticket className="h-4 w-4 flex-shrink-0" />
            <span>PDF tickets attached to your email</span>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            📧 Check your inbox (and spam folder) for your tickets
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
          {/* COMMENTED OUT: Download button removed - tickets are email-only */}
          {/* <button
            onClick={handleDownload}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </button> */}
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
