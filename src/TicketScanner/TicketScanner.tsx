import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ArrowLeft, CalendarDays, CheckCircle2, Loader2, MapPin, Minus, Plus, ScanLine, Ticket, User, XCircle } from 'lucide-react';
import { TicketValidationResult } from '../types';
import { useAppStore } from '../store/supabaseStore';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

/* html5-qrcode renders its own controls; restyle them to match the admin UI. */
const scannerCss = `
#qr-reader { border: 0 !important; padding: 0 !important; }
#qr-reader video { border-radius: 16px; object-fit: cover; }
#qr-reader__scan_region { border-radius: 16px; overflow: hidden; background: #f4f4f5; min-height: 120px; display: grid; place-items: center; }
#qr-reader__scan_region img { opacity: .35; }
#qr-reader__dashboard { padding: 16px 0 0 !important; }
#qr-reader__dashboard_section_csr > span, #qr-reader__dashboard_section_csr > div { display: flex !important; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: center; }
#qr-reader__dashboard_section_csr select { height: 40px; max-width: 100%; border-radius: 10px; border: 1px solid #e4e4e7; padding: 0 12px; font-size: 14px; background: #fff; color: #18181b; }
#qr-reader button { height: 40px; padding: 0 16px; border-radius: 10px; border: 0; background: #18181b; color: #fff; font-size: 14px; font-weight: 500; cursor: pointer; }
#qr-reader button:hover { background: #27272a; }
#qr-reader button[id*="stop"] { background: #fff; color: #18181b; border: 1px solid #e4e4e7; }
#qr-reader__dashboard_section_swaplink, #html5-qrcode-anchor-scan-type-change { display: inline-block; margin-top: 12px; font-size: 13px; color: #71717a !important; text-decoration: none !important; }
#qr-reader__dashboard_section_swaplink:hover, #html5-qrcode-anchor-scan-type-change:hover { color: #18181b !important; }
#qr-reader__status_span { font-size: 13px; color: #71717a; }
#qr-reader__header_message { border-radius: 10px; font-size: 13px !important; margin: 8px 0 0 !important; border: 0 !important; background: #fef3c7 !important; color: #92400e !important; padding: 8px 12px !important; }
#qr-reader input[type="file"] { font-size: 13px; }
`;

const TicketScanner: React.FC = () => {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState<TicketValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGuestlistBulkMode, setIsGuestlistBulkMode] = useState(false);
  const [guestlistId, setGuestlistId] = useState<string | null>(null);
  const [remainingScans, setRemainingScans] = useState<number>(0);
  const [bulkScanCount, setBulkScanCount] = useState<number>(1);
  const [isRecordingBulk, setIsRecordingBulk] = useState(false);

  const { validateTicket, recordTicketScan, validateGuestlist, recordMultipleGuestlistScans } = useAppStore();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScannedRef = useRef<string>('');
  const processingRef = useRef<boolean>(false);

  useEffect(() => {
    if (qrContainerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScan = async (decodedText: string) => {
    // Prevent duplicate scans of the same QR code
    if (lastScannedRef.current === decodedText) return;

    // Prevent multiple simultaneous processing
    if (processingRef.current || isProcessing) return;

    processingRef.current = true;
    setIsProcessing(true);
    lastScannedRef.current = decodedText;

    try {
      const qrData = JSON.parse(decodedText);

      let validation;

      if (qrData.type === 'guestlist') {
        validation = await validateGuestlist(qrData.guestlistId, 'entry');

        if (validation.isValid) {
          const { data: guestlist } = await supabase.from('guestlists').select('remaining_scans').eq('id', qrData.guestlistId).single();

          const remainingCount = guestlist?.remaining_scans || 0;

          // Set up bulk scan mode instead of recording immediately
          setGuestlistId(qrData.guestlistId);
          setRemainingScans(remainingCount);
          setBulkScanCount(1);
          setIsGuestlistBulkMode(true);

          setScanResult({
            ...validation,
            message: remainingCount === 1 ? '1 ticket remaining' : `${remainingCount} tickets remaining`,
          });

          // Don't auto-hide for guestlist - user will use bulk scan UI
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        } else {
          setScanResult(validation);
          setIsGuestlistBulkMode(false);

          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => setScanResult(null), 3000);
        }
      } else {
        // Regular ticket QR code (entry only)
        validation = await validateTicket(qrData.orderId, qrData.ticketTierId, qrData.customer, 'entry');

        if (validation.isValid) {
          await recordTicketScan({
            orderId: qrData.orderId,
            ticketTierId: qrData.ticketTierId,
            customerEmail: qrData.customer,
            eventId: validation.eventId || '',
            scanType: 'entry',
            location: '',
            notes: '',
          });
        }
      }

      // Only set scan result if it hasn't been set yet (for regular tickets)
      if (!scanResult && qrData.type !== 'guestlist') {
        setScanResult(validation);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setScanResult(null), 3000);
      }
    } catch (error) {
      console.error('Scan error:', error);
      setScanResult({
        isValid: false,
        message: 'Invalid QR code format',
        orderStatus: 'unknown',
        eventDate: 'unknown',
        customerName: 'unknown',
        customerEmail: 'unknown',
      });

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setScanResult(null), 1000);
    } finally {
      setIsProcessing(false);
      processingRef.current = false;

      // Clear the last scanned reference after a delay to allow re-scans
      setTimeout(() => {
        lastScannedRef.current = '';
      }, 1000);
    }
  };

  const handleError = () => {
    // Fires on every frame without a QR code - intentionally silent
  };

  const closeOverlay = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setScanResult(null);
    setIsGuestlistBulkMode(false);
    setGuestlistId(null);
    setRemainingScans(0);
    setBulkScanCount(1);
  };

  const handleBulkScan = async () => {
    if (!guestlistId || bulkScanCount <= 0 || bulkScanCount > remainingScans) return;

    setIsRecordingBulk(true);
    try {
      const validation = scanResult;
      if (!validation || !validation.isValid || !validation.eventId) {
        throw new Error('Invalid validation data');
      }

      const actualCount = await recordMultipleGuestlistScans(
        {
          guestlistId: guestlistId,
          eventId: validation.eventId,
          scanType: 'entry',
          location: '',
          notes: '',
          scannedBy: 'admin',
        },
        bulkScanCount
      );

      const { data: updatedGuestlist } = await supabase.from('guestlists').select('remaining_scans').eq('id', guestlistId).single();

      const newRemaining = updatedGuestlist?.remaining_scans || 0;
      setRemainingScans(newRemaining);

      const updatedMessage = newRemaining === 0 ? 'All tickets used' : newRemaining === 1 ? '1 ticket remaining' : `${newRemaining} tickets remaining`;

      setScanResult({
        ...validation,
        message: `Registered ${actualCount} ${actualCount === 1 ? 'person' : 'people'}. ${updatedMessage}`,
      });

      // Auto-close after 4 seconds when registration is complete
      setTimeout(() => closeOverlay(), 4000);
    } catch (error) {
      console.error('Error recording bulk scans:', error);
      setScanResult({
        ...scanResult!,
        isValid: false,
        message: 'Error recording scans. Please try again.',
      });
    } finally {
      setIsRecordingBulk(false);
    }
  };

  const alreadyScanned = !!scanResult?.message?.toLowerCase().includes('already scanned');
  const tone = scanResult?.isValid ? 'valid' : alreadyScanned ? 'warn' : 'invalid';
  const eventDateLabel =
    scanResult?.eventDate && scanResult.eventDate !== 'unknown'
      ? new Date(scanResult.eventDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
      : null;

  return (
    <div className="min-h-screen bg-[#f6f6f7] font-sans text-zinc-900 antialiased">
      <style>{scannerCss}</style>

      <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-[#f6f6f7]/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-xl items-center gap-3 px-4">
          <button
            type="button"
            onClick={() => navigate('/admin/dashboard')}
            className="grid h-9 w-9 place-items-center rounded-lg text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-[15px] font-semibold tracking-tight">Door scanner</h1>
            <p className="text-xs text-zinc-500">Entry check-in</p>
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
              isProcessing ? 'bg-amber-50 text-amber-700 ring-amber-600/20' : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', isProcessing ? 'animate-pulse bg-amber-500' : 'bg-emerald-500')} />
            {isProcessing ? 'Checking' : 'Ready'}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6">
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-5">
          <div id="qr-reader" ref={qrContainerRef} className="mx-auto w-full max-w-md" />
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-white/60 px-4 py-3 text-[13px] text-zinc-600 ring-1 ring-inset ring-zinc-200/80">
          <ScanLine className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
          <p>
            Hold the QR code inside the frame and keep it steady. Tickets check in automatically; group passes ask how many people are
            entering.
          </p>
        </div>
      </main>

      {/* Processing */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/30 backdrop-blur-[2px]"
          >
            <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-xl">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-700" />
              <p className="text-sm font-medium text-zinc-900">Checking ticket…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {scanResult && !isProcessing && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn('fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/50 backdrop-blur-[2px] sm:items-center sm:p-4', !isGuestlistBulkMode && 'cursor-pointer')}
            onClick={!isGuestlistBulkMode ? closeOverlay : undefined}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 360 }}
              className="max-h-[95vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={cn(
                  'flex flex-col items-center px-6 pb-6 pt-8 text-center text-white',
                  tone === 'valid' && 'bg-emerald-500',
                  tone === 'warn' && 'bg-amber-500',
                  tone === 'invalid' && 'bg-red-500'
                )}
              >
                {tone === 'valid' ? (
                  <CheckCircle2 className="h-16 w-16" strokeWidth={1.75} />
                ) : tone === 'warn' ? (
                  <AlertTriangle className="h-16 w-16" strokeWidth={1.75} />
                ) : (
                  <XCircle className="h-16 w-16" strokeWidth={1.75} />
                )}
                <h3 className="mt-3 text-2xl font-bold tracking-tight">
                  {tone === 'valid' ? (isGuestlistBulkMode ? 'Group pass' : 'Valid ticket') : tone === 'warn' ? 'Already scanned' : 'Not valid'}
                </h3>
                <p className="mt-1 text-[15px] text-white/90">{scanResult.message}</p>
              </div>

              <div className="space-y-5 p-5">
                {(scanResult.customerName !== 'unknown' || scanResult.eventTitle) && (
                  <dl className="divide-y divide-zinc-100 rounded-2xl bg-zinc-50 px-4 ring-1 ring-inset ring-zinc-200/80">
                    {scanResult.customerName && scanResult.customerName !== 'unknown' && (
                      <div className="flex items-center gap-3 py-3">
                        <User className="h-4 w-4 shrink-0 text-zinc-400" />
                        <dd className="text-[15px] font-semibold text-zinc-900">{scanResult.customerName}</dd>
                      </div>
                    )}
                    {scanResult.eventTitle && (
                      <div className="flex items-center gap-3 py-3">
                        <MapPin className="h-4 w-4 shrink-0 text-zinc-400" />
                        <dd className="text-sm font-medium text-zinc-800">{scanResult.eventTitle}</dd>
                      </div>
                    )}
                    {eventDateLabel && (
                      <div className="flex items-center gap-3 py-3">
                        <CalendarDays className="h-4 w-4 shrink-0 text-zinc-400" />
                        <dd className="text-sm text-zinc-700">{eventDateLabel}</dd>
                      </div>
                    )}
                    {scanResult.ticketTierName && (
                      <div className="flex items-center gap-3 py-3">
                        <Ticket className="h-4 w-4 shrink-0 text-zinc-400" />
                        <dd className="text-sm text-zinc-700">{scanResult.ticketTierName}</dd>
                      </div>
                    )}
                  </dl>
                )}

                {isGuestlistBulkMode && scanResult.isValid && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-[13px] font-medium text-zinc-500">How many people are entering?</p>
                      <div className="mt-3 flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => setBulkScanCount(Math.max(1, bulkScanCount - 1))}
                          disabled={bulkScanCount <= 1 || isRecordingBulk}
                          className="grid h-14 w-14 place-items-center rounded-2xl bg-zinc-100 text-zinc-800 hover:bg-zinc-200 disabled:opacity-40"
                          aria-label="Fewer people"
                        >
                          <Minus className="h-6 w-6" />
                        </button>
                        <input
                          id="bulkScanCount"
                          type="number"
                          min="1"
                          max={remainingScans}
                          value={bulkScanCount}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 1;
                            setBulkScanCount(Math.max(1, Math.min(value, remainingScans)));
                          }}
                          disabled={isRecordingBulk}
                          className="h-14 w-24 rounded-2xl border border-zinc-200 text-center text-3xl font-bold tabular-nums text-zinc-900 outline-none [appearance:textfield] focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          onClick={() => setBulkScanCount(Math.min(remainingScans, bulkScanCount + 1))}
                          disabled={bulkScanCount >= remainingScans || isRecordingBulk}
                          className="grid h-14 w-14 place-items-center rounded-2xl bg-zinc-100 text-zinc-800 hover:bg-zinc-200 disabled:opacity-40"
                          aria-label="More people"
                        >
                          <Plus className="h-6 w-6" />
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-zinc-500">
                        {remainingScans} {remainingScans === 1 ? 'ticket' : 'tickets'} left on this pass
                      </p>
                    </div>

                    <button
                      onClick={handleBulkScan}
                      disabled={bulkScanCount <= 0 || bulkScanCount > remainingScans || isRecordingBulk}
                      className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-base font-semibold text-white transition-colors hover:bg-emerald-700 disabled:bg-zinc-300"
                    >
                      {isRecordingBulk ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Recording…
                        </>
                      ) : (
                        `Let in ${bulkScanCount} ${bulkScanCount === 1 ? 'person' : 'people'}`
                      )}
                    </button>
                    <button
                      onClick={closeOverlay}
                      disabled={isRecordingBulk}
                      className="h-11 w-full rounded-2xl text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {!isGuestlistBulkMode && <p className="text-center text-xs text-zinc-400">Tap anywhere to continue scanning</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TicketScanner;
