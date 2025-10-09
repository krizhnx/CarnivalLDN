import { useState, useEffect } from 'react';
import { X, Users, Mail, Phone, GraduationCap, Tag, Percent } from 'lucide-react';
import { AffiliateSociety, AffiliateFormData } from '../types';
import toast from 'react-hot-toast';

interface AffiliateSocietyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (society: AffiliateFormData) => Promise<void>;
  editingSociety?: AffiliateSociety | null;
}

const AffiliateSocietyModal = ({ isOpen, onClose, onSave, editingSociety }: AffiliateSocietyModalProps) => {
  const [formData, setFormData] = useState<AffiliateFormData>({
    name: '',
    code: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    university: '',
    societyType: '',
    commissionRate: 5.0
  });
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
        commissionRate: editingSociety.commissionRate
      });
    } else {
      setFormData({
        name: '',
        code: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        university: '',
        societyType: '',
        commissionRate: 5.0
      });
    }
  }, [editingSociety, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Society name and code are required');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
      toast.success(editingSociety ? 'Society updated successfully!' : 'Society created successfully!');
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
      setFormData(prev => ({ ...prev, code }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingSociety ? 'Edit Society' : 'Add New Society'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Society Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="inline h-4 w-4 mr-2" />
              Society Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Imperial College Bollywood Society"
              required
            />
          </div>

          {/* Society Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="inline h-4 w-4 mr-2" />
              Society Code *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., imperial-bollywood"
                required
              />
              <button
                type="button"
                onClick={generateCode}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Generate
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Used in tracking URLs: carnivalldn.com/events/bollywood-night?ref={formData.code}</p>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="inline h-4 w-4 mr-2" />
                Contact Name
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., John Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline h-4 w-4 mr-2" />
                Contact Email
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., john@imperial.ac.uk"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="inline h-4 w-4 mr-2" />
              Contact Phone
            </label>
            <input
              type="tel"
              value={formData.contactPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., +44 20 7589 5111"
            />
          </div>

          {/* University and Society Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <GraduationCap className="inline h-4 w-4 mr-2" />
                University
              </label>
              <select
                value={formData.university}
                onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select University</option>
                <option value="Imperial College London">Imperial College London</option>
                <option value="University College London">University College London</option>
                <option value="King's College London">King's College London</option>
                <option value="London School of Economics">London School of Economics</option>
                <option value="Queen Mary University">Queen Mary University</option>
                <option value="City University London">City University London</option>
                <option value="Brunel University">Brunel University</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="inline h-4 w-4 mr-2" />
                Society Type
              </label>
              <select
                value={formData.societyType}
                onChange={(e) => setFormData(prev => ({ ...prev, societyType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select Type</option>
                <option value="bollywood">Bollywood/Cultural</option>
                <option value="cultural">Cultural Society</option>
                <option value="music">Music Society</option>
                <option value="dance">Dance Society</option>
                <option value="social">Social Society</option>
                <option value="general">General</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Commission Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Percent className="inline h-4 w-4 mr-2" />
              Commission Rate (%)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="50"
                step="0.1"
                value={formData.commissionRate}
                onChange={(e) => setFormData(prev => ({ ...prev, commissionRate: parseFloat(e.target.value) || 0 }))}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="5.0"
              />
              <span className="text-sm text-gray-500">% of ticket sales</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Commission paid to society for each ticket sold through their links</p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : (editingSociety ? 'Update Society' : 'Create Society')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AffiliateSocietyModal;
