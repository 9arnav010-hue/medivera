import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ArrowLeft, Play, Pause, Square, MapPin, Timer, Activity, Flame, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to auto-center map
function MapUpdater({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, [center, zoom, map]);
  
  return null;
}

// Enhanced Speed Calculator with faster response
class SpeedCalculator {
  constructor() {
    this.lastLocation = null;
    this.lastTime = null;
    this.speedBuffer = [];
    this.stationaryCounter = 0;
    this.SPEED_THRESHOLD = 0.8; // Lower threshold for better response
    this.DISTANCE_THRESHOLD = 2.0; // meters
    this.BUFFER_SIZE = 3; // Smaller buffer for faster response
    this.lastValidSpeed = 0;
  }

  calculate(location, currentTime) {
    // If no previous data, initialize
    if (!this.lastLocation || !this.lastTime) {
      this.lastLocation = location;
      this.lastTime = currentTime;
      return 0;
    }

    const timeDiff = currentTime - this.lastTime;
    
    // Ignore updates that are too frequent (< 300ms) or too old (> 5s)
    if (timeDiff < 300 || timeDiff > 5000) {
      return this.lastValidSpeed;
    }

    // Calculate distance using Haversine formula
    const distance = this.haversineDistance(
      this.lastLocation.coords.latitude,
      this.lastLocation.coords.longitude,
      location.coords.latitude,
      location.coords.longitude
    );

    // Check if movement is significant
    if (distance < this.DISTANCE_THRESHOLD) {
      this.stationaryCounter++;
      
      // If stationary for 2 consecutive readings, return 0
      if (this.stationaryCounter >= 2) {
        this.speedBuffer = [0, 0];
        this.lastValidSpeed = 0;
        return 0;
      }
      
      return this.lastValidSpeed;
    } else {
      this.stationaryCounter = 0;
    }

    // Calculate raw speed (km/h) - FASTER CALCULATION
    const rawSpeed = (distance / 1000) / (timeDiff / 3600000);
    
    // Filter unrealistic speeds (max 30 km/h for running)
    if (rawSpeed > 30 || rawSpeed < 0) {
      return this.lastValidSpeed;
    }

    // Apply smoothing with EXPONENTIAL moving average (faster response)
    if (this.speedBuffer.length === 0) {
      this.speedBuffer.push(rawSpeed);
    } else {
      // 70% weight to new reading, 30% to old average (faster response)
      const smoothed = (rawSpeed * 0.7) + (this.speedBuffer[this.speedBuffer.length - 1] * 0.3);
      this.speedBuffer.push(smoothed);
    }
    
    if (this.speedBuffer.length > this.BUFFER_SIZE) {
      this.speedBuffer.shift();
    }

    // Update references
    this.lastLocation = location;
    this.lastTime = currentTime;
    
    // Use latest value for faster response
    const currentSpeed = this.speedBuffer[this.speedBuffer.length - 1];
    this.lastValidSpeed = currentSpeed;
    
    // Apply threshold
    return currentSpeed < this.SPEED_THRESHOLD ? 0 : currentSpeed;
  }

  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }

  reset() {
    this.lastLocation = null;
    this.lastTime = null;
    this.speedBuffer = [];
    this.stationaryCounter = 0;
    this.lastValidSpeed = 0;
  }
}

// Distance calculation function
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return (R * c) / 1000;
};

const MapTracker = ({ isDarkMode, setCurrentPage, nearbyBoosts = [] }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [calories, setCalories] = useState(0);
  const [gpsError, setGpsError] = useState(null);
  const [activeBoosts, setActiveBoosts] = useState([]);
  const [speedHistory, setSpeedHistory] = useState([]);
  
  const watchIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const pauseTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const speedCalculatorRef = useRef(new SpeedCalculator());
  const lastRouteUpdateRef = useRef(Date.now());

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Real-time boost fetching
  useEffect(() => {
    if (currentPosition && isTracking) {
      loadNearbyBoosts();
    }
  }, [currentPosition, isTracking]);

  const loadNearbyBoosts = async () => {
    try {
      const token = localStorage.getItem('healthsphere_token');
      if (!token || !currentPosition) return;

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const response = await axios.get(`${API_URL}/boosts/active`, {
        params: {
          lat: currentPosition[0],
          lng: currentPosition[1],
          radius: 5000
        },
        ...config
      });

      setActiveBoosts(response.data.boosts || []);
    } catch (error) {
      console.error('Error loading boosts:', error);
    }
  };

  // Monitor speed changes
  useEffect(() => {
    if (isTracking && !isPaused) {
      setSpeedHistory(prev => {
        const newHistory = [...prev, { time: Date.now(), speed }];
        if (newHistory.length > 10) newHistory.shift();
        return newHistory;
      });
    }
  }, [speed, isTracking, isPaused]);

  // Get initial position on mount
  useEffect(() => {
    if (navigator.geolocation) {
      console.log('Getting initial position...');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = [position.coords.latitude, position.coords.longitude];
          console.log('Initial position:', pos);
          setCurrentPosition(pos);
          setGpsError(null);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setGpsError(error.message);
          const fallback = [22.4734, 82.5194];
          setCurrentPosition(fallback);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );

      // Watch position continuously when not tracking
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (!isTracking) {
            const pos = [position.coords.latitude, position.coords.longitude];
            setCurrentPosition(pos);
            setGpsError(null);
          }
        },
        (error) => {
          console.error('Watch position error:', error);
          setGpsError(error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );

      return () => {
        if (watchId) {
          navigator.geolocation.clearWatch(watchId);
        }
      };
    } else {
      setGpsError('Geolocation not supported');
      setCurrentPosition([22.4734, 82.5194]);
    }
  }, [isTracking]);

  // Start tracking
  const startTracking = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    console.log('Starting run tracking...');
    setIsTracking(true);
    setIsPaused(false);
    startTimeRef.current = Date.now();
    speedCalculatorRef.current.reset();
    lastRouteUpdateRef.current = Date.now();
    
    // Reset tracking data
    setRoute([]);
    setDistance(0);
    setDuration(0);
    setSpeed(0);
    setCalories(0);
    setSpeedHistory([]);
    
    // Start duration timer
    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
      }
    }, 1000);

    // Watch position for tracking with HIGH FREQUENCY
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const currentTime = Date.now();
        
        if (accuracy < 30) { // Only accept accurate readings
          const newPoint = [latitude, longitude];
          setCurrentPosition(newPoint);
          
          // Calculate speed with faster response
          const smoothedSpeed = speedCalculatorRef.current.calculate(position, currentTime);
          
          // Update speed with immediate feedback
          setSpeed(Math.max(0, Math.round(smoothedSpeed * 10) / 10));
          
          // Update route and distance (FASTER UPDATES)
          setRoute((prevRoute) => {
            if (prevRoute.length > 0) {
              const lastPoint = prevRoute[prevRoute.length - 1];
              const dist = calculateDistance(
                lastPoint[0], lastPoint[1],
                latitude, longitude
              );
              
              // Only add point if moved more than 2 meters AND speed > 1 km/h
              if (dist > 0.002 && smoothedSpeed > 1) {
                setDistance((prev) => {
                  const newDist = prev + dist;
                  // Update calories based on distance and speed
                  setCalories(Math.round(newDist * 60 * (1 + smoothedSpeed / 20)));
                  return newDist;
                });
                lastRouteUpdateRef.current = currentTime;
                return [...prevRoute, newPoint];
              }
              return prevRoute;
            }
            return [newPoint];
          });
          
          setGpsError(null);
        } else {
          setGpsError(`GPS accuracy: ${accuracy.toFixed(1)}m`);
        }
      },
      (error) => {
        console.error('Tracking error:', error);
        setGpsError(error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
        distanceFilter: 1 // Minimum 1 meter between updates
      }
    );
  };

  // Pause/Resume
  const togglePause = () => {
    if (isPaused) {
      const pauseDuration = Date.now() - pauseTimeRef.current;
      startTimeRef.current += pauseDuration;
      setIsPaused(false);
    } else {
      pauseTimeRef.current = Date.now();
      setIsPaused(true);
    }
  };

  // Stop tracking and save to backend
  const stopTracking = async () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsTracking(false);
    speedCalculatorRef.current.reset();

    // Save run to backend with CORRECTED DATA FORMAT
    if (distance > 0 && route.length > 1) {
      try {
        const token = localStorage.getItem('healthsphere_token');
        if (token) {
          const config = {
            headers: { Authorization: `Bearer ${token}` }
          };

          // FIXED: Ensure proper GeoJSON format
          const runData = {
            distance: parseFloat(distance.toFixed(3)),
            duration: duration,
            pace: distance > 0 ? parseFloat((duration / 60 / distance).toFixed(2)) : 0,
            calories: calories || Math.round(distance * 60),
            route: {
              type: "LineString",
              coordinates: route.map(point => {
                // Ensure [lng, lat] format with numbers
                return [
                  parseFloat(point[1].toFixed(7)),
                  parseFloat(point[0].toFixed(7))
                ];
              })
            },
            startLocation: {
              type: "Point",
              coordinates: [
                parseFloat(route[0][1].toFixed(7)),
                parseFloat(route[0][0].toFixed(7))
              ]
            },
            endLocation: {
              type: "Point",
              coordinates: [
                parseFloat(route[route.length - 1][1].toFixed(7)),
                parseFloat(route[route.length - 1][0].toFixed(7))
              ]
            }
          };

          console.log('Saving run data:', JSON.stringify(runData, null, 2));
          
          const response = await axios.post(`${API_URL}/runs`, runData, config);
          alert(`Run Saved! 🎉\nDistance: ${distance.toFixed(2)} km\nDuration: ${formatTime(duration)}\nCalories: ${calories}`);
        }
      } catch (error) {
        console.error('Error saving run:', error);
        alert(`Run Complete!\nDistance: ${distance.toFixed(2)} km\nDuration: ${formatTime(duration)}\nCalories: ${calories}\n(Could not save to server)`);
      }
    } else {
      alert('No valid run data to save.');
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const defaultCenter = currentPosition || [22.4734, 82.5194];
  const mapZoom = currentPosition ? 18 : 13;

  // Speed status based on recent history
  const getSpeedStatus = () => {
    if (speed < 0.5) return 'stopped';
    if (speedHistory.length < 3) return 'starting';
    
    // Check if speed is increasing
    const recentSpeeds = speedHistory.slice(-3).map(s => s.speed);
    const isIncreasing = recentSpeeds.every((s, i) => i === 0 || s >= recentSpeeds[i-1]);
    
    if (isIncreasing && speed > 5) return 'accelerating';
    return 'moving';
  };

  const speedStatus = getSpeedStatus();

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-900">
      {/* Top Bar - Simplified */}
      <div className="absolute top-0 left-0 right-0 z-[1001] bg-gradient-to-r from-purple-900/95 to-pink-900/95 backdrop-blur-lg shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentPage('runner')}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/20 text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </motion.button>
          
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">Map Tracker</h1>
            <p className="text-xs text-purple-200">Real-time running tracker</p>
          </div>
          
          <div className="w-20"></div> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Stats Cards - Only show when tracking */}
      {isTracking && (
        <div className="absolute top-16 left-4 right-4 z-[1000]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white/95 backdrop-blur-lg rounded-xl p-3 shadow-lg"
            >
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-800">{distance.toFixed(2)}</p>
                  <p className="text-xs text-gray-600">km</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white/95 backdrop-blur-lg rounded-xl p-3 shadow-lg"
            >
              <div className="flex items-center space-x-2">
                <Zap className={`w-5 h-5 ${
                  speedStatus === 'accelerating' ? 'text-green-600 animate-pulse' :
                  speedStatus === 'moving' ? 'text-blue-600' :
                  speedStatus === 'starting' ? 'text-yellow-600' : 'text-gray-400'
                }`} />
                <div>
                  <p className="text-2xl font-bold text-gray-800">{speed.toFixed(1)}</p>
                  <p className="text-xs text-gray-600">km/h</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/95 backdrop-blur-lg rounded-xl p-3 shadow-lg"
            >
              <div className="flex items-center space-x-2">
                <Timer className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xl font-bold text-gray-800">{formatTime(duration)}</p>
                  <p className="text-xs text-gray-600">time</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/95 backdrop-blur-lg rounded-xl p-3 shadow-lg"
            >
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-gray-800">{calories}</p>
                  <p className="text-xs text-gray-600">calories</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Speed Status Indicator */}
      {isTracking && speedStatus !== 'stopped' && (
        <div className="absolute top-36 left-0 right-0 z-[1000] flex justify-center px-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${
              speedStatus === 'accelerating' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
              speedStatus === 'starting' ? 'bg-gradient-to-r from-yellow-500 to-amber-600' :
              'bg-gradient-to-r from-blue-500 to-cyan-600'
            } backdrop-blur-lg rounded-full px-6 py-2 text-white text-sm font-bold shadow-lg`}
          >
            {speedStatus === 'accelerating' ? '🚀 Accelerating' :
             speedStatus === 'starting' ? '⚡ Starting up' :
             '🏃 Moving'}
          </motion.div>
        </div>
      )}

      {/* GPS Error Alert */}
      {gpsError && (
        <div className="absolute top-44 left-0 right-0 z-[1000] flex justify-center px-4">
          <div className="bg-red-500/90 backdrop-blur-lg rounded-xl px-4 py-2 text-white text-sm font-medium shadow-lg">
            ⚠️ {gpsError}
          </div>
        </div>
      )}

      {/* Map */}
      <div className="flex-1 w-full h-full mt-16">
        <MapContainer
          center={defaultCenter}
          zoom={mapZoom}
          className="w-full h-full"
          zoomControl={true}
          style={{ height: '100%', width: '100%' }}
          whenCreated={(mapInstance) => {
            setTimeout(() => {
              mapInstance.invalidateSize();
            }, 100);
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          
          <MapUpdater center={currentPosition} zoom={mapZoom} />

          {currentPosition && (
            <Marker position={currentPosition}>
              <Popup>
                <div className="text-center">
                  <p className="font-bold">Your Location</p>
                  <p className="text-sm">Speed: {speed.toFixed(1)} km/h</p>
                  <p className="text-xs text-gray-600">Lat: {currentPosition[0].toFixed(6)}</p>
                  <p className="text-xs text-gray-600">Lng: {currentPosition[1].toFixed(6)}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {route.length > 1 && (
            <Polyline
              positions={route}
              color="#8B5CF6"
              weight={4}
              opacity={0.8}
            />
          )}

          {activeBoosts.map((boost) => (
            <Circle
              key={boost._id}
              center={[boost.location.coordinates[1], boost.location.coordinates[0]]}
              radius={boost.radius}
              pathOptions={{
                color: boost.rarity === 'epic' ? '#9C27B0' : 
                       boost.rarity === 'rare' ? '#2196F3' : '#FFC107',
                fillColor: boost.rarity === 'epic' ? '#9C27B0' : 
                           boost.rarity === 'rare' ? '#2196F3' : '#FFC107',
                fillOpacity: 0.15
              }}
            >
              <Popup>
                <div className="text-center">
                  <h3 className="font-bold">{boost.name}</h3>
                  <p className="text-sm">{boost.description}</p>
                  <p className="text-xs text-gray-600">{boost.multiplier}x multiplier</p>
                </div>
              </Popup>
            </Circle>
          ))}
        </MapContainer>
      </div>

      {/* Control Buttons */}
      <div className="absolute bottom-8 left-0 right-0 z-[1000] flex justify-center px-4">
        <div className="bg-white/95 backdrop-blur-lg rounded-full shadow-2xl p-3 flex gap-3">
          {!isTracking ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startTracking}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-10 py-4 rounded-full font-bold text-lg shadow-lg transition-all flex items-center space-x-2"
            >
              <Play className="w-6 h-6" />
              <span>Start Run</span>
            </motion.button>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={togglePause}
                className={`${
                  isPaused 
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700' 
                    : 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700'
                } text-white px-8 py-4 rounded-full font-bold shadow-lg transition-all flex items-center space-x-2`}
              >
                {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopTracking}
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-8 py-4 rounded-full font-bold shadow-lg transition-all flex items-center space-x-2"
              >
                <Square className="w-6 h-6" />
                <span>Stop</span>
              </motion.button>
            </>
          )}
        </div>
      </div>

      {/* Paused Overlay */}
      {isTracking && isPaused && (
        <div className="absolute inset-0 z-[999] bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 text-center shadow-2xl"
          >
            <Pause className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Run Paused</h2>
            <p className="text-gray-600 mb-4">Tap Resume to continue tracking</p>
            <div className="text-sm text-gray-500">
              Distance: {distance.toFixed(2)} km • Time: {formatTime(duration)}
            </div>
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <div className="flex-shrink-0 bg-gray-900 text-white py-3 text-center text-sm border-t border-gray-800">
        <p>© 2026 Medivera • Live Run Tracker</p>
        <p className="text-xs mt-1 text-blue-400">The Future of Human-Centered Healthcare</p>
      </div>
    </div>
  );
};

export default MapTracker;
