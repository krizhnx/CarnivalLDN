import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';
import { TicketTier } from '../types';

interface TicketTierFormProps {
  ticketTiers: TicketTier[];
  eventId: string; // Add eventId prop
  onSave: (tiers: TicketTier[]) => void;
  onClose: () => void;
}

const TicketTierForm = ({ ticketTiers, eventId, onSave, onClose }: TicketTierFormProps) => {
  const [tiers, setTiers] = useState<TicketTier[]>(ticketTiers || []);
  const [newTier, setNewTier] = useState<Partial<TicketTier>>({
    name: '',
    price: undefined,
    originalPrice: undefined,
    capacity: undefined,
    soldCount: 0,
    availableFrom: new Date(),
    availableUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    description: '',
    benefits: [],
    isActive: true,
  });

  const addTier = () => {
    console.log('addTier called with newTier:', newTier);
    console.log('Validation check:', {
      hasName: !!newTier.name,
      hasPrice: !!newTier.price,
      hasCapacity: !!newTier.capacity,
      name: newTier.name,
      price: newTier.price,
      capacity: newTier.capacity
    });
    
    if (
      (newTier.name || '').toString().trim().length > 0 &&
      newTier.price !== undefined && newTier.price >= 0 &&
      newTier.capacity !== undefined && newTier.capacity > 0
    ) {
      const tier: TicketTier = {
        id: `tier_${Date.now()}`,
        eventId: eventId, // Link to the event
        name: newTier.name || '',
        price: (newTier.price || 0) * 100, // Convert to pence
        originalPrice: newTier.originalPrice !== undefined ? (newTier.originalPrice || 0) * 100 : undefined,
        capacity: newTier.capacity || 0,
        soldCount: 0,
        availableFrom: newTier.availableFrom!,
        availableUntil: newTier.availableUntil!,
        description: newTier.description || '',
        benefits: (newTier.benefits || []).filter(b => b.trim()),
        isActive: newTier.isActive !== false,
      };
      
      console.log('Created tier:', tier);
      setTiers([...tiers, tier]);
      console.log('Updated tiers array:', [...tiers, tier]);
      
      setNewTier({
        name: '',
        price: undefined,
        originalPrice: undefined,
        capacity: undefined,
        soldCount: 0,
        availableFrom: new Date(),
        availableUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        description: '',
        benefits: [],
        isActive: true,
      });
    } else {
      console.log('Validation failed - missing required fields');
    }
  };

  const removeTier = (id: string) => {
    setTiers(tiers.filter(tier => tier.id !== id));
  };

  const updateTier = (id: string, updates: Partial<TicketTier>) => {
    setTiers(tiers.map(tier => 
      tier.id === id ? { ...tier, ...updates } : tier
    ));
  };

  const addBenefit = (tierId: string) => {
    const tier = tiers.find(t => t.id === tierId);
    if (tier) {
      updateTier(tierId, {
        benefits: [...(tier.benefits || []), '']
      });
    }
  };

  const updateBenefit = (tierId: string, index: number, value: string) => {
    const tier = tiers.find(t => t.id === tierId);
    if (tier) {
      const newBenefits = [...(tier.benefits || [])];
      newBenefits[index] = value;
      updateTier(tierId, { benefits: newBenefits });
    }
  };

  const removeBenefit = (tierId: string, index: number) => {
    const tier = tiers.find(t => t.id === tierId);
    if (tier) {
      const newBenefits = (tier.benefits || []).filter((_, i) => i !== index);
      updateTier(tierId, { benefits: newBenefits });
    }
  };

  const handleSave = () => {
    console.log('handleSave called with tiers:', tiers);
    console.log('Tiers length:', tiers.length);
    console.log('Tiers details:', tiers.map(t => ({ id: t.id, name: t.name, price: t.price, capacity: t.capacity })));
    onSave(tiers);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4" onClick={(e) => e.stopPropagation()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Manage Ticket Tiers</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Add New Tier Form */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Add New Tier</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>How it works:</strong> Create different ticket types with different prices. 
                For example: "Early Bird" at £25, "VIP" at £50, or "Student" at £15. 
                Set how many tickets are available for each tier.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tier Name</label>
                <input
                  type="text"
                  placeholder="e.g., Early Bird, VIP, Student"
                  value={newTier.name}
                  onChange={(e) => setNewTier({ ...newTier, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  placeholder="e.g., 25 for £25"
                  value={newTier.price ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNewTier({ ...newTier, price: v === '' ? undefined : parseFloat(v) || 0 });
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input
                  type="number"
                  placeholder="e.g., 100 tickets"
                  value={newTier.capacity ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNewTier({ ...newTier, capacity: v === '' ? undefined : parseInt(v) || 0 });
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g., 35 for £35 (shows discount)"
                  value={newTier.originalPrice ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNewTier({ ...newTier, originalPrice: v === '' ? undefined : parseFloat(v) || 0 });
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available From</label>
                <input
                  type="date"
                  value={newTier.availableFrom?.toISOString().split('T')[0]}
                  onChange={(e) => setNewTier({ ...newTier, availableFrom: new Date(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available Until</label>
                <input
                  type="date"
                  value={newTier.availableUntil?.toISOString().split('T')[0]}
                  onChange={(e) => setNewTier({ ...newTier, availableUntil: new Date(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <textarea
              placeholder="Description (optional)"
              value={newTier.description}
              onChange={(e) => setNewTier({ ...newTier, description: e.target.value })}
              className="w-full mt-4 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
            <div className="mt-4 flex items-center justify-end gap-4">
              <label htmlFor="new-tier-active" className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  id="new-tier-active"
                  type="checkbox"
                  checked={newTier.isActive !== false}
                  onChange={(e) => setNewTier({ ...newTier, isActive: e.target.checked })}
                />
                Active (allow sales)
              </label>
              <button
                onClick={addTier}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Tier
              </button>
            </div>
          </div>

          {/* Existing Tiers */}
          <div className="space-y-4">
            {tiers.map((tier) => (
              <div key={tier.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        value={tier.name}
                        onChange={(e) => updateTier(tier.id, { name: e.target.value })}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        value={tier.price / 100}
                        onChange={(e) => updateTier(tier.id, { price: (parseFloat(e.target.value) || 0) * 100 })}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        value={tier.capacity}
                        onChange={(e) => updateTier(tier.id, { capacity: parseInt(e.target.value) || 0 })}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Benefits</label>
                      <div className="space-y-2">
                                                 {(tier.benefits || []).map((benefit, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={benefit}
                              onChange={(e) => updateBenefit(tier.id, index, e.target.value)}
                              placeholder="Benefit description"
                              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                              onClick={() => removeBenefit(tier.id, index)}
                              className="px-2 py-2 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addBenefit(tier.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          Add Benefit
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeTier(tier.id)}
                    className="ml-4 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span>Available: {tier.capacity - tier.soldCount} / {tier.capacity}</span>
                  <span>Price: £{(tier.price / 100).toFixed(2)}</span>
                  {tier.originalPrice && tier.originalPrice > tier.price && (
                    <span className="line-through text-gray-400">£{(tier.originalPrice / 100).toFixed(2)}</span>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    {tier.capacity - tier.soldCount <= 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">Sold out by capacity</span>
                    )}
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={tier.isActive === false}
                        disabled={tier.capacity - tier.soldCount <= 0}
                        onChange={(e) => updateTier(tier.id, { isActive: e.target.checked ? false : true })}
                      />
                      <span>Mark as sold out (disable sales)</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TicketTierForm;
