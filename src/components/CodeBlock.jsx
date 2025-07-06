import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiCopy, FiCheck, FiPlay, FiDownload } = FiIcons;

export default function CodeBlock({ code, language = 'text', filename = '' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRun = () => {
    // TODO: Implement code execution
    console.log('Running code:', code);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `code.${language}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group"
    >
      <div className="bg-dark-800 border border-dark-600 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-dark-700 border-b border-dark-600">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-mono text-gray-400">
              {language.toUpperCase()}
            </span>
            {filename && (
              <span className="text-sm text-gray-300">{filename}</span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {(language === 'javascript' || language === 'js' || language === 'python') && (
              <button
                onClick={handleRun}
                className="p-1.5 rounded hover:bg-dark-600 transition-colors"
                title="Run code"
              >
                <SafeIcon icon={FiPlay} className="w-4 h-4 text-green-400" />
              </button>
            )}
            
            <button
              onClick={handleDownload}
              className="p-1.5 rounded hover:bg-dark-600 transition-colors"
              title="Download"
            >
              <SafeIcon icon={FiDownload} className="w-4 h-4 text-gray-400" />
            </button>
            
            <button
              onClick={handleCopy}
              className="p-1.5 rounded hover:bg-dark-600 transition-colors"
              title="Copy code"
            >
              <SafeIcon 
                icon={copied ? FiCheck : FiCopy} 
                className={`w-4 h-4 ${copied ? 'text-green-400' : 'text-gray-400'}`} 
              />
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4 overflow-x-auto">
          <pre className="text-sm font-mono text-gray-300 leading-relaxed">
            <code className={`language-${language}`}>
              {code}
            </code>
          </pre>
        </div>
      </div>
    </motion.div>
  );
}