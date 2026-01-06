import { motion } from 'framer-motion';
import { ArrowLeft, Target, Clock, Trophy, Zap } from 'lucide-react';

const Challenges = ({ isDarkMode, setCurrentPage }) => {
  // Mock challenges data
  const challenges = [
    {
      id: 1,
      title: '5K This Week',
      description: 'Run a total of 5 kilometers this week',
      progress: 0,
      target: 5,
      reward: 100,
      timeLeft: '6 days',
      icon: '🏃',
      difficulty: 'Easy'
    },
    {
      id: 2,
      title: 'Daily Runner',
      description: 'Run for 7 consecutive days',
      progress: 0,
      target: 7,
      reward: 200,
      timeLeft: '7 days',
      icon: '🔥',
      difficulty: 'Medium'
    },
    {
      id: 3,
      title: 'Speed Demon',
      description: 'Complete a 1km run under 5 minutes',
      progress: 0,
      target: 1,
      reward: 150,
      timeLeft: '14 days',
      icon: '⚡',
      difficulty: 'Hard'
    }
  ];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return isDarkMode ? 'text-green-400' : 'text-green-600';
      case 'Medium':
        return isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
      case 'Hard':
        return isDarkMode ? 'text-red-400' : 'text-red-600';
      default:
        return isDarkMode ? 'text-gray-400' : 'text-gray-600';
    }
  };

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
        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-full flex items-center justify-center shadow-lg">
          <Target className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Challenges
          </h1>
          <p className={`${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
            Complete challenges to earn rewards
          </p>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        <div className={`${
          isDarkMode ? 'bg-purple-900/20 border-purple-500/20' : 'bg-white border-purple-200'
        } backdrop-blur-xl rounded-xl p-6 border`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Active Challenges
            </span>
            <Target className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {challenges.length}
          </p>
        </div>

        <div className={`${
          isDarkMode ? 'bg-purple-900/20 border-purple-500/20' : 'bg-white border-purple-200'
        } backdrop-blur-xl rounded-xl p-6 border`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Completed
            </span>
            <Trophy className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>0</p>
        </div>

        <div className={`${
          isDarkMode ? 'bg-purple-900/20 border-purple-500/20' : 'bg-white border-purple-200'
        } backdrop-blur-xl rounded-xl p-6 border`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Rewards
            </span>
            <Zap className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            0 pts
          </p>
        </div>
      </motion.div>

      {/* Challenges List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Available Challenges
        </h2>
        <div className="space-y-4">
          {challenges.map((challenge, index) => {
            const progress = (challenge.progress / challenge.target) * 100;
            
            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className={`${
                  isDarkMode ? 'bg-purple-900/20 border-purple-500/20' : 'bg-white border-purple-200'
                } backdrop-blur-xl rounded-xl p-6 border hover:scale-[1.02] transition-transform cursor-pointer`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="text-5xl">{challenge.icon}</div>
                    <div>
                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {challenge.title}
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {challenge.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isDarkMode ? 'bg-purple-900/50' : 'bg-purple-100'
                        } ${getDifficultyColor(challenge.difficulty)}`}>
                          {challenge.difficulty}
                        </span>
                        <span className={`text-xs flex items-center space-x-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <Clock className="w-3 h-3" />
                          <span>{challenge.timeLeft}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                      +{challenge.reward}
                    </div>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      points
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className={`w-full rounded-full h-3 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <div
                      className="bg-gradient-to-r from-purple-600 to-fuchsia-600 h-3 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <p className={`text-xs text-right ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {challenge.progress} / {challenge.target} {challenge.title.includes('km') ? 'km' : 'days'}
                </p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className={`mt-8 ${
          isDarkMode ? 'bg-gradient-to-r from-purple-900/40 to-fuchsia-900/40 border-purple-500/20' : 'bg-gradient-to-r from-purple-100 to-fuchsia-100 border-purple-200'
        } backdrop-blur-xl rounded-xl p-8 border text-center`}
      >
        <Trophy className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
        <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Start Running to Complete Challenges
        </h3>
        <p className={`mb-6 ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
          Track your runs and watch your progress grow!
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentPage('run')}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all"
        >
          Start Running
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Challenges;