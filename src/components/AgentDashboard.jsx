import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useApp } from '../context/AppContext';

const { 
  FiCpu, FiPlus, FiPlay, FiPause, FiStop, FiSettings, FiTrash2,
  FiActivity, FiClock, FiZap, FiBrain, FiCode, FiDatabase
} = FiIcons;

export default function AgentDashboard() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: '',
    description: '',
    type: 'coder',
    capabilities: []
  });
  
  const { agents, addAgent, setActiveAgent, activeAgent } = useApp();

  const agentTypes = [
    { id: 'coder', name: 'Code Assistant', description: 'Helps with coding tasks', icon: FiCode },
    { id: 'researcher', name: 'Research Agent', description: 'Gathers and analyzes information', icon: FiBrain },
    { id: 'data', name: 'Data Analyst', description: 'Processes and analyzes data', icon: FiDatabase },
    { id: 'tester', name: 'Testing Agent', description: 'Automated testing and QA', icon: FiActivity }
  ];

  const capabilities = [
    'Code Generation', 'Code Review', 'Debugging', 'Documentation',
    'API Integration', 'Database Operations', 'Testing', 'Deployment'
  ];

  const handleCreateAgent = () => {
    if (!newAgent.name.trim()) return;

    const agent = {
      id: Date.now(),
      name: newAgent.name,
      description: newAgent.description,
      type: newAgent.type,
      capabilities: newAgent.capabilities,
      status: 'idle',
      createdAt: new Date(),
      lastActive: new Date(),
      tasksCompleted: 0,
      averageResponseTime: 0
    };

    addAgent(agent);
    setNewAgent({ name: '', description: '', type: 'coder', capabilities: [] });
    setShowCreateModal(false);
  };

  const handleToggleCapability = (capability) => {
    setNewAgent(prev => ({
      ...prev,
      capabilities: prev.capabilities.includes(capability)
        ? prev.capabilities.filter(c => c !== capability)
        : [...prev.capabilities, capability]
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'busy': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="h-full bg-dark-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Agent Dashboard</h1>
            <p className="text-gray-400 mt-1">Manage your AI agents and their capabilities</p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            <SafeIcon icon={FiPlus} className="w-4 h-4" />
            <span>New Agent</span>
          </button>
        </div>

        {/* Active Agent */}
        {activeAgent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <SafeIcon icon={FiCpu} className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {activeAgent.name} (Active)
                  </h3>
                  <p className="text-primary-100">{activeAgent.description}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors">
                  <SafeIcon icon={FiPause} className="w-4 h-4 text-white" />
                </button>
                <button className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors">
                  <SafeIcon icon={FiSettings} className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {agents.map((agent) => {
              const AgentIcon = agentTypes.find(t => t.id === agent.type)?.icon || FiCpu;
              
              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  whileHover={{ scale: 1.02 }}
                  className={`bg-dark-800 border rounded-lg p-6 transition-colors cursor-pointer ${
                    activeAgent?.id === agent.id 
                      ? 'border-primary-500 bg-primary-900 bg-opacity-20' 
                      : 'border-dark-700 hover:border-primary-500'
                  }`}
                  onClick={() => setActiveAgent(agent)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                        <SafeIcon icon={AgentIcon} className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{agent.name}</h3>
                        <p className="text-sm text-gray-400">{agent.type}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status).replace('text-', 'bg-')}`} />
                      <span className={`text-xs ${getStatusColor(agent.status)}`}>
                        {agent.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm mb-4">
                    {agent.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {agent.capabilities.slice(0, 3).map((capability) => (
                      <span
                        key={capability}
                        className="px-2 py-1 bg-dark-700 text-xs rounded-full text-gray-300"
                      >
                        {capability}
                      </span>
                    ))}
                    {agent.capabilities.length > 3 && (
                      <span className="px-2 py-1 bg-dark-700 text-xs rounded-full text-gray-400">
                        +{agent.capabilities.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center space-x-1">
                      <SafeIcon icon={FiActivity} className="w-3 h-3" />
                      <span>{agent.tasksCompleted} tasks</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <SafeIcon icon={FiClock} className="w-3 h-3" />
                      <span>{agent.averageResponseTime}ms avg</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {agents.length === 0 && (
          <div className="text-center py-12">
            <SafeIcon icon={FiCpu} className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Agents Yet</h3>
            <p className="text-gray-500 mb-6">Create your first AI agent to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            >
              Create New Agent
            </button>
          </div>
        )}
      </div>

      {/* Create Agent Modal */}
      <AnimatePresence>
        {showCreateModal && (
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
              className="bg-dark-800 rounded-lg p-6 w-full max-w-md border border-dark-700 max-h-[80vh] overflow-y-auto"
            >
              <h3 className="text-xl font-semibold text-white mb-4">Create New Agent</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Agent Name
                  </label>
                  <input
                    type="text"
                    value={newAgent.name}
                    onChange={(e) => setNewAgent(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 bg-dark-700 border border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="My AI Assistant"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newAgent.description}
                    onChange={(e) => setNewAgent(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-3 bg-dark-700 border border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="What does this agent do?"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Agent Type
                  </label>
                  <select
                    value={newAgent.type}
                    onChange={(e) => setNewAgent(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full p-3 bg-dark-700 border border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {agentTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Capabilities
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {capabilities.map(capability => (
                      <label
                        key={capability}
                        className="flex items-center space-x-2 p-2 bg-dark-700 rounded-lg cursor-pointer hover:bg-dark-600"
                      >
                        <input
                          type="checkbox"
                          checked={newAgent.capabilities.includes(capability)}
                          onChange={() => handleToggleCapability(capability)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-300">{capability}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAgent}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                >
                  Create Agent
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}