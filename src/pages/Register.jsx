import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Heart, Eye, EyeOff, Sun, Moon, User, Mail, Lock, Calendar, Users, MailCheck, RefreshCw } from 'lucide-react';
import { authAPI } from '../services/api';
import axios from 'axios';

export default function Register({ setCurrentPage, isDarkMode, setIsDarkMode }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Code-based verification states
  const [showVerification, setShowVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await authAPI.register(registerData);
      
      if (response.data.success && response.data.requiresVerification) {
        setRegisteredEmail(formData.email);
        setShowVerification(true);
        setCodeSent(true);
        setError('');
      } else if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          setCurrentPage('login');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/verify-email-code`, {
        email: registeredEmail,
        code: verificationCode
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          setCurrentPage('login');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid verification code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/resend-verification-code`, {
        email: registeredEmail
      });
      
      if (response.data.success) {
        setCodeSent(true);
        setVerificationCode('');
        setError('✅ New verification code sent! Please check your email.');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setError(`Please wait ${err.response.data.retryAfter} seconds before requesting a new code.`);
      } else {
        setError('Failed to resend code. Please try again.');
      }
    } finally {
      setResending(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(value);
    setError('');
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
        className="max-w-2xl w-full relative z-10"
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
              Join HealthSphere.AI
            </h2>
            <p className={`${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
              Start your journey to better health
            </p>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-xl text-sm text-center ${
                error.includes('✅') 
                  ? 'bg-green-500/20 border border-green-500/50 text-green-300' 
                  : 'bg-red-500/20 border border-red-500/50 text-red-300'
              }`}
            >
              <p>{error}</p>
            </motion.div>
          )}

          {/* Success Message */}
          {success && !showVerification && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl"
            >
              <p className="text-green-300 text-sm text-center">
                ✅ Account created successfully! Redirecting to login...
              </p>
            </motion.div>
          )}

          {/* Register Form - Hide if verification is shown */}
          {!showVerification && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className={`block ${
                    isDarkMode ? 'text-purple-300' : 'text-purple-600'
                  } mb-2 font-medium flex items-center space-x-2`}>
                    <User className="w-4 h-4" />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 ${
                      isDarkMode ? 'bg-white/5 text-white' : 'bg-gray-50 text-gray-900'
                    } border ${
                      isDarkMode ? 'border-purple-500/30' : 'border-purple-200'
                    } rounded-xl focus:outline-none focus:border-purple-500 transition-colors`}
                    placeholder="John Doe"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className={`block ${
                    isDarkMode ? 'text-purple-300' : 'text-purple-600'
                  } mb-2 font-medium flex items-center space-x-2`}>
                    <Mail className="w-4 h-4" />
                    <span>Email Address</span>
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
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Password */}
                <div>
                  <label className={`block ${
                    isDarkMode ? 'text-purple-300' : 'text-purple-600'
                  } mb-2 font-medium flex items-center space-x-2`}>
                    <Lock className="w-4 h-4" />
                    <span>Password</span>
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

                {/* Confirm Password */}
                <div>
                  <label className={`block ${
                    isDarkMode ? 'text-purple-300' : 'text-purple-600'
                  } mb-2 font-medium flex items-center space-x-2`}>
                    <Lock className="w-4 h-4" />
                    <span>Confirm Password</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pr-12 ${
                        isDarkMode ? 'bg-white/5 text-white' : 'bg-gray-50 text-gray-900'
                      } border ${
                        isDarkMode ? 'border-purple-500/30' : 'border-purple-200'
                    } rounded-xl focus:outline-none focus:border-purple-500 transition-colors`}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                        isDarkMode ? 'text-purple-400' : 'text-purple-600'
                      } hover:text-purple-500`}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Age */}
                <div>
                  <label className={`block ${
                    isDarkMode ? 'text-purple-300' : 'text-purple-600'
                  } mb-2 font-medium flex items-center space-x-2`}>
                    <Calendar className="w-4 h-4" />
                    <span>Age </span>
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 ${
                      isDarkMode ? 'bg-white/5 text-white' : 'bg-gray-50 text-gray-900'
                    } border ${
                      isDarkMode ? 'border-purple-500/30' : 'border-purple-200'
                    } rounded-xl focus:outline-none focus:border-purple-500 transition-colors`}
                    placeholder="25"
                    min="1"
                    max="150"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className={`block ${
                    isDarkMode ? 'text-purple-300' : 'text-purple-600'
                  } mb-2 font-medium flex items-center space-x-2`}>
                    <Users className="w-4 h-4" />
                    <span>Gender</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 ${
                      isDarkMode ? 'bg-white/5 text-white' : 'bg-gray-50 text-gray-900'
                    } border ${
                      isDarkMode ? 'border-purple-500/30' : 'border-purple-200'
                    } rounded-xl focus:outline-none focus:border-purple-500 transition-colors`}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || success}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : success ? (
                  <>
                    <span className="mr-2">✓</span> Account Created
                  </>
                ) : (
                  'Create Account'
                )}
              </motion.button>
            </form>
          )}

          {/* Code Verification UI */}
          {showVerification && !success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6"
            >
              <div className={`p-6 rounded-xl ${
                isDarkMode ? 'bg-blue-900/20 border-blue-500/30' : 'bg-blue-50 border-blue-200'
              } border text-center`}>
                
                {/* Icon */}
                <div className="mb-4">
                  <MailCheck className={`w-12 h-12 mx-auto ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                
                {/* Title */}
                <h3 className={`text-xl font-bold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  📧 Check Your Email
                </h3>
                
                {/* Description */}
                <p className={`text-sm mb-4 ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-700'
                }`}>
                  We've sent a 6-digit verification code to
                </p>
                
                {/* Email Display */}
                <div className={`px-4 py-2 mb-6 rounded-lg ${
                  isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'
                }`}>
                  <p className="font-mono font-bold text-lg">
                    {registeredEmail}
                  </p>
                </div>
                
                {/* Code Input */}
                <div className="mb-6">
                  <label className={`block mb-2 text-sm font-medium ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-700'
                  }`}>
                    Enter 6-digit code:
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength="6"
                    value={verificationCode}
                    onChange={handleCodeChange}
                    placeholder="000000"
                    className={`w-full px-4 py-3 text-center text-2xl tracking-widest font-mono rounded-xl mb-2 ${
                      isDarkMode 
                        ? 'bg-white/5 text-white border-purple-500/30' 
                        : 'bg-white text-gray-900 border-purple-200'
                    } border focus:outline-none focus:border-purple-500`}
                  />
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Enter the 6-digit code from your email
                  </p>
                </div>
                
                {/* Verify Button */}
                <button
                  onClick={handleVerify}
                  disabled={verifying || verificationCode.length !== 6}
                  className="w-full py-3 mb-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Email'
                  )}
                </button>
                
                {/* Resend Code */}
                <div className="pt-4 border-t border-gray-700/20">
                  <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Didn't receive the code?
                  </p>
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className={`w-full py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center space-x-2 ${
                      isDarkMode 
                        ? 'bg-white/5 text-purple-300 hover:bg-white/10' 
                        : 'bg-gray-50 text-purple-600 hover:bg-gray-100'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {resending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>Resend Verification Code</span>
                      </>
                    )}
                  </button>
                  <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    New code will be sent to your email
                  </p>
                </div>
                
                {/* Note */}
                <div className={`mt-4 p-3 rounded-lg text-xs ${
                  isDarkMode ? 'bg-yellow-900/20 text-yellow-300' : 'bg-yellow-50 text-yellow-700'
                }`}>
                  <p><strong>Note:</strong> The code expires in 15 minutes. Check your spam folder if you don't see it.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Divider - Show only when not in verification mode */}
          {!showVerification && (
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
                  Already have an account?
                </span>
              </div>
            </div>
          )}

          {/* Login Link - Show only when not in verification mode */}
          {!showVerification && (
            <div className="text-center">
              <button
                onClick={() => setCurrentPage('login')}
                className={`${
                  isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-pink-600 hover:text-pink-500'
                } font-bold transition-colors text-lg`}
              >
                Sign In →
              </button>
            </div>
          )}
        </div>

        {/* Credits */}
        <p className={`text-center mt-6 ${
          isDarkMode ? 'text-purple-400' : 'text-purple-600'
        } text-sm`}>
          Created by <span className="font-bold">Aksh & Arnav</span>
        </p>
      </motion.div>
    </div>
  );
}

// Animated Background Component
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