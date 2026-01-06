import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Map, 
  Trophy, 
  Target, 
  Users, 
  TrendingUp,
  Footprints,
  ArrowLeft
} from 'lucide-react';
import axios from 'axios';

const RunnerDashboard = ({ isDarkMode, setCurrentPage, user }) => {
  const [stats, setStats] = useState(null);
  const [recentRuns, setRecentRuns] = useState([]);
  const [userTeams, setUserTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('healthsphere_token');
      
      if (!token) {
        setDefaultValues();
        setLoading(false);
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const results = await Promise.allSettled([
        axios.get(`${API_URL}/auth/me`, config).catch(() => null),
        axios.get(`${API_URL}/runs/user?limit=5`, config).catch(() => null),
        axios.get(`${API_URL}/teams/my-teams`, config).catch(() => null)
      ]);

      if (results[0].status === 'fulfilled' && results[0].value) {
        setStats(results[0].value.data.user || results[0].value.data);
      } else {
        setDefaultValues();
      }

      if (results[1].status === 'fulfilled' && results[1].value) {
        setRecentRuns(results[1].value.data.runs || []);
      }

      if (results[2].status === 'fulfilled' && results[2].value) {
        setUserTeams(results[2].value.data.teams || []);
      }

    } catch (error) {
      console.log('Error loading dashboard:', error.message);
      setDefaultValues();
    } finally {
      setLoading(false);
    }
  };

  const setDefaultValues = () => {
    setStats({
      name: user?.name || 'Runner',
      totalDistance: 0,
      totalRuns: 0,
      points: 0,
      level: 1,
      totalTerritories: 0,
      totalArea: 0
    });
  };

  const formatDistance = (distance) => {
    return distance ? distance.toFixed(2) : '0.00';
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0h 0m';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-purple-300' : 'text-purple-600'}>Loading LazySense...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      id: 'run',
      title: 'Start Running',
      description: 'Track your run in real-time',
      icon: Play,
      gradient: 'from-purple-600 to-pink-600',
      emoji: '🏃'
    },
    {
      id: 'territories',
      title: 'Territories',
      description: 'View and capture zones',
      icon: Map,
      gradient: 'from-purple-600 to-indigo-600',
      emoji: '🗺️'
    },
    {
      id: 'leaderboard',
      title: 'Leaderboard',
      description: 'See global rankings',
      icon: Trophy,
      gradient: 'from-purple-600 to-violet-600',
      emoji: '🏆'
    },
    {
      id: 'challenges',
      title: 'Challenges',
      description: 'Complete daily tasks',
      icon: Target,
      gradient: 'from-purple-600 to-fuchsia-600',
      emoji: '🎯'
    },
    {
      id: 'teams',
      title: 'Teams',
      description: 'Join or create teams',
      icon: Users,
      gradient: 'from-purple-600 to-rose-600',
      emoji: '👥'
    }
  ];

  const quickStats = [
    {
      label: 'Total Distance',
      value: `${formatDistance(stats?.totalDistance)} km`,
      emoji: '🏃'
    },
    {
      label: 'Total Runs',
      value: stats?.totalRuns || 0,
      emoji: '👟'
    },
    {
      label: 'Points',
      value: stats?.points || 0,
      emoji: '⭐'
    },
    {
      label: 'Territories',
      value: stats?.totalTerritories || 0,
      emoji: '🗺️'
    },
    {
      label: 'Teams',
      value: userTeams.length,
      emoji: '👥'
    },
    {
      label: 'Level',
      value: stats?.level || 1,
      emoji: '🎖️'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setCurrentPage('dashboard')}
        className={`mb-6 flex items-center space-x-2 px-4 py-2 rounded-lg ${
          isDarkMode ? 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
        } transition-colors`}
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Dashboard</span>
      </motion.button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center mb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/50">
            <Footprints className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className={`text-4xl md:text-5xl font-bold mb-2 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Welcome back, {stats?.name || user?.name || 'Runner'}! 🏃‍♂️
        </h1>
        <p className={`text-lg ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
          Ready to claim more territory? Track your runs and compete with others
        </p>
      </motion.div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {quickStats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
            className={`${
              isDarkMode ? 'bg-purple-900/20 border-purple-500/20' : 'bg-white border-purple-200'
            } backdrop-blur-xl rounded-xl p-4 border text-center hover:scale-105 transition-transform cursor-pointer`}
          >
            <div className="text-3xl mb-2">{stat.emoji}</div>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
              {stat.label}
            </p>
            <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Main Feature Buttons */}
      <div className="mb-8">
        <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.button
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                onClick={() => setCurrentPage(feature.id)}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className={`${
                  isDarkMode ? 'bg-purple-900/20 border-purple-500/20' : 'bg-white border-purple-200'
                } backdrop-blur-xl rounded-2xl p-8 border shadow-xl hover:shadow-purple-500/50 hover:shadow-2xl transition-all text-left group`}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="text-5xl">{feature.emoji}</div>
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                  {feature.title}
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {feature.description}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className={`${
          isDarkMode ? 'bg-purple-900/20 border-purple-500/20' : 'bg-white border-purple-200'
        } backdrop-blur-xl rounded-2xl p-8 border mb-8`}
      >
        <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Recent Runs
        </h2>

        {recentRuns.length === 0 ? (
          <div className="text-center py-12">
            <Footprints className={`w-16 h-16 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-4`} />
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
              No runs yet. Start your first run to see your activity here!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage('run')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all inline-flex items-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>Start Your First Run 🏃</span>
            </motion.button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentRuns.map((run) => (
              <div
                key={run._id}
                className={`border ${
                  isDarkMode ? 'border-purple-700 hover:bg-purple-900/10' : 'border-purple-200 hover:bg-purple-50'
                } rounded-lg p-4 cursor-pointer transition`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatDistance(run.distance)} km
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {new Date(run.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {formatDuration(run.duration)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Motivational Banner - Single Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.0 }}
        className={`bg-gradient-to-r ${
          isDarkMode 
            ? 'from-purple-900/40 via-pink-900/40 to-indigo-900/40 border-purple-500/20' 
            : 'from-purple-100 via-pink-100 to-indigo-100 border-purple-200'
        } backdrop-blur-xl rounded-2xl p-8 border text-center`}
      >
        <TrendingUp className={`w-12 h-12 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'} mx-auto mb-4`} />
        <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
          Ready to Run?
        </h3>
        <p className={`${isDarkMode ? 'text-purple-300' : 'text-purple-600'} mb-6`}>
          Every step counts. Start tracking your runs and capturing territories today!
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentPage('run')}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all inline-flex items-center space-x-2"
        >
          <Play className="w-5 h-5" />
          <span>Start Running</span>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default RunnerDashboard;