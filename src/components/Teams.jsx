import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Plus, X, Crown, Award, TrendingUp, LogOut, Edit2, Save, Copy, UserMinus, Share, Key } from 'lucide-react';
import axios from 'axios';

const Teams = ({ isDarkMode, setCurrentPage }) => {
  const [activeTab, setActiveTab] = useState('my-teams');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [myTeams, setMyTeams] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamToShare, setTeamToShare] = useState(null);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [joinTeamCode, setJoinTeamCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxMembers: 10,
    isPublic: true
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    loadTeamsData();
  }, []);

  const loadTeamsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('healthsphere_token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const [myTeamsRes, allTeamsRes] = await Promise.allSettled([
        axios.get(`${API_URL}/teams/my-teams`, config),
        axios.get(`${API_URL}/teams/all`, config)
      ]);

      if (myTeamsRes.status === 'fulfilled' && myTeamsRes.value?.data?.teams) {
        setMyTeams(Array.isArray(myTeamsRes.value.data.teams) ? myTeamsRes.value.data.teams.filter(team => team && team._id) : []);
      }

      if (allTeamsRes.status === 'fulfilled' && allTeamsRes.value?.data?.teams) {
        setAllTeams(Array.isArray(allTeamsRes.value.data.teams) ? allTeamsRes.value.data.teams.filter(team => team && team._id) : []);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('healthsphere_token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const response = await axios.post(
        `${API_URL}/teams/create`,
        formData,
        config
      );

      if (response.data.success) {
        setSuccessMessage('Team created successfully!');
        setShowSuccessMessage(true);
        setShowCreateModal(false);
        
        setFormData({
          name: '',
          description: '',
          maxMembers: 10,
          isPublic: true
        });

        await loadTeamsData();

        setTimeout(() => setShowSuccessMessage(false), 3000);
      }
    } catch (error) {
      console.error('Error creating team:', error);
      alert(error.response?.data?.message || 'Failed to create team');
    }
  };

  const handleJoinTeam = async (teamId) => {
    try {
      const token = localStorage.getItem('healthsphere_token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const response = await axios.post(
        `${API_URL}/teams/${teamId}/join`,
        {},
        config
      );

      if (response.data.success) {
        setSuccessMessage('Joined team successfully!');
        setShowSuccessMessage(true);
        await loadTeamsData();
        setTimeout(() => setShowSuccessMessage(false), 3000);
      }
    } catch (error) {
      console.error('Error joining team:', error);
      alert(error.response?.data?.message || 'Failed to join team');
    }
  };

  const handleJoinWithCode = async (e) => {
    e.preventDefault();
    if (!joinTeamCode.trim()) {
      alert('Please enter a Team ID');
      return;
    }
    
    try {
      const token = localStorage.getItem('healthsphere_token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const response = await axios.post(
        `${API_URL}/teams/join/${joinTeamCode.trim()}`,
        {},
        config
      );

      if (response.data.success) {
        setSuccessMessage('Joined team successfully!');
        setShowSuccessMessage(true);
        setShowJoinModal(false);
        setJoinTeamCode('');
        await loadTeamsData();
        setTimeout(() => setShowSuccessMessage(false), 3000);
      }
    } catch (error) {
      console.error('Error joining team with code:', error);
      const errorMessage = error.response?.data?.message || 'Failed to join team';
      alert(`Error: ${errorMessage}\n\nPlease make sure you have the correct Team ID.`);
    }
  };

  const handleLeaveTeam = async (teamId) => {
    if (!confirm('Are you sure you want to leave this team?')) {
      return;
    }

    try {
      const token = localStorage.getItem('healthsphere_token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const response = await axios.post(
        `${API_URL}/teams/${teamId}/leave`,
        {},
        config
      );

      if (response.data.success) {
        setSuccessMessage('Left team successfully!');
        setShowSuccessMessage(true);
        setSelectedTeam(null);
        await loadTeamsData();
        setTimeout(() => setShowSuccessMessage(false), 3000);
      }
    } catch (error) {
      console.error('Error leaving team:', error);
      alert(error.response?.data?.message || 'Failed to leave team');
    }
  };

  const handleRemoveMember = async (teamId, memberId) => {
    try {
      const token = localStorage.getItem('healthsphere_token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const response = await axios.post(
        `${API_URL}/teams/${teamId}/remove-member`,
        { memberId },
        config
      );

      if (response.data.success) {
        setSuccessMessage('Member removed successfully!');
        setShowSuccessMessage(true);
        setShowRemoveMemberModal(false);
        setMemberToRemove(null);
        
        if (selectedTeam && selectedTeam._id === teamId) {
          const updatedTeamRes = await axios.get(
            `${API_URL}/teams/${teamId}`,
            config
          );
          if (updatedTeamRes.data.success) {
            setSelectedTeam(updatedTeamRes.data.team);
          }
        }
        
        await loadTeamsData();
        setTimeout(() => setShowSuccessMessage(false), 3000);
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const copyTeamId = async (team) => {
    try {
      await navigator.clipboard.writeText(team._id);
      setSuccessMessage('Team ID copied to clipboard!');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy Team ID');
    }
  };

  const openShareModal = (team) => {
    setTeamToShare(team);
    setShowShareModal(true);
  };

  const viewTeamDetails = async (teamId) => {
    try {
      const token = localStorage.getItem('healthsphere_token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const response = await axios.get(
        `${API_URL}/teams/${teamId}`,
        config
      );

      if (response.data.success) {
        setSelectedTeam(response.data.team);
      }
    } catch (error) {
      console.error('Error fetching team details:', error);
    }
  };

  const renderTeamCard = (team, isMine = false) => {
    if (!team || !team._id) return null;

    const userId = JSON.parse(localStorage.getItem('healthsphere_user'))?._id;
    const isCaptain = team?.captain && (
      (team.captain._id && team.captain._id === userId) || 
      team.captain === userId
    );
    const isMember = team.members?.some(member => 
      (member?.user?._id === userId) || 
      (member?.user === userId) || 
      (member === userId)
    );

    return (
      <motion.div
        key={team._id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className={`relative ${
          isDarkMode ? 'bg-purple-900/20 border-purple-500/20' : 'bg-white border-purple-200'
        } backdrop-blur-xl rounded-xl p-6 border transition-all`}
      >
        <div 
          className={isMine ? 'cursor-pointer' : ''}
          onClick={isMine ? () => viewTeamDetails(team._id) : undefined}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {team.name || 'Unnamed Team'}
                </h3>
                {isCaptain && (
                  <Crown className="w-5 h-5 text-yellow-500" />
                )}
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                {team.description || 'No description'}
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className={`flex items-center space-x-1 ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                  <Users className="w-4 h-4" />
                  <span>{(team.members?.length || 0)}/{team.maxMembers || 10} members</span>
                </span>
                <span className={`flex items-center space-x-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  <TrendingUp className="w-4 h-4" />
                  <span>{(team.totalDistance || 0).toFixed(1)} km</span>
                </span>
                <span className={`flex items-center space-x-1 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                  <Award className="w-4 h-4" />
                  <span>{team.totalPoints || 0} pts</span>
                </span>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              team.isPublic
                ? 'bg-green-500/20 text-green-400'
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {team.isPublic ? 'Public' : 'Private'}
            </div>
          </div>
          
          <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
            {isMine ? (
              <button 
                onClick={() => viewTeamDetails(team._id)}
                className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:shadow-lg transition-all"
              >
                View Details
              </button>
            ) : isMember ? (
              <button 
                onClick={() => viewTeamDetails(team._id)}
                className="flex-1 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:shadow-lg transition-all"
              >
                View Team
              </button>
            ) : team.isPublic ? (
              <button 
                onClick={() => handleJoinTeam(team._id)}
                className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:shadow-lg transition-all"
              >
                Join Team
              </button>
            ) : (
              <button 
                onClick={() => openShareModal(team)}
                className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Share className="w-4 h-4" />
                Get Team ID
              </button>
            )}
          </div>
        </div>

        {isCaptain && isMine && (
          <div 
            className="absolute top-4 right-4 z-10"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <button
              onClick={() => {
                openShareModal(team);
              }}
              className="p-2 rounded-full hover:bg-white/10 transition-colors bg-purple-900/50 backdrop-blur-sm"
              title="Share Team"
            >
              <Share className="w-5 h-5 text-purple-300" />
            </button>
          </div>
        )}
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-purple-300' : 'text-purple-600'}>Loading teams...</p>
        </div>
      </div>
    );
  }

  if (selectedTeam) {
    return (
      <>
        <TeamDetail 
          team={selectedTeam} 
          isDarkMode={isDarkMode} 
          onBack={() => {
            setSelectedTeam(null);
            setShowShareModal(false);
            setTeamToShare(null);
          }}
          onLeave={handleLeaveTeam}
          onRemoveMember={(memberId) => {
            setMemberToRemove({ teamId: selectedTeam._id, memberId });
            setShowRemoveMemberModal(true);
          }}
          onUpdate={loadTeamsData}
          onShare={(team) => {
            setTeamToShare(team);
            setShowShareModal(true);
          }}
        />
        
        <AnimatePresence>
          {showShareModal && teamToShare && (
            <ShareTeamModal
              isDarkMode={isDarkMode}
              team={teamToShare}
              onClose={() => {
                setShowShareModal(false);
                setTeamToShare(null);
              }}
              onCopyLink={() => copyTeamId(teamToShare)}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
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

      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl"
          >
            <p className="text-green-300 text-center font-medium">✅ {successMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Teams
            </h1>
            <p className={`${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
              Join or create teams to compete together
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowJoinModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl shadow-lg flex items-center space-x-2"
          >
            <Key className="w-5 h-5" />
            <span>Join with Team ID</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Team</span>
          </motion.button>
        </div>
      </motion.div>

      <div className="flex space-x-2 mb-8">
        <button
          onClick={() => setActiveTab('my-teams')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'my-teams'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
              : isDarkMode
              ? 'bg-purple-900/20 text-purple-300 hover:bg-purple-900/30'
              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
          }`}
        >
          My Teams ({myTeams.length})
        </button>
        <button
          onClick={() => setActiveTab('all-teams')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'all-teams'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
              : isDarkMode
              ? 'bg-purple-900/20 text-purple-300 hover:bg-purple-900/30'
              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
          }`}
        >
          All Teams ({allTeams.length})
        </button>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'my-teams' ? (
          myTeams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myTeams.filter(team => team && team._id).map(team => renderTeamCard(team, true))}
            </div>
          ) : (
            <div className={`${
              isDarkMode ? 'bg-purple-900/20 border-purple-500/20' : 'bg-white border-purple-200'
            } backdrop-blur-xl rounded-2xl p-12 border text-center`}>
              <Users className={`w-16 h-16 mx-auto mb-4 ${
                isDarkMode ? 'text-gray-600' : 'text-gray-300'
              }`} />
              <p className={`text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                You haven't joined a team yet
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                Create or join a team to start competing together!
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg"
              >
                Create Your First Team
              </motion.button>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allTeams.filter(team => team && team._id).map(team => renderTeamCard(team, false))}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showCreateModal && (
          <CreateTeamModal
            isDarkMode={isDarkMode}
            formData={formData}
            setFormData={setFormData}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateTeam}
          />
        )}
        
        {showShareModal && teamToShare && (
          <ShareTeamModal
            isDarkMode={isDarkMode}
            team={teamToShare}
            onClose={() => {
              setShowShareModal(false);
              setTeamToShare(null);
            }}
            onCopyLink={() => copyTeamId(teamToShare)}
          />
        )}

        {showJoinModal && (
          <JoinTeamModal
            isDarkMode={isDarkMode}
            joinTeamCode={joinTeamCode}
            setJoinTeamCode={setJoinTeamCode}
            onClose={() => {
              setShowJoinModal(false);
              setJoinTeamCode('');
            }}
            onSubmit={handleJoinWithCode}
          />
        )}

        {showRemoveMemberModal && memberToRemove && (
          <RemoveMemberModal
            isDarkMode={isDarkMode}
            memberId={memberToRemove.memberId}
            teamId={memberToRemove.teamId}
            onClose={() => {
              setShowRemoveMemberModal(false);
              setMemberToRemove(null);
            }}
            onConfirm={handleRemoveMember}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

function CreateTeamModal({ isDarkMode, formData, setFormData, onClose, onSubmit }) {
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
        className={`max-w-md w-full rounded-2xl ${
          isDarkMode ? 'bg-gray-900' : 'bg-white'
        } p-8`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Create Team
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

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-purple-300' : 'text-purple-700'
            }`}>
              Team Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg ${
                isDarkMode 
                  ? 'bg-white/5 text-white border-purple-500/30' 
                  : 'bg-gray-50 text-gray-900 border-purple-200'
              } border focus:outline-none focus:border-purple-500`}
              placeholder="Enter team name"
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-purple-300' : 'text-purple-700'
            }`}>
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg ${
                isDarkMode 
                  ? 'bg-white/5 text-white border-purple-500/30' 
                  : 'bg-gray-50 text-gray-900 border-purple-200'
              } border focus:outline-none focus:border-purple-500 resize-none`}
              rows="3"
              placeholder="Describe your team"
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-purple-300' : 'text-purple-700'
            }`}>
              Max Members
            </label>
            <input
              type="number"
              value={formData.maxMembers}
              onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) })}
              className={`w-full px-4 py-3 rounded-lg ${
                isDarkMode 
                  ? 'bg-white/5 text-white border-purple-500/30' 
                  : 'bg-gray-50 text-gray-900 border-purple-200'
              } border focus:outline-none focus:border-purple-500`}
              min="2"
              max="50"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="w-5 h-5 rounded border-purple-500 text-purple-600 focus:ring-purple-500"
            />
            <label
              htmlFor="isPublic"
              className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Public team (anyone can join)
            </label>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                isDarkMode 
                  ? 'bg-white/10 text-white hover:bg-white/20' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
            >
              Create
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function ShareTeamModal({ isDarkMode, team, onClose, onCopyLink }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await onCopyLink();
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

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
        className={`max-w-md w-full rounded-2xl ${
          isDarkMode ? 'bg-gray-900' : 'bg-white'
        } p-8`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Share Team
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

        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${
            isDarkMode ? 'bg-white/5' : 'bg-gray-50'
          }`}>
            <h3 className={`font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {team?.name || 'Team'}
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {team?.description || 'No description'}
            </p>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-purple-300' : 'text-purple-700'
            }`}>
              Team ID (Share this to invite others)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={team?._id || ''}
                readOnly
                className={`flex-1 px-4 py-3 rounded-lg ${
                  isDarkMode 
                    ? 'bg-white/5 text-white border-purple-500/30' 
                    : 'bg-gray-50 text-gray-900 border-purple-200'
                } border focus:outline-none focus:border-purple-500 font-mono text-sm`}
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`px-4 py-3 font-bold rounded-lg transition-all flex items-center justify-center ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
                }`}
              >
                {copied ? (
                  <>
                    <span className="mr-2">✓</span>
                    Copied!
                  </>
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Share this Team ID with others to invite them to join your team.
            They can use this ID in the "Join with Team ID" option.
          </p>

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                isDarkMode 
                  ? 'bg-white/10 text-white hover:bg-white/20' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
              }`}
            >
              {copied ? 'Copied!' : (
                <>
                  <Copy className="w-5 h-5" />
                  Copy ID
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function JoinTeamModal({ isDarkMode, joinTeamCode, setJoinTeamCode, onClose, onSubmit }) {
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
        className={`max-w-md w-full rounded-2xl ${
          isDarkMode ? 'bg-gray-900' : 'bg-white'
        } p-8`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Join Team with Team ID
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

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-purple-300' : 'text-purple-700'
            }`}>
              Enter Team ID
            </label>
            <input
              type="text"
              value={joinTeamCode}
              onChange={(e) => setJoinTeamCode(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg ${
                isDarkMode 
                  ? 'bg-white/5 text-white border-purple-500/30' 
                  : 'bg-gray-50 text-gray-900 border-purple-200'
              } border focus:outline-none focus:border-purple-500 font-mono`}
              placeholder="Paste Team ID here"
              required
            />
          </div>

          <div className={`p-4 rounded-lg ${
            isDarkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'
          } border`}>
            <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              <strong>How to get Team ID:</strong>
            </p>
            <ul className={`text-sm mt-2 space-y-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
              <li>• Ask the team captain for the Team ID</li>
              <li>• Team captain can find it in Team Details</li>
              <li>• Or by clicking "Get Team ID" on team card</li>
            </ul>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                isDarkMode 
                  ? 'bg-white/10 text-white hover:bg-white/20' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
            >
              Join Team
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function RemoveMemberModal({ isDarkMode, teamId, memberId, onClose, onConfirm }) {
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
        className={`max-w-md w-full rounded-2xl ${
          isDarkMode ? 'bg-gray-900' : 'bg-white'
        } p-8`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Remove Member
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

        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${
            isDarkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
          } border text-center`}>
            <UserMinus className={`w-12 h-12 mx-auto mb-2 ${
              isDarkMode ? 'text-red-400' : 'text-red-500'
            }`} />
            <p className={`font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Are you sure?
            </p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              This member will be removed from the team. This action cannot be undone.
            </p>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                isDarkMode 
                  ? 'bg-white/10 text-white hover:bg-white/20' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(teamId, memberId)}
              className="flex-1 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
            >
              Remove Member
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TeamDetail({ team, isDarkMode, onBack, onLeave, onRemoveMember, onUpdate, onShare }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editedName, setEditedName] = useState(team?.name || '');
  const [editedDesc, setEditedDesc] = useState(team?.description || '');
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  if (!team) return null;

  const userId = JSON.parse(localStorage.getItem('healthsphere_user'))?._id;
  const isCaptain = team?.captain && (
    (team.captain._id && team.captain._id === userId) || 
    team.captain === userId
  );

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleSaveName = async () => {
    try {
      const token = localStorage.getItem('healthsphere_token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      await axios.put(
        `${API_URL}/teams/${team._id}/name`,
        { name: editedName },
        config
      );

      team.name = editedName;
      setIsEditingName(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating name:', error);
      alert(error.response?.data?.message || 'Failed to update name');
    }
  };

  const handleSaveDesc = async () => {
    try {
      const token = localStorage.getItem('healthsphere_token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      await axios.put(
        `${API_URL}/teams/${team._id}/description`,
        { description: editedDesc },
        config
      );

      team.description = editedDesc;
      setIsEditingDesc(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating description:', error);
      alert(error.response?.data?.message || 'Failed to update description');
    }
  };

  const copyTeamId = async () => {
    try {
      await navigator.clipboard.writeText(team._id);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const sortedMembers = [...(team.members || [])].sort((a, b) => 
    (b?.contribution?.distance || 0) - (a?.contribution?.distance || 0)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onBack}
        className={`mb-6 flex items-center space-x-2 px-4 py-2 rounded-lg ${
          isDarkMode ? 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
        } transition-colors`}
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Teams</span>
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${
          isDarkMode ? 'bg-purple-900/20 border-purple-500/20' : 'bg-white border-purple-200'
        } backdrop-blur-xl rounded-2xl p-8 border mb-8`}
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            {isEditingName && isCaptain ? (
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className={`flex-1 px-4 py-2 rounded-lg ${
                    isDarkMode ? 'bg-white/5 text-white border-purple-500/30' : 'bg-gray-50 text-gray-900 border-purple-200'
                  } border focus:outline-none focus:border-purple-500`}
                />
                <button onClick={handleSaveName} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                  <Save className="w-5 h-5" />
                </button>
                <button onClick={() => setIsEditingName(false)} className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 mb-4">
                <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {team.name || 'Team'}
                </h1>
                {isCaptain && (
                  <button onClick={() => setIsEditingName(true)} className="p-2 hover:bg-white/10 rounded-lg">
                    <Edit2 className="w-5 h-5 text-purple-400" />
                  </button>
                )}
              </div>
            )}

            {isEditingDesc && isCaptain ? (
              <div className="flex items-center space-x-2">
                <textarea
                  value={editedDesc}
                  onChange={(e) => setEditedDesc(e.target.value)}
                  className={`flex-1 px-4 py-2 rounded-lg ${
                    isDarkMode ? 'bg-white/5 text-white border-purple-500/30' : 'bg-gray-50 text-gray-900 border-purple-200'
                  } border focus:outline-none focus:border-purple-500 resize-none`}
                  rows="2"
                />
                <button onClick={handleSaveDesc} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                  <Save className="w-5 h-5" />
                </button>
                <button onClick={() => setIsEditingDesc(false)} className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-start space-x-2">
                <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {team.description || 'No description'}
                </p>
                {isCaptain && (
                  <button onClick={() => setIsEditingDesc(true)} className="p-1 hover:bg-white/10 rounded-lg">
                    <Edit2 className="w-4 h-4 text-purple-400" />
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onShare(team)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center space-x-2"
            >
              <Share className="w-5 h-5" />
              <span>Share Team</span>
            </button>
            <button
              onClick={() => onLeave(team._id)}
              className="px-6 py-3 bg-red-500/20 text-red-400 font-bold rounded-xl hover:bg-red-500/30 transition-all flex items-center space-x-2"
            >
              <LogOut className="w-5 h-5" />
              <span>Leave Team</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Distance</p>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {(team.totalDistance || 0).toFixed(2)} km
            </p>
          </div>
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Points</p>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {team.totalPoints || 0}
            </p>
          </div>
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Runs</p>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {team.totalRuns || 0}
            </p>
          </div>
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-orange-900/30' : 'bg-orange-100'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Members</p>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {(team.members?.length || 0)}/{team.maxMembers || 10}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`${
          isDarkMode ? 'bg-purple-900/20 border-purple-500/20' : 'bg-white border-purple-200'
        } backdrop-blur-xl rounded-2xl p-8 border`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Team Members
          </h2>
          <div className="text-sm px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400">
            {sortedMembers.length} Members
          </div>
        </div>

        <div className="space-y-4">
          {sortedMembers.map((member, index) => {
            if (!member) return null;
            
            const isTeamCaptain = member.user && (
              (member.user._id && member.user._id === team.captain?._id) || 
              (member.user._id && member.user._id === team.captain) ||
              member.user === team.captain
            );
            const isCurrentUser = member.user && (
              (member.user._id && member.user._id === userId) || 
              member.user === userId
            );
            
            return (
              <div
                key={member.user?._id || index}
                className={`p-4 rounded-xl ${
                  isDarkMode ? 'bg-purple-900/20 border-purple-500/20' : 'bg-gray-50 border-gray-200'
                } border flex items-center justify-between`}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤'}</div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {member.user?.name || member.user?.email || 'Unknown Member'}
                      </p>
                      {isTeamCaptain && <Crown className="w-4 h-4 text-yellow-500" />}
                    </div>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Joined {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Unknown date'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className={`text-sm font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                      {(member.contribution?.distance || 0).toFixed(2)} km
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {member.contribution?.points || 0} pts • {member.contribution?.runs || 0} runs
                    </p>
                  </div>
                  
                  {isCaptain && !isTeamCaptain && !isCurrentUser && (
                    <button
                      onClick={() => onRemoveMember(member.user?._id)}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      title="Remove Member"
                    >
                      <UserMinus className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

export default Teams;