import React from 'react';
import { Users } from 'lucide-react';
import { AffiliateSociety } from '../types';
import { AdminModal } from './admin/Modal';
import { Avatar, Badge, Button, KeyValue } from './admin/ui';

interface SocietyDetailsModalProps {
  society: AffiliateSociety | null;
  isOpen: boolean;
  onClose: () => void;
}

const fmt = (d: Date | string) =>
  new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const SocietyDetailsModal: React.FC<SocietyDetailsModalProps> = ({ society, isOpen, onClose }) => (
  <AdminModal
    open={isOpen && !!society}
    onClose={onClose}
    size="md"
    icon={Users}
    title="Society details"
    footer={
      <Button variant="secondary" onClick={onClose}>
        Close
      </Button>
    }
  >
    {society && (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar name={society.name} size="lg" />
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold tracking-tight text-zinc-900">{society.name}</h3>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono text-[13px] text-zinc-500">{society.code}</span>
              <Badge tone={society.isActive ? 'green' : 'red'} dot>
                {society.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Contact</h4>
            <dl className="divide-y divide-zinc-100">
              <KeyValue label="Name">{society.contactName || '—'}</KeyValue>
              <KeyValue label="Email">{society.contactEmail || '—'}</KeyValue>
              <KeyValue label="Phone">{society.contactPhone || '—'}</KeyValue>
            </dl>
          </section>
          <section className="mt-6 sm:mt-0">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Society</h4>
            <dl className="divide-y divide-zinc-100">
              <KeyValue label="University">{society.university || '—'}</KeyValue>
              <KeyValue label="Type">{society.societyType || '—'}</KeyValue>
              <KeyValue label="Commission">{society.commissionRate}%</KeyValue>
            </dl>
          </section>
        </div>

        <dl className="grid grid-cols-2 gap-4 rounded-xl bg-zinc-50 p-4 text-sm ring-1 ring-inset ring-zinc-200">
          <div>
            <dt className="text-xs text-zinc-500">Created</dt>
            <dd className="mt-0.5 font-medium text-zinc-900">{fmt(society.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Last updated</dt>
            <dd className="mt-0.5 font-medium text-zinc-900">{fmt(society.updatedAt)}</dd>
          </div>
        </dl>
      </div>
    )}
  </AdminModal>
);

export default SocietyDetailsModal;
