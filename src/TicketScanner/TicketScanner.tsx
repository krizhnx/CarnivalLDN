import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, User, Calendar, MapPin, Ticket, ArrowLeft } from 'lucide-react';
import { TicketValidationResult } from '../types';
import { useAppStore } from '../store/supabaseStore';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const TicketScanner: React.FC = () => {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState<TicketValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanHistory, setScanHistory] = useState<TicketValidationResult[]>([]);

  
  const { validateTicket, recordTicketScan, validateGuestlist, recordGuestlistScan } = useAppStore();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScannedRef = useRef<string>('');
  const processingRef = useRef<boolean>(false);

  useEffect(() => {
    if (qrContainerRef.current) {
      // Initialize scanner
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        false
      );

      scannerRef.current.render(handleScan, handleError);

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear();
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, []);

  const handleScan = async (decodedText: string) => {
    // Prevent duplicate scans of the same QR code
    if (lastScannedRef.current === decodedText) {
      console.log('🚫 Duplicate QR code detected, ignoring');
      return;
    }
    
    // Prevent multiple simultaneous processing
    if (processingRef.current || isProcessing) {
      console.log('🚫 Already processing, ignoring scan');
      return;
    }
    
    // Set processing flags
    processingRef.current = true;
    setIsProcessing(true);
    lastScannedRef.current = decodedText;
    
    try {
      console.log('🔍 Raw QR code data:', decodedText);
      
      // Parse QR code data
      const qrData = JSON.parse(decodedText);
      console.log('🔍 Parsed QR data:', qrData);
      
      let validation;
      
      // Check if this is a guestlist QR code
      if (qrData.type === 'guestlist') {
        console.log('🔍 Processing guestlist QR code');
        
        // Validate guestlist
        validation = await validateGuestlist(qrData.guestlistId, 'entry');
        console.log('🔍 Guestlist validation result:', validation);
        
        if (validation.isValid) {
          // Guestlist is valid and has remaining scans
          await recordGuestlistScan({
            guestlistId: qrData.guestlistId,
            eventId: validation.eventId || '',
            scanType: 'entry',
            location: '',
            notes: '',
            scannedBy: 'admin' // Add the missing scannedBy field
          });
          
          // Get the updated guestlist data to show the correct remaining count after the scan
          const { data: updatedGuestlist } = await supabase
            .from('guestlists')
            .select('remaining_scans')
            .eq('id', qrData.guestlistId)
            .single();
          
          // Update the message to show the correct remaining count after the scan
          const remainingCount = updatedGuestlist?.remaining_scans || 0;
          const updatedMessage = remainingCount === 1 
            ? '1 ticket remaining'
            : `${remainingCount} tickets remaining`;
          
          // Create updated validation object with correct remaining count
          const updatedValidation = {
            ...validation,
            message: updatedMessage
          };
          
          // Add to scan history with updated validation
          const scanWithMetadata = {
            ...updatedValidation,
            scanType: 'entry',
            timestamp: new Date().toISOString()
          };
          setScanHistory(prev => [scanWithMetadata, ...prev.slice(0, 9)]);
          
          // Update the scan result to show the correct remaining count
          setScanResult(updatedValidation);
        }
      } else {
        // Regular ticket QR code
        console.log('🔍 Processing regular ticket QR code');
        
        // Validate ticket (entry only)
        validation = await validateTicket(qrData.orderId, qrData.ticketTierId, qrData.customer, 'entry');
        console.log('🔍 Ticket validation result:', validation);
        
        if (validation.isValid) {
          // Ticket is valid and not already scanned
          await recordTicketScan({
            orderId: qrData.orderId,
            ticketTierId: qrData.ticketTierId,
            customerEmail: qrData.customer,
            eventId: validation.eventId || '',
            scanType: 'entry',
            location: '',
            notes: ''
          });
          
          // Add to scan history
          const scanWithMetadata = {
            ...validation,
            scanType: 'entry',
            timestamp: new Date().toISOString()
          };
          setScanHistory(prev => [scanWithMetadata, ...prev.slice(0, 9)]);
        }
      }
      
      // Only set scan result if it hasn't been set yet (for guestlists)
      if (!scanResult) {
        setScanResult(validation);
      }
      
      // Auto-hide result after 1 second
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setScanResult(null);
      }, 3000);
      
    } catch (error) {
      console.error('Scan error:', error);
      setScanResult({
        isValid: false,
        message: 'Invalid QR code format',
        orderStatus: 'unknown',
        eventDate: 'unknown',
        customerName: 'unknown',
        customerEmail: 'unknown'
      });
      
      // Auto-hide error result after 1 second
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setScanResult(null);
      }, 1000);
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
      
      // Clear the last scanned reference after a delay to allow for testing
      setTimeout(() => {
        lastScannedRef.current = '';
      }, 1000);
    }
  };

  const handleError = (error: any) => {
    console.error('QR Scanner error:', error);
    // Don't show error toast for every scan attempt
  };

  const closeOverlay = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setScanResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 text-center">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Ticket Scanner</h1>
            <p className="text-gray-600 text-lg">Scan QR codes to validate tickets and record entry</p>
          </div>
          
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors mx-auto text-lg font-medium"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Dashboard
          </button>
        </div>

                {/* Scanner */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">QR Code Scanner</h2>
          <div className="relative">
            <div 
              id="qr-reader" 
              ref={qrContainerRef}
              className="w-full max-w-sm mx-auto"
            />
            <div className="text-center mt-6 space-y-2">
              <p className="text-gray-600 text-lg font-medium">
                📱 Position QR code within the frame
              </p>
              <p className="text-sm text-gray-500">
                Hold steady for best results
              </p>
            </div>
          </div>
        </div>

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg font-medium text-gray-900">Processing ticket...</p>
              <p className="text-sm text-gray-600">Please wait</p>
            </div>
          </div>
        )}

        {/* Scan Result Overlay */}
        {scanResult && !isProcessing && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 cursor-pointer"
              onClick={closeOverlay}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={`p-8 rounded-2xl border-2 max-w-lg w-full mx-4 text-center ${
                  scanResult.isValid 
                    ? 'border-green-300 bg-white shadow-green-100' 
                    : 'border-red-300 bg-white shadow-red-100'
                } shadow-2xl`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Large Icon */}
                <div className="mb-6">
                  {scanResult.isValid ? (
                    <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
                  ) : (
                    <XCircle className="h-20 w-20 text-red-500 mx-auto" />
                  )}
                </div>

                {/* Main Status */}
                <div className="mb-6">
                  <h3 className={`text-3xl font-bold mb-2 ${
                    scanResult.isValid ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {scanResult.isValid ? 'VALID TICKET' : 'INVALID TICKET'}
                  </h3>
                  <p className={`text-lg ${
                    scanResult.isValid ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {scanResult.message}
                  </p>
                  {scanResult.message.includes('already scanned') && (
                    <p className="text-orange-600 mt-2 font-medium">
                       ⚠️ Already Scanned for Entry
                    </p>
                  )}
                </div>

                {/* Customer Details */}
                <div className="space-y-4 text-left bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center justify-center gap-3">
                    <User className="h-5 w-5 text-gray-600" />
                    <span className="font-semibold text-lg text-gray-900">{scanResult.customerName}</span>
                  </div>
                  
                  <div className="flex items-center justify-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-700">
                      {scanResult.eventDate && scanResult.eventDate !== 'unknown' 
                        ? new Date(scanResult.eventDate).toLocaleDateString()
                        : 'Unknown Date'
                      }
                    </span>
                  </div>
                  
                  {scanResult.eventTitle && (
                    <div className="flex items-center justify-center gap-3">
                      <MapPin className="h-5 w-5 text-gray-600" />
                      <span className="font-medium text-gray-900">{scanResult.eventTitle}</span>
                    </div>
                  )}
                  
                  {scanResult.ticketTierName && (
                    <div className="flex items-center justify-center gap-3">
                      <Ticket className="h-5 w-5 text-gray-600" />
                      <span className="text-gray-700">{scanResult.ticketTierName}</span>
                    </div>
                  )}
                </div>

                {/* Tap to close hint */}
                <p className="text-sm text-gray-500 mt-6">Tap anywhere to close</p>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Recent Scans</h2>
            <div className="space-y-4">
              {scanHistory.map((scan, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-2 ${
                    scan.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center gap-4 mb-3">
                    {scan.isValid ? (
                      <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-lg ${
                        scan.isValid ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {scan.customerName}
                      </p>
                      <p className="text-gray-600">{scan.customerEmail}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg">
                    <p className="font-medium text-gray-900 mb-1">
                      {scan.eventTitle || 'Unknown Event'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Entry • {
                        (scan as any).timestamp 
                          ? new Date((scan as any).timestamp).toLocaleTimeString()
                          : (scan.eventDate && scan.eventDate !== 'unknown' 
                              ? new Date(scan.eventDate).toLocaleDateString()
                              : 'Unknown Date'
                            )
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketScanner;
