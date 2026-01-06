import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, Calendar, Save, X, Eye, EyeOff, 
  Camera, Loader, Shield, Award, TrendingUp, MessageSquare, FileText,
  Image as ImageIcon, Trophy, Star, RefreshCw
} from 'lucide-react';
import axios from 'axios';
import { achievementAPI } from '../services/api';

const Profile = ({ isDarkMode, user, setUser, stats, fetchStats }) => {
  const [activeTab, setActiveTab] = useState('stats');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [refreshing, setRefreshing] = useState(false);
  const [userStats, setUserStats] = useState(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    dateOfBirth: user?.dateOfBirth || '',
    gender: user?.gender || '',
    bio: user?.bio || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Fetch user stats for sidebar (Level, XP, Badges)
  useEffect(() => {
    fetchUserSidebarStats();
  }, []);

  const fetchUserSidebarStats = async () => {
    try {
      const [statsResponse, achievementsResponse] = await Promise.all([
        achievementAPI.getUserStats(),
        achievementAPI.getAchievements()
      ]);
      
      if (statsResponse.data.success) {
        // Count completed achievements as badges
        const completedAchievements = achievementsResponse.data?.achievements?.filter(a => a.completed) || [];
        
        setUserStats({
          ...statsResponse.data.stats,
          badges: completedAchievements,
          badgeCount: completedAchievements.length
        });
      }
    } catch (error) {
      console.error('Error fetching sidebar stats:', error);
    }
  };

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  // Refresh stats when switching to stats tab
  useEffect(() => {
    if (activeTab === 'stats' && fetchStats) {
      fetchStats();
    }
  }, [activeTab]);

  const handleRefreshStats = async () => {
    setRefreshing(true);
    
    try {
      // Refresh user profile
      const token = localStorage.getItem('healthsphere_token');
      const response = await axios.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.user) {
        const updatedUser = response.data.user;
        setUser(updatedUser);
        localStorage.setItem('healthsphere_user', JSON.stringify(updatedUser));
      }
      
      // Refresh sidebar stats
      await fetchUserSidebarStats();
      
      // Refresh stats from parent
      if (fetchStats) {
        await fetchStats();
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('healthsphere_token');
      const response = await axios.put(
        `${API_URL}/profile`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem('healthsphere_user', JSON.stringify(response.data.user));
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('healthsphere_token');
      const response = await axios.put(
        `${API_URL}/profile/change-password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to change password' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setMessage({ 
        type: 'error', 
        text: 'Invalid file type. Please upload JPEG, PNG, or GIF.' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ 
        type: 'error', 
        text: 'File too large. Maximum 5MB allowed.' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    setUploadingAvatar(true);
    setMessage({ type: '', text: '' });

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const token = localStorage.getItem('healthsphere_token');
      
      const response = await axios.post(
        `${API_URL}/profile/avatar`,
        { avatar: base64 },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        const updatedUser = response.data.user;
        setUser(updatedUser);
        localStorage.setItem('healthsphere_user', JSON.stringify(updatedUser));
        setMessage({ type: 'success', text: 'Avatar updated successfully!' });
        
        // Force navigation to re-render
        window.dispatchEvent(new Event('userUpdated'));
        
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to upload avatar' 
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const formatMemberSince = (dateString) => {
    if (!dateString) return 'Recently joined';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Recently joined';
    }
  };

  // Get stats from Dashboard
  const totalChats = stats?.totalChats || 0;
  const totalReports = stats?.totalReports || 0;
  const totalVisionAnalysis = stats?.totalVisionAnalysis || 0;
  const achievementsCompleted = stats?.achievementProgress?.completed || 0;
  const achievementsTotal = stats?.achievementProgress?.total || 56;
  const achievementPercentage = stats?.achievementProgress?.percentage || 0;

  // Get sidebar stats from userStats (fetched separately)
  const userLevel = userStats?.level || 1;
  const userXP = userStats?.totalXP || 0;
  const userBadges = userStats?.badgeCount || 0;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            My Profile
          </h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your account settings and preferences
          </p>
        </motion.div>

        <AnimatePresence>
          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 p-4 rounded-xl border ${
                message.type === 'success'
                  ? 'bg-green-500/20 border-green-500/50 text-green-300'
                  : 'bg-red-500/20 border-red-500/50 text-red-300'
              }`}
            >
              <p className="text-center font-medium">{message.text}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`lg:col-span-1 ${
              isDarkMode ? 'bg-purple-900/20 border-purple-500/20' : 'bg-white border-purple-200'
            } backdrop-blur-xl rounded-2xl p-6 border h-fit`}
          >
            {/* Avatar */}
            <div className="relative w-32 h-32 mx-auto mb-4">
              <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                {user?.avatar ? (
                  <img 
                    key={user.avatar}
                    src={user.avatar} 
                    alt={user.name || 'User'} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `<span class="text-white text-4xl font-bold">${user?.name?.[0]?.toUpperCase() || 'U'}</span>`;
                    }}
                  />
                ) : (
                  <span className="text-white text-4xl font-bold">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className={`absolute bottom-0 right-0 p-2 rounded-full ${
                  isDarkMode ? 'bg-purple-600' : 'bg-purple-500'
                } text-white cursor-pointer hover:scale-110 transition-transform shadow-lg`}
              >
                {uploadingAvatar ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </label>
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploadingAvatar}
              />
            </div>

            <div className="text-center mb-6">
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                {user?.name || 'User'}
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {user?.email}
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className={`flex justify-between items-center p-3 rounded-lg ${
                isDarkMode ? 'bg-purple-900/30' : 'bg-purple-50'
              }`}>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Level
                </span>
                <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {userLevel}
                </span>
              </div>
              <div className={`flex justify-between items-center p-3 rounded-lg ${
                isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'
              }`}>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total XP
                </span>
                <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {userXP}
                </span>
              </div>
              <div className={`flex justify-between items-center p-3 rounded-lg ${
                isDarkMode ? 'bg-pink-900/30' : 'bg-pink-50'
              }`}>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Badges
                </span>
                <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {userBadges}
                </span>
              </div>
            </div>

            <div className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <p className="mb-1">Member since</p>
              <p className={`font-medium ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                {formatMemberSince(user?.createdAt)}
              </p>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { id: 'profile', icon: User, label: 'Profile Info' },
                { id: 'stats', icon: TrendingUp, label: 'Statistics' },
                { id: 'security', icon: Shield, label: 'Security' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 sm:px-6 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : isDarkMode
                      ? 'bg-purple-900/20 text-purple-300 hover:bg-purple-900/30'
                      : 'bg-white text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className={`${
              isDarkMode ? 'bg-purple-900/20 border-purple-500/20' : 'bg-white border-purple-200'
            } backdrop-blur-xl rounded-2xl p-4 sm:p-8 border`}>
              <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Personal Information
                      </h3>
                      {!isEditing && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all text-sm sm:text-base"
                        >
                          Edit Profile
                        </button>
                      )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? 'text-purple-300' : 'text-purple-700'
                          }`}>
                            <User className="w-4 h-4 inline mr-2" />
                            Full Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={`w-full px-4 py-3 rounded-lg ${
                              isDarkMode 
                                ? 'bg-white/5 text-white border-purple-500/30' 
                                : 'bg-gray-50 text-gray-900 border-purple-200'
                            } border focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                          />
                        </div>

                        <div>
                          <label className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? 'text-purple-300' : 'text-purple-700'
                          }`}>
                            <Mail className="w-4 h-4 inline mr-2" />
                            Email
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            disabled
                            className={`w-full px-4 py-3 rounded-lg ${
                              isDarkMode 
                                ? 'bg-white/5 text-white border-purple-500/30' 
                                : 'bg-gray-50 text-gray-900 border-purple-200'
                            } border opacity-50 cursor-not-allowed`}
                          />
                        </div>

                        <div>
                          <label className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? 'text-purple-300' : 'text-purple-700'
                          }`}>
                            <Phone className="w-4 h-4 inline mr-2" />
                            Phone
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={!isEditing}
                            placeholder="+1 (555) 000-0000"
                            className={`w-full px-4 py-3 rounded-lg ${
                              isDarkMode 
                                ? 'bg-white/5 text-white border-purple-500/30' 
                                : 'bg-gray-50 text-gray-900 border-purple-200'
                            } border focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                          />
                        </div>

                        <div>
                          <label className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? 'text-purple-300' : 'text-purple-700'
                          }`}>
                            <MapPin className="w-4 h-4 inline mr-2" />
                            Location
                          </label>
                          <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            disabled={!isEditing}
                            placeholder="City, Country"
                            className={`w-full px-4 py-3 rounded-lg ${
                              isDarkMode 
                                ? 'bg-white/5 text-white border-purple-500/30' 
                                : 'bg-gray-50 text-gray-900 border-purple-200'
                            } border focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                          />
                        </div>

                        <div>
                          <label className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? 'text-purple-300' : 'text-purple-700'
                          }`}>
                            <Calendar className="w-4 h-4 inline mr-2" />
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            name="dateOfBirth"
                            value={formData.dateOfBirth ? formData.dateOfBirth.split('T')[0] : ''}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={`w-full px-4 py-3 rounded-lg ${
                              isDarkMode 
                                ? 'bg-white/5 text-white border-purple-500/30' 
                                : 'bg-gray-50 text-gray-900 border-purple-200'
                            } border focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                          />
                        </div>

                        <div>
                          <label className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? 'text-purple-300' : 'text-purple-700'
                          }`}>
                            Gender
                          </label>
                          <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={`w-full px-4 py-3 rounded-lg ${
                              isDarkMode 
                                ? 'bg-white/5 text-white border-purple-500/30' 
                                : 'bg-gray-50 text-gray-900 border-purple-200'
                            } border focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer_not_to_say">Prefer not to say</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? 'text-purple-300' : 'text-purple-700'
                        }`}>
                          Bio
                        </label>
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                          disabled={!isEditing}
                          placeholder="Tell us about yourself..."
                          maxLength={500}
                          rows={4}
                          className={`w-full px-4 py-3 rounded-lg ${
                            isDarkMode 
                              ? 'bg-white/5 text-white border-purple-500/30' 
                              : 'bg-gray-50 text-gray-900 border-purple-200'
                          } border focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed resize-none`}
                        />
                        <p className={`text-xs text-right mt-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {formData.bio.length}/500 characters
                        </p>
                      </div>

                      {isEditing && (
                        <div className="flex flex-col sm:flex-row gap-4 mt-6">
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditing(false);
                              setFormData({
                                name: user?.name || '',
                                email: user?.email || '',
                                phone: user?.phone || '',
                                location: user?.location || '',
                                dateOfBirth: user?.dateOfBirth || '',
                                gender: user?.gender || '',
                                bio: user?.bio || ''
                              });
                            }}
                            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                              isDarkMode 
                                ? 'bg-white/10 text-white hover:bg-white/20' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <X className="w-5 h-5 inline mr-2" />
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                          >
                            {loading ? (
                              <Loader className="w-5 h-5 animate-spin inline mr-2" />
                            ) : (
                              <Save className="w-5 h-5 inline mr-2" />
                            )}
                            Save Changes
                          </button>
                        </div>
                      )}
                    </form>
                  </motion.div>
                )}

                {activeTab === 'stats' && (
                  <motion.div
                    key="stats"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Your Statistics
                      </h3>
                      <button
                        onClick={handleRefreshStats}
                        disabled={refreshing}
                        className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg transition-all text-sm ${
                          isDarkMode 
                            ? 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50' 
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        } disabled:opacity-50`}
                      >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                      </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className={`p-4 sm:p-6 rounded-xl ${
                          isDarkMode ? 'bg-purple-900/30 border border-purple-500/20' : 'bg-purple-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Total Chats
                          </p>
                          <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                        </div>
                        <p className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {totalChats}
                        </p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className={`p-4 sm:p-6 rounded-xl ${
                          isDarkMode ? 'bg-blue-900/30 border border-blue-500/20' : 'bg-blue-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Reports Analyzed
                          </p>
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                        </div>
                        <p className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {totalReports}
                        </p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className={`p-4 sm:p-6 rounded-xl ${
                          isDarkMode ? 'bg-green-900/30 border border-green-500/20' : 'bg-green-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Vision Analysis
                          </p>
                          <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                        </div>
                        <p className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {totalVisionAnalysis}
                        </p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className={`p-4 sm:p-6 rounded-xl ${
                          isDarkMode ? 'bg-pink-900/30 border border-pink-500/20' : 'bg-pink-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Achievements
                          </p>
                          <Award className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
                        </div>
                        <p className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {achievementsCompleted}/{achievementsTotal}
                        </p>
                      </motion.div>
                    </div>

                    {/* Achievement Progress */}
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className={`text-sm sm:text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Achievement Progress
                        </h4>
                        <span className={`text-xs sm:text-sm ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                          {achievementsCompleted} of {achievementsTotal}
                        </span>
                      </div>
                      <div className={`h-3 sm:h-4 rounded-full ${
                        isDarkMode ? 'bg-white/10' : 'bg-gray-200'
                      } overflow-hidden`}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${achievementPercentage}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                        />
                      </div>
                      <p className={`text-xs text-right mt-1 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {achievementPercentage.toFixed(1)}% complete
                      </p>
                    </div>

                    {/* Recent Badges */}
                    <div>
                      <h4 className={`text-sm sm:text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                        Recent Badges
                      </h4>
                      {userStats?.badges && userStats.badges.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                          {userStats.badges.slice(0, 6).map((badge, index) => (
                            <motion.div
                              key={badge._id || index}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.7 + index * 0.1 }}
                              className={`p-3 sm:p-4 rounded-xl text-center ${
                                isDarkMode ? 'bg-purple-900/30 border border-purple-500/20' : 'bg-purple-50'
                              }`}
                            >
                              <div className="text-3xl mb-2">{badge.icon || '🏆'}</div>
                              <p className={`text-xs sm:text-sm font-medium ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {badge.title || 'Badge'}
                              </p>
                              <p className={`text-xs mt-1 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                +{badge.reward?.xp || 0} XP
                              </p>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className={`text-center py-8 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          <Star className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No badges earned yet. Start exploring!</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'security' && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <h3 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
                      Security Settings
                    </h3>

                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? 'text-purple-300' : 'text-purple-700'
                        }`}>
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.current ? 'text' : 'password'}
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            className={`w-full px-4 py-3 pr-12 rounded-lg ${
                              isDarkMode 
                                ? 'bg-white/5 text-white border-purple-500/30' 
                                : 'bg-gray-50 text-gray-900 border-purple-200'
                            } border focus:outline-none focus:border-purple-500 transition-colors`}
                            placeholder="••••••••"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                              isDarkMode ? 'text-purple-400' : 'text-purple-600'
                            }`}
                          >
                            {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? 'text-purple-300' : 'text-purple-700'
                        }`}>
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? 'text' : 'password'}
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            className={`w-full px-4 py-3 pr-12 rounded-lg ${
                              isDarkMode 
                                ? 'bg-white/5 text-white border-purple-500/30' 
                                : 'bg-gray-50 text-gray-900 border-purple-200'
                            } border focus:outline-none focus:border-purple-500 transition-colors`}
                            placeholder="••••••••"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                              isDarkMode ? 'text-purple-400' : 'text-purple-600'
                            }`}
                          >
                            {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? 'text-purple-300' : 'text-purple-700'
                        }`}>
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            className={`w-full px-4 py-3 pr-12 rounded-lg ${
                              isDarkMode 
                                ? 'bg-white/5 text-white border-purple-500/30' 
                                : 'bg-gray-50 text-gray-900 border-purple-200'
                            } border focus:outline-none focus:border-purple-500 transition-colors`}
                            placeholder="••••••••"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                              isDarkMode ? 'text-purple-400' : 'text-purple-600'
                            }`}
                          >
                            {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 mt-6"
                      >
                        {loading ? (
                          <Loader className="w-5 h-5 animate-spin inline mr-2" />
                        ) : (
                          <Shield className="w-5 h-5 inline mr-2" />
                        )}
                        Change Password
                      </button>
                    </form>

                    <div className={`mt-6 p-4 rounded-xl ${
                      isDarkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'
                    } border`}>
                      <h4 className={`text-sm font-bold mb-2 ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-700'
                      }`}>
                        Password Security Tips
                      </h4>
                      <ul className={`text-xs sm:text-sm space-y-1 ${
                        isDarkMode ? 'text-blue-200' : 'text-blue-600'
                      }`}>
                        <li>• Use at least 8 characters</li>
                        <li>• Include uppercase and lowercase letters</li>
                        <li>• Add numbers and special characters</li>
                        <li>• Avoid common words or personal information</li>
                        <li>• Don't reuse passwords from other accounts</li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;