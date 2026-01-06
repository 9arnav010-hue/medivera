import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, LogOut, Settings, Sun, Moon, ChevronDown, Activity 
} from 'lucide-react';

const Navigation = ({ 
  isDarkMode, 
  setIsDarkMode, 
  user, 
  setCurrentPage, 
  handleLogout 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Force re-render when user changes
  useEffect(() => {
    // This ensures avatar updates when user object changes
    if (user?.avatar) {
      console.log('User avatar updated:', user.avatar.substring(0, 50));
    }
  }, [user?.avatar]);

  return (
    <nav className={`${
      isDarkMode ? 'bg-gray-900/95 border-purple-500/20' : 'bg-white/95 border-purple-200'
    } backdrop-blur-xl border-b sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Medivéra
              </h1>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                by Aksh & Arnav
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                isDarkMode 
                  ? 'text-purple-300 hover:bg-purple-900/30' 
                  : 'text-purple-700 hover:bg-purple-100'
              }`}
            >
              <Activity className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>

            <button
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                isDarkMode 
                  ? 'text-gray-300 hover:bg-gray-800' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="font-medium">Features</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg transition-all ${
                isDarkMode 
                  ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* User Profile Dropdown with Avatar */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                  isDarkMode 
                    ? 'bg-purple-900/30 hover:bg-purple-900/50' 
                    : 'bg-purple-100 hover:bg-purple-200'
                }`}
              >
                {/* Profile Picture Avatar */}
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center ring-2 ring-purple-500/50">
                  {user?.avatar ? (
                    <img 
                      key={user.avatar} // Force re-render on avatar change
                      src={user.avatar} 
                      alt={user.name || 'User'} 
                      className="w-full h-full object-cover"
                      onLoad={() => console.log('Avatar loaded successfully')}
                      onError={(e) => {
                        console.error('Avatar failed to load');
                        e.target.style.display = 'none';
                        const fallback = document.createElement('span');
                        fallback.className = 'text-white text-sm font-bold';
                        fallback.textContent = user?.name?.[0]?.toUpperCase() || 'U';
                        e.target.parentElement.appendChild(fallback);
                      }}
                    />
                  ) : (
                    <span className="text-white text-sm font-bold">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>

                {/* User Name and Level */}
                <div className="text-left hidden sm:block">
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user?.name || 'User'}
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Level {user?.level || 1}
                  </p>
                </div>

                <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={`absolute right-0 mt-2 w-64 rounded-xl shadow-xl border overflow-hidden ${
                      isDarkMode 
                        ? 'bg-gray-900 border-purple-500/20' 
                        : 'bg-white border-purple-200'
                    }`}
                  >
                    {/* User Info Section */}
                    <div className={`p-4 border-b ${
                      isDarkMode ? 'border-purple-500/20' : 'border-purple-200'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                          {user?.avatar ? (
                            <img 
                              key={user.avatar}
                              src={user.avatar} 
                              alt={user.name || 'User'} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-lg font-bold">
                              {user?.name?.[0]?.toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {user?.name || 'User'}
                          </p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {user?.email}
                          </p>
                        </div>
                      </div>
                      
                      {/* Quick Stats */}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className={`text-center p-2 rounded-lg ${
                          isDarkMode ? 'bg-purple-900/30' : 'bg-purple-50'
                        }`}>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Level</p>
                          <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {user?.level || 1}
                          </p>
                        </div>
                        <div className={`text-center p-2 rounded-lg ${
                          isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'
                        }`}>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>XP</p>
                          <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {user?.xp || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setCurrentPage('profile');
                          setShowDropdown(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 transition-colors ${
                          isDarkMode 
                            ? 'hover:bg-purple-900/30 text-gray-300' 
                            : 'hover:bg-purple-50 text-gray-700'
                        }`}
                      >
                        <User className="w-5 h-5" />
                        <span>My Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setCurrentPage('dashboard');
                          setShowDropdown(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 transition-colors ${
                          isDarkMode 
                            ? 'hover:bg-purple-900/30 text-gray-300' 
                            : 'hover:bg-purple-50 text-gray-700'
                        }`}
                      >
                        <Settings className="w-5 h-5" />
                        <span>Settings</span>
                      </button>

                      <div className={`my-2 border-t ${
                        isDarkMode ? 'border-purple-500/20' : 'border-purple-200'
                      }`} />

                      <button
                        onClick={() => {
                          handleLogout();
                          setShowDropdown(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 transition-colors ${
                          isDarkMode 
                            ? 'hover:bg-red-900/20 text-red-400' 
                            : 'hover:bg-red-50 text-red-600'
                        }`}
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;