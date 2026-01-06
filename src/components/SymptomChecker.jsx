import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Heart, AlertCircle, CheckCircle, XCircle, 
  Search, X, Plus, Thermometer, Clock, User, MapPin,
  Brain, Stethoscope, Pill, FileText, TrendingUp, Loader,
  ArrowRight, Info
} from 'lucide-react';
import axios from 'axios';

export default function SymptomChecker({ isDarkMode }) {
  const [step, setStep] = useState(1); // 1: Input, 2: Details, 3: Results
  const [symptoms, setSymptoms] = useState([]);
  const [currentSymptom, setCurrentSymptom] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  
  // Patient details
  const [patientDetails, setPatientDetails] = useState({
    age: '',
    gender: '',
    duration: '',
    severity: 'moderate',
    additionalInfo: ''
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Common symptoms for quick selection
  const commonSymptoms = [
    { icon: '🤒', name: 'Fever', category: 'General' },
    { icon: '😷', name: 'Cough', category: 'Respiratory' },
    { icon: '🤧', name: 'Runny Nose', category: 'Respiratory' },
    { icon: '😫', name: 'Headache', category: 'Neurological' },
    { icon: '🤢', name: 'Nausea', category: 'Digestive' },
    { icon: '😴', name: 'Fatigue', category: 'General' },
    { icon: '💪', name: 'Body Aches', category: 'Musculoskeletal' },
    { icon: '🤕', name: 'Sore Throat', category: 'Respiratory' },
    { icon: '😵', name: 'Dizziness', category: 'Neurological' },
    { icon: '🥵', name: 'Chills', category: 'General' },
    { icon: '🤮', name: 'Vomiting', category: 'Digestive' },
    { icon: '💩', name: 'Diarrhea', category: 'Digestive' },
    { icon: '🫁', name: 'Shortness of Breath', category: 'Respiratory' },
    { icon: '💔', name: 'Chest Pain', category: 'Cardiovascular' },
    { icon: '🧠', name: 'Confusion', category: 'Neurological' },
    { icon: '👃', name: 'Loss of Smell', category: 'Sensory' },
  ];

  const handleAddSymptom = (symptomName) => {
    if (symptomName && !selectedSymptoms.includes(symptomName)) {
      setSelectedSymptoms([...selectedSymptoms, symptomName]);
      setCurrentSymptom('');
    }
  };

  const handleRemoveSymptom = (symptom) => {
    setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
  };

  const handleSubmit = async () => {
    if (selectedSymptoms.length === 0) {
      setError('Please select at least one symptom');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('healthsphere_token');
      
      const response = await axios.post(
        `${API_URL}/symptom-checker/analyze`,
        {
          symptoms: selectedSymptoms,
          patientDetails
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setAnalysis(response.data.analysis);
        setStep(3);
      }
    } catch (err) {
      console.error('Error analyzing symptoms:', err);
      setError(err.response?.data?.message || 'Failed to analyze symptoms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedSymptoms([]);
    setCurrentSymptom('');
    setPatientDetails({
      age: '',
      gender: '',
      duration: '',
      severity: 'moderate',
      additionalInfo: ''
    });
    setAnalysis(null);
    setError('');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 py-8"
    >
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8"
      >
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              AI Symptom Checker
            </h1>
            <p className={`text-lg ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
              Get preliminary health insights based on your symptoms
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`p-4 rounded-xl border ${
            isDarkMode 
              ? 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300' 
              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          } flex items-start space-x-3`}
        >
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Medical Disclaimer</p>
            <p>This tool provides general information only and is not a substitute for professional medical advice. Always consult a healthcare provider for accurate diagnosis and treatment.</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8 space-x-4">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 * s }}
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                step >= s
                  ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg'
                  : isDarkMode
                  ? 'bg-gray-800 text-gray-500'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {step > s ? <CheckCircle className="w-6 h-6" /> : s}
            </motion.div>
            {s < 3 && (
              <div className={`w-16 h-1 rounded ${
                step > s
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600'
                  : isDarkMode
                  ? 'bg-gray-800'
                  : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Symptom Selection */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`${
              isDarkMode ? 'bg-purple-900/20 border-purple-500/20' : 'bg-white border-purple-200'
            } backdrop-blur-xl rounded-2xl p-8 border`}
          >
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              What symptoms are you experiencing?
            </h2>

            {/* Selected Symptoms */}
            {selectedSymptoms.length > 0 && (
              <div className="mb-6">
                <p className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                  Selected Symptoms ({selectedSymptoms.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedSymptoms.map((symptom) => (
                    <motion.div
                      key={symptom}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                        isDarkMode 
                          ? 'bg-blue-900/30 border border-blue-500/30' 
                          : 'bg-blue-100 border border-blue-200'
                      }`}
                    >
                      <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {symptom}
                      </span>
                      <button
                        onClick={() => handleRemoveSymptom(symptom)}
                        className="hover:scale-110 transition-transform"
                      >
                        <X className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Symptom Input */}
            <div className="mb-6">
              <p className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                Add Custom Symptom
              </p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={currentSymptom}
                  onChange={(e) => setCurrentSymptom(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSymptom(currentSymptom)}
                  placeholder="Type a symptom and press Enter"
                  className={`flex-1 px-4 py-3 rounded-lg ${
                    isDarkMode 
                      ? 'bg-white/5 text-white border-purple-500/30' 
                      : 'bg-gray-50 text-gray-900 border-purple-200'
                  } border focus:outline-none focus:border-purple-500 transition-colors`}
                />
                <button
                  onClick={() => handleAddSymptom(currentSymptom)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Common Symptoms */}
            <div>
              <p className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                Or select from common symptoms
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {commonSymptoms.map((symptom) => (
                  <motion.button
                    key={symptom.name}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAddSymptom(symptom.name)}
                    disabled={selectedSymptoms.includes(symptom.name)}
                    className={`p-4 rounded-xl transition-all ${
                      selectedSymptoms.includes(symptom.name)
                        ? isDarkMode
                          ? 'bg-green-900/30 border-green-500/30 opacity-50'
                          : 'bg-green-100 border-green-200 opacity-50'
                        : isDarkMode
                        ? 'bg-white/5 hover:bg-white/10 border-purple-500/20'
                        : 'bg-white hover:bg-gray-50 border-purple-200'
                    } border`}
                  >
                    <div className="text-3xl mb-2">{symptom.icon}</div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {symptom.name}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {symptom.category}
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 flex items-center space-x-2"
              >
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="flex justify-end mt-8">
              <button
                onClick={() => setStep(2)}
                disabled={selectedSymptoms.length === 0}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <span>Next: Patient Details</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Patient Details */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`${
              isDarkMode ? 'bg-purple-900/20 border-purple-500/20' : 'bg-white border-purple-200'
            } backdrop-blur-xl rounded-2xl p-8 border`}
          >
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Tell us more about you
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                  <User className="w-4 h-4 inline mr-2" />
                  Age
                </label>
                <input
                  type="number"
                  value={patientDetails.age}
                  onChange={(e) => setPatientDetails({...patientDetails, age: e.target.value})}
                  placeholder="Enter your age"
                  className={`w-full px-4 py-3 rounded-lg ${
                    isDarkMode 
                      ? 'bg-white/5 text-white border-purple-500/30' 
                      : 'bg-gray-50 text-gray-900 border-purple-200'
                  } border focus:outline-none focus:border-purple-500 transition-colors`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                  Gender
                </label>
                <select
                  value={patientDetails.gender}
                  onChange={(e) => setPatientDetails({...patientDetails, gender: e.target.value})}
                  className={`w-full px-4 py-3 rounded-lg ${
                    isDarkMode 
                      ? 'bg-white/5 text-white border-purple-500/30' 
                      : 'bg-gray-50 text-gray-900 border-purple-200'
                  } border focus:outline-none focus:border-purple-500 transition-colors`}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                  <Clock className="w-4 h-4 inline mr-2" />
                  Symptom Duration
                </label>
                <select
                  value={patientDetails.duration}
                  onChange={(e) => setPatientDetails({...patientDetails, duration: e.target.value})}
                  className={`w-full px-4 py-3 rounded-lg ${
                    isDarkMode 
                      ? 'bg-white/5 text-white border-purple-500/30' 
                      : 'bg-gray-50 text-gray-900 border-purple-200'
                  } border focus:outline-none focus:border-purple-500 transition-colors`}
                >
                  <option value="">Select duration</option>
                  <option value="hours">A few hours</option>
                  <option value="1-2days">1-2 days</option>
                  <option value="3-7days">3-7 days</option>
                  <option value="1-2weeks">1-2 weeks</option>
                  <option value="2weeks+">More than 2 weeks</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                  <Activity className="w-4 h-4 inline mr-2" />
                  Severity
                </label>
                <select
                  value={patientDetails.severity}
                  onChange={(e) => setPatientDetails({...patientDetails, severity: e.target.value})}
                  className={`w-full px-4 py-3 rounded-lg ${
                    isDarkMode 
                      ? 'bg-white/5 text-white border-purple-500/30' 
                      : 'bg-gray-50 text-gray-900 border-purple-200'
                  } border focus:outline-none focus:border-purple-500 transition-colors`}
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                Additional Information (Optional)
              </label>
              <textarea
                value={patientDetails.additionalInfo}
                onChange={(e) => setPatientDetails({...patientDetails, additionalInfo: e.target.value})}
                placeholder="Any other relevant details about your symptoms..."
                rows={4}
                className={`w-full px-4 py-3 rounded-lg ${
                  isDarkMode 
                    ? 'bg-white/5 text-white border-purple-500/30' 
                    : 'bg-gray-50 text-gray-900 border-purple-200'
                } border focus:outline-none focus:border-purple-500 transition-colors resize-none`}
              />
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep(1)}
                className={`px-8 py-3 rounded-xl font-bold transition-all ${
                  isDarkMode 
                    ? 'bg-white/10 text-white hover:bg-white/20' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze Symptoms</span>
                    <Brain className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Results */}
        {step === 3 && analysis && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Analysis Summary */}
            <div className={`${
              isDarkMode ? 'bg-purple-900/20 border-purple-500/20' : 'bg-white border-purple-200'
            } backdrop-blur-xl rounded-2xl p-8 border`}>
              <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Analysis Results
              </h2>

              <div className={`p-6 rounded-xl mb-6 ${
                isDarkMode ? 'bg-blue-900/30 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'
              }`}>
                <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Summary
                </h3>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {analysis.summary}
                </p>
              </div>

              {/* Possible Conditions */}
              {analysis.possibleConditions && analysis.possibleConditions.length > 0 && (
                <div className="mb-6">
                  <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Possible Conditions
                  </h3>
                  <div className="space-y-3">
                    {analysis.possibleConditions.map((condition, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 rounded-xl ${
                          isDarkMode ? 'bg-white/5 border border-purple-500/20' : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {condition.name}
                            </h4>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {condition.description}
                            </p>
                          </div>
                          <span className={`ml-4 px-3 py-1 rounded-full text-xs font-bold ${
                            condition.likelihood === 'high' 
                              ? 'bg-red-500/20 text-red-300'
                              : condition.likelihood === 'medium'
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : 'bg-green-500/20 text-green-300'
                          }`}>
                            {condition.likelihood} likelihood
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations && (
                <div className="mb-6">
                  <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Recommendations
                  </h3>
                  <div className="space-y-2">
                    {analysis.recommendations.map((rec, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-start space-x-3 p-3 rounded-lg ${
                          isDarkMode ? 'bg-green-900/20' : 'bg-green-50'
                        }`}
                      >
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {rec}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warning Signs */}
              {analysis.warningSignsToWatch && (
                <div className={`p-6 rounded-xl ${
                  isDarkMode ? 'bg-red-900/20 border border-red-500/30' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Warning Signs
                    </h3>
                  </div>
                  <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                    Seek immediate medical attention if you experience: {analysis.warningSignsToWatch}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleReset}
                className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <Search className="w-5 h-5" />
                <span>Check New Symptoms</span>
              </button>
              <button
                onClick={() => {/* Save report logic */}}
                className={`flex-1 py-4 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 ${
                  isDarkMode 
                    ? 'bg-white/10 text-white hover:bg-white/20' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>Save Report</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}