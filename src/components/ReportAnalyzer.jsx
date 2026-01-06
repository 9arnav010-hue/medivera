import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Loader2, Download, Languages, CheckCircle } from 'lucide-react';
import { reportAPI } from '../services/api';

export default function ReportAnalyzer({ isDarkMode }) {
  const [reportText, setReportText] = useState('');
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [language, setLanguage] = useState('English');
  const [uploadType, setUploadType] = useState('text');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      alert('Please select a PDF file');
    }
  };

  const handleAnalyze = async () => {
    if (!reportText && !file) return;
    
    setAnalyzing(true);
    setResult(null);

    try {
      let response;
      
      if (uploadType === 'text' && reportText) {
        response = await reportAPI.analyzeText({
          reportText,
          language,
          reportType: 'general'
        });
      } else if (uploadType === 'pdf' && file) {
        const formData = new FormData();
        formData.append('pdf', file);
        formData.append('language', language);
        response = await reportAPI.analyzePDF(formData);
      }

      if (response.data.success) {
        setResult(response.data.report);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze report. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className={`text-4xl font-bold mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Medical Report Analyzer
      </h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className={`p-6 rounded-2xl ${
          isDarkMode ? 'bg-white/10' : 'bg-white'
        } backdrop-blur-lg border ${
          isDarkMode ? 'border-purple-500/20' : 'border-purple-200'
        }`}>
          <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Upload Report
          </h2>

          {/* Upload Type Selection */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setUploadType('text')}
              className={`flex-1 py-3 rounded-xl font-medium transition ${
                uploadType === 'text'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : isDarkMode
                    ? 'bg-white/5 text-purple-300'
                    : 'bg-gray-100 text-gray-700'
              }`}
            >
              <FileText className="w-5 h-5 inline mr-2" />
              Text
            </button>
            <button
              onClick={() => setUploadType('pdf')}
              className={`flex-1 py-3 rounded-xl font-medium transition ${
                uploadType === 'pdf'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : isDarkMode
                    ? 'bg-white/5 text-purple-300'
                    : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Upload className="w-5 h-5 inline mr-2" />
              PDF
            </button>
          </div>

          {/* Language Selection */}
          <div className="mb-6">
            <label className={`block mb-2 font-medium ${
              isDarkMode ? 'text-purple-300' : 'text-purple-600'
            }`}>
              <Languages className="w-4 h-4 inline mr-2" />
              Output Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl ${
                isDarkMode 
                  ? 'bg-white/5 text-white' 
                  : 'bg-gray-50 text-gray-900'
              } border ${
                isDarkMode ? 'border-purple-500/30' : 'border-purple-200'
              } focus:outline-none focus:border-purple-500`}
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
            </select>
          </div>

          {/* Text Input */}
          {uploadType === 'text' && (
            <div className="mb-6">
              <label className={`block mb-2 font-medium ${
                isDarkMode ? 'text-purple-300' : 'text-purple-600'
              }`}>
                Paste Report Text
              </label>
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Paste your medical report here..."
                className={`w-full px-4 py-3 rounded-xl resize-none h-64 ${
                  isDarkMode 
                    ? 'bg-white/5 text-white placeholder-purple-300/50' 
                    : 'bg-gray-50 text-gray-900 placeholder-gray-400'
                } border ${
                  isDarkMode ? 'border-purple-500/30' : 'border-purple-200'
                } focus:outline-none focus:border-purple-500`}
              />
            </div>
          )}

          {/* PDF Upload */}
          {uploadType === 'pdf' && (
            <div className="mb-6">
              <label className={`block mb-2 font-medium ${
                isDarkMode ? 'text-purple-300' : 'text-purple-600'
              }`}>
                Upload PDF File
              </label>
              <div className={`border-2 border-dashed rounded-xl p-8 text-center ${
                isDarkMode 
                  ? 'border-purple-500/30 bg-white/5' 
                  : 'border-purple-200 bg-gray-50'
              }`}>
                <Upload className={`w-12 h-12 mx-auto mb-4 ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`} />
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="pdf-upload"
                />
                <label
                  htmlFor="pdf-upload"
                  className="cursor-pointer px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl inline-block hover:shadow-lg transition"
                >
                  Choose PDF File
                </label>
                {file && (
                  <p className={`mt-4 ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    {file.name}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={analyzing || (!reportText && !file)}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                <span>Analyze Report</span>
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        <div className={`p-6 rounded-2xl ${
          isDarkMode ? 'bg-white/10' : 'bg-white'
        } backdrop-blur-lg border ${
          isDarkMode ? 'border-purple-500/20' : 'border-purple-200'
        }`}>
          <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Analysis Results
          </h2>

          {!result && !analyzing && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className={`w-16 h-16 mx-auto mb-4 opacity-50 ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`} />
                <p className={`${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                  Upload a report to see analysis
                </p>
              </div>
            </div>
          )}

          {analyzing && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className={`w-16 h-16 mx-auto mb-4 animate-spin ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`} />
                <p className={`${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                  Analyzing your report...
                </p>
              </div>
            </div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className={`p-4 rounded-xl ${
                isDarkMode ? 'bg-white/5' : 'bg-gray-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    AI Confidence Score
                  </h3>
                  <span className="text-2xl font-bold text-green-400">
                    {result.confidence}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-400 to-emerald-400 h-2 rounded-full transition-all"
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>
              </div>

              <div className={`p-4 rounded-xl ${
                isDarkMode ? 'bg-white/5' : 'bg-gray-50'
              } max-h-96 overflow-y-auto`}>
                <h3 className={`font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Summary
                </h3>
                <div className={`whitespace-pre-wrap ${
                  isDarkMode ? 'text-purple-200' : 'text-gray-700'
                }`}>
                  {result.summary}
                </div>
              </div>

              <button
                className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition flex items-center justify-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Download PDF Summary</span>
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}