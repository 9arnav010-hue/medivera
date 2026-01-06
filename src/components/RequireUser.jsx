import React, { useEffect, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';

// Safe wrapper component that ensures user is loaded
const RequireUser = ({ user, children, isDarkMode, setCurrentPage }) => {
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    // If still loading after 5 seconds, show error
    const timeout = setTimeout(() => {
      if (!user || (!user._id && !user.id)) {
        console.error('User loading timeout. User object:', user);
        setShowError(true);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [user]);

  // If user is not loaded yet, show loading spinner
  if (!user || (!user._id && !user.id)) {
    if (showError) {
      return (
        <div className={`min-h-screen flex items-center justify-center ${
          isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
          <div className="text-center max-w-md px-4">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h3 className={`text-xl font-bold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Failed to Load User Data
            </h3>
            <p className={`mb-6 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              There was a problem loading your user information. Please try logging in again.
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('healthsphere_token');
                localStorage.removeItem('healthsphere_user');
                window.location.reload();
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:shadow-lg transition-all"
            >
              Return to Login
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-500" />
          <p className={`${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
            Loading user data...
          </p>
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            This is taking longer than usual...
          </p>
        </div>
      </div>
    );
  }

  // User is loaded, render children
  return <>{children}</>;
};

export default RequireUser;