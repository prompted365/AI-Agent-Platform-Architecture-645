import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useApp } from '../context/AppContext';

const { 
  FiSettings, FiKey, FiGithub, FiDatabase, FiServer, FiSave,
  FiEye, FiEyeOff, FiCheck, FiX
} = FiIcons;

export default function Settings() {
  const { settings, updateSettings } = useApp();
  const [showPasswords, setShowPasswords] = useState({});
  const [testResults, setTestResults] = useState({});
  const [saving, setSaving] = useState(false);

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const testConnection = async (service) => {
    setTestResults(prev => ({ ...prev, [service]: 'testing' }));
    
    // Simulate API test
    setTimeout(() => {
      setTestResults(prev => ({ 
        ...prev, 
        [service]: Math.random() > 0.3 ? 'success' : 'error' 
      }));
    }, 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    setTimeout(() => {
      setSaving(false);
    }, 1000);
  };

  const getTestIcon = (status) => {
    switch (status) {
      case 'testing': return <div className="spinner" />;
      case 'success': return <SafeIcon icon={FiCheck} className="w-4 h-4 text-green-400" />;
      case 'error': return <SafeIcon icon={FiX} className="w-4 h-4 text-red-400" />;
      default: return null;
    }
  };

  const sections = [
    {
      title: 'LLM Provider',
      icon: FiServer,
      fields: [
        {
          key: 'llmProvider',
          label: 'Provider',
          type: 'select',
          options: [
            { value: 'requesty', label: 'Requesty.ai' },
            { value: 'openai', label: 'OpenAI' },
            { value: 'anthropic', label: 'Anthropic' },
            { value: 'local', label: 'Local Model' }
          ]
        },
        {
          key: 'apiKey',
          label: 'API Key',
          type: 'password',
          placeholder: 'Enter your API key...',
          testable: true
        }
      ]
    },
    {
      title: 'GitHub Integration',
      icon: FiGithub,
      fields: [
        {
          key: 'githubToken',
          label: 'GitHub Token',
          type: 'password',
          placeholder: 'ghp_xxxxxxxxxxxx',
          testable: true
        }
      ]
    },
    {
      title: 'Astra DB',
      icon: FiDatabase,
      fields: [
        {
          key: 'astraToken',
          label: 'Application Token',
          type: 'password',
          placeholder: 'AstraCS:xxxxxxxxxxxx',
          testable: true
        },
        {
          key: 'astraEndpoint',
          label: 'API Endpoint',
          type: 'text',
          placeholder: 'https://your-database-region.apps.astra.datastax.com'
        }
      ]
    },
    {
      title: 'Railway Deployment',
      icon: FiServer,
      fields: [
        {
          key: 'railwayToken',
          label: 'Railway Token',
          type: 'password',
          placeholder: 'railway_xxxxxxxxxxxx',
          testable: true
        }
      ]
    }
  ];

  return (
    <div className="h-full bg-dark-900 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <SafeIcon icon={FiSettings} className="w-8 h-8 text-primary-500" />
            <div>
              <h1 className="text-3xl font-bold text-white">Settings</h1>
              <p className="text-gray-400 mt-1">Configure your development environment</p>
            </div>
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-700 rounded-lg transition-colors"
          >
            {saving ? (
              <div className="spinner" />
            ) : (
              <SafeIcon icon={FiSave} className="w-4 h-4" />
            )}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>

        {/* Settings Sections */}
        <div className="space-y-8">
          {sections.map((section) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-dark-800 border border-dark-700 rounded-lg p-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <SafeIcon icon={section.icon} className="w-5 h-5 text-primary-500" />
                <h2 className="text-xl font-semibold text-white">{section.title}</h2>
              </div>

              <div className="space-y-4">
                {section.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {field.label}
                    </label>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 relative">
                        {field.type === 'select' ? (
                          <select
                            value={settings[field.key] || ''}
                            onChange={(e) => updateSettings({ [field.key]: e.target.value })}
                            className="w-full p-3 bg-dark-700 border border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            {field.options.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type === 'password' && !showPasswords[field.key] ? 'password' : 'text'}
                            value={settings[field.key] || ''}
                            onChange={(e) => updateSettings({ [field.key]: e.target.value })}
                            placeholder={field.placeholder}
                            className="w-full p-3 bg-dark-700 border border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        )}
                        
                        {field.type === 'password' && (
                          <button
                            onClick={() => togglePasswordVisibility(field.key)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            <SafeIcon 
                              icon={showPasswords[field.key] ? FiEyeOff : FiEye} 
                              className="w-4 h-4" 
                            />
                          </button>
                        )}
                      </div>
                      
                      {field.testable && (
                        <button
                          onClick={() => testConnection(field.key)}
                          disabled={!settings[field.key] || testResults[field.key] === 'testing'}
                          className="px-4 py-3 bg-dark-700 hover:bg-dark-600 disabled:bg-dark-700 disabled:cursor-not-allowed border border-dark-600 rounded-lg transition-colors flex items-center space-x-2"
                        >
                          {getTestIcon(testResults[field.key])}
                          <span className="text-sm">Test</span>
                        </button>
                      )}
                    </div>
                    
                    {testResults[field.key] && testResults[field.key] !== 'testing' && (
                      <p className={`text-sm mt-2 ${
                        testResults[field.key] === 'success' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {testResults[field.key] === 'success' 
                          ? 'Connection successful!' 
                          : 'Connection failed. Please check your credentials.'
                        }
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          {/* General Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-800 border border-dark-700 rounded-lg p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <SafeIcon icon={FiSettings} className="w-5 h-5 text-primary-500" />
              <h2 className="text-xl font-semibold text-white">General</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-300">Auto Save</label>
                  <p className="text-xs text-gray-500">Automatically save changes</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => updateSettings({ autoSave: e.target.checked })}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-300">Code Completion</label>
                  <p className="text-xs text-gray-500">Enable AI-powered code completion</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.codeCompletion}
                  onChange={(e) => updateSettings({ codeCompletion: e.target.checked })}
                  className="rounded"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}