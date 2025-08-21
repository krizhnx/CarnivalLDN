import React from 'react';
import TicketScanner from '../TicketScanner/TicketScanner';

const ScannerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <TicketScanner />
    </div>
  );
};

export default ScannerPage;
