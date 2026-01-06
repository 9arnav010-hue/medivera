import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Medal, Award } from 'lucide-react';

const Leaderboard = ({ isDarkMode, setCurrentPage }) => {
  const [activeTab, setActiveTab] = useState('global');

  // Mock leaderboard data
  const globalData = [
    { rank: 1, name: 'SpeedRunner', points: 1500, distance: 125.5, avatar: '🏃‍♂️' },
    { rank: 2, name: 'MarathonPro', points: 1350, distance: 110.2, avatar: '🏃‍♀️' },
    { rank: 3, name: 'FastFeet', points: 1200, distance: 98.7, avatar: '🏃' },
  ];

  const friendsData = [
    { rank: 1, name: 'BestFriend', points: 800, distance: 65.3, avatar: '👟' },
    { rank: 2, name: 'RunBuddy', points: 650, distance: 54.2, avatar: '🏃‍♂️' },
  ];

  const localData = [
    { rank: 1, name: 'LocalChamp', points: 950, distance: 78.4, avatar: '🏆' },
    { rank: 2, name: 'NeighborRun', points: 820, distance: 67.8, avatar: '🏃‍♀️' },
    { rank: 3, name: 'AreaRunner', points: 750, distance: 62.1, avatar: '🏃' },
  ];

  const getLeaderboardData = () => {
    switch (activeTab) {
      case 'friends':
        return friendsData;
      case 'local':
        return localData;
      default:
        return globalData;
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className={`font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>#{rank}</span>;
    }
  };

  const currentData = getLeaderboardData();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setCurrentPage('runner')}
        className={`mb-6 flex items-center space-x-2 px-4 py-2 rounded-lg ${
          isDarkMode ? 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
        } transition-colors`}
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Runner Dashboard</span>
      </motion.button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-4 mb-8"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-violet-600 rounded-full flex items-center justify-center shadow-lg">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Leaderboard
          </h1>
          <p className={`${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
            See how you rank against other runners
          </p>
        </div>
      </motion.div>

      {/* Tabs - FIXED */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex space-x-2 mb-6"
      >
        <button
          onClick={() => setActiveTab('global')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'global'
              ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white'
              : isDarkMode
              ? 'bg-purple-900/20 text-purple-300 hover:bg-purple-900/30'
              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
          }`}
        >
          Global
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'friends'
              ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white'
              : isDarkMode
              ? 'bg-purple-900/20 text-purple-300 hover:bg-purple-900/30'
              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
          }`}
        >
          Friends
        </button>
        <button
          onClick={() => setActiveTab('local')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'local'
              ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white'
              : isDarkMode
              ? 'bg-purple-900/20 text-purple-300 hover:bg-purple-900/30'
              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
          }`}
        >
          Local
        </button>
      </motion.div>

      {/* Leaderboard List */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {currentData.length === 0 ? (
          <div className={`${
            isDarkMode ? 'bg-purple-900/20 border-purple-500/20' : 'bg-white border-purple-200'
          } backdrop-blur-xl rounded-2xl p-12 border text-center`}>
            <Trophy className={`w-16 h-16 mx-auto mb-4 ${
              isDarkMode ? 'text-gray-600' : 'text-gray-300'
            }`} />
            <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              No runners yet
            </p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Be the first to start running and claim the top spot!
            </p>
          </div>
        ) : (
          currentData.map((runner, index) => (
            <motion.div
              key={`${activeTab}-${runner.rank}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${
                isDarkMode ? 'bg-purple-900/20 border-purple-500/20' : 'bg-white border-purple-200'
              } backdrop-blur-xl rounded-xl p-6 border hover:scale-[1.02] transition-transform cursor-pointer`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 flex items-center justify-center">
                    {getRankIcon(runner.rank)}
                  </div>
                  <div className="text-4xl">{runner.avatar}</div>
                  <div>
                    <p className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {runner.name}
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {runner.distance} km total
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    {runner.points}
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    points
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Your Rank */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`mt-8 ${
          isDarkMode ? 'bg-gradient-to-r from-purple-900/40 to-violet-900/40 border-purple-500/30' : 'bg-gradient-to-r from-purple-100 to-violet-100 border-purple-300'
        } backdrop-blur-xl rounded-xl p-6 border`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Award className={`w-8 h-8 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <div>
              <p className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Your Rank ({activeTab})
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Start running to see your position
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
              Unranked
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              0 points
            </p>
          </div>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentPage('run')}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all"
        >
          Start Running to Join Rankings
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Leaderboard;