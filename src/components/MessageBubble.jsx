import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import CodeBlock from './CodeBlock';
import { format } from 'date-fns';

const { FiUser, FiCpu, FiCopy, FiCheck } = FiIcons;

export default function MessageBubble({ message }) {
  const isUser = message.type === 'user';
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const renderContent = () => {
    // Check if message contains code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(message.content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: message.content.slice(lastIndex, match.index)
        });
      }
      
      // Add code block
      parts.push({
        type: 'code',
        language: match[1] || 'text',
        content: match[2].trim()
      });
      
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < message.content.length) {
      parts.push({
        type: 'text',
        content: message.content.slice(lastIndex)
      });
    }

    // If no code blocks found, treat as plain text
    if (parts.length === 0) {
      parts.push({
        type: 'text',
        content: message.content
      });
    }

    return parts.map((part, index) => {
      if (part.type === 'code') {
        return (
          <CodeBlock
            key={index}
            code={part.content}
            language={part.language}
          />
        );
      } else {
        return (
          <div key={index} className="whitespace-pre-wrap">
            {part.content}
          </div>
        );
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex space-x-3 max-w-3xl ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-primary-600' : 'bg-dark-600'
          }`}>
            <SafeIcon 
              icon={isUser ? FiUser : FiCpu} 
              className="w-4 h-4 text-white" 
            />
          </div>
        </div>
        
        <div className={`flex-1 ${isUser ? 'text-right' : ''}`}>
          <div className={`inline-block p-4 rounded-lg ${
            isUser 
              ? 'bg-primary-600 text-white' 
              : 'bg-dark-800 text-gray-100 border border-dark-600'
          }`}>
            <div className="space-y-2">
              {renderContent()}
            </div>
          </div>
          
          <div className={`flex items-center space-x-2 mt-2 text-xs text-gray-400 ${
            isUser ? 'justify-end' : 'justify-start'
          }`}>
            <span>{format(new Date(message.timestamp), 'HH:mm')}</span>
            {message.agent && (
              <span className="text-primary-400">• {message.agent}</span>
            )}
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-dark-700 transition-colors"
            >
              <SafeIcon 
                icon={copied ? FiCheck : FiCopy} 
                className={`w-3 h-3 ${copied ? 'text-green-400' : ''}`} 
              />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}