import { useState, useEffect } from 'react';
import { X, Copy, ExternalLink, Users, Calendar } from 'lucide-react';
import { AffiliateSociety, AffiliateLink, Event } from '../types';
import toast from 'react-hot-toast';

interface AffiliateLinkGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateLinks: (societyIds: string[], eventId: string) => Promise<void>;
  societies: AffiliateSociety[];
  events: Event[];
}

const AffiliateLinkGenerator = ({ 
  isOpen, 
  onClose, 
  onGenerateLinks, 
  societies, 
  events 
}: AffiliateLinkGeneratorProps) => {
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedSocieties, setSelectedSocieties] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLinks, setGeneratedLinks] = useState<AffiliateLink[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedEvent('');
      setSelectedSocieties([]);
      setGeneratedLinks([]);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEvent || selectedSocieties.length === 0) {
      toast.error('Please select an event and at least one society');
      return;
    }

    setIsLoading(true);
    try {
      await onGenerateLinks(selectedSocieties, selectedEvent);
      toast.success(`Generated ${selectedSocieties.length} tracking link(s) successfully!`);
      
      // Simulate generated links for demo
      const event = events.find(e => e.id === selectedEvent);
      const links = selectedSocieties.map(societyId => {
        const society = societies.find(s => s.id === societyId);
        return {
          id: `link-${societyId}-${selectedEvent}`,
          societyId,
          eventId: selectedEvent,
          linkCode: `${society?.code}-${event?.id}`,
          customUrl: undefined,
          isActive: true,
          createdAt: new Date()
        };
      });
      setGeneratedLinks(links);
    } catch (error) {
      console.error('Error generating links:', error);
      toast.error('Failed to generate tracking links');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copied to clipboard!');
  };

  const toggleSociety = (societyId: string) => {
    setSelectedSocieties(prev => 
      prev.includes(societyId) 
        ? prev.filter(id => id !== societyId)
        : [...prev, societyId]
    );
  };

  const selectAllSocieties = () => {
    setSelectedSocieties(societies.map(s => s.id));
  };

  const clearSelection = () => {
    setSelectedSocieties([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Generate Tracking Links</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {generatedLinks.length === 0 ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-2" />
                  Select Event *
                </label>
                <select
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose an event...</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.title} - {event.date}
                    </option>
                  ))}
                </select>
              </div>

              {/* Society Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <Users className="inline h-4 w-4 mr-2" />
                    Select Societies *
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllSocieties}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {societies.map(society => (
                    <label key={society.id} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSocieties.includes(society.id)}
                        onChange={() => toggleSociety(society.id)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{society.name}</div>
                        <div className="text-xs text-gray-500">{society.university} • {society.code}</div>
                      </div>
                    </label>
                  ))}
                </div>
                
                {selectedSocieties.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    {selectedSocieties.length} society(ies) selected
                  </p>
                )}
              </div>

              {/* Preview */}
              {selectedEvent && selectedSocieties.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Preview Links:</h3>
                  <div className="space-y-2">
                    {selectedSocieties.map(societyId => {
                      const society = societies.find(s => s.id === societyId);
                      const event = events.find(e => e.id === selectedEvent);
                      const previewUrl = `carnivalldn.com/events?event=${event?.id}&ref=${society?.code}`;
                      
                      return (
                        <div key={societyId} className="text-xs text-gray-600 bg-white p-2 rounded border">
                          <div className="font-medium">{society?.name}</div>
                          <div className="text-gray-500">{previewUrl}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
                  disabled={isLoading || !selectedEvent || selectedSocieties.length === 0}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Generating...' : `Generate ${selectedSocieties.length} Link(s)`}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Success Message */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Links Generated Successfully!</h3>
                    <p className="text-sm text-green-700 mt-1">
                      {generatedLinks.length} tracking link(s) have been created and are ready to use.
                    </p>
                  </div>
                </div>
              </div>

              {/* Generated Links */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Generated Tracking Links</h3>
                <div className="space-y-3">
                  {generatedLinks.map(link => {
                    const society = societies.find(s => s.id === link.societyId);
                    const event = events.find(e => e.id === link.eventId);
                    const fullUrl = `https://carnivalldn.com/events?event=${event?.id}&ref=${society?.code}`;
                    
                    return (
                      <div key={link.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                                <span className="text-white font-semibold text-xs">
                                  {society?.name.substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{society?.name}</div>
                                <div className="text-xs text-gray-500">{event?.title}</div>
                              </div>
                            </div>
                            <div className="mt-2 text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                              {fullUrl}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => copyToClipboard(fullUrl)}
                              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Copy link"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <a
                              href={fullUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Open link"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setGeneratedLinks([]);
                    setSelectedEvent('');
                    setSelectedSocieties([]);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Generate More
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AffiliateLinkGenerator;
