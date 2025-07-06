import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import CodeEditor from './components/CodeEditor';
import ProjectManager from './components/ProjectManager';
import Settings from './components/Settings';
import AgentDashboard from './components/AgentDashboard';
import SwarmBoard from './components/SwarmBoard';
import ConversationHub from './components/ConversationHub';
import AuthGuard from './components/AuthGuard';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState('conversations');

  return (
    <AuthProvider>
      <AuthGuard>
        <AppProvider>
          <SocketProvider>
            <div className="min-h-screen bg-dark-900 text-white flex">
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.div
                    initial={{ x: -280 }}
                    animate={{ x: 0 }}
                    exit={{ x: -280 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed inset-y-0 left-0 z-50 w-70 bg-dark-800 border-r border-dark-700 lg:relative lg:translate-x-0"
                  >
                    <Sidebar
                      currentView={currentView}
                      setCurrentView={setCurrentView}
                      setSidebarOpen={setSidebarOpen}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex-1 flex flex-col">
                <Header
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                  currentView={currentView}
                />
                <main className="flex-1 overflow-hidden">
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5 }}
                          className="h-full"
                        >
                          {currentView === 'conversations' && <ConversationHub />}
                          {currentView === 'chat' && <ChatInterface />}
                          {currentView === 'code' && <CodeEditor />}
                          {currentView === 'projects' && <ProjectManager />}
                          {currentView === 'agents' && <AgentDashboard />}
                          {currentView === 'swarm' && <SwarmBoard />}
                          {currentView === 'settings' && <Settings />}
                        </motion.div>
                      }
                    />
                  </Routes>
                </main>
              </div>
            </div>
          </SocketProvider>
        </AppProvider>
      </AuthGuard>
    </AuthProvider>
  );
}

export default App;