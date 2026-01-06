import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Original Pages
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import Profile from './components/Profile';
import SymptomChecker from './components/SymptomChecker';

// Original Components
import Dashboard from './components/Dashboard.jsx';
import ReportAnalyzer from './components/ReportAnalyzer.jsx';
import Chatbot from './components/Chatbot.jsx';
import VisionCare from './components/VisionCare.jsx';
import Layout from './components/Layout.jsx';
import SplashScreen from './components/SplashScreen.jsx';
import RequireUser from './components/RequireUser.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// LazySense Components
import RunnerDashboard from './components/RunnerDashboard';
import MapTracker from './components/MapTracker';
import TerritoryMap from './components/TerritoryMap';
import Leaderboard from './components/Leaderboard';
import Challenges from './components/Challenges';
import SafeTeamsWrapper from './components/SafeTeamsWrapper';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  // Shared stats state between Dashboard and Profile
  const [stats, setStats] = useState({
    totalChats: 0,
    totalReports: 0,
    totalVisionAnalysis: 0,
    achievementProgress: {
      completed: 0,
      total: 56,
      percentage: 0
    }
  });

  // Function to fetch stats (will be called by Profile)
  const fetchStats = async () => {
    // The Dashboard component will handle the actual fetching
    // This is just a placeholder that Profile can call
    console.log('fetchStats called from Profile');
  };

  // Listen for user updates (avatar changes)
  useEffect(() => {
    const handleUserUpdate = () => {
      const updatedUser = localStorage.getItem('healthsphere_user');
      if (updatedUser) {
        try {
          const parsedUser = JSON.parse(updatedUser);
          console.log('User updated from event:', parsedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error('Error parsing updated user:', error);
        }
      }
    };
    
    window.addEventListener('userUpdated', handleUserUpdate);
    return () => window.removeEventListener('userUpdated', handleUserUpdate);
  }, []);

  useEffect(() => {
    // Check for stored auth token
    const token = localStorage.getItem('healthsphere_token') || localStorage.getItem('token');
    const storedUser = localStorage.getItem('healthsphere_user');
    
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('Loaded user from localStorage:', parsedUser);
        
        // Ensure user has _id field (some backends use 'id' instead of '_id')
        if (!parsedUser._id && parsedUser.id) {
          parsedUser._id = parsedUser.id;
        }
        
        // Validate that user has required fields
        if (parsedUser && (parsedUser._id || parsedUser.id)) {
          setIsLoggedIn(true);
          setUser(parsedUser);
          setCurrentPage('dashboard');
        } else {
          console.error('User object missing ID field:', parsedUser);
          // Clear invalid user data
          localStorage.removeItem('healthsphere_token');
          localStorage.removeItem('healthsphere_user');
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Clear corrupted data
        localStorage.removeItem('healthsphere_token');
        localStorage.removeItem('healthsphere_user');
        localStorage.removeItem('token');
      }
    }

    // Check dark mode preference
    const darkModePreference = localStorage.getItem('healthsphere_darkmode');
    if (darkModePreference !== null) {
      setIsDarkMode(darkModePreference === 'true');
    }

    // Splash screen
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Save dark mode preference
    localStorage.setItem('healthsphere_darkmode', isDarkMode);
  }, [isDarkMode]);

  const handleLogout = () => {
    localStorage.removeItem('healthsphere_token');
    localStorage.removeItem('healthsphere_user');
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
    setCurrentPage('home');
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <ErrorBoundary isDarkMode={isDarkMode} onReset={() => setCurrentPage('dashboard')}>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      {isLoggedIn ? (
        <Layout
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          handleLogout={handleLogout}
          user={user}
        >
          <AnimatePresence mode="wait">
            {/* Dashboard with stats props */}
            {currentPage === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Dashboard 
                  user={user} 
                  isDarkMode={isDarkMode} 
                  setCurrentPage={setCurrentPage}
                  stats={stats}
                  setStats={setStats}
                />
              </motion.div>
            )}
            
            {currentPage === 'report' && (
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ReportAnalyzer isDarkMode={isDarkMode} />
              </motion.div>
            )}
            
            {currentPage === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Chatbot isDarkMode={isDarkMode} />
              </motion.div>
            )}
            
            {currentPage === 'vision' && (
              <motion.div
                key="vision"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <VisionCare isDarkMode={isDarkMode} />
              </motion.div>
            )}

            {/* Symptom Checker - NEW! */}
            {currentPage === 'symptom' && (
              <motion.div
                key="symptom"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SymptomChecker isDarkMode={isDarkMode} />
              </motion.div>
            )}

            {/* Profile with stats props */}
            {currentPage === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <RequireUser user={user} isDarkMode={isDarkMode}>
                  <Profile 
                    isDarkMode={isDarkMode} 
                    user={user} 
                    setUser={setUser}
                    stats={stats}
                    fetchStats={fetchStats}
                  />
                </RequireUser>
              </motion.div>
            )}

            {/* LazySense Features */}
            {currentPage === 'runner' && (
              <motion.div
                key="runner"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <RequireUser user={user} isDarkMode={isDarkMode}>
                  <RunnerDashboard isDarkMode={isDarkMode} setCurrentPage={setCurrentPage} user={user} />
                </RequireUser>
              </motion.div>
            )}

            {currentPage === 'run' && (
              <motion.div
                key="run"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <MapTracker isDarkMode={isDarkMode} setCurrentPage={setCurrentPage} />
              </motion.div>
            )}

            {currentPage === 'territories' && (
              <motion.div
                key="territories"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <TerritoryMap isDarkMode={isDarkMode} setCurrentPage={setCurrentPage} />
              </motion.div>
            )}

            {currentPage === 'leaderboard' && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Leaderboard isDarkMode={isDarkMode} setCurrentPage={setCurrentPage} />
              </motion.div>
            )}

            {currentPage === 'challenges' && (
              <motion.div
                key="challenges"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Challenges isDarkMode={isDarkMode} setCurrentPage={setCurrentPage} />
              </motion.div>
            )}

            {currentPage === 'teams' && (
              <motion.div
                key="teams"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SafeTeamsWrapper isDarkMode={isDarkMode} setCurrentPage={setCurrentPage} user={user} />
              </motion.div>
            )}
          </AnimatePresence>
        </Layout>
      ) : (
        <AnimatePresence mode="wait">
          {currentPage === 'home' && (
            <Home 
              key="home" 
              setCurrentPage={setCurrentPage} 
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
            />
          )}
          {currentPage === 'login' && (
            <Login 
              key="login" 
              setCurrentPage={setCurrentPage} 
              setIsLoggedIn={setIsLoggedIn} 
              setUser={setUser}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
            />
          )}
          {currentPage === 'register' && (
            <Register 
              key="register" 
              setCurrentPage={setCurrentPage}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
            />
          )}
          {currentPage === 'verify-email' && (
            <VerifyEmail 
              key="verify-email"
              setCurrentPage={setCurrentPage}
              isDarkMode={isDarkMode}
            />
          )}
        </AnimatePresence>
      )}
    </div>
    </ErrorBoundary>
  );
}

export default App;