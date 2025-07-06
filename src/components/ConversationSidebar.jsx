import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import conversationService from '../services/ConversationService';
import { useAuth } from '../context/AuthContext';

const {
  FiPlus,
  FiFolder,
  FiFolderPlus,
  FiMessageCircle,
  FiShare2,
  FiEdit3,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiChevronRight,
  FiStar,
  FiClock,
  FiUsers
} = FiIcons;

export default function ConversationSidebar({ 
  currentOrganization, 
  currentConversation, 
  onConversationSelect,
  onNewConversation 
}) {
  const [folders, setFolders] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (currentOrganization) {
      loadFolders();
      loadConversations();
    }
  }, [currentOrganization]);

  const loadFolders = async () => {
    try {
      const data = await conversationService.getFolders(currentOrganization.id);
      setFolders(data);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const loadConversations = async (folderId = null) => {
    try {
      const data = await conversationService.getConversations(currentOrganization.id, folderId);
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      await conversationService.createFolder({
        name: newFolderName,
        organization_id: currentOrganization.id,
        color: '#3B82F6'
      });
      
      setNewFolderName('');
      setIsCreatingFolder(false);
      loadFolders();
      
      await conversationService.logActivity(
        currentOrganization.id,
        'folder_created',
        'folder',
        null,
        { folder_name: newFolderName }
      );
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
      setSelectedFolder(null);
      loadConversations();
    } else {
      newExpanded.add(folderId);
      setSelectedFolder(folderId);
      loadConversations(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleNewConversation = async () => {
    try {
      const conversation = await conversationService.createConversation({
        title: 'New Conversation',
        organization_id: currentOrganization.id,
        folder_id: selectedFolder
      });
      
      onNewConversation(conversation);
      loadConversations(selectedFolder);
      
      await conversationService.logActivity(
        currentOrganization.id,
        'conversation_created',
        'conversation',
        conversation.id
      );
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="w-80 bg-dark-800 border-r border-dark-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Conversations</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsCreatingFolder(true)}
              className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
              title="New Folder"
            >
              <SafeIcon icon={FiFolderPlus} className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={handleNewConversation}
              className="p-2 rounded-lg bg-primary-600 hover:bg-primary-700 transition-colors"
              title="New Conversation"
            >
              <SafeIcon icon={FiPlus} className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
          />
        </div>
      </div>

      {/* Folders and Conversations */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Root conversations */}
        {!selectedFolder && (
          <div className="space-y-1">
            {filteredConversations.map((conversation) => (
              <motion.button
                key={conversation.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => onConversationSelect(conversation)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left ${
                  currentConversation?.id === conversation.id
                    ? 'bg-primary-600 text-white'
                    : 'hover:bg-dark-700 text-gray-300'
                }`}
              >
                <SafeIcon icon={FiMessageCircle} className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{conversation.title}</div>
                  <div className="text-xs text-gray-400 flex items-center space-x-2">
                    <span>{formatDate(conversation.updated_at)}</span>
                    {conversation.is_shared && (
                      <SafeIcon icon={FiShare2} className="w-3 h-3" />
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* Folders */}
        {folders.map((folder) => (
          <div key={folder.id} className="space-y-1">
            <button
              onClick={() => toggleFolder(folder.id)}
              className="w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-dark-700 transition-colors text-left"
            >
              <SafeIcon 
                icon={expandedFolders.has(folder.id) ? FiChevronDown : FiChevronRight}
                className="w-4 h-4 text-gray-400"
              />
              <SafeIcon icon={FiFolder} className="w-4 h-4" style={{ color: folder.color }} />
              <span className="text-gray-300 font-medium">{folder.name}</span>
            </button>

            <AnimatePresence>
              {expandedFolders.has(folder.id) && selectedFolder === folder.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="ml-6 space-y-1"
                >
                  {filteredConversations.map((conversation) => (
                    <motion.button
                      key={conversation.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => onConversationSelect(conversation)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left ${
                        currentConversation?.id === conversation.id
                          ? 'bg-primary-600 text-white'
                          : 'hover:bg-dark-700 text-gray-300'
                      }`}
                    >
                      <SafeIcon icon={FiMessageCircle} className="w-4 h-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{conversation.title}</div>
                        <div className="text-xs text-gray-400 flex items-center space-x-2">
                          <span>{formatDate(conversation.updated_at)}</span>
                          {conversation.is_shared && (
                            <SafeIcon icon={FiShare2} className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Create Folder Modal */}
      <AnimatePresence>
        {isCreatingFolder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-800 rounded-lg p-6 w-full max-w-md border border-dark-700"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Create New Folder</h3>
              <input
                type="text"
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                className="w-full p-3 bg-dark-700 border border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white mb-4"
                autoFocus
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsCreatingFolder(false);
                    setNewFolderName('');
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors text-white"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}