import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useApp } from '../context/AppContext';

const {
  FiMessageSquare,
  FiCode,
  FiFolderOpen,
  FiCpu,
  FiUsers,
  FiSettings,
  FiX,
  FiPlus,
  FiGithub,
  FiDatabase,
  FiPlay
} = FiIcons;

export default function Sidebar({ currentView, setCurrentView, setSidebarOpen }) {
  const { projects, currentProject, setCurrentProject } = useApp();

  const menuItems = [
    { id: 'chat', icon: FiMessageSquare, label: 'AI Assistant', shortcut: '⌘1' },
    { id: 'code', icon: FiCode, label: 'Code Editor', shortcut: '⌘2' },
    { id: 'projects', icon: FiFolderOpen, label: 'Projects', shortcut: '⌘3' },
    { id: 'agents', icon: FiCpu, label: 'Agents', shortcut: '⌘4' },
    { id: 'swarm', icon: FiUsers, label: 'Swarms', shortcut: '⌘5' },
    { id: 'settings', icon: FiSettings, label: 'Settings', shortcut: '⌘,' }
  ];

  return (
    <div className="h-full flex flex-col bg-dark-800 border-r border-dark-700">
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Navigation</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded hover:bg-dark-700 lg:hidden"
          >
            <SafeIcon icon={FiX} className="w-4 h-4" />
          </button>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentView(item.id)}
            className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
              currentView === item.id
                ? 'bg-primary-600 text-white'
                : 'hover:bg-dark-700 text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <SafeIcon icon={item.icon} className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </div>
            <span className="text-xs text-gray-400">{item.shortcut}</span>
          </motion.button>
        ))}
      </nav>

      <div className="p-4 border-t border-dark-700">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Recent Projects</h3>
            <button className="p-1 rounded hover:bg-dark-700">
              <SafeIcon icon={FiPlus} className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">
            {projects.slice(0, 3).map((project) => (
              <button
                key={project.id}
                onClick={() => setCurrentProject(project)}
                className={`w-full flex items-center space-x-2 p-2 rounded text-sm transition-colors ${
                  currentProject?.id === project.id
                    ? 'bg-dark-600 text-white'
                    : 'hover:bg-dark-700 text-gray-400'
                }`}
              >
                <SafeIcon icon={FiFolderOpen} className="w-4 h-4" />
                <span className="truncate">{project.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <SafeIcon icon={FiGithub} className="w-4 h-4" />
          <SafeIcon icon={FiDatabase} className="w-4 h-4" />
          <SafeIcon icon={FiPlay} className="w-4 h-4" />
          <span>Connected</span>
        </div>
      </div>
    </div>
  );
}