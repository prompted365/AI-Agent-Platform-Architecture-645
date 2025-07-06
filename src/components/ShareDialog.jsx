import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import conversationService from '../services/ConversationService';

const {
  FiShare2,
  FiLink,
  FiCopy,
  FiCheck,
  FiEye,
  FiEdit3,
  FiMessageCircle,
  FiCalendar,
  FiX,
  FiUsers,
  FiGlobe
} = FiIcons;

export default function ShareDialog({ conversation, isOpen, onClose }) {
  const [shareData, setShareData] = useState(null);
  const [permissions, setPermissions] = useState({
    can_view: true,
    can_comment: false,
    can_edit: false
  });
  const [expiresAt, setExpiresAt] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && conversation) {
      loadOrCreateShare();
    }
  }, [isOpen, conversation]);

  const loadOrCreateShare = async () => {
    if (!conversation) return;
    
    setIsCreating(true);
    try {
      const data = await conversationService.shareConversation(
        conversation.id,
        { ...permissions, expires_at: expiresAt || null }
      );
      setShareData(data);
    } catch (error) {
      console.error('Error creating share:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!shareData) return;
    
    const shareUrl = `${window.location.origin}/shared/${shareData.share_token}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handlePermissionChange = (permission, value) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: value
    }));
  };

  const handleUpdateShare = async () => {
    if (!shareData) return;
    
    try {
      // Update share permissions
      // This would require an update endpoint in the service
      console.log('Updating share permissions:', permissions);
    } catch (error) {
      console.error('Error updating share:', error);
    }
  };

  if (!isOpen) return null;

  const shareUrl = shareData ? `${window.location.origin}/shared/${shareData.share_token}` : '';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-dark-800 rounded-lg p-6 w-full max-w-md border border-dark-700"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <SafeIcon icon={FiShare2} className="w-5 h-5 text-primary-500" />
              <h3 className="text-lg font-semibold text-white">Share Conversation</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-dark-700 transition-colors"
            >
              <SafeIcon icon={FiX} className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {isCreating ? (
            <div className="text-center py-8">
              <div className="spinner mx-auto mb-4" />
              <p className="text-gray-400">Creating share link...</p>
            </div>
          ) : shareData ? (
            <div className="space-y-6">
              {/* Share Link */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Share Link
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 p-3 bg-dark-700 border border-dark-600 rounded-lg text-gray-300 text-sm font-mono truncate">
                    {shareUrl}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="p-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                  >
                    <SafeIcon icon={copied ? FiCheck : FiCopy} className="w-4 h-4" />
                  </button>
                </div>
                {copied && (
                  <p className="text-green-400 text-xs mt-1">Link copied to clipboard!</p>
                )}
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Permissions
                </label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <SafeIcon icon={FiEye} className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">Can view</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={permissions.can_view}
                      onChange={(e) => handlePermissionChange('can_view', e.target.checked)}
                      className="rounded"
                      disabled
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <SafeIcon icon={FiMessageCircle} className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">Can comment</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={permissions.can_comment}
                      onChange={(e) => handlePermissionChange('can_comment', e.target.checked)}
                      className="rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <SafeIcon icon={FiEdit3} className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">Can edit</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={permissions.can_edit}
                      onChange={(e) => handlePermissionChange('can_edit', e.target.checked)}
                      className="rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Expiration */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Link Expiration (Optional)
                </label>
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiCalendar} className="w-4 h-4 text-gray-400" />
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="flex-1 p-2 bg-dark-700 border border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-300 text-sm"
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="bg-dark-700 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Share Statistics</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400">Access Count</span>
                    <div className="font-medium text-white">{shareData.access_count || 0}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Created</span>
                    <div className="font-medium text-white">
                      {new Date(shareData.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleUpdateShare}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors text-white"
                >
                  Update Permissions
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">Failed to create share link. Please try again.</p>
              <button
                onClick={loadOrCreateShare}
                className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors text-white"
              >
                Retry
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}