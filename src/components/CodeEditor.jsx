import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import MonacoEditor from 'react-monaco-editor';

const { 
  FiPlay, FiSave, FiFolder, FiFile, FiPlus, FiX, FiMaximize2, 
  FiMinimize2, FiTerminal, FiGitBranch, FiSettings
} = FiIcons;

export default function CodeEditor() {
  const [files, setFiles] = useState([
    { id: 1, name: 'main.js', content: '// Welcome to Claude Code Editor\nconsole.log("Hello, World!");', language: 'javascript', active: true },
    { id: 2, name: 'style.css', content: '/* Add your styles here */\nbody {\n  font-family: Arial, sans-serif;\n}', language: 'css', active: false }
  ]);
  const [activeFile, setActiveFile] = useState(files[0]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [output, setOutput] = useState('');
  const editorRef = useRef(null);
  
  const { currentProject, settings } = useApp();

  const handleFileSelect = (file) => {
    setActiveFile(file);
    setFiles(prev => prev.map(f => ({ ...f, active: f.id === file.id })));
  };

  const handleFileClose = (fileId) => {
    const newFiles = files.filter(f => f.id !== fileId);
    setFiles(newFiles);
    if (activeFile.id === fileId && newFiles.length > 0) {
      setActiveFile(newFiles[0]);
    }
  };

  const handleNewFile = () => {
    const newFile = {
      id: Date.now(),
      name: 'untitled.js',
      content: '',
      language: 'javascript',
      active: true
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFile(newFile);
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Saving file:', activeFile);
  };

  const handleRun = () => {
    // TODO: Implement code execution
    setOutput('Running code...\n');
    setTerminalOpen(true);
    
    setTimeout(() => {
      setOutput(prev => prev + 'Code executed successfully!\n');
    }, 1000);
  };

  const handleEditorChange = (newValue) => {
    setFiles(prev => prev.map(f => 
      f.id === activeFile.id ? { ...f, content: newValue } : f
    ));
  };

  const editorOptions = {
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line',
    automaticLayout: true,
    theme: 'vs-dark',
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    tabSize: 2,
    insertSpaces: true,
    wordWrap: 'on',
    lineNumbers: 'on',
    glyphMargin: true,
    folding: true,
    renderLineHighlight: 'gutter',
    matchBrackets: 'always',
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always',
    formatOnPaste: true,
    formatOnType: true
  };

  return (
    <div className={`h-full flex flex-col bg-dark-900 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Editor Header */}
      <div className="h-12 bg-dark-800 border-b border-dark-700 flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiFile} className="w-4 h-4 text-primary-500" />
            <span className="text-sm font-medium">
              {currentProject?.name || 'Untitled Project'}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={handleNewFile}
              className="p-1.5 rounded hover:bg-dark-700 transition-colors"
              title="New File"
            >
              <SafeIcon icon={FiPlus} className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleSave}
              className="p-1.5 rounded hover:bg-dark-700 transition-colors"
              title="Save (Ctrl+S)"
            >
              <SafeIcon icon={FiSave} className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleRun}
              className="p-1.5 rounded bg-green-600 hover:bg-green-700 transition-colors"
              title="Run Code"
            >
              <SafeIcon icon={FiPlay} className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTerminalOpen(!terminalOpen)}
            className={`p-1.5 rounded transition-colors ${
              terminalOpen ? 'bg-primary-600' : 'hover:bg-dark-700'
            }`}
            title="Toggle Terminal"
          >
            <SafeIcon icon={FiTerminal} className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded hover:bg-dark-700 transition-colors"
            title="Toggle Fullscreen"
          >
            <SafeIcon icon={isFullscreen ? FiMinimize2 : FiMaximize2} className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* File Tabs */}
      <div className="h-10 bg-dark-800 border-b border-dark-700 flex items-center px-4 overflow-x-auto">
        <div className="flex space-x-1">
          {files.map((file) => (
            <motion.button
              key={file.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => handleFileSelect(file)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-t-lg transition-colors ${
                file.active 
                  ? 'bg-dark-900 text-white border-b-2 border-primary-500' 
                  : 'hover:bg-dark-700 text-gray-400'
              }`}
            >
              <SafeIcon icon={FiFile} className="w-3 h-3" />
              <span className="text-sm">{file.name}</span>
              {files.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFileClose(file.id);
                  }}
                  className="p-0.5 rounded hover:bg-dark-600"
                >
                  <SafeIcon icon={FiX} className="w-3 h-3" />
                </button>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 flex">
        <div className="flex-1 relative">
          <MonacoEditor
            width="100%"
            height="100%"
            language={activeFile.language}
            theme="vs-dark"
            value={activeFile.content}
            options={editorOptions}
            onChange={handleEditorChange}
            editorDidMount={(editor) => { editorRef.current = editor; }}
          />
        </div>
      </div>

      {/* Terminal */}
      {terminalOpen && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 200 }}
          exit={{ height: 0 }}
          className="bg-dark-900 border-t border-dark-700 flex flex-col"
        >
          <div className="h-8 bg-dark-800 border-b border-dark-700 flex items-center justify-between px-4">
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiTerminal} className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium">Terminal</span>
            </div>
            <button
              onClick={() => setTerminalOpen(false)}
              className="p-1 rounded hover:bg-dark-700"
            >
              <SafeIcon icon={FiX} className="w-3 h-3" />
            </button>
          </div>
          
          <div className="flex-1 p-4 font-mono text-sm text-gray-300 overflow-y-auto">
            <pre className="whitespace-pre-wrap">{output}</pre>
            <div className="flex items-center mt-2">
              <span className="text-primary-400">$</span>
              <input
                type="text"
                className="flex-1 ml-2 bg-transparent border-none outline-none text-gray-300"
                placeholder="Type a command..."
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}