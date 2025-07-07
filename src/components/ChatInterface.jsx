import React, {useState, useRef, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import {useApp} from '../context/AppContext';
import {useSocket} from '../context/SocketContext';
import MessageBubble from './MessageBubble';
import CodeBlock from './CodeBlock';

const {FiSend, FiPaperclip, FiMic, FiStopCircle, FiRefreshCw, FiZap, FiActivity} = FiIcons;

export default function ChatInterface() {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const {chatHistory, addChatMessage, activeAgent, settings} = useApp();
  const {socket, emit, connected} = useSocket();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
  }, [chatHistory]);

  useEffect(() => {
    if (socket) {
      socket.on('message', (data) => {
        addChatMessage({
          id: Date.now(),
          type: 'assistant',
          content: data.content,
          timestamp: new Date(),
          agent: data.agent
        });
        setIsTyping(false);
      });

      socket.on('typing', (data) => {
        setIsTyping(data.isTyping);
      });

      socket.on('error', (error) => {
        addChatMessage({
          id: Date.now(),
          type: 'assistant',
          content: `Error: ${error.message}. Please check your API configuration.`,
          timestamp: new Date(),
          agent: 'System'
        });
        setIsTyping(false);
      });

      return () => {
        socket.off('message');
        socket.off('typing');
        socket.off('error');
      };
    }
  }, [socket, addChatMessage]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    addChatMessage(userMessage);
    setMessage('');
    setIsTyping(true);

    if (connected && socket) {
      // Send via Socket.IO if connected
      emit('message', {
        content: userMessage.content,
        agent: activeAgent,
        context: {
          chatHistory: chatHistory.slice(-10),
          settings,
          currentProject: null
        }
      });
    } else {
      // Fallback to HTTP API if Socket.IO not connected
      try {
        const response = await fetch(`/api/llm/test`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage.content,
            model: 'anthropic/claude-sonnet-4-0'
          }),
        });

        const data = await response.json();
        if (data.success) {
          addChatMessage({
            id: Date.now(),
            type: 'assistant',
            content: data.response,
            timestamp: new Date(),
            agent: 'Claude Sonnet-4'
          });
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
        addChatMessage({
          id: Date.now(),
          type: 'assistant',
          content: `Error: ${error.message}. Using Socket.IO fallback failed.`,
          timestamp: new Date(),
          agent: 'System'
        });
      } finally {
        setIsTyping(false);
      }
    }
  };

  const handleTestAPI = async () => {
    setIsTyping(true);
    setTestResults(null);
    try {
      console.log('🧪 Testing Requesty API...');
      const apiUrl = `/api/llm/test`;
      console.log('📡 API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Hello! This is a test message to verify the AI API connection works properly.',
          model: 'anthropic/claude-sonnet-4-0'
        }),
      });
      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Parsed response:', data);

      if (data.success) {
        addChatMessage({
          id: Date.now(),
          type: 'assistant',
          content: `✅ **API Test Successful!**\n\n**Model:** ${data.model || 'anthropic/claude-sonnet-4-0'}\n**Response:** ${data.response}\n\n*Connection to Requesty API is working properly.*`,
          timestamp: new Date(),
          agent: 'API Test'
        });
        setTestResults({success: true, model: data.model});
      } else {
        addChatMessage({
          id: Date.now(),
          type: 'assistant',
          content: `❌ **API Test Failed!**\n\n**Error:** ${data.error}\n\nPlease check your Requesty API key in the environment variables.`,
          timestamp: new Date(),
          agent: 'API Test'
        });
        setTestResults({success: false, error: data.error});
      }
    } catch (error) {
      console.error('❌ Test error:', error);
      addChatMessage({
        id: Date.now(),
        type: 'assistant',
        content: `❌ **Connection Error!**\n\n**Error:** ${error.message}\n\n**Troubleshooting:**\n- Check if Railway server is deployed and running\n- Verify environment variables are set\n- Check Railway logs for errors\n- Ensure CORS is configured correctly`,
        timestamp: new Date(),
        agent: 'System Error'
      });
      setTestResults({success: false, error: error.message});
    } finally {
      setIsTyping(false);
    }
  };

  const handleTestMultipleModels = async () => {
    setIsTyping(true);
    try {
      console.log('🧪 Testing multiple models...');
      const response = await fetch(`/api/llm/test-models`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        const resultsText = data.results.map(result => {
          if (result.status === 'success') {
            return `✅ **${result.model}** (${result.duration}ms): ${result.response}`;
          } else {
            return `❌ **${result.model}**: ${result.error}`;
          }
        }).join('\n\n');

        addChatMessage({
          id: Date.now(),
          type: 'assistant',
          content: `🧪 **Multi-Model Test Results**\n\n${resultsText}`,
          timestamp: new Date(),
          agent: 'Model Test'
        });
      } else {
        addChatMessage({
          id: Date.now(),
          type: 'assistant',
          content: `❌ **Model Test Failed!**\n\nError: ${data.error}`,
          timestamp: new Date(),
          agent: 'Model Test'
        });
      }
    } catch (error) {
      addChatMessage({
        id: Date.now(),
        type: 'assistant',
        content: `❌ **Model Test Error!**\n\nFailed to test models: ${error.message}`,
        timestamp: new Date(),
        agent: 'System Error'
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording
  };

  return (
    <div className="h-full flex flex-col bg-dark-900">
      {/* Chat Header */}
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
              <SafeIcon icon={FiIcons.FiCpu} className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-medium">
                {activeAgent?.name || 'Claude Sonnet-4'}
              </h3>
              <p className="text-sm text-gray-400">
                {activeAgent?.description || 'AI-powered development assistant with reasoning'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-lg ${connected ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span>{connected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <button
              onClick={handleTestAPI}
              disabled={isTyping}
              className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-700 rounded-lg transition-colors text-sm"
            >
              <SafeIcon icon={FiZap} className="w-4 h-4" />
              <span>Test API</span>
            </button>
            <button
              onClick={handleTestMultipleModels}
              disabled={isTyping}
              className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-700 rounded-lg transition-colors text-sm"
            >
              <SafeIcon icon={FiActivity} className="w-4 h-4" />
              <span>Test Models</span>
            </button>
            <button className="p-2 rounded-lg hover:bg-dark-700 transition-colors">
              <SafeIcon icon={FiRefreshCw} className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Connection Status & Test Results */}
        <div className="mt-2 space-y-2">
          {testResults && (
            <motion.div
              initial={{opacity: 0, height: 0}}
              animate={{opacity: 1, height: 'auto'}}
              className={`px-3 py-2 rounded-lg text-sm ${
                testResults.success
                  ? 'bg-green-900 bg-opacity-50 text-green-300 border border-green-700'
                  : 'bg-red-900 bg-opacity-50 text-red-300 border border-red-700'
              }`}
            >
              {testResults.success
                ? `✅ API Connected (${testResults.model})`
                : `❌ API Error: ${testResults.error}`}
            </motion.div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 && (
          <div className="text-center py-12">
            <SafeIcon icon={FiIcons.FiCpu} className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">Welcome to Swarm Agents</h3>
            <p className="text-gray-500 mb-6">Start a conversation with Claude Sonnet-4</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <button
                onClick={() => setMessage('Help me create a React component with reasoning')}
                className="p-4 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors text-left"
              >
                <h4 className="font-medium text-white mb-1">Create Components</h4>
                <p className="text-sm text-gray-400">Generate React components with AI reasoning</p>
              </button>
              <button
                onClick={() => setMessage('Review my code and explain your reasoning process')}
                className="p-4 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors text-left"
              >
                <h4 className="font-medium text-white mb-1">Code Review</h4>
                <p className="text-sm text-gray-400">Get detailed feedback with reasoning tokens</p>
              </button>
              <button
                onClick={() => setMessage('Help me debug this error with step-by-step reasoning')}
                className="p-4 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors text-left"
              >
                <h4 className="font-medium text-white mb-1">Debug Issues</h4>
                <p className="text-sm text-gray-400">Troubleshoot with transparent reasoning</p>
              </button>
              <button
                onClick={() => setMessage('Explain deployment strategies and show your reasoning')}
                className="p-4 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors text-left"
              >
                <h4 className="font-medium text-white mb-1">Deployment Help</h4>
                <p className="text-sm text-gray-400">Learn with detailed reasoning process</p>
              </button>
            </div>
          </div>
        )}

        <AnimatePresence>
          {chatHistory.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{opacity: 0, y: 20}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -20}}
              transition={{duration: 0.3}}
            >
              <MessageBubble message={msg} />
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            className="flex items-center space-x-2 text-gray-400"
          >
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
                style={{animationDelay: '0.1s'}}
              ></div>
              <div
                className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
                style={{animationDelay: '0.2s'}}
              ></div>
            </div>
            <span className="text-sm">Claude Sonnet-4 is reasoning...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-dark-700">
        <div className="flex items-end space-x-3">
          <button className="p-2 rounded-lg hover:bg-dark-700 transition-colors">
            <SafeIcon icon={FiPaperclip} className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              className="w-full p-3 bg-dark-800 border border-dark-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={1}
              style={{minHeight: '44px', maxHeight: '120px', overflow: 'auto'}}
              disabled={isTyping}
            />
          </div>
          <button
            onClick={toggleRecording}
            className={`p-2 rounded-lg transition-colors ${
              isRecording ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-dark-700'
            }`}
          >
            <SafeIcon icon={isRecording ? FiStopCircle : FiMic} className="w-5 h-5" />
          </button>
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isTyping}
            className="p-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-dark-600 disabled:cursor-not-allowed transition-colors"
          >
            <SafeIcon icon={FiSend} className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}