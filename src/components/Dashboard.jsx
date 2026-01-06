import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Heart, MessageSquare, Award, FileText, 
  Camera, TrendingUp, Zap, Brain, Shield, Clock, 
  Users, Trophy, Star, Target, ChevronRight, X,
  Footprints
} from 'lucide-react';
import { achievementAPI } from '../services/api';
import Achievements from './Achievements';

export default function Dashboard({ user, isDarkMode, setCurrentPage, stats: appStats, setStats: setAppStats }) {
  const [localStats, setLocalStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [showAchievements, setShowAchievements] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Dashboard: Fetching stats...');
      
      const [statsResponse, achievementsResponse] = await Promise.all([
        achievementAPI.getUserStats(),
        achievementAPI.getAchievements()
      ]);

      console.log('Dashboard: Stats response:', statsResponse.data);

      if (statsResponse.data.success) {
        const fetchedStats = statsResponse.data;
        setLocalStats(fetchedStats);
        
        // CRITICAL FIX: Update App.jsx stats state for Profile
        if (setAppStats) {
          const updatedAppStats = {
            totalChats: fetchedStats.stats?.totalChats || 0,
            totalReports: fetchedStats.stats?.totalReports || 0,
            totalVisionAnalysis: fetchedStats.stats?.totalVisionAnalysis || 0,
            achievementProgress: {
              completed: fetchedStats.achievementProgress?.completed || 0,
              total: fetchedStats.achievementProgress?.total || 56,
              percentage: fetchedStats.achievementProgress?.percentage || 0
            }
          };
          
          console.log('Dashboard: Updating App stats:', updatedAppStats);
          setAppStats(updatedAppStats);
        } else {
          console.error('Dashboard: setAppStats is not provided!');
        }
      }

      if (achievementsResponse.data.success) {
        setAchievements(achievementsResponse.data.achievements);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getXPForNextLevel = () => {
    if (!localStats) return 100;
    const currentLevel = localStats.stats.level;
    return currentLevel * 100;
  };

  const getXPProgress = () => {
    if (!localStats) return 0;
    const currentLevelXP = (localStats.stats.level - 1) * 100;
    const nextLevelXP = localStats.stats.level * 100;
    const currentXP = localStats.stats.totalXP;
    return ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-purple-300' : 'text-purple-600'}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 py-8"
    >
      {/* Welcome Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <h1 className={`text-4xl md:text-5xl font-bold mb-2 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Welcome back, {user?.name || 'User'}! 👋
        </h1>
        <p className={`text-lg ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
          Here's your health overview for today
        </p>
      </motion.div>

      {/* Level Progress Card */}
      {localStats && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`mb-8 p-6 rounded-2xl ${
            isDarkMode ? 'bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500/20' : 'bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200'
          } backdrop-blur-lg border`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                <Star className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Level {localStats.stats.level}
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                  {localStats.stats.totalXP} XP Total
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                {localStats.stats.totalXP % 100}/{getXPForNextLevel() % 100 || 100} XP
              </p>
              <p className={`text-xs ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`}>
                to next level
              </p>
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${getXPProgress()}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3"
            />
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard 
          icon={MessageSquare} 
          title="Chat Sessions" 
          value={localStats?.stats.totalChats || 0}
          trend="+New" 
          color="purple" 
          isDarkMode={isDarkMode}
          delay={0.2}
        />
        <StatsCard 
          icon={FileText} 
          title="Reports Analyzed" 
          value={localStats?.stats.totalReports || 0}
          trend="+Track" 
          color="pink" 
          isDarkMode={isDarkMode}
          delay={0.3}
        />
        <StatsCard 
          icon={Camera} 
          title="Vision Analysis" 
          value={localStats?.stats.totalVisionAnalysis || 0}
          trend="+Scan" 
          color="blue" 
          isDarkMode={isDarkMode}
          delay={0.4}
        />
        <StatsCard 
          icon={Award} 
          title="Achievements" 
          value={`${localStats?.achievementProgress.completed || 0}/${localStats?.achievementProgress.total || 56}`}
          trend={`${localStats?.achievementProgress.percentage || 0}%`}
          color="green" 
          isDarkMode={isDarkMode}
          delay={0.5}
          onClick={() => setShowAchievements(true)}
        />
      </div>

      {/* Streak Card */}
      {localStats && localStats.stats.streak > 0 && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className={`mb-8 p-6 rounded-2xl ${
            isDarkMode ? 'bg-orange-900/30 border-orange-500/30' : 'bg-orange-50 border-orange-200'
          } border`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-4xl">🔥</div>
              <div>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {localStats.stats.streak} Day Streak!
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-orange-300' : 'text-orange-600'}`}>
                  Keep it up! You're doing great!
                </p>
              </div>
            </div>
            <Zap className={`w-8 h-8 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mb-8"
      >
        <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickActionCard
            icon={FileText}
            title="Analyze Report"
            description="Upload medical reports"
            gradient="from-purple-600 to-pink-600"
            onClick={() => setCurrentPage('report')}
            delay={0.8}
          />
          <QuickActionCard
            icon={MessageSquare}
            title="Chat with Dr. AI"
            description="Get health advice"
            gradient="from-blue-600 to-cyan-600"
            onClick={() => setCurrentPage('chat')}
            delay={0.9}
          />
          <QuickActionCard
            icon={Camera}
            title="Vision Analysis"
            description="Analyze medical images"
            gradient="from-green-600 to-emerald-600"
            onClick={() => setCurrentPage('vision')}
            delay={1.0}
          />
          <QuickActionCard
            icon={Footprints}
            title="LazySense"
            description="Track runs & compete"
            gradient="from-cyan-600 to-teal-600"
            onClick={() => setCurrentPage('runner')}
            delay={1.1}
          />
        </div>
      </motion.div>

      {/* Recent Achievements Preview */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Recent Achievements
          </h2>
          <button
            onClick={() => setShowAchievements(true)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
              isDarkMode ? 'text-purple-300 hover:bg-white/5' : 'text-purple-600 hover:bg-purple-50'
            }`}
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {achievements.filter(a => a.completed).slice(0, 3).map((achievement, index) => (
            <motion.div
              key={achievement._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 + index * 0.1 }}
              onClick={() => setSelectedAchievement(achievement)}
              className={`p-4 rounded-xl cursor-pointer transition ${
                isDarkMode 
                  ? 'bg-white/5 hover:bg-white/10 border-purple-500/20' 
                  : 'bg-white hover:bg-gray-50 border-purple-200'
              } border`}
            >
              <div className="flex items-center space-x-3">
                <div className="text-3xl">{achievement.icon}</div>
                <div className="flex-1">
                  <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {achievement.title}
                  </h4>
                  <p className={`text-xs ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                    +{achievement.reward.xp} XP
                  </p>
                </div>
                <Award className="w-5 h-5 text-yellow-500" />
              </div>
            </motion.div>
          ))}
        </div>
        {achievements.filter(a => a.completed).length === 0 && (
          <div className={`text-center py-12 ${
            isDarkMode ? 'text-purple-300' : 'text-purple-600'
          }`}>
            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Complete actions to unlock achievements!</p>
          </div>
        )}
      </motion.div>

      {/* Achievements Modal */}
      <AnimatePresence>
        {showAchievements && (
          <Achievements
            isDarkMode={isDarkMode}
            onClose={() => setShowAchievements(false)}
          />
        )}
      </AnimatePresence>

      {/* Achievement Detail Modal */}
      <AnimatePresence>
        {selectedAchievement && (
          <AchievementDetailModal
            achievement={selectedAchievement}
            isDarkMode={isDarkMode}
            onClose={() => setSelectedAchievement(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatsCard({ icon: Icon, title, value, trend, color, isDarkMode, delay, onClick }) {
  const colors = {
    purple: 'from-purple-600 to-pink-600',
    pink: 'from-pink-600 to-rose-600',
    blue: 'from-blue-600 to-cyan-600',
    green: 'from-green-600 to-emerald-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      whileHover={{ scale: 1.05, y: -5 }}
      onClick={onClick}
      className={`p-6 rounded-2xl bg-gradient-to-br ${colors[color]} shadow-xl ${
        onClick ? 'cursor-pointer' : ''
      } group relative overflow-hidden`}
    >
      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
      
      <Icon className="w-10 h-10 text-white mb-3 group-hover:scale-110 transition-transform" />
      <p className="text-white/80 text-sm mb-1">{title}</p>
      <div className="flex items-end justify-between">
        <p className="text-4xl font-bold text-white">{value}</p>
        <span className="text-sm font-semibold text-white/90 bg-white/20 px-2 py-1 rounded-full">
          {trend}
        </span>
      </div>
    </motion.div>
  );
}

function QuickActionCard({ icon: Icon, title, description, gradient, onClick, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.03, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`p-6 rounded-2xl bg-gradient-to-br ${gradient} shadow-xl cursor-pointer group relative overflow-hidden`}
    >
      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
      
      <Icon className="w-14 h-14 text-white mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform" />
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-white/90 text-sm">{description}</p>
      
      <motion.div
        className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100"
        initial={{ x: -10 }}
        whileHover={{ x: 0 }}
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </motion.div>
    </motion.div>
  );
}

function AchievementDetailModal({ achievement, isDarkMode, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={`max-w-md w-full rounded-2xl ${
          isDarkMode ? 'bg-gray-900' : 'bg-white'
        } p-8 text-center`}
      >
        <div className="text-6xl mb-4">{achievement.icon}</div>
        <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {achievement.title}
        </h2>
        <p className={`mb-6 ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
          {achievement.description}
        </p>

        {achievement.completed ? (
          <div className={`mb-6 p-4 rounded-xl ${
            isDarkMode ? 'bg-green-900/30 border-green-500/30' : 'bg-green-50 border-green-200'
          } border`}>
            <Award className={`w-8 h-8 mx-auto mb-2 ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`} />
            <p className={`text-sm ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
              Completed {new Date(achievement.completedAt).toLocaleDateString()}
            </p>
            <p className={`text-lg font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
              +{achievement.reward.xp} XP Earned
            </p>
          </div>
        ) : (
          <div className={`mb-6 p-4 rounded-xl ${
            isDarkMode ? 'bg-purple-900/30 border-purple-500/30' : 'bg-purple-50 border-purple-200'
          } border`}>
            <Target className={`w-8 h-8 mx-auto mb-2 ${
              isDarkMode ? 'text-purple-400' : 'text-purple-600'
            }`} />
            <p className={`text-sm ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
              Progress
            </p>
            <div className="w-full bg-gray-700 rounded-full h-3 my-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
              />
            </div>
            <p className={`text-lg font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
              {achievement.progress} / {achievement.target}
            </p>
            <p className={`text-xs mt-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`}>
              Reward: +{achievement.reward.xp} XP
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}