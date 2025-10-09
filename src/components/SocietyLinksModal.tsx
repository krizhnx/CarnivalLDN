import React, { useState, useEffect } from 'react';
import { X, Copy, ExternalLink, Calendar, Eye, Users } from 'lucide-react';
import { AffiliateSociety, AffiliateLink } from '../types';
import { useAppStore } from '../store/supabaseStore';

interface SocietyLinksModalProps {
  society: AffiliateSociety | null;
  isOpen: boolean;
  onClose: () => void;
}

const SocietyLinksModal: React.FC<SocietyLinksModalProps> = ({
  society,
  isOpen,
  onClose
}) => {
  const { affiliateLinks, events } = useAppStore();
  const [societyLinks, setSocietyLinks] = useState<AffiliateLink[]>([]);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 SocietyLinksModal useEffect:', {
      society: society?.name,
      societyId: society?.id,
      affiliateLinksLength: affiliateLinks.length,
      affiliateLinks: affiliateLinks.map(link => ({ id: link.id, societyId: link.societyId }))
    });
    
    if (society) {
      const links = affiliateLinks.filter(link => link.societyId === society.id);
      console.log('🔍 Filtered links for society:', links);
      setSocietyLinks(links);
    }
  }, [society, affiliateLinks]);

  const copyToClipboard = async (text: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLinkId(linkId);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getEventTitle = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    return event ? event.title : 'Unknown Event';
  };

  const getEventDate = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    return event ? event.date : 'Unknown Date';
  };

  if (!isOpen || !society) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Affiliate Links</h2>
            <p className="text-gray-600 mt-1">{society.name} - {society.code}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {societyLinks.length === 0 ? (
            <div className="text-center py-12">
              <ExternalLink className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Links Generated</h3>
              <p className="text-gray-500 mb-4">This society doesn't have any affiliate links yet.</p>
              <p className="text-sm text-gray-400">Use the "Generate Links" button to create tracking links for events.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {societyLinks.map((link) => {
                const eventTitle = getEventTitle(link.eventId);
                const eventDate = getEventDate(link.eventId);
                const fullUrl = `https://carnivalldn.com/events?event=${link.eventId}&ref=${society.code}`;
                
                return (
                  <div key={link.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{eventTitle}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            link.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {link.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{eventDate}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Eye className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">Link ID: {link.id.substring(0, 8)}...</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">Society: {society.code}</span>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <p className="text-xs text-gray-500 mb-1">Affiliate Link:</p>
                          <div className="flex items-center space-x-2">
                            <code className="text-sm text-gray-800 flex-1 break-all">{fullUrl}</code>
                            <button
                              onClick={() => copyToClipboard(fullUrl, link.id)}
                              className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                              <span>{copiedLinkId === link.id ? 'Copied!' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>

                        <div className="text-xs text-gray-500">
                          <p>Created: {new Date(link.createdAt).toLocaleDateString('en-GB', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SocietyLinksModal;
