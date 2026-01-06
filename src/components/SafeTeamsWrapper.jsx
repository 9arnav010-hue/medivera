// SafeTeamsWrapper.jsx
// This wrapper ensures Teams component only renders when user is fully loaded

import React from 'react';
import Teams from './Teams';
import { Loader2 } from 'lucide-react';

const SafeTeamsWrapper = ({ isDarkMode, setCurrentPage, user }) => {
  // Triple check user is loaded with all required fields
  const isUserReady = user && (user._id || user.id) && user.name;

  if (!isUserReady) {
    console.log('SafeTeamsWrapper: User not ready', { user });
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-500" />
          <p className={`${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
            Preparing Teams...
          </p>
        </div>
      </div>
    );
  }

  // User is ready, render Teams component
  console.log('SafeTeamsWrapper: User ready, rendering Teams', { userId: user._id || user.id });
  
  return <Teams isDarkMode={isDarkMode} setCurrentPage={setCurrentPage} user={user} />;
};

export default SafeTeamsWrapper;