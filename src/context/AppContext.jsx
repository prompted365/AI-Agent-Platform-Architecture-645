import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AppContext = createContext();

const initialState = {
  user: null,
  projects: [],
  currentProject: null,
  agents: [],
  activeAgent: null,
  settings: {
    theme: 'dark',
    autoSave: true,
    codeCompletion: true,
    llmProvider: 'requesty',
    apiKey: '',
    githubToken: '',
    astraToken: '',
    astraEndpoint: '',
    railwayToken: ''
  },
  chatHistory: [],
  isLoading: false,
  error: null
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'SET_CURRENT_PROJECT':
      return { ...state, currentProject: action.payload };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p => 
          p.id === action.payload.id ? action.payload : p
        )
      };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload)
      };
    case 'SET_AGENTS':
      return { ...state, agents: action.payload };
    case 'SET_ACTIVE_AGENT':
      return { ...state, activeAgent: action.payload };
    case 'ADD_AGENT':
      return { ...state, agents: [...state.agents, action.payload] };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatHistory: [...state.chatHistory, action.payload] };
    case 'SET_CHAT_HISTORY':
      return { ...state, chatHistory: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('claude-code-settings');
    if (savedSettings) {
      dispatch({ type: 'UPDATE_SETTINGS', payload: JSON.parse(savedSettings) });
    }
  }, []);

  useEffect(() => {
    // Save settings to localStorage
    localStorage.setItem('claude-code-settings', JSON.stringify(state.settings));
  }, [state.settings]);

  const value = {
    ...state,
    dispatch,
    // Helper functions
    setUser: (user) => dispatch({ type: 'SET_USER', payload: user }),
    setProjects: (projects) => dispatch({ type: 'SET_PROJECTS', payload: projects }),
    setCurrentProject: (project) => dispatch({ type: 'SET_CURRENT_PROJECT', payload: project }),
    addProject: (project) => dispatch({ type: 'ADD_PROJECT', payload: project }),
    updateProject: (project) => dispatch({ type: 'UPDATE_PROJECT', payload: project }),
    deleteProject: (id) => dispatch({ type: 'DELETE_PROJECT', payload: id }),
    setAgents: (agents) => dispatch({ type: 'SET_AGENTS', payload: agents }),
    setActiveAgent: (agent) => dispatch({ type: 'SET_ACTIVE_AGENT', payload: agent }),
    addAgent: (agent) => dispatch({ type: 'ADD_AGENT', payload: agent }),
    updateSettings: (settings) => dispatch({ type: 'UPDATE_SETTINGS', payload: settings }),
    addChatMessage: (message) => dispatch({ type: 'ADD_CHAT_MESSAGE', payload: message }),
    setChatHistory: (history) => dispatch({ type: 'SET_CHAT_HISTORY', payload: history }),
    setLoading: (loading) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error) => dispatch({ type: 'SET_ERROR', payload: error }),
    clearError: () => dispatch({ type: 'CLEAR_ERROR' })
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}