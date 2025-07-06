import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';
import MessageBubble from './MessageBubble';
import CodeBlock from './CodeBlock';

const { FiSend, FiPaperclip, FiMic, FiStopCircle, FiRefreshCw } = FiIcons;

export default function ChatInterface() {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const { chatHistory, addChatMessage, activeAgent, settings } = useApp();
  const { socket, emit } = useSocket();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    if (socket) {
      socket.on('message', (data) => {
        addChatMessage({
          id: Date.now(),
          type: 'assistant',
          content: data.content,
          timestamp: new Date(),
          agent: data.agent
        });
        setIsTyping(false);
      });

      socket.on('typing', (data) => {
        setIsTyping(data.isTyping);
      });

      return () => {
        socket.off('message');
        socket.off('typing');
      };
    }
  }, [socket, addChatMessage]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    addChatMessage(userMessage);
    setMessage('');
    setIsTyping(true);

    // Send to server
    emit('message', {
      content: message,
      agent: activeAgent?.id,
      context: {
        chatHistory: chatHistory.slice(-10), // Last 10 messages for context
        settings
      }
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording
  };

  return (
    <div className="h-full flex flex-col bg-dark-900">
      {/* Chat Header */}
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
              <SafeIcon icon={FiIcons.FiCpu} className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-medium">
                {activeAgent?.name || 'Claude Assistant'}
              </h3>
              <p className="text-sm text-gray-400">
                {activeAgent?.description || 'AI-powered development assistant'}
              </p>
            </div>
          </div>
          <button className="p-2 rounded-lg hover:bg-dark-700 transition-colors">
            <SafeIcon icon={FiRefreshCw} className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {chatHistory.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <MessageBubble message={msg} />
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-2 text-gray-400"
          >
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-sm">Assistant is typing...</span>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-dark-700">
        <div className="flex items-end space-x-3">
          <button className="p-2 rounded-lg hover:bg-dark-700 transition-colors">
            <SafeIcon icon={FiPaperclip} className="w-5 h-5" />
          </button>
          
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              className="w-full p-3 bg-dark-800 border border-dark-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={1}
              style={{ 
                minHeight: '44px',
                maxHeight: '120px',
                overflow: 'auto'
              }}
            />
          </div>

          <button
            onClick={toggleRecording}
            className={`p-2 rounded-lg transition-colors ${
              isRecording 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'hover:bg-dark-700'
            }`}
          >
            <SafeIcon 
              icon={isRecording ? FiStopCircle : FiMic} 
              className="w-5 h-5" 
            />
          </button>

          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="p-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-dark-600 disabled:cursor-not-allowed transition-colors"
          >
            <SafeIcon icon={FiSend} className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}