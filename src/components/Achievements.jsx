import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, CheckCircle, TrendingUp, Award as AwardIcon } from 'lucide-react';
import axios from 'axios';

const Achievements = ({ isDarkMode, onClose }) => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('achievements'); // 'achievements' or 'badges'
  const [stats, setStats] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://medivera-backend.onrender.com/api';

  useEffect(() => {
    loadAchievements();
    loadStats();
  }, []);

  const loadAchievements = async () => {
    try {
      const token = localStorage.getItem('healthsphere_token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const response = await axios.get(`${API_URL}/achievements`, config);
      if (response.data.success) {
        setAchievements(response.data.achievements);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('healthsphere_token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const response = await axios.get(`${API_URL}/achievements/stats`, config);
      if (response.data.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const categories = [
    { id: 'all', name: 'All', icon: '🏆' },
    { id: 'chat', name: 'Chat', icon: '💬' },
    { id: 'report', name: 'Reports', icon: '📄' },
    { id: 'vision', name: 'Vision', icon: '👁️' },
    { id: 'running', name: 'Running', icon: '🏃' },
    { id: 'distance', name: 'Distance', icon: '📏' },
    { id: 'territory', name: 'Territory', icon: '🗺️' },
    { id: 'team', name: 'Teams', icon: '👥' },
    { id: 'challenge', name: 'Challenges', icon: '🎯' },
    { id: 'speed', name: 'Speed', icon: '💨' },
    { id: 'leaderboard', name: 'Leaderboard', icon: '📊' },
    { id: 'streak', name: 'Streak', icon: '🔥' },
    { id: 'special', name: 'Special', icon: '⭐' }
  ];

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  const groupedAchievements = filteredAchievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {});

  const getCategoryIcon = (category) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.icon : '🏆';
  };

  const getCategoryName = (category) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.name : category;
  };

  const completedCount = achievements.filter(a => a.completed).length;
  const totalCount = achievements.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`max-w-6xl w-full max-h-[90vh] rounded-2xl ${
          isDarkMode ? 'bg-gray-900' : 'bg-white'
        } overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className={`p-6 border-b ${
          isDarkMode ? 'border-purple-500/20' : 'border-purple-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              🏆 Achievements & Badges
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${
                isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'
              }`}
            >
              <X className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setActiveTab('achievements')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'achievements'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : isDarkMode
                  ? 'bg-purple-900/20 text-purple-300 hover:bg-purple-900/30'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              🏆 Achievements ({totalCount})
            </button>
            <button
              onClick={() => setActiveTab('badges')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'badges'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : isDarkMode
                  ? 'bg-purple-900/20 text-purple-300 hover:bg-purple-900/30'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              🎖️ Badges ({stats?.badges?.length || 0})
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-purple-300' : 'text-purple-600'
              }`}>
                Overall Progress
              </span>
              <span className={`text-sm font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {completedCount} / {totalCount} ({completionPercentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className={`p-3 rounded-xl ${
                isDarkMode ? 'bg-purple-900/20' : 'bg-purple-100'
              }`}>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Level
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.stats?.level || 1}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${
                isDarkMode ? 'bg-blue-900/20' : 'bg-blue-100'
              }`}>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total XP
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.stats?.totalXP || 0}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${
                isDarkMode ? 'bg-green-900/20' : 'bg-green-100'
              }`}>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Badges
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.badges?.length || 0}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        {activeTab === 'achievements' ? (
          <>
            {/* Category Filter */}
            <div className={`p-4 border-b ${
              isDarkMode ? 'border-purple-500/20 bg-gray-800/50' : 'border-purple-200 bg-gray-50'
            }`}>
              <style>{`
                .category-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                  gap: 0.5rem;
                }
                @media (max-width: 768px) {
                  .category-grid {
                    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                  }
                }
              `}</style>
              <div className="category-grid">
                {categories.map((category) => {
                  const count = achievements.filter(a => 
                    category.id === 'all' || a.category === category.id
                  ).length;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                        selectedCategory === category.id
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                          : isDarkMode
                          ? 'bg-purple-900/20 text-purple-300 hover:bg-purple-900/30'
                          : 'bg-white text-purple-700 hover:bg-purple-100'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-xl">{category.icon}</span>
                        <span className="text-xs">{category.name}</span>
                        <span className="text-[10px] opacity-70">({count})</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Achievements List */}
            <div className="flex-1 overflow-y-auto p-6">
              <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: ${isDarkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)'};
                  border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: linear-gradient(180deg, #9333ea, #ec4899);
                  border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: linear-gradient(180deg, #7e22ce, #db2777);
                }
              `}</style>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className={isDarkMode ? 'text-purple-300' : 'text-purple-600'}>
                      Loading achievements...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 custom-scrollbar">
                  {Object.keys(groupedAchievements).map((category) => (
                    <div key={category}>
                      <h3 className={`text-xl font-bold mb-4 flex items-center space-x-2 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        <span className="text-2xl">{getCategoryIcon(category)}</span>
                        <span>{getCategoryName(category)}</span>
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {groupedAchievements[category].map((achievement) => (
                          <AchievementCard
                            key={achievement._id}
                            achievement={achievement}
                            isDarkMode={isDarkMode}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <BadgesSection stats={stats} isDarkMode={isDarkMode} loading={loading} />
        )}
      </motion.div>
    </motion.div>
  );
};

// Badge Section Component
function BadgesSection({ stats, isDarkMode, loading }) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-purple-300' : 'text-purple-600'}>
            Loading badges...
          </p>
        </div>
      </div>
    );
  }

  const badges = stats?.badges || [];

  if (badges.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <AwardIcon className={`w-24 h-24 mx-auto mb-4 ${
            isDarkMode ? 'text-gray-700' : 'text-gray-300'
          }`} />
          <h3 className={`text-xl font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            No Badges Yet
          </h3>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            Complete achievements to earn badges!
          </p>
        </div>
      </div>
    );
  }

  // Sort badges by earned date (newest first)
  const sortedBadges = [...badges].sort((a, b) => 
    new Date(b.earnedAt) - new Date(a.earnedAt)
  );

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDarkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)'};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #9333ea, #ec4899);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #7e22ce, #db2777);
        }
      `}</style>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 custom-scrollbar">
        {sortedBadges.map((badge, index) => (
          <BadgeCard
            key={index}
            badge={badge}
            isDarkMode={isDarkMode}
          />
        ))}
      </div>
    </div>
  );
}

// Badge Card Component
function BadgeCard({ badge, isDarkMode }) {
  // Determine rarity color based on badge properties
  const getRarityColor = () => {
    // Default gradient based on earnedAt (older = more rare)
    const daysOld = Math.floor((Date.now() - new Date(badge.earnedAt)) / (1000 * 60 * 60 * 24));
    
    if (daysOld > 180) return 'from-purple-600 to-pink-600'; // Legendary (6+ months)
    if (daysOld > 90) return 'from-blue-600 to-purple-500'; // Rare (3+ months)
    if (daysOld > 30) return 'from-green-600 to-emerald-500'; // Uncommon (1+ month)
    return 'from-gray-600 to-gray-500'; // Common (new)
  };

  const getRarityName = () => {
    const daysOld = Math.floor((Date.now() - new Date(badge.earnedAt)) / (1000 * 60 * 60 * 24));
    if (daysOld > 180) return 'Legendary';
    if (daysOld > 90) return 'Rare';
    if (daysOld > 30) return 'Uncommon';
    return 'Common';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      className={`relative p-6 rounded-2xl border text-center cursor-pointer transition-all overflow-hidden ${
        isDarkMode 
          ? 'bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/30' 
          : 'bg-gradient-to-br from-purple-100 to-pink-100 border-purple-300 hover:shadow-xl'
      }`}
    >
      {/* Rarity Badge */}
      <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r ${getRarityColor()} text-white`}>
        {getRarityName()}
      </div>

      {/* Glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getRarityColor()} opacity-0 hover:opacity-20 transition-opacity duration-300`}></div>

      <div className="relative z-10">
        <div className="text-6xl mb-3 animate-pulse">
          {badge.icon}
        </div>
        <h4 className={`font-bold mb-2 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {badge.name}
        </h4>
        <p className={`text-xs mb-2 ${
          isDarkMode ? 'text-purple-300' : 'text-purple-600'
        }`}>
          Earned {new Date(badge.earnedAt).toLocaleDateString()}
        </p>
        
        {/* Badge shine effect */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 animate-shine"></div>
        </div>
      </div>
      
      <style>{`
        @keyframes shine {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(200%) skewX(-12deg);
          }
        }
        .animate-shine {
          animation: shine 3s infinite;
        }
      `}</style>
    </motion.div>
  );
}

// Achievement Card Component
function AchievementCard({ achievement, isDarkMode }) {
  const progressPercentage = achievement.target > 0 
    ? Math.min(Math.round((achievement.progress / achievement.target) * 100), 100)
    : 0;

  return (
    <motion.div
      whileHover={{ scale: achievement.completed ? 1 : 1.02 }}
      className={`p-4 rounded-xl border transition-all ${
        achievement.completed
          ? isDarkMode
            ? 'bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-500/50 shadow-lg shadow-purple-500/20'
            : 'bg-gradient-to-br from-purple-100 to-pink-100 border-purple-300 shadow-lg'
          : isDarkMode
          ? 'bg-gray-800/50 border-purple-500/20'
          : 'bg-white border-gray-200'
      } ${!achievement.completed && 'opacity-75'}`}
    >
      <div className="flex items-start space-x-3">
        <div className={`text-4xl ${!achievement.completed && 'grayscale opacity-50'}`}>
          {achievement.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className={`font-bold truncate ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {achievement.title}
            </h4>
            {achievement.completed ? (
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 ml-2" />
            ) : (
              <Lock className="w-5 h-5 text-gray-500 flex-shrink-0 ml-2" />
            )}
          </div>
          
          <p className={`text-sm mb-3 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {achievement.description}
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                Progress: {achievement.progress} / {achievement.target}
              </span>
              <span className={`font-bold ${
                isDarkMode ? 'text-purple-400' : 'text-purple-600'
              }`}>
                +{achievement.reward.xp} XP
              </span>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  achievement.completed
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          
          {achievement.completed && achievement.completedAt && (
            <p className={`text-xs mt-2 ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`}>
              ✓ Completed {new Date(achievement.completedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}


export default Achievements;
