import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';

const { FiMenu, FiSettings, FiUser, FiWifi, FiWifiOff, FiUsers } = FiIcons;

export default function Header({ sidebarOpen, setSidebarOpen, currentView }) {
  const { user, currentProject } = useApp();
  const { connected } = useSocket();

  const viewTitles = {
    chat: 'AI Assistant',
    code: 'Code Editor',
    projects: 'Project Manager',
    agents: 'Agent Dashboard',
    swarm: 'Swarm Dashboard',
    settings: 'Settings'
  };

  return (
    <header className="h-16 bg-dark-800 border-b border-dark-700 flex items-center justify-between px-4">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
        >
          <SafeIcon icon={FiMenu} className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-3">
          <SafeIcon icon={FiUsers} className="w-6 h-6 text-primary-500" />
          <h1 className="text-xl font-bold">Swarm Agents</h1>
        </div>
        <div className="hidden md:flex items-center space-x-2 text-sm text-gray-400">
          <span>/</span>
          <span>{viewTitles[currentView]}</span>
          {currentProject && (
            <>
              <span>/</span>
              <span className="text-primary-400">{currentProject.name}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="flex items-center space-x-2"
        >
          <SafeIcon
            icon={connected ? FiWifi : FiWifiOff}
            className={`w-4 h-4 ${connected ? 'text-green-400' : 'text-red-400'}`}
          />
          <span className="text-xs text-gray-400">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </motion.div>
        <button className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-dark-700 transition-colors">
          <SafeIcon icon={FiUser} className="w-4 h-4" />
          <span className="text-sm">{user?.name || 'Guest'}</span>
        </button>
        <button className="p-2 rounded-lg hover:bg-dark-700 transition-colors">
          <SafeIcon icon={FiSettings} className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}