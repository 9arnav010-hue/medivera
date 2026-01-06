import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      const { isDarkMode } = this.props;
      
      return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${
          isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
          <div className={`max-w-md w-full p-8 rounded-2xl ${
            isDarkMode ? 'bg-gray-800 border-red-500/20' : 'bg-white border-red-200'
          } border shadow-xl`}>
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              
              <h2 className={`text-2xl font-bold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Oops! Something went wrong
              </h2>
              
              <p className={`mb-6 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className={`mb-6 text-left p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
                }`}>
                  <summary className={`cursor-pointer font-medium mb-2 ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>
                    Error Details (Development Mode)
                  </summary>
                  <pre className={`text-xs overflow-auto ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3">
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:shadow-lg transition-all"
                >
                  <Home className="w-5 h-5" />
                  Go to Dashboard
                </button>
                
                <button
                  onClick={this.handleRefresh}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    isDarkMode 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <RefreshCw className="w-5 h-5" />
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;