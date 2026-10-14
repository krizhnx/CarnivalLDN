import { useState, useEffect } from 'react';
import { Users, Wand2 } from 'lucide-react';
import { AffiliateSociety, AffiliateFormData } from '../types';
import toast from 'react-hot-toast';
import { AdminModal } from './admin/Modal';
import { Button, Field, Input, Select } from './admin/ui';

interface AffiliateSocietyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (society: AffiliateFormData) => Promise<void>;
  editingSociety?: AffiliateSociety | null;
}

const EMPTY: AffiliateFormData = {
  name: '',
  code: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  university: '',
  societyType: '',
  commissionRate: 5.0,
};

const AffiliateSocietyModal = ({ isOpen, onClose, onSave, editingSociety }: AffiliateSocietyModalProps) => {
  const [formData, setFormData] = useState<AffiliateFormData>(EMPTY);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editingSociety) {
      setFormData({
        name: editingSociety.name,
        code: editingSociety.code,
        contactName: editingSociety.contactName || '',
        contactEmail: editingSociety.contactEmail || '',
        contactPhone: editingSociety.contactPhone || '',
        university: editingSociety.university || '',
        societyType: editingSociety.societyType || '',
        commissionRate: editingSociety.commissionRate,
      });
    } else {
      setFormData(EMPTY);
    }
  }, [editingSociety, isOpen]);

  const set = <K extends keyof AffiliateFormData>(key: K, value: AffiliateFormData[K]) => setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Society name and code are required');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
      toast.success(editingSociety ? 'Society updated' : 'Society created');
      onClose();
    } catch (error) {
      console.error('Error saving society:', error);
      toast.error('Failed to save society');
    } finally {
      setIsLoading(false);
    }
  };

  const generateCode = () => {
    if (formData.name) {
      const code = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 20);
      set('code', code);
    }
  };

  return (
    <AdminModal
      open={isOpen}
      onClose={onClose}
      closeOnBackdrop={false}
      size="md"
      icon={Users}
      title={editingSociety ? 'Edit society' : 'Add society'}
      description={editingSociety ? editingSociety.name : 'Track sales from a university society'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="society-form" loading={isLoading}>
            {editingSociety ? 'Save changes' : 'Create society'}
          </Button>
        </>
      }
    >
      <form id="society-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Society name" htmlFor="soc-name" className="sm:col-span-2">
          <Input id="soc-name" value={formData.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Imperial College Bollywood Society" required autoFocus />
        </Field>

        <Field
          label="Tracking code"
          htmlFor="soc-code"
          className="sm:col-span-2"
          hint={
            <>
              Used in links: <span className="font-mono">carnivalldn.com/events?event=…&ref={formData.code || 'code'}</span>
            </>
          }
        >
          <div className="flex gap-2">
            <Input id="soc-code" value={formData.code} onChange={(e) => set('code', e.target.value)} placeholder="e.g. imperial-bollywood" className="font-mono" required />
            <Button icon={Wand2} onClick={generateCode} disabled={!formData.name} className="h-10">
              Generate
            </Button>
          </div>
        </Field>

        <Field label="Contact name" optional htmlFor="soc-contact">
          <Input id="soc-contact" value={formData.contactName} onChange={(e) => set('contactName', e.target.value)} placeholder="e.g. John Smith" />
        </Field>
        <Field label="Contact email" optional htmlFor="soc-email">
          <Input id="soc-email" type="email" value={formData.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} placeholder="john@imperial.ac.uk" />
        </Field>
        <Field label="Contact phone" optional htmlFor="soc-phone">
          <Input id="soc-phone" type="tel" value={formData.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} placeholder="+44 …" />
        </Field>
        <Field label="Commission" htmlFor="soc-rate" hint="% of ticket sales through their links">
          <div className="relative">
            <Input
              id="soc-rate"
              type="number"
              min="0"
              max="50"
              step="0.1"
              value={formData.commissionRate}
              onChange={(e) => set('commissionRate', parseFloat(e.target.value) || 0)}
              className="pr-8"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">%</span>
          </div>
        </Field>

        <Field label="University" optional htmlFor="soc-uni">
          <Select id="soc-uni" value={formData.university} onChange={(e) => set('university', e.target.value)}>
            <option value="">Select university</option>
            <option value="Imperial College London">Imperial College London</option>
            <option value="University College London">University College London</option>
            <option value="King's College London">King's College London</option>
            <option value="London School of Economics">London School of Economics</option>
            <option value="Queen Mary University">Queen Mary University</option>
            <option value="City University London">City University London</option>
            <option value="Brunel University">Brunel University</option>
            <option value="Other">Other</option>
          </Select>
        </Field>
        <Field label="Society type" optional htmlFor="soc-type">
          <Select id="soc-type" value={formData.societyType} onChange={(e) => set('societyType', e.target.value)}>
            <option value="">Select type</option>
            <option value="bollywood">Bollywood/Cultural</option>
            <option value="cultural">Cultural Society</option>
            <option value="music">Music Society</option>
            <option value="dance">Dance Society</option>
            <option value="social">Social Society</option>
            <option value="general">General</option>
            <option value="other">Other</option>
          </Select>
        </Field>
      </form>
    </AdminModal>
  );
};

export default AffiliateSocietyModal;
