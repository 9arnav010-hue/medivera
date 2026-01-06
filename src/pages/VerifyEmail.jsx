import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import axios from 'axios';

export default function VerifyEmail({ setCurrentPage, isDarkMode }) {
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    verifyEmail();
  }, []);

  const verifyEmail = async () => {
    try {
      // Get token from URL
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('No verification token found');
        return;
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${API_URL}/auth/verify-email`, { token });

      if (response.data.success) {
        setStatus('success');
        setMessage('Email verified successfully! Redirecting to login...');
        setTimeout(() => {
          setCurrentPage('login');
        }, 3000);
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.error || 'Email verification failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`max-w-md w-full p-8 rounded-2xl text-center ${
          isDarkMode ? 'bg-white/10' : 'bg-white'
        } backdrop-blur-xl border ${
          isDarkMode ? 'border-purple-500/20' : 'border-purple-200'
        }`}
      >
        {status === 'verifying' && (
          <>
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-purple-500 animate-spin" />
            <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Verifying Email...
            </h2>
            <p className={`${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
              Please wait while we verify your email address
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
            >
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            </motion.div>
            <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Email Verified! ✅
            </h2>
            <p className={`${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>
              {message}
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Verification Failed ❌
            </h2>
            <p className={`mb-6 ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>
              {message}
            </p>
            <button
              onClick={() => setCurrentPage('login')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl"
            >
              Go to Login
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}