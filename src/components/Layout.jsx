import React, { useState, useEffect } from 'react';
import { Stethoscope } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Activity, FileText, MessageSquare, Camera, 
  LogOut, Sun, Moon, Menu, X, User, ChevronDown,
  Footprints, Sparkles
} from 'lucide-react';
import { achievementAPI } from '../services/api';

export default function Layout({ children, currentPage, setCurrentPage, isDarkMode, setIsDarkMode, handleLogout, user }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFeaturesDropdown, setShowFeaturesDropdown] = useState(false);
  const [localUser, setLocalUser] = useState(user);
  const [userStats, setUserStats] = useState(null);

  // Fetch user stats for navigation display
  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      const response = await achievementAPI.getUserStats();
      if (response.data.success) {
        setUserStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching user stats in Layout:', error);
    }
  };

  // Listen for user updates (avatar changes)
  useEffect(() => {
    const handleUserUpdate = () => {
      const updatedUser = localStorage.getItem('healthsphere_user');
      if (updatedUser) {
        try {
          const parsedUser = JSON.parse(updatedUser);
          console.log('Layout: User updated from event', parsedUser);
          setLocalUser(parsedUser);
        } catch (error) {
          console.error('Error parsing user in Layout:', error);
        }
      }
      // Also refresh stats when user updates
      fetchUserStats();
    };
    
    window.addEventListener('userUpdated', handleUserUpdate);
    return () => window.removeEventListener('userUpdated', handleUserUpdate);
  }, []);

  // Update localUser when user prop changes
  useEffect(() => {
    if (user) {
      setLocalUser(user);
    }
  }, [user]);

  // Features list
  const features = [
    { id: 'report', icon: FileText, label: 'Report Analyzer', description: 'Analyze medical reports', gradient: 'from-purple-600 to-pink-600' },
    { id: 'chat', icon: MessageSquare, label: 'Dr. AI Chat', description: 'Get health advice', gradient: 'from-blue-600 to-cyan-600' },
    { id: 'vision', icon: Camera, label: 'VisionCare+', description: 'Medical image analysis', gradient: 'from-green-600 to-emerald-600' },
    { 
    id: 'symptom', 
    icon: Stethoscope, 
    label: 'Symptom Checker', 
    description: 'AI symptom analysis',
    gradient: 'from-blue-600 to-cyan-600'
  },
    { id: 'runner', icon: Footprints, label: 'LazySense', description: 'Track runs & compete', gradient: 'from-cyan-600 to-teal-600' }
  ];

  const handleFeatureClick = (featureId) => {
    setCurrentPage(featureId);
    setShowFeaturesDropdown(false);
  };

  const isFeaturePage = ['report', 'chat', 'vision', 'runner', 'run', 'territories', 'leaderboard', 'challenges', 'teams'].includes(currentPage);

  // Get stats for display
  const displayLevel = userStats?.level || 1;
  const displayXP = userStats?.totalXP || 0;
  const displayBadges = userStats?.badges?.length || 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Animated Background */}
      <AnimatedBackground isDarkMode={isDarkMode} />

      {/* Navigation */}
      <nav className={`relative z-20 ${
        isDarkMode ? 'bg-gray-900/90' : 'bg-white/90'
      } backdrop-blur-xl border-b ${
        isDarkMode ? 'border-purple-500/20' : 'border-purple-200'
      } sticky top-0 shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => setCurrentPage('dashboard')}
            >
              <Heart className="w-8 h-8 text-pink-500 animate-pulse" />
              <div>
                <h1 className={`text-xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Medivéra
                </h1>
                <p className="text-xs text-purple-400">by Aksh & Arnav</p>
              </div>
            </motion.div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-2">
              {/* Dashboard Button */}
              <NavButton 
                icon={Activity} 
                label="Dashboard" 
                onClick={() => setCurrentPage('dashboard')} 
                active={currentPage === 'dashboard'} 
                isDarkMode={isDarkMode} 
              />

              {/* Features Dropdown */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowFeaturesDropdown(!showFeaturesDropdown)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    isFeaturePage
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50' 
                      : isDarkMode 
                        ? 'text-gray-300 hover:bg-gray-800' 
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                  <span className="font-medium">Features</span>
                  <motion.div
                    animate={{ rotate: showFeaturesDropdown ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </motion.button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showFeaturesDropdown && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowFeaturesDropdown(false)}
                      />
                      
                      {/* Dropdown Content */}
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`absolute left-0 mt-2 w-80 rounded-xl shadow-2xl border overflow-hidden z-50 ${
                          isDarkMode 
                            ? 'bg-gray-900 border-purple-500/20' 
                            : 'bg-white border-purple-200'
                        }`}
                      >
                        {features.map((feature, index) => (
                          <motion.button
                            key={feature.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleFeatureClick(feature.id)}
                            className={`w-full px-4 py-4 flex items-center space-x-3 transition-all border-b last:border-b-0 ${
                              isDarkMode 
                                ? 'border-purple-500/10 hover:bg-purple-900/20' 
                                : 'border-purple-100 hover:bg-purple-50'
                            } ${
                              currentPage === feature.id 
                                ? isDarkMode 
                                  ? 'bg-purple-900/30' 
                                  : 'bg-purple-100' 
                                : ''
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                              <feature.icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 text-left">
                              <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {feature.label}
                              </p>
                              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {feature.description}
                              </p>
                            </div>
                          </motion.button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg ${
                  isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-200 text-gray-700'
                } hover:shadow-lg transition-all`}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.button>

              {/* User Menu with Avatar */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
                  } hover:shadow-lg transition-all`}
                >
                  {/* Avatar with Image Support */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden ring-2 ring-purple-500/50">
                    {localUser?.avatar ? (
                      <img 
                        key={localUser.avatar}
                        src={localUser.avatar} 
                        alt={localUser.name || 'User'} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Avatar failed to load in Layout');
                          e.target.style.display = 'none';
                          const fallback = document.createElement('span');
                          fallback.className = 'text-white font-bold text-sm';
                          fallback.textContent = localUser?.name?.[0]?.toUpperCase() || 'U';
                          e.target.parentElement.appendChild(fallback);
                        }}
                      />
                    ) : (
                      <span className="text-white font-bold text-sm">
                        {localUser?.name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="font-medium text-sm">{localUser?.name || 'User'}</p>
                    <p className="text-xs text-purple-400">Level {displayLevel}</p>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </motion.button>

                <AnimatePresence>
                  {showUserMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowUserMenu(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`absolute right-0 mt-2 w-48 rounded-xl ${
                          isDarkMode ? 'bg-gray-800 border-purple-500/20' : 'bg-white border-gray-200'
                        } border shadow-xl overflow-hidden z-50`}
                      >
                        <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                          <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {localUser?.name || 'User'}
                          </p>
                          <p className="text-xs text-purple-400">
                            Level {displayLevel} • {displayXP} XP
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setCurrentPage('profile');
                            setShowUserMenu(false);
                          }}
                          className={`w-full flex items-center space-x-3 px-4 py-3 border-b ${
                            isDarkMode ? 'hover:bg-gray-700 text-white border-gray-700' : 'hover:bg-gray-50 text-gray-900 border-gray-200'
                          } transition`}
                        >
                          <User className="w-5 h-5 text-purple-500" />
                          <span>Profile</span>
                        </button>
                        <button
                          onClick={handleLogout}
                          className={`w-full flex items-center space-x-3 px-4 py-3 ${
                            isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-900'
                          } transition`}
                        >
                          <LogOut className="w-5 h-5 text-red-500" />
                          <span>Logout</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="md:hidden p-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition"
            >
              {showMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`md:hidden ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              } border-t ${
                isDarkMode ? 'border-purple-500/20' : 'border-purple-200'
              }`}
            >
              <div className="px-4 py-4 space-y-2">
                {/* User Info in Mobile */}
                <div className={`flex items-center space-x-3 p-3 rounded-lg mb-3 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center overflow-hidden ring-2 ring-purple-500/50">
                    {localUser?.avatar ? (
                      <img 
                        src={localUser.avatar} 
                        alt={localUser.name || 'User'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold">
                        {localUser?.name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {localUser?.name || 'User'}
                    </p>
                    <p className="text-xs text-purple-400">
                      Level {displayLevel} • {displayXP} XP
                    </p>
                  </div>
                </div>

                <MobileNavButton 
                  icon={Activity} 
                  label="Dashboard" 
                  onClick={() => { setCurrentPage('dashboard'); setShowMenu(false); }} 
                  isDarkMode={isDarkMode} 
                />
                
                {/* Features Section in Mobile */}
                <div className={`text-xs font-bold uppercase tracking-wider px-4 py-2 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  Features
                </div>
                
                {features.map((feature) => (
                  <MobileNavButton 
                    key={feature.id}
                    icon={feature.icon} 
                    label={feature.label} 
                    onClick={() => { setCurrentPage(feature.id); setShowMenu(false); }} 
                    isDarkMode={isDarkMode}
                    active={currentPage === feature.id}
                  />
                ))}
                
                <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} my-2`} />
                
                <MobileNavButton 
                  icon={User} 
                  label="My Profile" 
                  onClick={() => { setCurrentPage('profile'); setShowMenu(false); }} 
                  isDarkMode={isDarkMode}
                  active={currentPage === 'profile'}
                />
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className={`relative z-10 py-6 border-t ${
        isDarkMode ? 'border-purple-500/20 bg-gray-900/50' : 'border-purple-200 bg-white/50'
      } backdrop-blur-lg mt-auto`}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className={`${isDarkMode ? 'text-purple-300' : 'text-purple-600'} text-sm`}>
            © 2026 Medivéra - Created by <span className="font-bold">Aksh & Arnav</span>
          </p>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`}>
            The Future of Human-Centered Healthcare
          </p>
        </div>
      </footer>
    </div>
  );
}

function NavButton({ icon: Icon, label, onClick, active, isDarkMode }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
        active 
          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50' 
          : isDarkMode 
            ? 'text-gray-300 hover:bg-gray-800' 
            : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </motion.button>
  );
}

function MobileNavButton({ icon: Icon, label, onClick, isDarkMode, active }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
        active
          ? isDarkMode
            ? 'bg-purple-900/30 text-purple-300'
            : 'bg-purple-100 text-purple-700'
          : isDarkMode 
            ? 'text-gray-300 hover:bg-gray-700' 
            : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </motion.button>
  );
}

function AnimatedBackground({ isDarkMode }) {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className={`absolute inset-0 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20' 
          : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
      }`} />
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-2 h-2 ${
            isDarkMode ? 'bg-purple-400' : 'bg-purple-300'
          } rounded-full opacity-20`}
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
          }}
          animate={{
            y: [null, Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000)],
            x: [null, Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000)],
          }}
          transition={{
            duration: Math.random() * 15 + 10,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      ))}
    </div>
  );
}