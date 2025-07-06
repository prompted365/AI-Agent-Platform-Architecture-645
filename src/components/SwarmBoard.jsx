import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';

const {
  FiPlus,
  FiUsers,
  FiCpu,
  FiZap,
  FiDatabase,
  FiCheck,
  FiClock,
  FiPlay,
  FiPause,
  FiTrash2,
  FiRefreshCw,
  FiEye,
  FiSettings,
  FiCode,
  FiMessageCircle,
  FiBriefcase,
  FiStar,
  FiGitBranch
} = FiIcons;

export default function SwarmBoard() {
  const [swarms, setSwarms] = useState([]);
  const [activeSwarm, setActiveSwarm] = useState(null);
  const [swarmAgents, setSwarmAgents] = useState([]);
  const [swarmTasks, setSwarmTasks] = useState([]);
  const [isCreatingSwarm, setIsCreatingSwarm] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newSwarm, setNewSwarm] = useState({
    name: '',
    description: '',
    agentCount: 3
  });
  const [newTask, setNewTask] = useState({
    type: 'code_generation',
    description: '',
    priority: 5
  });
  const [swarmMemory, setSwarmMemory] = useState({});
  const [swarmEvents, setSwarmEvents] = useState([]);
  
  const { socket, emit } = useSocket();
  const { user } = useApp();
  
  // Agent roles for swarm creation
  const agentRoles = [
    {
      id: 'coordinator',
      name: 'Coordinator',
      icon: FiUsers,
      description: 'Manages the swarm and distributes tasks'
    },
    {
      id: 'researcher',
      name: 'Researcher',
      icon: FiDatabase,
      description: 'Gathers and analyzes information'
    },
    {
      id: 'coder',
      name: 'Coder',
      icon: FiCode,
      description: 'Generates and reviews code'
    },
    {
      id: 'reviewer',
      name: 'Reviewer',
      icon: FiEye,
      description: 'Reviews and improves work'
    },
    {
      id: 'tester',
      name: 'Tester',
      icon: FiCheck,
      description: 'Tests and validates solutions'
    }
  ];
  
  // Task types
  const taskTypes = [
    {
      id: 'code_generation',
      name: 'Code Generation',
      icon: FiCode
    },
    {
      id: 'research',
      name: 'Research',
      icon: FiDatabase
    },
    {
      id: 'analysis',
      name: 'Analysis',
      icon: FiEye
    },
    {
      id: 'swarm_coordination',
      name: 'Coordination',
      icon: FiUsers
    },
    {
      id: 'message_relay',
      name: 'Message',
      icon: FiMessageCircle
    }
  ];

  // Fetch swarms on component mount
  useEffect(() => {
    fetchSwarms();
  }, []);

  // Setup socket event listeners
  useEffect(() => {
    if (socket) {
      socket.on('swarm-created', handleSwarmCreated);
      socket.on('swarm-task-submitted', handleTaskSubmitted);
      socket.on('swarm-event', handleSwarmEvent);
      socket.on('swarm-subscribed', handleSwarmSubscribed);
      
      return () => {
        socket.off('swarm-created');
        socket.off('swarm-task-submitted');
        socket.off('swarm-event');
        socket.off('swarm-subscribed');
      };
    }
  }, [socket]);

  // Subscribe to swarm events when active swarm changes
  useEffect(() => {
    if (socket && activeSwarm) {
      // Subscribe to events for this swarm
      emit('swarm-subscribe', { swarmId: activeSwarm.id });
      
      // Fetch swarm agents and tasks
      fetchSwarmAgents(activeSwarm.id);
      fetchSwarmTasks(activeSwarm.id);
    }
  }, [socket, activeSwarm]);

  const fetchSwarms = async () => {
    try {
      const response = await fetch('/api/swarms');
      const data = await response.json();
      setSwarms(data);
    } catch (error) {
      console.error('Error fetching swarms:', error);
    }
  };

  const fetchSwarmAgents = async (swarmId) => {
    try {
      const response = await fetch(`/api/swarms/${swarmId}/agents`);
      const data = await response.json();
      setSwarmAgents(data);
    } catch (error) {
      console.error('Error fetching swarm agents:', error);
    }
  };

  const fetchSwarmTasks = async (swarmId) => {
    try {
      const response = await fetch(`/api/swarms/${swarmId}/tasks`);
      const data = await response.json();
      setSwarmTasks(data);
    } catch (error) {
      console.error('Error fetching swarm tasks:', error);
    }
  };

  const handleSwarmCreated = (swarm) => {
    setSwarms(prev => [...prev, swarm]);
    setIsCreatingSwarm(false);
    setNewSwarm({
      name: '',
      description: '',
      agentCount: 3
    });
    setActiveSwarm(swarm);
  };

  const handleTaskSubmitted = (task) => {
    setSwarmTasks(prev => [...prev, task]);
    setIsCreatingTask(false);
    setNewTask({
      type: 'code_generation',
      description: '',
      priority: 5
    });
  };

  const handleSwarmEvent = (event) => {
    // Add event to history
    setSwarmEvents(prev => [event, ...prev].slice(0, 100));
    
    // Update swarm state based on event type
    if (event.type === 'swarm:memory_updated' && event.swarmId === activeSwarm?.id) {
      setSwarmMemory(prev => ({
        ...prev,
        ...event.updates
      }));
    } else if (event.type === 'task:updated' && activeSwarm) {
      // Update task in the list
      setSwarmTasks(prev => 
        prev.map(t => t.id === event.taskId ? { ...t, ...event.updates } : t)
      );
    } else if (event.type === 'agent:status_changed' && activeSwarm) {
      // Update agent in the list
      setSwarmAgents(prev => 
        prev.map(a => a.id === event.agentId ? { ...a, status: event.status } : a)
      );
    }
  };

  const handleSwarmSubscribed = ({ swarmId }) => {
    console.log(`Subscribed to swarm ${swarmId} events`);
  };

  const handleCreateSwarm = () => {
    if (!newSwarm.name.trim()) return;
    
    // Generate agent configs based on roles
    const agents = [];
    
    // Always add a coordinator
    agents.push({
      name: `${newSwarm.name} Coordinator`,
      type: 'coordinator',
      role: 'coordinator',
      capabilities: ['task_distribution', 'memory_management', 'coordination']
    });
    
    // Add other agent types
    const remainingAgents = newSwarm.agentCount - 1;
    const roles = ['researcher', 'coder', 'reviewer'];
    
    for (let i = 0; i < remainingAgents; i++) {
      const role = roles[i % roles.length];
      const capabilities = [];
      
      if (role === 'researcher') {
        capabilities.push('research', 'analysis', 'information_gathering');
      } else if (role === 'coder') {
        capabilities.push('code_generation', 'refactoring', 'debugging');
      } else if (role === 'reviewer') {
        capabilities.push('code_review', 'quality_control', 'testing');
      }
      
      agents.push({
        name: `${newSwarm.name} ${role.charAt(0).toUpperCase() + role.slice(1)} ${i+1}`,
        type: role,
        role: role,
        capabilities
      });
    }
    
    // Create swarm with agents
    emit('swarm-create', {
      name: newSwarm.name,
      description: newSwarm.description,
      owner: user?.id || 'anonymous',
      initialMemory: {
        purpose: newSwarm.description,
        createdAt: new Date().toISOString()
      },
      agents
    });
  };

  const handleCreateTask = () => {
    if (!newTask.description.trim() || !activeSwarm) return;
    
    emit('swarm-task', {
      swarmId: activeSwarm.id,
      task: {
        type: newTask.type,
        description: newTask.description,
        priority: parseInt(newTask.priority),
        context: {
          createdAt: new Date().toISOString(),
          createdBy: user?.id || 'anonymous'
        }
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'busy': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      case 'completed': return 'text-green-400';
      case 'running': return 'text-blue-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-400';
      case 'busy': return 'bg-yellow-400';
      case 'error': return 'bg-red-400';
      case 'completed': return 'bg-green-400';
      case 'running': return 'bg-blue-400';
      case 'pending': return 'bg-yellow-400';
      case 'failed': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const renderAgentRoleIcon = (role) => {
    switch (role) {
      case 'coordinator': return <SafeIcon icon={FiUsers} />;
      case 'researcher': return <SafeIcon icon={FiDatabase} />;
      case 'coder': return <SafeIcon icon={FiCode} />;
      case 'reviewer': return <SafeIcon icon={FiEye} />;
      case 'tester': return <SafeIcon icon={FiCheck} />;
      default: return <SafeIcon icon={FiCpu} />;
    }
  };

  return (
    <div className="h-full bg-dark-900 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Swarm Dashboard</h1>
            <p className="text-gray-400 mt-1">Manage your agent swarms and coordinate tasks</p>
          </div>
          <button
            onClick={() => setIsCreatingSwarm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            <SafeIcon icon={FiPlus} className="w-4 h-4" />
            <span>New Swarm</span>
          </button>
        </div>

        {/* Active Swarm */}
        {activeSwarm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <SafeIcon icon={FiUsers} className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {activeSwarm.name}
                  </h3>
                  <p className="text-primary-100">{activeSwarm.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 mt-4 lg:mt-0">
                <div className="flex items-center space-x-2 bg-white bg-opacity-20 px-3 py-1 rounded-lg">
                  <SafeIcon icon={FiCpu} className="w-4 h-4 text-white" />
                  <span className="text-white">{activeSwarm.agentCount} Agents</span>
                </div>
                <div className="flex items-center space-x-2 bg-white bg-opacity-20 px-3 py-1 rounded-lg">
                  <SafeIcon icon={FiBriefcase} className="w-4 h-4 text-white" />
                  <span className="text-white">{swarmTasks.length} Tasks</span>
                </div>
                <button className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors">
                  <SafeIcon icon={FiSettings} className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
            
            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => setIsCreatingTask(true)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
              >
                <SafeIcon icon={FiPlus} className="w-3 h-3" />
                <span className="text-sm">New Task</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors">
                <SafeIcon icon={FiCpu} className="w-3 h-3" />
                <span className="text-sm">Add Agent</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors">
                <SafeIcon icon={FiMessageCircle} className="w-3 h-3" />
                <span className="text-sm">Broadcast</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors">
                <SafeIcon icon={FiRefreshCw} className="w-3 h-3" />
                <span className="text-sm">Refresh</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Swarm Content */}
        {activeSwarm ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Agents Panel */}
            <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Agents</h3>
                <span className="text-xs text-gray-400">{swarmAgents.length} total</span>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {swarmAgents.map((agent) => (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-dark-700 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                          {renderAgentRoleIcon(agent.role)}
                        </div>
                        <div>
                          <div className="font-medium text-white">{agent.name}</div>
                          <div className="text-xs text-gray-400">{agent.role}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusBgColor(agent.status)}`} />
                        <span className={`text-xs ${getStatusColor(agent.status)}`}>{agent.status}</span>
                      </div>
                    </div>
                    
                    {agent.currentTask && (
                      <div className="mt-2 text-xs text-gray-400 bg-dark-800 rounded p-2">
                        Working on: {agent.currentTask}
                      </div>
                    )}
                  </motion.div>
                ))}
                
                {swarmAgents.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <SafeIcon icon={FiCpu} className="w-8 h-8 mx-auto mb-2" />
                    <p>No agents in this swarm</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Tasks Panel */}
            <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Tasks</h3>
                <button
                  onClick={() => setIsCreatingTask(true)}
                  className="p-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors"
                >
                  <SafeIcon icon={FiPlus} className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {swarmTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-dark-700 rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusBgColor(task.status)}`} />
                          <span className="font-medium text-white">{task.type}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(task.status)} bg-opacity-20 ${getStatusBgColor(task.status)}`}>
                            {task.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mt-1">{task.description}</p>
                      </div>
                      <div className="flex space-x-1">
                        <button className="p-1 rounded-lg bg-dark-600 hover:bg-dark-500 transition-colors">
                          <SafeIcon icon={FiEye} className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    </div>
                    
                    {task.assignedAgents?.length > 0 && (
                      <div className="mt-2 flex items-center space-x-1 text-xs text-gray-400">
                        <SafeIcon icon={FiCpu} className="w-3 h-3" />
                        <span>Assigned to: {task.assignedAgents.map(id => {
                          const agent = swarmAgents.find(a => a.id === id);
                          return agent ? agent.name : id;
                        }).join(', ')}</span>
                      </div>
                    )}
                    
                    {task.progress > 0 && (
                      <div className="mt-2">
                        <div className="h-1 w-full bg-dark-600 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary-500" 
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{task.progress}% complete</div>
                      </div>
                    )}
                  </motion.div>
                ))}
                
                {swarmTasks.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <SafeIcon icon={FiBriefcase} className="w-8 h-8 mx-auto mb-2" />
                    <p>No tasks in this swarm</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Events Panel */}
            <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Event Stream</h3>
                <span className="text-xs text-gray-400">{swarmEvents.length} events</span>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {swarmEvents.map((event, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-dark-700 rounded-lg p-3 text-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-mono text-xs text-primary-400">{event.type}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="mt-1 text-gray-300">
                      {event.type === 'swarm:memory_updated' && (
                        <div>
                          Memory updated by {event.updatedBy}
                          {event.updates && (
                            <div className="mt-1 text-xs bg-dark-800 p-2 rounded font-mono">
                              {JSON.stringify(event.updates).slice(0, 100)}
                              {JSON.stringify(event.updates).length > 100 ? '...' : ''}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {event.type === 'task:assigned' && (
                        <div>
                          Task {event.taskId.slice(0, 8)} assigned to agent {event.agentId.slice(0, 8)}
                        </div>
                      )}
                      
                      {event.type === 'task:completed' && (
                        <div>
                          Task {event.taskId.slice(0, 8)} completed
                        </div>
                      )}
                      
                      {event.type === 'agent:message' && (
                        <div>
                          Message from {event.from.slice(0, 8)} to {event.to.slice(0, 8)}:
                          <div className="mt-1 text-xs bg-dark-800 p-2 rounded">
                            {typeof event.content === 'string' 
                              ? event.content.slice(0, 100) + (event.content.length > 100 ? '...' : '')
                              : JSON.stringify(event.content).slice(0, 100) + '...'}
                          </div>
                        </div>
                      )}
                      
                      {event.type === 'swarm:broadcast' && (
                        <div>
                          Broadcast to swarm
                          <div className="mt-1 text-xs bg-dark-800 p-2 rounded">
                            {typeof event.message?.content === 'string'
                              ? event.message.content.slice(0, 100) + (event.message.content.length > 100 ? '...' : '')
                              : JSON.stringify(event.message?.content).slice(0, 100) + '...'}
                          </div>
                        </div>
                      )}
                      
                      {/* Generic handler for other events */}
                      {!['swarm:memory_updated', 'task:assigned', 'task:completed', 'agent:message', 'swarm:broadcast'].includes(event.type) && (
                        <div className="text-xs font-mono bg-dark-800 p-2 rounded overflow-x-auto">
                          {JSON.stringify(event).slice(0, 150)}...
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                
                {swarmEvents.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <SafeIcon icon={FiZap} className="w-8 h-8 mx-auto mb-2" />
                    <p>No events yet</p>
                    <p className="text-xs mt-1">Events will appear here as agents work</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Swarms Grid */}
            <AnimatePresence>
              {swarms.map((swarm) => (
                <motion.div
                  key={swarm.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-dark-800 border border-dark-700 rounded-lg p-6 hover:border-primary-500 transition-colors cursor-pointer"
                  onClick={() => setActiveSwarm(swarm)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                        <SafeIcon icon={FiUsers} className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{swarm.name}</h3>
                        <p className="text-sm text-gray-400">
                          {swarm.agentCount} agents
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusBgColor(swarm.status)}`} />
                      <span className={`text-xs ${getStatusColor(swarm.status)}`}>{swarm.status}</span>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                    {swarm.description || 'No description available'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center space-x-1">
                      <SafeIcon icon={FiClock} className="w-3 h-3" />
                      <span>{new Date(swarm.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <SafeIcon icon={FiBriefcase} className="w-3 h-3" />
                      <span>{swarm.tasks?.length || 0} tasks</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {swarms.length === 0 && (
              <div className="col-span-3 text-center py-12">
                <SafeIcon icon={FiUsers} className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No Swarms Yet</h3>
                <p className="text-gray-500 mb-6">Create your first agent swarm to get started</p>
                <button
                  onClick={() => setIsCreatingSwarm(true)}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                >
                  Create New Swarm
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Swarm Modal */}
      <AnimatePresence>
        {isCreatingSwarm && (
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
              <h3 className="text-xl font-semibold text-white mb-4">Create New Swarm</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Swarm Name
                  </label>
                  <input
                    type="text"
                    value={newSwarm.name}
                    onChange={(e) => setNewSwarm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 bg-dark-700 border border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="My Agent Swarm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Purpose
                  </label>
                  <textarea
                    value={newSwarm.description}
                    onChange={(e) => setNewSwarm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-3 bg-dark-700 border border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="What will this swarm accomplish?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Number of Agents
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="2"
                      max="10"
                      value={newSwarm.agentCount}
                      onChange={(e) => setNewSwarm(prev => ({ ...prev, agentCount: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="text-white font-medium">{newSwarm.agentCount}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Agent Roles
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {agentRoles.map(role => (
                      <div
                        key={role.id}
                        className="bg-dark-700 rounded-lg p-2 flex items-center space-x-2"
                      >
                        <SafeIcon icon={role.icon} className="w-4 h-4 text-primary-400" />
                        <div className="text-sm">
                          <div className="font-medium text-white">{role.name}</div>
                          <div className="text-xs text-gray-400">{role.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Your swarm will include a balanced mix of these roles
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsCreatingSwarm(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSwarm}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                >
                  Create Swarm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Task Modal */}
      <AnimatePresence>
        {isCreatingTask && (
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
              <h3 className="text-xl font-semibold text-white mb-4">Create New Task</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Task Type
                  </label>
                  <select
                    value={newTask.type}
                    onChange={(e) => setNewTask(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full p-3 bg-dark-700 border border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {taskTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-3 bg-dark-700 border border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={4}
                    placeholder="Describe what the swarm should accomplish"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Priority (1-10)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={newTask.priority}
                      onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                      className="flex-1"
                    />
                    <span className="text-white font-medium">{newTask.priority}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsCreatingTask(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTask}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                >
                  Create Task
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}