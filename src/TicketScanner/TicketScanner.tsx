import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Camera, RotateCcw, User, Calendar, MapPin, Ticket } from 'lucide-react';
import { TicketValidationResult, QRCodeData } from '../types';
import { useAppStore } from '../store/supabaseStore';
import toast from 'react-hot-toast';

interface TicketScannerProps {
  onClose?: () => void;
}

const TicketScanner: React.FC<TicketScannerProps> = ({ onClose }) => {
  const [isScanning, setIsScanning] = useState(true);
  const [scanResult, setScanResult] = useState<TicketValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanHistory, setScanHistory] = useState<TicketValidationResult[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [location, setLocation] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [scanType, setScanType] = useState<'entry' | 'exit'>('entry');
  
  const { events, validateTicket, recordTicketScan, debugTicketData } = useAppStore();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isScanning && qrContainerRef.current) {
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
      };
    }
  }, [isScanning]);

  const handleScan = async (decodedText: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setIsScanning(false);
    
    try {
      console.log('🔍 Raw QR code data:', decodedText);
      
      // Parse QR code data
      const qrData: QRCodeData = JSON.parse(decodedText);
      console.log('🔍 Parsed QR data:', qrData);
      
      // Debug: Check database state
      await debugTicketData(qrData.orderId, qrData.ticketTierId);
      
      // Validate ticket
      const validation = await validateTicket(qrData.orderId, qrData.ticketTierId, qrData.customer);
      console.log('🔍 Validation result:', validation);
      
      if (validation.isValid) {
        // Record the scan
        await recordTicketScan({
          orderId: qrData.orderId,
          ticketTierId: qrData.ticketTierId,
          customerEmail: qrData.customer,
          eventId: validation.eventId || '',
          scanType,
          location,
          notes
        });
        
        toast.success('Ticket scanned successfully!');
      } else {
        toast.error(validation.message);
      }
      
      setScanResult(validation);
      setScanHistory(prev => [validation, ...prev.slice(0, 9)]); // Keep last 10 scans
      
    } catch (error) {
      console.error('Scan error:', error);
      toast.error('Failed to process QR code');
      setScanResult({
        isValid: false,
        message: 'Invalid QR code format',
        orderStatus: 'unknown',
        eventDate: 'unknown',
        customerName: 'unknown',
        customerEmail: 'unknown'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleError = (error: any) => {
    console.error('QR Scanner error:', error);
    // Don't show error toast for every scan attempt
  };

  const resetScanner = () => {
    setIsScanning(true);
    setScanResult(null);
    setLocation('');
    setNotes('');
    
    // Clear and reinitialize scanner
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ticket Scanner</h1>
              <p className="text-gray-600">Scan QR codes to validate tickets and record entry/exit</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Filter</label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Events</option>
                {events?.map(event => (
                  <option key={event.id} value={event.id}>{event.title}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scan Type</label>
              <select
                value={scanType}
                onChange={(e) => setScanType(e.target.value as 'entry' | 'exit')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="entry">Entry</option>
                <option value="exit">Exit</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Main Gate, VIP Entry"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scanner */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">QR Code Scanner</h2>
              <button
                onClick={resetScanner}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>

            {isScanning ? (
              <div className="relative">
                <div 
                  id="qr-reader" 
                  ref={qrContainerRef}
                  className="w-full max-w-sm mx-auto"
                />
                <p className="text-center text-sm text-gray-600 mt-4">
                  Position QR code within the frame
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Scanner paused</p>
                <button
                  onClick={resetScanner}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Resume Scanning
                </button>
              </div>
            )}
          </div>

          {/* Scan Result */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Scan Result</h2>
            
            {isProcessing ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Processing ticket...</p>
              </div>
            ) : scanResult ? (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`p-4 rounded-lg border-2 ${
                    scanResult.isValid 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    {scanResult.isValid ? (
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-600" />
                    )}
                    <div>
                      <h3 className={`font-semibold ${
                        scanResult.isValid ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {scanResult.isValid ? 'Valid Ticket' : 'Invalid Ticket'}
                      </h3>
                      <p className={`text-sm ${
                        scanResult.isValid ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {scanResult.message}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{scanResult.customerName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>{scanResult.eventDate}</span>
                    </div>
                    
                    {scanResult.eventTitle && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{scanResult.eventTitle}</span>
                      </div>
                    )}
                    
                    {scanResult.ticketTierName && (
                      <div className="flex items-center gap-2 text-sm">
                        <Ticket className="h-4 w-4 text-gray-500" />
                        <span>{scanResult.ticketTierName}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                <p>Scan a QR code to see results</p>
              </div>
            )}
          </div>
        </div>

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Scans</h2>
            <div className="space-y-3">
              {scanHistory.map((scan, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    scan.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {scan.isValid ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className={`font-medium ${
                        scan.isValid ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {scan.customerName}
                      </p>
                      <p className="text-sm text-gray-600">{scan.customerEmail}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {scan.eventTitle || 'Unknown Event'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date().toLocaleTimeString()}
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
