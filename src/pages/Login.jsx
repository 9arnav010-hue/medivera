import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Heart, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { authAPI } from '../services/api';
import axios from 'axios';

export default function Login({ setCurrentPage, setIsLoggedIn, setUser, isDarkMode, setIsDarkMode }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleLogin = async (e) => {
    // Prevent all default behaviors
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Prevent if already loading
    if (loading) {
      console.log('Already loading, preventing duplicate submission');
      return false;
    }
    
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', formData.email);
    
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(formData);
      
      console.log('=== LOGIN RESPONSE ===');
      console.log('Full response:', response);
      console.log('Response status:', response?.status);
      console.log('Response data:', response?.data);
      console.log('Success flag:', response?.data?.success);
      console.log('Token:', response?.data?.token ? 'Present' : 'Missing');
      
      // Check if login was successful
      if (response?.data?.success === true && response?.data?.token) {
        console.log('✅ Login successful, saving token and redirecting');
        
        const userData = response.data.user;
        
        // Ensure user has _id field (some backends use 'id' instead)
        if (!userData._id && userData.id) {
          userData._id = userData.id;
        }
        
        console.log('User data to save:', userData);
        
        localStorage.setItem('healthsphere_token', response.data.token);
        localStorage.setItem('healthsphere_user', JSON.stringify(userData));
        setIsLoggedIn(true);
        setUser(userData);
        setCurrentPage('dashboard');
      } else {
        // Login failed
        console.log('❌ Login failed');
        const errorMessage = response?.data?.error || 
                            response?.data?.message || 
                            'Invalid email or password';
        setError(errorMessage);
        setLoading(false);
      }
    } catch (err) {
      console.log('=== LOGIN ERROR ===');
      console.error('Error caught:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
    
    return false;
  };

  const resendVerification = async (email) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/resend-verification`, { email });
      if (response.data.success) {
        alert('✅ Verification email sent! Please check your inbox.');
      }
    } catch (error) {
      alert('❌ Failed to resend verification email. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12">
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

      {/* Back Button */}
      <button
        onClick={() => setCurrentPage('home')}
        className={`absolute top-4 left-4 z-50 px-4 py-2 rounded-lg ${
          isDarkMode ? 'bg-white/10 text-white' : 'bg-white text-gray-700'
        } backdrop-blur-lg border ${
          isDarkMode ? 'border-purple-500/20' : 'border-purple-200'
        } hover:scale-105 transition-transform`}
      >
        ← Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-md w-full relative z-10"
      >
        <div className={`${
          isDarkMode ? 'bg-white/10' : 'bg-white'
        } backdrop-blur-xl rounded-3xl p-8 shadow-2xl border ${
          isDarkMode ? 'border-purple-500/20' : 'border-purple-200'
        }`}>
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="text-center mb-8"
          >
            <Heart className="w-16 h-16 text-pink-500 mx-auto mb-4 animate-pulse" />
            <h2 className={`text-3xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            } mb-2`}>
              Welcome Back
            </h2>
            <p className={`${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
              Sign in to continue to Medivéra
            </p>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl"
            >
              <p className="text-red-300 text-sm text-center">{error}</p>
            </motion.div>
          )}

          {/* Login Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }} 
            className="space-y-6" 
            noValidate
            autoComplete="off"
          >
            <div>
              <label className={`block ${
                isDarkMode ? 'text-purple-300' : 'text-purple-600'
              } mb-2 font-medium`}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 ${
                  isDarkMode ? 'bg-white/5 text-white' : 'bg-gray-50 text-gray-900'
                } border ${
                  isDarkMode ? 'border-purple-500/30' : 'border-purple-200'
                } rounded-xl focus:outline-none focus:border-purple-500 transition-colors`}
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className={`block ${
                isDarkMode ? 'text-purple-300' : 'text-purple-600'
              } mb-2 font-medium`}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 pr-12 ${
                    isDarkMode ? 'bg-white/5 text-white' : 'bg-gray-50 text-gray-900'
                  } border ${
                    isDarkMode ? 'border-purple-500/30' : 'border-purple-200'
                  } rounded-xl focus:outline-none focus:border-purple-500 transition-colors`}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  } hover:text-purple-500`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className={`absolute inset-0 flex items-center`}>
              <div className={`w-full border-t ${
                isDarkMode ? 'border-purple-500/20' : 'border-purple-200'
              }`} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-2 ${
                isDarkMode ? 'bg-gray-900 text-purple-300' : 'bg-white text-purple-600'
              }`}>
                New to Medivéra?
              </span>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <button
              onClick={() => setCurrentPage('register')}
              className={`${
                isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-pink-600 hover:text-pink-500'
              } font-bold transition-colors`}
            >
              Create an Account →
            </button>
          </div>
        </div>

        {/* Credits */}
        <p className={`text-center mt-6 ${
          isDarkMode ? 'text-purple-400' : 'text-purple-600'
        }`}>
          Created by <span className="font-bold">Aksh & Arnav</span>
        </p>
      </motion.div>
    </div>
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
      {[...Array(20)].map((_, i) => (
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

