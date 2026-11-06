import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

// Loaded only on /scanner so the camera + QR reader code isn't downloaded by site visitors.
const TicketScanner = lazy(() => import('../TicketScanner/TicketScanner'));

const ScannerPage: React.FC = () => (
  <Suspense
    fallback={
      <div className="grid min-h-screen place-items-center bg-[#f6f6f7]">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    }
  >
    <TicketScanner />
  </Suspense>
);

export default ScannerPage;
