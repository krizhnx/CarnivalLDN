import React, { useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, Link2 } from 'lucide-react';
import { AffiliateSociety } from '../types';
import { useAppStore } from '../store/supabaseStore';
import { formatEventDateShort } from '../lib/checkout';
import { AdminModal } from './admin/Modal';
import { Badge, Button, EmptyState } from './admin/ui';

interface SocietyLinksModalProps {
  society: AffiliateSociety | null;
  isOpen: boolean;
  onClose: () => void;
}

const SocietyLinksModal: React.FC<SocietyLinksModalProps> = ({ society, isOpen, onClose }) => {
  const { affiliateLinks, events } = useAppStore();
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  const societyLinks = useMemo(() => (society ? affiliateLinks.filter((link) => link.societyId === society.id) : []), [society, affiliateLinks]);

  const copyToClipboard = async (text: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLinkId(linkId);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <AdminModal
      open={isOpen && !!society}
      onClose={onClose}
      size="lg"
      icon={Link2}
      title="Tracking links"
      description={society ? `${society.name} · ${society.code}` : undefined}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      {society &&
        (societyLinks.length === 0 ? (
          <EmptyState icon={Link2} title="No links yet" description="Use “Generate links” on the Affiliates page to create tracking links for events." />
        ) : (
          <div className="divide-y divide-zinc-100 overflow-hidden rounded-xl ring-1 ring-zinc-200">
            {societyLinks.map((link) => {
              const event = events.find((e) => e.id === link.eventId);
              const fullUrl = `https://carnivalldn.com/events?event=${link.eventId}&ref=${society.code}`;
              const copied = copiedLinkId === link.id;
              return (
                <div key={link.id} className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900">{event?.title || 'Unknown event'}</p>
                    <Badge tone={link.isActive ? 'green' : 'red'} dot>
                      {link.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {event ? formatEventDateShort(event.date) : 'Unknown date'} · created{' '}
                    {new Date(link.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-zinc-50 py-1.5 pl-3 pr-1.5 ring-1 ring-inset ring-zinc-200">
                    <code className="min-w-0 flex-1 truncate text-xs text-zinc-700">{fullUrl}</code>
                    <Button size="sm" variant={copied ? 'secondary' : 'primary'} icon={copied ? Check : Copy} onClick={() => void copyToClipboard(fullUrl, link.id)} className="h-7">
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                    <a
                      href={fullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="grid h-7 w-7 place-items-center rounded-md text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-900"
                      title="Open link"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
    </AdminModal>
  );
};

export default SocietyLinksModal;
