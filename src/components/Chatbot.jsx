import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Mic, Volume2, Trash2, User, Bot, AlertCircle } from 'lucide-react';
import { chatAPI } from '../services/api';

export default function Chatbot({ isDarkMode }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  // Welcome message
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: 'Hello! I\'m Dr. AI, your personal health assistant. How can I help you today? You can ask me about symptoms, general health advice, or wellness tips.',
        timestamp: new Date().toISOString()
      }
    ]);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);
    
    // Add user message
    const newUserMessage = { 
      role: 'user', 
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setLoading(true);

    try {
      console.log('Sending message:', userMessage);
      
      const response = await chatAPI.sendMessage({
        message: userMessage,
        sessionId: sessionId
      });

      console.log('Response received:', response.data);

      if (response.data.success) {
        const assistantMessage = {
          role: 'assistant', 
          content: response.data.response,
          emotion: response.data.emotion,
          timestamp: response.data.timestamp
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        if (!sessionId) {
          setSessionId(response.data.sessionId);
        }
      }
    } catch (error) {
      console.error('Chat error details:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = '🔒 Authentication error. Please log out and log in again.';
      } else if (error.response?.status === 500) {
        errorMessage = '⚠️ Server error. The backend might be down or having issues.';
      } else if (error.message.includes('Network Error')) {
        errorMessage = '🔌 Cannot connect to server. Please check if backend is running on port 5000.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      setError(errorMessage);
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMessage,
        isError: true,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Chat cleared! How can I help you today?',
        timestamp: new Date().toISOString()
      }
    ]);
    setSessionId(null);
    setError(null);
  };

  const quickQuestions = [
    "I have a headache, what should I do?",
    "How can I improve my sleep?",
    "What are symptoms of high blood pressure?",
    "Tips for staying healthy",
    "How much water should I drink daily?"
  ];

  const handleQuickQuestion = (question) => {
    setInput(question);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 h-[calc(100vh-200px)] flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className={`text-4xl font-bold flex items-center ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            <Bot className="w-10 h-10 mr-3 text-purple-500" />
            Dr. AI Health Assistant
          </h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
            24/7 AI-powered health guidance and support
          </p>
        </div>
        {messages.length > 1 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearChat}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition border border-red-500/30"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Chat</span>
          </motion.button>
        )}
      </motion.div>

      {/* Quick Questions - Show only when no messages */}
      {messages.length <= 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <p className={`text-sm mb-3 ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
            Quick questions to get started:
          </p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleQuickQuestion(question)}
                className={`px-4 py-2 rounded-xl text-sm transition ${
                  isDarkMode 
                    ? 'bg-white/5 text-purple-300 hover:bg-white/10 border border-purple-500/20' 
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                {question}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Messages Container */}
      <div className={`flex-1 overflow-y-auto p-6 rounded-2xl ${
        isDarkMode ? 'bg-white/5' : 'bg-white'
      } backdrop-blur-lg border ${
        isDarkMode ? 'border-purple-500/20' : 'border-purple-200'
      } mb-4 shadow-xl`}>
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
              >
                <Bot className={`w-20 h-20 mx-auto mb-4 ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`} />
              </motion.div>
              <h3 className={`text-xl font-bold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Hello! I'm Dr. AI
              </h3>
              <p className={`${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                Ask me anything about your health and wellness
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-3 max-w-[85%] ${
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                      : message.isError
                        ? 'bg-red-500/20'
                        : 'bg-gradient-to-r from-blue-600 to-cyan-600'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-6 h-6 text-white" />
                    ) : message.isError ? (
                      <AlertCircle className="w-6 h-6 text-red-400" />
                    ) : (
                      <Bot className="w-6 h-6 text-white" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`rounded-2xl px-5 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : message.isError
                        ? isDarkMode
                          ? 'bg-red-500/10 text-red-300 border border-red-500/30'
                          : 'bg-red-50 text-red-700 border border-red-200'
                        : isDarkMode
                          ? 'bg-white/10 text-white border border-purple-500/20'
                          : 'bg-gray-100 text-gray-900 border border-purple-200'
                  } shadow-lg`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    
                    {/* Emotion Badge */}
                    {message.emotion && !message.isError && (
                      <div className="mt-2 flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isDarkMode ? 'bg-white/10' : 'bg-purple-100'
                        }`}>
                          😊 Emotion: {message.emotion}
                        </span>
                      </div>
                    )}

                    {/* Timestamp */}
                    <p className={`text-xs mt-2 ${
                      message.role === 'user'
                        ? 'text-white/70'
                        : message.isError
                          ? isDarkMode ? 'text-red-400/70' : 'text-red-600/70'
                          : isDarkMode ? 'text-purple-300/70' : 'text-gray-500'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className={`rounded-2xl px-5 py-3 ${
                  isDarkMode ? 'bg-white/10' : 'bg-gray-100'
                } flex items-center space-x-2`}>
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                  <span className={`${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                    Dr. AI is thinking...
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={`p-4 rounded-2xl ${
          isDarkMode ? 'bg-white/5' : 'bg-white'
        } backdrop-blur-lg border ${
          isDarkMode ? 'border-purple-500/20' : 'border-purple-200'
        } shadow-xl`}
      >
        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-3 p-3 rounded-lg ${
              isDarkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
            } border flex items-start space-x-2`}
          >
            <AlertCircle className={`w-5 h-5 mt-0.5 ${
              isDarkMode ? 'text-red-400' : 'text-red-600'
            }`} />
            <div className="flex-1">
              <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                {error}
              </p>
            </div>
          </motion.div>
        )}

        <div className="flex space-x-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about your health... (Shift+Enter for new line)"
            className={`flex-1 px-4 py-3 rounded-xl resize-none max-h-32 ${
              isDarkMode 
                ? 'bg-white/5 text-white placeholder-purple-300/50' 
                : 'bg-gray-50 text-gray-900 placeholder-gray-400'
            } border ${
              isDarkMode ? 'border-purple-500/30' : 'border-purple-200'
            } focus:outline-none focus:border-purple-500 transition-colors`}
            rows="1"
            disabled={loading}
          />
          <motion.button
            whileHover={{ scale: loading || !input.trim() ? 1 : 1.05 }}
            whileTap={{ scale: loading || !input.trim() ? 1 : 0.95 }}
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span className="hidden sm:inline font-semibold">Send</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Info Text */}
        <p className={`text-xs mt-3 text-center ${
          isDarkMode ? 'text-purple-400/70' : 'text-purple-600/70'
        }`}>
          Press Enter to send • Shift+Enter for new line • AI responses are for educational purposes only
        </p>
      </motion.div>

      {/* Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={`mt-4 p-3 rounded-xl ${
          isDarkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'
        } border`}
      >
        <div className="flex items-start space-x-2">
          <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
            isDarkMode ? 'text-blue-400' : 'text-blue-600'
          }`} />
          <p className={`text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
            <strong>Medical Disclaimer:</strong> Dr. AI provides general health information for educational purposes only. 
            This is not a substitute for professional medical advice. Always consult with qualified healthcare providers 
            for medical concerns and before making health decisions.
          </p>
        </div>
      </motion.div>
    </div>
  );
}