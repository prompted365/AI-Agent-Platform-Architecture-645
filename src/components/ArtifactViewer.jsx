import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import CodeBlock from './CodeBlock';
import conversationService from '../services/ConversationService';

const {
  FiCode,
  FiFile,
  FiImage,
  FiBarChart,
  FiGlobe,
  FiLayers,
  FiEye,
  FiEdit3,
  FiSave,
  FiShare2,
  FiDownload,
  FiClock,
  FiGitBranch,
  FiMaximize2,
  FiMinimize2,
  FiPlay,
  FiRefreshCw
} = FiIcons;

const ARTIFACT_TYPES = {
  code: { icon: FiCode, label: 'Code', color: 'text-green-400' },
  document: { icon: FiFile, label: 'Document', color: 'text-blue-400' },
  image: { icon: FiImage, label: 'Image', color: 'text-purple-400' },
  chart: { icon: FiBarChart, label: 'Chart', color: 'text-yellow-400' },
  diagram: { icon: FiLayers, label: 'Diagram', color: 'text-pink-400' },
  web_app: { icon: FiGlobe, label: 'Web App', color: 'text-cyan-400' },
  component: { icon: FiLayers, label: 'Component', color: 'text-orange-400' },
  analysis: { icon: FiBarChart, label: 'Analysis', color: 'text-indigo-400' }
};

export default function ArtifactViewer({ 
  artifact, 
  isEditing = false, 
  onSave, 
  onClose,
  fullscreen = false,
  onToggleFullscreen 
}) {
  const [content, setContent] = useState(artifact?.content || '');
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [showVersions, setShowVersions] = useState(false);

  useEffect(() => {
    if (artifact) {
      setContent(artifact.content);
      loadVersions();
    }
  }, [artifact]);

  const loadVersions = async () => {
    if (!artifact) return;
    try {
      const data = await conversationService.getArtifactVersions(artifact.id);
      setVersions(data);
    } catch (error) {
      console.error('Error loading versions:', error);
    }
  };

  const handleSave = async () => {
    if (!artifact || content === artifact.content) return;
    
    try {
      await conversationService.updateArtifact(artifact.id, { content });
      onSave?.();
      loadVersions();
    } catch (error) {
      console.error('Error saving artifact:', error);
    }
  };

  const handleRun = async () => {
    if (artifact.type !== 'code') return;
    
    setIsRunning(true);
    setOutput('Running...');
    
    // Simulate code execution
    setTimeout(() => {
      setOutput('Code executed successfully!\nOutput: Hello, World!');
      setIsRunning(false);
    }, 2000);
  };

  const handleShare = async () => {
    try {
      await conversationService.updateArtifact(artifact.id, { 
        is_published: !artifact.is_published 
      });
      // Refresh artifact data
    } catch (error) {
      console.error('Error sharing artifact:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title}.${getFileExtension(artifact.type, artifact.language)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFileExtension = (type, language) => {
    if (type === 'code') {
      const extensions = {
        javascript: 'js',
        python: 'py',
        typescript: 'ts',
        html: 'html',
        css: 'css',
        json: 'json'
      };
      return extensions[language] || 'txt';
    }
    return type === 'document' ? 'md' : 'txt';
  };

  const renderContent = () => {
    if (artifact.type === 'code') {
      if (isEditing) {
        return (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full p-4 bg-dark-900 text-gray-300 font-mono text-sm resize-none focus:outline-none"
            placeholder="Enter your code here..."
          />
        );
      } else {
        return (
          <CodeBlock
            code={content}
            language={artifact.language}
            filename={artifact.title}
          />
        );
      }
    } else if (artifact.type === 'web_app') {
      return (
        <iframe
          srcDoc={content}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
          title={artifact.title}
        />
      );
    } else {
      if (isEditing) {
        return (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full p-4 bg-dark-900 text-gray-300 text-sm resize-none focus:outline-none"
            placeholder="Enter your content here..."
          />
        );
      } else {
        return (
          <div className="p-4 text-gray-300 whitespace-pre-wrap">
            {content}
          </div>
        );
      }
    }
  };

  if (!artifact) return null;

  const artifactType = ARTIFACT_TYPES[artifact.type] || ARTIFACT_TYPES.document;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-dark-800 border border-dark-700 rounded-lg overflow-hidden ${
        fullscreen ? 'fixed inset-4 z-50' : 'h-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-700 bg-dark-750">
        <div className="flex items-center space-x-3">
          <SafeIcon icon={artifactType.icon} className={`w-5 h-5 ${artifactType.color}`} />
          <div>
            <h3 className="font-semibold text-white">{artifact.title}</h3>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span>{artifactType.label}</span>
              {artifact.language && <span>• {artifact.language}</span>}
              <span>• v{artifact.version}</span>
              {artifact.is_published && (
                <>
                  <span>•</span>
                  <SafeIcon icon={FiShare2} className="w-3 h-3" />
                  <span>Published</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {artifact.type === 'code' && !isEditing && (
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="p-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-700 transition-colors"
              title="Run Code"
            >
              <SafeIcon icon={isRunning ? FiRefreshCw : FiPlay} className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            </button>
          )}
          
          <button
            onClick={() => setShowVersions(!showVersions)}
            className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
            title="Version History"
          >
            <SafeIcon icon={FiGitBranch} className="w-4 h-4 text-gray-400" />
          </button>

          {isEditing && (
            <button
              onClick={handleSave}
              disabled={content === artifact.content}
              className="p-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-primary-700 transition-colors"
              title="Save"
            >
              <SafeIcon icon={FiSave} className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleShare}
            className={`p-2 rounded-lg transition-colors ${
              artifact.is_published 
                ? 'bg-primary-600 hover:bg-primary-700' 
                : 'hover:bg-dark-700'
            }`}
            title={artifact.is_published ? 'Unpublish' : 'Publish'}
          >
            <SafeIcon icon={FiShare2} className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownload}
            className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
            title="Download"
          >
            <SafeIcon icon={FiDownload} className="w-4 h-4 text-gray-400" />
          </button>

          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
              title={fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              <SafeIcon icon={fullscreen ? FiMinimize2 : FiMaximize2} className="w-4 h-4 text-gray-400" />
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
              title="Close"
            >
              <SafeIcon icon={FiEye} className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      <div className="flex h-full">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">
            {renderContent()}
          </div>

          {/* Output Panel for Code */}
          {artifact.type === 'code' && output && (
            <div className="h-32 border-t border-dark-700 bg-dark-900">
              <div className="p-2 border-b border-dark-700 bg-dark-800">
                <span className="text-xs font-medium text-gray-400">Output</span>
              </div>
              <div className="p-3 h-full overflow-y-auto">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap">{output}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Version History Sidebar */}
        <AnimatePresence>
          {showVersions && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 250, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-dark-700 bg-dark-750 overflow-hidden"
            >
              <div className="p-3 border-b border-dark-700">
                <h4 className="font-medium text-white">Version History</h4>
              </div>
              <div className="overflow-y-auto">
                {versions.map((version) => (
                  <button
                    key={version.id}
                    onClick={() => setSelectedVersion(version)}
                    className={`w-full p-3 border-b border-dark-700 hover:bg-dark-700 transition-colors text-left ${
                      selectedVersion?.id === version.id ? 'bg-dark-700' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-white">v{version.version}</span>
                      {version.version === artifact.version && (
                        <span className="text-xs bg-primary-600 text-white px-2 py-0.5 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center space-x-1">
                      <SafeIcon icon={FiClock} className="w-3 h-3" />
                      <span>{new Date(version.created_at).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}