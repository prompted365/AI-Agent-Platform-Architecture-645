import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ConversationSidebar from './ConversationSidebar';
import ConversationView from './ConversationView';
import conversationService from '../services/ConversationService';
import { useAuth } from '../context/AuthContext';

export default function ConversationHub() {
  const [organizations, setOrganizations] = useState([]);
  const [currentOrganization, setCurrentOrganization] = useState(null);
  const [currentConversation, setCurrentConversation] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadOrganizations();
    }
  }, [user]);

  const loadOrganizations = async () => {
    try {
      const data = await conversationService.getOrganizations();
      setOrganizations(data);
      if (data.length > 0) {
        setCurrentOrganization(data[0]);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  };

  const handleConversationSelect = (conversation) => {
    setCurrentConversation(conversation);
  };

  const handleNewConversation = (conversation) => {
    setCurrentConversation(conversation);
  };

  const handleConversationUpdate = () => {
    // Refresh conversation data if needed
    if (currentConversation) {
      // Reload conversation data
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex bg-dark-900"
    >
      {currentOrganization && (
        <>
          <ConversationSidebar
            currentOrganization={currentOrganization}
            currentConversation={currentConversation}
            onConversationSelect={handleConversationSelect}
            onNewConversation={handleNewConversation}
          />
          <ConversationView
            conversation={currentConversation}
            currentOrganization={currentOrganization}
            onConversationUpdate={handleConversationUpdate}
          />
        </>
      )}
    </motion.div>
  );
}