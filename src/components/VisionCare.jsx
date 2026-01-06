import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Upload, Loader2, Image as ImageIcon, 
  Zap, CheckCircle, XCircle, AlertCircle, Trash2 
} from 'lucide-react';
import { visionAPI } from '../services/api';

export default function VisionCare({ isDarkMode }) {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [imageType, setImageType] = useState('general');
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setResult(null);
    } else {
      alert('Please select an image file (JPG, PNG, or JPEG)');
    }
  };

  const handleAnalyze = async () => {
    if (!imagePreview) return;

    setAnalyzing(true);
    setResult(null);

    try {
      const response = await visionAPI.analyzeImage({
        imageData: imagePreview,
        imageType
      });

      if (response.data.success) {
        setResult(response.data);
      }
    } catch (error) {
      console.error('Vision analysis error:', error);
      setResult({
        success: false,
        error: 'Failed to analyze image. Please try again.'
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setImage(null);
    setImagePreview(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8"
      >
        <h1 className={`text-4xl md:text-5xl font-bold mb-2 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          VisionCare+ Medical Image Analysis
        </h1>
        <p className={`text-lg ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
          Advanced AI-powered medical image analysis
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={`p-6 rounded-2xl ${
            isDarkMode ? 'bg-white/10' : 'bg-white'
          } backdrop-blur-lg border ${
            isDarkMode ? 'border-purple-500/20' : 'border-purple-200'
          } shadow-xl`}
        >
          <h2 className={`text-2xl font-bold mb-6 flex items-center ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            <Camera className="w-7 h-7 mr-2 text-purple-500" />
            Upload Medical Image
          </h2>

          {/* Image Type Selection */}
          <div className="mb-6">
            <label className={`block mb-3 font-semibold ${
              isDarkMode ? 'text-purple-300' : 'text-purple-600'
            }`}>
              Select Image Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { value: 'general', label: 'General' },
                { value: 'xray', label: 'X-Ray' },
                { value: 'skin', label: 'Skin' },
                { value: 'retinal', label: 'Retinal' },
                { value: 'mri', label: 'MRI' },
                { value: 'ct', label: 'CT Scan' },
              ].map((type) => (
                <motion.button
                  key={type.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setImageType(type.value)}
                  className={`py-3 px-4 rounded-xl font-medium transition-all ${
                    imageType === type.value
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : isDarkMode
                        ? 'bg-white/5 text-purple-300 hover:bg-white/10'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Image Upload Area */}
          <div className={`border-2 border-dashed rounded-2xl p-8 text-center mb-6 transition-all ${
            isDarkMode 
              ? 'border-purple-500/30 bg-white/5 hover:bg-white/10' 
              : 'border-purple-200 bg-gray-50 hover:bg-gray-100'
          }`}>
            <AnimatePresence mode="wait">
              {imagePreview ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative"
                >
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-80 mx-auto rounded-xl shadow-2xl"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={resetAnalysis}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition shadow-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Camera className={`w-20 h-20 mx-auto mb-4 ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer inline-block"
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-purple-500/50 transition-all inline-flex items-center space-x-2"
                    >
                      <Upload className="w-5 h-5" />
                      <span>Choose Image</span>
                    </motion.div>
                  </label>
                  <p className={`mt-4 text-sm ${
                    isDarkMode ? 'text-purple-300' : 'text-purple-600'
                  }`}>
                    Supported formats: JPG, PNG, JPEG
                  </p>
                  <p className={`mt-2 text-xs ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-500'
                  }`}>
                    Maximum file size: 10MB
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Analyze Button */}
          <motion.button
            whileHover={{ scale: imagePreview && !analyzing ? 1.02 : 1 }}
            whileTap={{ scale: imagePreview && !analyzing ? 0.98 : 1 }}
            onClick={handleAnalyze}
            disabled={analyzing || !imagePreview}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Analyzing Image...</span>
              </>
            ) : (
              <>
                <Zap className="w-6 h-6" />
                <span>Analyze with AI</span>
              </>
            )}
          </motion.button>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`mt-6 p-4 rounded-xl ${
              isDarkMode ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'
            } border`}
          >
            <div className="flex items-start space-x-3">
              <AlertCircle className={`w-5 h-5 mt-0.5 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`} />
              <div>
                <p className={`text-sm font-semibold mb-1 ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-700'
                }`}>
                  Educational Purpose Only
                </p>
                <p className={`text-xs ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  This analysis is for educational purposes only and should not be used as a medical diagnosis. Always consult with healthcare professionals.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Results Section */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`p-6 rounded-2xl ${
            isDarkMode ? 'bg-white/10' : 'bg-white'
          } backdrop-blur-lg border ${
            isDarkMode ? 'border-purple-500/20' : 'border-purple-200'
          } shadow-xl`}
        >
          <h2 className={`text-2xl font-bold mb-6 flex items-center ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            <ImageIcon className="w-7 h-7 mr-2 text-pink-500" />
            Analysis Results
          </h2>

          <AnimatePresence mode="wait">
            {!result && !analyzing && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-full min-h-[400px]"
              >
                <div className="text-center">
                  <ImageIcon className={`w-20 h-20 mx-auto mb-4 opacity-30 ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                  <p className={`text-lg ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                    Upload an image to see AI analysis
                  </p>
                  <p className={`text-sm mt-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`}>
                    Get instant insights about medical images
                  </p>
                </div>
              </motion.div>
            )}

            {analyzing && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-full min-h-[400px]"
              >
                <div className="text-center">
                  <Loader2 className={`w-20 h-20 mx-auto mb-4 animate-spin ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                  <p className={`text-lg font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Analyzing your image...
                  </p>
                  <p className={`text-sm mt-2 ${
                    isDarkMode ? 'text-purple-300' : 'text-purple-600'
                  }`}>
                    Our AI is examining the image carefully
                  </p>
                  <div className="flex items-center justify-center space-x-2 mt-6">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                      className="w-3 h-3 bg-purple-500 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                      className="w-3 h-3 bg-pink-500 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                      className="w-3 h-3 bg-blue-500 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {result && result.success && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Confidence Score */}
                <div className={`p-5 rounded-xl ${
                  isDarkMode ? 'bg-white/5' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`font-bold flex items-center ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                      AI Confidence Score
                    </h3>
                    <span className="text-3xl font-bold text-green-400">
                      {result.confidence}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.confidence}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="bg-gradient-to-r from-green-400 to-emerald-400 h-3 rounded-full"
                    />
                  </div>
                </div>

                {/* Analysis Text */}
                <div className={`p-5 rounded-xl ${
                  isDarkMode ? 'bg-white/5' : 'bg-gray-50'
                } max-h-96 overflow-y-auto`}>
                  <h3 className={`font-bold mb-3 flex items-center ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                    Detailed Analysis
                  </h3>
                  <div className={`whitespace-pre-wrap leading-relaxed ${
                    isDarkMode ? 'text-purple-200' : 'text-gray-700'
                  }`}>
                    {result.analysis}
                  </div>
                </div>

                {/* Regions of Interest */}
                {result.regions && result.regions.length > 0 && (
                  <div className={`p-5 rounded-xl ${
                    isDarkMode ? 'bg-white/5' : 'bg-gray-50'
                  }`}>
                    <h3 className={`font-bold mb-4 flex items-center ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      <Camera className="w-5 h-5 mr-2 text-blue-500" />
                      Regions of Interest
                    </h3>
                    <div className="space-y-3">
                      {result.regions.map((region, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-4 rounded-lg ${
                            isDarkMode ? 'bg-white/5' : 'bg-white'
                          } border ${
                            isDarkMode ? 'border-purple-500/20' : 'border-purple-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-semibold ${
                              isDarkMode ? 'text-purple-300' : 'text-purple-600'
                            }`}>
                              Region {index + 1}
                            </span>
                            <span className="text-sm font-bold text-blue-400 bg-blue-500/20 px-3 py-1 rounded-full">
                              {region.confidence}%
                            </span>
                          </div>
                          <p className={`text-sm ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {region.description}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <div className={`p-4 rounded-xl ${
                  isDarkMode ? 'bg-orange-500/10 border-orange-500/30' : 'bg-orange-50 border-orange-200'
                } border`}>
                  <div className="flex items-start space-x-3">
                    <AlertCircle className={`w-5 h-5 mt-0.5 ${
                      isDarkMode ? 'text-orange-400' : 'text-orange-600'
                    }`} />
                    <div>
                      <p className={`text-sm font-semibold mb-1 ${
                        isDarkMode ? 'text-orange-300' : 'text-orange-700'
                      }`}>
                        Important Reminder
                      </p>
                      <p className={`text-xs ${
                        isDarkMode ? 'text-orange-400' : 'text-orange-600'
                      }`}>
                        This AI analysis is for educational purposes only. Please consult qualified healthcare professionals for medical advice and diagnosis.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {result && !result.success && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-full min-h-[400px]"
              >
                <div className="text-center">
                  <XCircle className="w-20 h-20 mx-auto mb-4 text-red-500" />
                  <p className={`text-lg font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Analysis Failed
                  </p>
                  <p className={`text-sm mt-2 ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>
                    {result.error || 'Something went wrong. Please try again.'}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetAnalysis}
                    className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition"
                  >
                    Try Again
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}