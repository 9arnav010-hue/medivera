import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ArrowLeft, Play, Pause, Square, MapPin, Timer, Flame, Zap, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    }
  }, [center, zoom, map]);
  
  return null;
}

// IMPROVED Speed Calculator with better smoothing and accuracy
class ImprovedSpeedCalculator {
  constructor() {
    this.positions = []; // Store recent positions with timestamps
    this.speeds = []; // Store calculated speeds
    this.MAX_POSITIONS = 5; // Keep last 5 positions
    this.MAX_SPEEDS = 8; // Average over 8 speed readings
    this.MIN_DISTANCE = 3; // Minimum 3 meters to calculate speed
    this.MAX_SPEED = 50; // Max realistic speed (km/h)
    this.MIN_UPDATE_INTERVAL = 500; // Update at most every 500ms
    this.lastUpdateTime = 0;
  }

  addPosition(lat, lng, timestamp, accuracy) {
    // Store position with metadata
    this.positions.push({ lat, lng, timestamp, accuracy });
    
    // Keep only recent positions
    if (this.positions.length > this.MAX_POSITIONS) {
      this.positions.shift();
    }
  }

  calculateSpeed(currentLat, currentLng, currentTime, accuracy) {
    // Don't update too frequently
    if (currentTime - this.lastUpdateTime < this.MIN_UPDATE_INTERVAL) {
      return this.getCurrentSpeed();
    }

    // Need at least 2 positions
    if (this.positions.length < 2) {
      this.addPosition(currentLat, currentLng, currentTime, accuracy);
      return 0;
    }

    // Get the oldest reliable position
    const oldestGoodPosition = this.positions[0];
    
    // Calculate distance from oldest position
    const distance = this.haversineDistance(
      oldestGoodPosition.lat,
      oldestGoodPosition.lng,
      currentLat,
      currentLng
    );

    // Calculate time difference in seconds
    const timeDiff = (currentTime - oldestGoodPosition.timestamp) / 1000;

    // Only calculate if moved enough distance
    if (distance >= this.MIN_DISTANCE && timeDiff > 0) {
      // Speed in km/h
      const speedKmh = (distance / 1000) / (timeDiff / 3600);
      
      // Validate speed is realistic
      if (speedKmh >= 0 && speedKmh <= this.MAX_SPEED) {
        this.speeds.push(speedKmh);
        
        // Keep recent speeds only
        if (this.speeds.length > this.MAX_SPEEDS) {
          this.speeds.shift();
        }
        
        this.lastUpdateTime = currentTime;
      }
    }

    // Add current position
    this.addPosition(currentLat, currentLng, currentTime, accuracy);
    
    return this.getCurrentSpeed();
  }

  getCurrentSpeed() {
    if (this.speeds.length === 0) return 0;
    
    // Use weighted average - recent speeds matter more
    let totalWeight = 0;
    let weightedSum = 0;
    
    this.speeds.forEach((speed, index) => {
      const weight = index + 1; // More recent = higher weight
      weightedSum += speed * weight;
      totalWeight += weight;
    });
    
    const avgSpeed = weightedSum / totalWeight;
    
    // Return 0 if speed is very low (walking pace)
    return avgSpeed < 1 ? 0 : avgSpeed;
  }

  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  reset() {
    this.positions = [];
    this.speeds = [];
    this.lastUpdateTime = 0;
  }
}

// Distance calculation helper
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return (R * c) / 1000; // Convert to km
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
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [activeBoosts, setActiveBoosts] = useState([]);
  
  const watchIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const pauseTimeRef = useRef(null);
  const totalPausedTimeRef = useRef(0);
  const intervalRef = useRef(null);
  const speedCalculatorRef = useRef(new ImprovedSpeedCalculator());
  const lastPositionRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Load nearby boosts
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

  // Get initial position on mount
  useEffect(() => {
    if (navigator.geolocation) {
      console.log('🗺️ Getting initial GPS position...');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = [position.coords.latitude, position.coords.longitude];
          console.log('✅ Initial position:', pos, `Accuracy: ${position.coords.accuracy}m`);
          setCurrentPosition(pos);
          setGpsAccuracy(position.coords.accuracy);
          setGpsError(null);
        },
        (error) => {
          console.error('❌ Geolocation error:', error);
          setGpsError(error.message);
          // Fallback to Singrauli
          setCurrentPosition([24.0896, 82.6473]);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );

      // Watch position when not tracking (to show current location)
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (!isTracking) {
            const pos = [position.coords.latitude, position.coords.longitude];
            setCurrentPosition(pos);
            setGpsAccuracy(position.coords.accuracy);
            setGpsError(null);
          }
        },
        (error) => {
          console.error('Watch position error:', error);
          setGpsError(error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 1000
        }
      );

      return () => {
        if (watchId) {
          navigator.geolocation.clearWatch(watchId);
        }
      };
    } else {
      setGpsError('Geolocation not supported');
      setCurrentPosition([24.0896, 82.6473]);
    }
  }, [isTracking]);

  // Start tracking
  const startTracking = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    console.log('🏃 Starting run tracking...');
    setIsTracking(true);
    setIsPaused(false);
    startTimeRef.current = Date.now();
    totalPausedTimeRef.current = 0;
    speedCalculatorRef.current.reset();
    lastPositionRef.current = null;
    
    // Reset all stats
    setRoute([]);
    setDistance(0);
    setDuration(0);
    setSpeed(0);
    setCalories(0);
    
    // Start duration counter
    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current - totalPausedTimeRef.current) / 1000);
        setDuration(elapsed);
      }
    }, 1000);

    // Start GPS tracking with high accuracy
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const currentTime = Date.now();
        
        console.log('📍 GPS Update:', {
          lat: latitude.toFixed(6),
          lng: longitude.toFixed(6),
          accuracy: accuracy.toFixed(1) + 'm'
        });

        setGpsAccuracy(accuracy);
        
        // Only use accurate GPS readings
        if (accuracy < 50) {
          const newPoint = [latitude, longitude];
          setCurrentPosition(newPoint);
          
          // Calculate speed using improved calculator
          const calculatedSpeed = speedCalculatorRef.current.calculateSpeed(
            latitude,
            longitude,
            currentTime,
            accuracy
          );
          
          setSpeed(Math.max(0, Math.round(calculatedSpeed * 10) / 10));
          
          // Add to route if moved significantly
          if (lastPositionRef.current) {
            const dist = calculateDistance(
              lastPositionRef.current[0],
              lastPositionRef.current[1],
              latitude,
              longitude
            );
            
            // Only add point if moved at least 5 meters and has some speed
            if (dist >= 0.005 && calculatedSpeed > 0.5) {
              console.log('✅ Adding point to route:', {
                distance: (dist * 1000).toFixed(1) + 'm',
                speed: calculatedSpeed.toFixed(1) + 'km/h'
              });
              
              setRoute((prevRoute) => [...prevRoute, newPoint]);
              
              setDistance((prevDistance) => {
                const newDistance = prevDistance + dist;
                // Update calories based on distance and speed
                const caloriesPerKm = 60 + (calculatedSpeed * 2); // More speed = more calories
                setCalories(Math.round(newDistance * caloriesPerKm));
                return newDistance;
              });
              
              lastPositionRef.current = newPoint;
            }
          } else {
            // First point
            setRoute([newPoint]);
            lastPositionRef.current = newPoint;
          }
          
          setGpsError(null);
        } else {
          setGpsError(`GPS accuracy: ${accuracy.toFixed(0)}m - Searching for better signal...`);
        }
      },
      (error) => {
        console.error('❌ GPS Tracking error:', error);
        setGpsError(error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        distanceFilter: 0 // Get all updates
      }
    );
  };

  // Pause/Resume
  const togglePause = () => {
    if (isPaused) {
      // Resuming
      const pauseDuration = Date.now() - pauseTimeRef.current;
      totalPausedTimeRef.current += pauseDuration;
      setIsPaused(false);
      console.log('▶️ Resumed tracking');
    } else {
      // Pausing
      pauseTimeRef.current = Date.now();
      setIsPaused(true);
      console.log('⏸️ Paused tracking');
    }
  };

  // Stop tracking and save
  const stopTracking = async () => {
    console.log('⏹️ Stopping tracking...');
    
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsTracking(false);
    setIsPaused(false);
    speedCalculatorRef.current.reset();

    if (distance > 0.01 && route.length >= 2) {
      try {
        const token = localStorage.getItem('healthsphere_token');
        if (token) {
          const config = {
            headers: { Authorization: `Bearer ${token}` }
          };

          // Convert route coordinates: Leaflet [lat, lng] → GeoJSON [lng, lat]
          const routeCoordinates = route.map(point => [
            Number(point[1].toFixed(7)), // longitude
            Number(point[0].toFixed(7))  // latitude
          ]);

          const startCoords = [
            Number(route[0][1].toFixed(7)), // longitude
            Number(route[0][0].toFixed(7))  // latitude
          ];

          const endCoords = [
            Number(route[route.length - 1][1].toFixed(7)), // longitude
            Number(route[route.length - 1][0].toFixed(7))  // latitude
          ];

          const runData = {
            distance: Number(distance.toFixed(3)),
            duration: Number(duration),
            pace: distance > 0 ? Number((duration / 60 / distance).toFixed(2)) : 0,
            calories: calories || Math.round(distance * 60),
            route: {
              type: "LineString",
              coordinates: routeCoordinates
            },
            startLocation: {
              type: "Point",
              coordinates: startCoords
            },
            endLocation: {
              type: "Point",
              coordinates: endCoords
            }
          };

          console.log('💾 Saving run:', {
            distance: runData.distance + 'km',
            duration: formatTime(runData.duration),
            points: routeCoordinates.length,
            coordinates: 'GeoJSON [lng, lat]'
          });
          
          const response = await axios.post(`${API_URL}/runs`, runData, config);
          
          if (response.data.success) {
            alert(
              `🎉 Run Saved Successfully!\n\n` +
              `📍 Distance: ${distance.toFixed(2)} km\n` +
              `⏱️ Duration: ${formatTime(duration)}\n` +
              `🔥 Calories: ${calories}\n` +
              `📊 Points tracked: ${routeCoordinates.length}\n` +
              `⚡ Avg Speed: ${(distance / (duration / 3600)).toFixed(1)} km/h`
            );
          }
        }
      } catch (error) {
        console.error('❌ Error saving run:', error);
        console.error('Response:', error.response?.data);
        
        alert(
          `✅ Run Complete!\n\n` +
          `📍 Distance: ${distance.toFixed(2)} km\n` +
          `⏱️ Duration: ${formatTime(duration)}\n` +
          `🔥 Calories: ${calories}\n\n` +
          `⚠️ Could not save to server:\n${error.response?.data?.message || error.message}`
        );
      }
    } else {
      alert('❌ No valid run data to save.\nMinimum: 10m distance and 2 GPS points.');
    }
  };

  // Format time helper
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get speed status
  const getSpeedStatus = () => {
    if (speed === 0) return { label: 'Stopped', color: 'text-gray-400', bg: 'bg-gray-500' };
    if (speed < 3) return { label: 'Walking', color: 'text-yellow-400', bg: 'bg-yellow-500' };
    if (speed < 6) return { label: 'Jogging', color: 'text-blue-400', bg: 'bg-blue-500' };
    if (speed < 10) return { label: 'Running', color: 'text-green-400', bg: 'bg-green-500' };
    return { label: 'Sprinting', color: 'text-red-400 animate-pulse', bg: 'bg-red-500' };
  };

  const speedStatus = getSpeedStatus();
  const defaultCenter = currentPosition || [24.0896, 82.6473];
  const mapZoom = currentPosition ? 18 : 13;

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-900">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[1001] bg-gradient-to-r from-purple-900/95 to-pink-900/95 backdrop-blur-lg shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentPage('runner')}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </motion.button>
          
          <div className="text-center flex-1">
            <h1 className="text-xl font-bold text-white">Map Tracker</h1>
            <p className="text-xs text-purple-200">GPS Running Tracker</p>
          </div>
          
          <div className="w-24"></div>
        </div>
      </div>

      {/* Stats Cards */}
      <AnimatePresence>
        {isTracking && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-20 left-0 right-0 z-[1000] px-4"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Distance */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
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
              
              {/* Speed */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-white/95 backdrop-blur-lg rounded-xl p-3 shadow-lg"
              >
                <div className="flex items-center space-x-2">
                  <Zap className={`w-5 h-5 ${speedStatus.color}`} />
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{speed.toFixed(1)}</p>
                    <p className="text-xs text-gray-600">km/h</p>
                  </div>
                </div>
              </motion.div>
              
              {/* Duration */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-white/95 backdrop-blur-lg rounded-xl p-3 shadow-lg"
              >
                <div className="flex items-center space-x-2">
                  <Timer className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-lg font-bold text-gray-800">{formatTime(duration)}</p>
                    <p className="text-xs text-gray-600">time</p>
                  </div>
                </div>
              </motion.div>
              
              {/* Calories */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-white/95 backdrop-blur-lg rounded-xl p-3 shadow-lg"
              >
                <div className="flex items-center space-x-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{calories}</p>
                    <p className="text-xs text-gray-600">kcal</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speed Status Badge */}
      {isTracking && speed > 0 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute top-44 left-0 right-0 z-[1000] flex justify-center px-4"
        >
          <div className={`${speedStatus.bg} backdrop-blur-lg rounded-full px-6 py-2 text-white text-sm font-bold shadow-lg flex items-center space-x-2`}>
            <TrendingUp className="w-4 h-4" />
            <span>{speedStatus.label}</span>
          </div>
        </motion.div>
      )}

      {/* GPS Status */}
      {(gpsError || (gpsAccuracy && gpsAccuracy > 30)) && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`absolute ${isTracking ? 'top-52' : 'top-20'} left-0 right-0 z-[1000] flex justify-center px-4`}
        >
          <div className={`${gpsAccuracy && gpsAccuracy <= 30 ? 'bg-yellow-500/90' : 'bg-red-500/90'} backdrop-blur-lg rounded-xl px-4 py-2 text-white text-sm font-medium shadow-lg`}>
            {gpsError ? `⚠️ ${gpsError}` : `📡 GPS Accuracy: ${gpsAccuracy?.toFixed(0)}m`}
          </div>
        </motion.div>
      )}

      {/* Map */}
      <div className={`flex-1 w-full ${isTracking ? 'pt-60' : 'pt-20'} pb-32`}>
        <MapContainer
          center={defaultCenter}
          zoom={mapZoom}
          className="w-full h-full"
          zoomControl={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          
          <MapUpdater center={currentPosition} zoom={mapZoom} />

          {currentPosition && (
            <Marker position={currentPosition}>
              <Popup>
                <div className="text-center">
                  <p className="font-bold text-purple-600">📍 Your Location</p>
                  <p className="text-sm mt-1">Speed: {speed.toFixed(1)} km/h</p>
                  <p className="text-xs text-gray-600">Accuracy: {gpsAccuracy?.toFixed(0)}m</p>
                </div>
              </Popup>
            </Marker>
          )}

          {route.length > 1 && (
            <Polyline
              positions={route}
              color="#8B5CF6"
              weight={5}
              opacity={0.8}
              smoothFactor={1}
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
                  <p className="text-xs text-gray-600">{boost.multiplier}x boost</p>
                </div>
              </Popup>
            </Circle>
          ))}
        </MapContainer>
      </div>

      {/* Control Buttons */}
      <div className="absolute bottom-20 left-0 right-0 z-[1000] flex justify-center px-4">
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
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
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
      <AnimatePresence>
        {isTracking && isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 text-center shadow-2xl max-w-sm mx-4"
            >
              <Pause className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Run Paused</h2>
              <p className="text-gray-600 mb-4">Tap Resume when ready to continue</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-purple-600 font-semibold">Distance</p>
                  <p className="text-2xl font-bold text-gray-800">{distance.toFixed(2)}</p>
                  <p className="text-xs text-gray-600">km</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-blue-600 font-semibold">Time</p>
                  <p className="text-xl font-bold text-gray-800">{formatTime(duration)}</p>
                  <p className="text-xs text-gray-600">elapsed</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-900 text-white py-3 text-center text-sm border-t border-gray-800">
        <p>© 2026 Medivera - Created by Aksh & Arnav</p>
        <p className="text-xs mt-1 text-blue-400">GPS Running Tracker</p>
      </div>
    </div>
  );
};

export default MapTracker;
