import React from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, FileText, MessageSquare, Camera, Activity, 
  Shield, Brain, Zap, Globe, Sun, Moon 
} from 'lucide-react';

export default function Home({ setCurrentPage, isDarkMode, setIsDarkMode }) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground isDarkMode={isDarkMode} />
      
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-3 rounded-full ${
            isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-700'
          } shadow-lg hover:scale-110 transition-transform`}
        >
          {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <Heart className="w-32 h-32 text-pink-500 mx-auto mb-8 animate-pulse" />
          </motion.div>

          <motion.h1
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"
          >
            Medivéra
          </motion.h1>

          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className={`text-2xl md:text-4xl mb-4 ${
              isDarkMode ? 'text-purple-300' : 'text-purple-600'
            }`}
          >
            The Future of Human-Centered Healthcare
          </motion.p>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className={`text-lg md:text-xl mb-12 ${
              isDarkMode ? 'text-purple-400' : 'text-purple-500'
            }`}
          >
            Presented by <span className="font-bold">Aksh & Arnav</span>
          </motion.p>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage('register')}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl font-bold rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all"
            >
              Get Started Free
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage('login')}
              className={`px-8 py-4 ${
                isDarkMode 
                  ? 'bg-white/10 border-purple-400' 
                  : 'bg-purple-100 border-purple-600'
              } backdrop-blur-lg ${
                isDarkMode ? 'text-white' : 'text-purple-600'
              } text-xl font-bold rounded-full border-2 hover:bg-white/20 transition-all`}
            >
              Sign In
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`text-4xl md:text-5xl font-bold text-center mb-16 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            Powerful AI-Driven Features
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={FileText}
              title="Report Summarizer"
              description="AI-powered medical report analysis with risk assessment, lifestyle suggestions, and multilingual support"
              gradient="from-purple-600 to-pink-600"
              delay={0.1}
              isDarkMode={isDarkMode}
            />
            <FeatureCard
              icon={MessageSquare}
              title="Health Chatbot"
              description="24/7 AI doctor assistant with emotional support, voice input, and personalized health guidance"
              gradient="from-blue-600 to-cyan-600"
              delay={0.2}
              isDarkMode={isDarkMode}
            />
            <FeatureCard
              icon={Camera}
              title="VisionCare+"
              description="Advanced medical image analysis for X-rays, skin conditions, and retinal scans with AI insights"
              gradient="from-green-600 to-emerald-600"
              delay={0.3}
              isDarkMode={isDarkMode}
            />
            <FeatureCard
              icon={Activity}
              title="LazySense+"
              description="Activity engagement system with personalized tasks, rewards, and health tracking"
              gradient="from-orange-600 to-red-600"
              delay={0.4}
              isDarkMode={isDarkMode}
            />
            <FeatureCard
              icon={Shield}
              title="Emergency Connect"
              description="Quick access to nearby hospitals with GPS navigation and emergency services"
              gradient="from-red-600 to-pink-600"
              delay={0.5}
              isDarkMode={isDarkMode}
            />
            <FeatureCard
              icon={Brain}
              title="Offline Mode"
              description="Works without internet using local AI models for emergency situations"
              gradient="from-indigo-600 to-purple-600"
              delay={0.6}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <StatCard number="10K+" label="Active Users" isDarkMode={isDarkMode} />
            <StatCard number="50K+" label="Reports Analyzed" isDarkMode={isDarkMode} />
            <StatCard number="100K+" label="Chat Sessions" isDarkMode={isDarkMode} />
            <StatCard number="98%" label="Satisfaction Rate" isDarkMode={isDarkMode} />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`p-12 rounded-3xl ${
              isDarkMode ? 'bg-white/5' : 'bg-white'
            } backdrop-blur-lg border ${
              isDarkMode ? 'border-purple-500/20' : 'border-purple-200'
            } shadow-2xl`}
          >
            <Zap className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Ready to Transform Your Healthcare?
            </h2>
            <p className={`text-lg mb-8 ${
              isDarkMode ? 'text-purple-300' : 'text-purple-600'
            }`}>
              Join thousands of users experiencing the future of medical AI
            </p>
            <button
              onClick={() => setCurrentPage('register')}
              className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl font-bold rounded-full shadow-xl hover:shadow-purple-500/50 hover:scale-105 transition-all"
            >
              Start Your Journey
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`relative z-10 py-8 border-t ${
        isDarkMode ? 'border-purple-500/20 bg-gray-900/50' : 'border-purple-200 bg-white/50'
      } backdrop-blur-lg`}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className={`${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
            © 2026 Medivéra - Created by Aksh & Arnav
          </p>
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`}>
            The Future of Human-Centered Healthcare
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, gradient, delay, isDarkMode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      whileHover={{ scale: 1.05, y: -10 }}
      className={`p-8 rounded-2xl bg-gradient-to-br ${gradient} shadow-xl cursor-pointer group`}
    >
      <Icon className="w-14 h-14 text-white mb-4 group-hover:scale-110 transition-transform" />
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-white/90 leading-relaxed">{description}</p>
    </motion.div>
  );
}

function StatCard({ number, label, isDarkMode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className={`p-6 rounded-xl ${
        isDarkMode ? 'bg-white/5' : 'bg-white'
      } backdrop-blur-lg border ${
        isDarkMode ? 'border-purple-500/20' : 'border-purple-200'
      }`}
    >
      <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
        {number}
      </p>
      <p className={`${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>{label}</p>
    </motion.div>
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
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      ))}
    </div>
  );

}
