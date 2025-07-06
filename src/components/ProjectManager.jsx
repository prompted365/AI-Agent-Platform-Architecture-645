import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useApp } from '../context/AppContext';

const { 
  FiPlus, FiFolder, FiGithub, FiTrash2, FiEdit3, FiExternalLink,
  FiCalendar, FiClock, FiStar, FiGitBranch, FiCode, FiDatabase
} = FiIcons;

export default function ProjectManager() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    template: 'blank',
    githubRepo: ''
  });
  
  const { projects, addProject, deleteProject, setCurrentProject } = useApp();

  const templates = [
    { id: 'blank', name: 'Blank Project', description: 'Start from scratch' },
    { id: 'react', name: 'React App', description: 'React with Vite' },
    { id: 'nextjs', name: 'Next.js', description: 'Full-stack React framework' },
    { id: 'nodejs', name: 'Node.js API', description: 'Express.js backend' },
    { id: 'python', name: 'Python Project', description: 'Python with Flask' }
  ];

  const handleCreateProject = () => {
    if (!newProject.name.trim()) return;

    const project = {
      id: Date.now(),
      name: newProject.name,
      description: newProject.description,
      template: newProject.template,
      githubRepo: newProject.githubRepo,
      createdAt: new Date(),
      updatedAt: new Date(),
      starred: false,
      files: [],
      deployments: []
    };

    addProject(project);
    setNewProject({ name: '', description: '', template: 'blank', githubRepo: '' });
    setShowCreateModal(false);
  };

  const handleDeleteProject = (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteProject(projectId);
    }
  };

  return (
    <div className="h-full bg-dark-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Projects</h1>
            <p className="text-gray-400 mt-1">Manage your development projects</p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            <SafeIcon icon={FiPlus} className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {projects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                whileHover={{ scale: 1.02 }}
                className="bg-dark-800 border border-dark-700 rounded-lg p-6 hover:border-primary-500 transition-colors cursor-pointer"
                onClick={() => setCurrentProject(project)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                      <SafeIcon icon={FiFolder} className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{project.name}</h3>
                      <p className="text-sm text-gray-400">{project.template}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Toggle star
                      }}
                      className="p-1 rounded hover:bg-dark-700"
                    >
                      <SafeIcon icon={FiStar} className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                      className="p-1 rounded hover:bg-dark-700 text-red-400"
                    >
                      <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                  {project.description || 'No description available'}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <SafeIcon icon={FiCalendar} className="w-3 h-3" />
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    {project.githubRepo && (
                      <div className="flex items-center space-x-1">
                        <SafeIcon icon={FiGithub} className="w-3 h-3" />
                        <span>Connected</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiCode} className="w-3 h-3" />
                    <span>{project.files?.length || 0} files</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12">
            <SafeIcon icon={FiFolder} className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Projects Yet</h3>
            <p className="text-gray-500 mb-6">Create your first project to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            >
              Create New Project
            </button>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
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
              className="bg-dark-800 rounded-lg p-6 w-full max-w-md border border-dark-700"
            >
              <h3 className="text-xl font-semibold text-white mb-4">Create New Project</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 bg-dark-700 border border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="My Awesome Project"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-3 bg-dark-700 border border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Brief description of your project..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Template
                  </label>
                  <select
                    value={newProject.template}
                    onChange={(e) => setNewProject(prev => ({ ...prev, template: e.target.value }))}
                    className="w-full p-3 bg-dark-700 border border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} - {template.description}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    GitHub Repository (Optional)
                  </label>
                  <input
                    type="text"
                    value={newProject.githubRepo}
                    onChange={(e) => setNewProject(prev => ({ ...prev, githubRepo: e.target.value }))}
                    className="w-full p-3 bg-dark-700 border border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="https://github.com/username/repo"
                  />
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
                  onClick={handleCreateProject}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                >
                  Create Project
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}