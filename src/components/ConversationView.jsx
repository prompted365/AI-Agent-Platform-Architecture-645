import React, {useState, useEffect, useRef} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import MessageBubble from './MessageBubble';
import ArtifactViewer from './ArtifactViewer';
import ShareDialog from './ShareDialog';
import conversationService from '../services/ConversationService';
import {useAuth} from '../context/AuthContext';

const {
  FiSend,
  FiPaperclip,
  FiShare2,
  FiEdit3,
  FiStar,
  FiFolder,
  FiCode,
  FiFile,
  FiPlus,
  FiMaximize2,
  FiX,
  FiZap
} = FiIcons;

export default function ConversationView({conversation, onConversationUpdate, currentOrganization}) {
  const [messages, setMessages] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [isArtifactFullscreen, setIsArtifactFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const {user} = useAuth();

  useEffect(() => {
    if (conversation) {
      loadMessages();
      loadArtifacts();
      setEditedTitle(conversation.title);
    }
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
  };

  const loadMessages = async () => {
    if (!conversation) return;
    try {
      const data = await conversationService.getMessages(conversation.id);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadArtifacts = async () => {
    if (!conversation) return;
    try {
      const data = await conversationService.getArtifacts(conversation.id);
      setArtifacts(data);
    } catch (error) {
      console.error('Error loading artifacts:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;
    setIsLoading(true);
    const userMessageContent = newMessage;
    setNewMessage(''); // Clear input immediately for better UX

    try {
      // Add user message to database
      const userMessage = await conversationService.addMessage(
        conversation.id,
        userMessageContent,
        'user'
      );
      // Add to local state
      setMessages(prev => [...prev, userMessage]);

      // Call backend API for AI response
      const response = await fetch(`/api/llm/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessageContent,
          model: 'anthropic/claude-sonnet-4-0'
        }),
      });

      const aiData = await response.json();
      if (aiData.success) {
        // Add AI response to database
        const aiMessage = await conversationService.addMessage(
          conversation.id,
          aiData.response,
          'assistant'
        );
        // Add to local state
        setMessages(prev => [...prev, aiMessage]);

        // Check if we should create an artifact based on message content
        if (shouldCreateArtifact(userMessageContent, aiData.response)) {
          await createArtifactFromResponse(userMessageContent, aiData.response);
        }
      } else {
        // Handle API error
        const errorMessage = await conversationService.addMessage(
          conversation.id,
          `I apologize, but I encountered an error: ${aiData.error}. Please check your API configuration and try again.`,
          'assistant'
        );
        setMessages(prev => [...prev, errorMessage]);
      }

      // Log activity
      await conversationService.logActivity(
        currentOrganization.id,
        'message_sent',
        'message',
        userMessage.id
      );
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage = await conversationService.addMessage(
        conversation.id,
        `I'm sorry, but I encountered a technical error. Please try again later. Error: ${error.message}`,
        'assistant'
      );
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const shouldCreateArtifact = (userMessage, aiResponse) => {
    const createKeywords = ['create', 'generate', 'build', 'make', 'write'];
    const codeKeywords = ['code', 'function', 'component', 'app', 'website', 'script'];
    
    const userLower = userMessage.toLowerCase();
    const hasCreateIntent = createKeywords.some(keyword => userLower.includes(keyword));
    const hasCodeIntent = codeKeywords.some(keyword => userLower.includes(keyword));
    
    // Also check if AI response contains code blocks
    const hasCodeBlock = aiResponse.includes('```');
    
    return (hasCreateIntent && hasCodeIntent) || hasCodeBlock;
  };

  const createArtifactFromResponse = async (userMessage, aiResponse) => {
    try {
      // Extract code from response if it exists
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      const matches = [...aiResponse.matchAll(codeBlockRegex)];
      
      if (matches.length > 0) {
        const firstMatch = matches[0];
        const language = firstMatch[1] || 'javascript';
        const code = firstMatch[2].trim();
        
        // Determine artifact type and title based on content
        let type = 'code';
        let title = 'Generated Code';
        
        if (language === 'html' || code.includes('<html') || code.includes('<!DOCTYPE')) {
          type = 'web_app';
          title = 'Generated Web App';
        } else if (language === 'markdown' || language === 'md') {
          type = 'document';
          title = 'Generated Document';
        }
        
        const artifact = await conversationService.createArtifact({
          conversation_id: conversation.id,
          organization_id: currentOrganization.id,
          title,
          type,
          language,
          content: code,
          metadata: {
            created_by_ai: true,
            user_request: userMessage.substring(0, 200)
          }
        });
        
        setArtifacts(prev => [...prev, artifact]);
      }
    } catch (error) {
      console.error('Error creating artifact:', error);
    }
  };

  const handleTitleSave = async () => {
    if (!conversation || editedTitle === conversation.title) {
      setIsEditing(false);
      return;
    }

    try {
      await conversationService.updateConversation(conversation.id, {title: editedTitle});
      onConversationUpdate?.();
      setIsEditing(false);
      
      await conversationService.logActivity(
        currentOrganization.id,
        'conversation_renamed',
        'conversation',
        conversation.id,
        {
          old_title: conversation.title,
          new_title: editedTitle
        }
      );
    } catch (error) {
      console.error('Error updating title:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleGenerateArtifact = async (description, type = 'code') => {
    try {
      const response = await fetch(`/api/artifacts/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          type,
          language: 'javascript'
        }),
      });

      const data = await response.json();
      if (data.success) {
        const artifact = await conversationService.createArtifact({
          conversation_id: conversation.id,
          organization_id: currentOrganization.id,
          title: `Generated ${type}`,
          type,
          language: data.language,
          content: data.content,
          metadata: {
            created_by_ai: true,
            generation_request: description
          }
        });
        
        setArtifacts(prev => [...prev, artifact]);
        setSelectedArtifact(artifact);
      } else {
        console.error('Artifact generation failed:', data.error);
      }
    } catch (error) {
      console.error('Error generating artifact:', error);
    }
  };

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center bg-dark-900">
        <div className="text-center">
          <SafeIcon icon={FiPlus} className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Conversation Selected</h3>
          <p className="text-gray-500">Select a conversation or create a new one to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-dark-700 bg-dark-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isEditing ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyPress={(e) => e.key === 'Enter' && handleTitleSave()}
                  className="text-lg font-semibold bg-dark-700 border border-dark-600 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
              ) : (
                <h1 className="text-lg font-semibold text-white">{conversation.title}</h1>
              )}
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-1 rounded hover:bg-dark-700 transition-colors"
              >
                <SafeIcon icon={FiEdit3} className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleGenerateArtifact('Create a sample React component')}
                className="p-2 rounded-lg bg-primary-600 hover:bg-primary-700 transition-colors"
                title="Generate Artifact"
              >
                <SafeIcon icon={FiZap} className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => setShowShareDialog(true)}
                className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
              >
                <SafeIcon icon={FiShare2} className="w-4 h-4 text-gray-400" />
              </button>
              <button className="p-2 rounded-lg hover:bg-dark-700 transition-colors">
                <SafeIcon icon={FiStar} className="w-4 h-4 text-gray-400" />
              </button>
              <button className="p-2 rounded-lg hover:bg-dark-700 transition-colors">
                <SafeIcon icon={FiFolder} className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              className="flex items-center space-x-2 text-gray-400"
            >
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
                  style={{animationDelay: '0.1s'}}
                ></div>
                <div
                  className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
                  style={{animationDelay: '0.2s'}}
                ></div>
              </div>
              <span className="text-sm">AI is thinking...</span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-dark-700 bg-dark-800">
          <div className="flex items-end space-x-3">
            <button className="p-2 rounded-lg hover:bg-dark-700 transition-colors">
              <SafeIcon icon={FiPaperclip} className="w-5 h-5 text-gray-400" />
            </button>
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                className="w-full p-3 bg-dark-800 border border-dark-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                rows={1}
                style={{minHeight: '44px', maxHeight: '120px', height: 'auto'}}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isLoading}
              className="p-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-primary-700 disabled:cursor-not-allowed transition-colors"
            >
              <SafeIcon icon={FiSend} className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Artifacts Panel */}
      {artifacts.length > 0 && (
        <div className="w-96 border-l border-dark-700 bg-dark-800">
          <div className="p-4 border-b border-dark-700">
            <h3 className="font-semibold text-white">Artifacts</h3>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto">
            {artifacts.map((artifact) => (
              <motion.button
                key={artifact.id}
                whileHover={{scale: 1.02}}
                onClick={() => setSelectedArtifact(artifact)}
                className="w-full p-3 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors text-left"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <SafeIcon
                    icon={artifact.type === 'code' ? FiCode : FiFile}
                    className="w-4 h-4 text-primary-400"
                  />
                  <span className="font-medium text-white truncate">{artifact.title}</span>
                </div>
                <div className="text-xs text-gray-400">
                  {artifact.type} • v{artifact.version}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Share Dialog */}
      <ShareDialog
        conversation={conversation}
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
      />

      {/* Artifact Viewer Modal */}
      <AnimatePresence>
        {selectedArtifact && (
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{scale: 0.9, opacity: 0}}
              animate={{scale: 1, opacity: 1}}
              exit={{scale: 0.9, opacity: 0}}
              className={`bg-dark-800 rounded-lg border border-dark-700 ${
                isArtifactFullscreen ? 'w-full h-full' : 'w-4/5 h-4/5'
              }`}
            >
              <ArtifactViewer
                artifact={selectedArtifact}
                onSave={() => loadArtifacts()}
                onClose={() => setSelectedArtifact(null)}
                fullscreen={isArtifactFullscreen}
                onToggleFullscreen={() => setIsArtifactFullscreen(!isArtifactFullscreen)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}