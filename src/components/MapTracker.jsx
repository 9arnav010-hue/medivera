import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ArrowLeft, Play, Pause, Square } from 'lucide-react';
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

// Enhanced Speed Calculator Class
class SpeedCalculator {
  constructor() {
    this.lastLocation = null;
    this.lastTime = null;
    this.speedBuffer = [];
    this.stationaryCounter = 0;
    this.SPEED_THRESHOLD = 1.0; // km/h
    this.DISTANCE_THRESHOLD = 3.0; // meters
    this.TIME_THRESHOLD = 1000; // ms
    this.BUFFER_SIZE = 5;
    this.maxStationaryReadings = 3;
  }

  calculate(location, currentTime) {
    // If no previous data, initialize
    if (!this.lastLocation || !this.lastTime) {
      this.lastLocation = location;
      this.lastTime = currentTime;
      return 0;
    }

    const timeDiff = currentTime - this.lastTime;
    
    // Ignore updates that are too frequent (< 500ms) or too old (> 10s)
    if (timeDiff < 500 || timeDiff > 10000) {
      return this.getCurrentSpeed();
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
      
      // If stationary for consecutive readings, return 0 and reset buffer
      if (this.stationaryCounter >= this.maxStationaryReadings) {
        this.speedBuffer = Array(this.BUFFER_SIZE).fill(0);
        return 0;
      }
      
      return this.getCurrentSpeed();
    } else {
      this.stationaryCounter = 0;
    }

    // Calculate raw speed (km/h)
    const rawSpeed = (distance / 1000) / (timeDiff / 3600000);
    
    // Filter unrealistic speeds (max 25 km/h for running)
    if (rawSpeed > 25 || rawSpeed < 0) {
      console.log('Filtered unrealistic speed:', rawSpeed);
      return this.getCurrentSpeed();
    }

    // Apply smoothing with moving average
    this.speedBuffer.push(rawSpeed);
    if (this.speedBuffer.length > this.BUFFER_SIZE) {
      this.speedBuffer.shift();
    }

    // Update references
    this.lastLocation = location;
    this.lastTime = currentTime;

    return this.getCurrentSpeed();
  }

  getCurrentSpeed() {
    if (this.speedBuffer.length === 0) return 0;
    
    // Calculate median (more robust to outliers than average)
    const sortedBuffer = [...this.speedBuffer].sort((a, b) => a - b);
    const medianSpeed = sortedBuffer[Math.floor(sortedBuffer.length / 2)];
    
    // Apply threshold - if below threshold, return 0
    return medianSpeed < this.SPEED_THRESHOLD ? 0 : medianSpeed;
  }

  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
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
  }
}

// Distance calculation function
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return (R * c) / 1000; // Return in kilometers
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [gpsError, setGpsError] = useState(null);
  const [activeBoosts, setActiveBoosts] = useState([]);
  const [speedStability, setSpeedStability] = useState('stable');
  
  const watchIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const pauseTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const speedCalculatorRef = useRef(new SpeedCalculator());

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Real-time boost fetching
  useEffect(() => {
    if (currentPosition) {
      loadNearbyBoosts();
    }
  }, [currentPosition]);

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

  // Update current time every second
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Monitor speed stability
  useEffect(() => {
    const checkStability = () => {
      if (speed < 0.5) {
        setSpeedStability('stationary');
      } else if (speed > 0.5 && speed < 20) {
        setSpeedStability('stable');
      } else {
        setSpeedStability('unstable');
      }
    };

    checkStability();
  }, [speed]);

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
          timeout: 15000,
          maximumAge: 60000
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
          timeout: 15000,
          maximumAge: 60000
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
    
    // Reset tracking data
    setRoute([]);
    setDistance(0);
    setDuration(0);
    setSpeed(0);
    setCalories(0);
    
    // Start duration timer
    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
      }
    }, 1000);

    // Watch position for tracking
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const currentTime = Date.now();
        
        console.log('Position update:', { latitude, longitude, accuracy });
        
        if (accuracy < 50) { // Only accept accurate readings (< 50m)
          const newPoint = [latitude, longitude];
          setCurrentPosition(newPoint);
          
          // Calculate smoothed speed
          const smoothedSpeed = speedCalculatorRef.current.calculate(position, currentTime);
          setSpeed(Math.max(0, smoothedSpeed));
          
          // Update route and distance
          setRoute((prevRoute) => {
            if (prevRoute.length > 0) {
              const lastPoint = prevRoute[prevRoute.length - 1];
              const dist = calculateDistance(
                lastPoint[0], lastPoint[1],
                latitude, longitude
              );
              
              // Only add point if moved more than 5 meters
              if (dist > 0.005 && smoothedSpeed > 1) {
                setDistance((prev) => {
                  const newDist = prev + dist;
                  // Update calories based on distance
                  setCalories(Math.round(newDist * 60));
                  return newDist;
                });
                return [...prevRoute, newPoint];
              }
              return prevRoute;
            }
            return [newPoint];
          });
          
          setGpsError(null);
        } else {
          setGpsError(`Low GPS accuracy: ${accuracy.toFixed(1)}m`);
        }
      },
      (error) => {
        console.error('Tracking error:', error);
        setGpsError(error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0, // Always get fresh position
        distanceFilter: 5 // Minimum 5 meters between updates
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

    // Save run to backend
    if (distance > 0 && route.length > 1) {
      try {
        const token = localStorage.getItem('healthsphere_token');
        if (token) {
          const config = {
            headers: { Authorization: `Bearer ${token}` }
          };

          const runData = {
            distance: parseFloat(distance.toFixed(2)),
            duration: duration,
            pace: distance > 0 ? parseFloat((duration / 60 / distance).toFixed(2)) : 0,
            calories: calories || Math.round(distance * 60),
            route: {
              type: "LineString",
              coordinates: route.map(point => [point[1], point[0]]) // Convert to [lng, lat]
            },
            startLocation: {
              type: "Point",
              coordinates: [route[0][1], route[0][0]] // [lng, lat]
            },
            endLocation: {
              type: "Point",
              coordinates: [route[route.length - 1][1], route[route.length - 1][0]]
            }
          };

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
  const mapZoom = currentPosition ? 17 : 13;

  // Speed display color based on stability
  const getSpeedColor = () => {
    switch(speedStability) {
      case 'stationary': return 'text-gray-600';
      case 'stable': return 'text-green-600';
      case 'unstable': return 'text-yellow-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-900">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-[1001]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentPage('runner')}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/95 backdrop-blur-lg text-gray-900 shadow-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </motion.button>
      </div>

      {/* Stats Bar - Real-time updates */}
      {isTracking && (
        <div className="absolute top-20 left-4 right-4 z-[1000] max-w-4xl mx-auto">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl px-4 py-3">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-purple-600">
                  {distance.toFixed(2)}
                </p>
                <p className="text-xs text-gray-600 font-medium">Distance (km)</p>
              </div>
              
              <div className="text-center">
                <p className={`text-2xl md:text-3xl font-bold ${getSpeedColor()}`}>
                  {speed.toFixed(1)}
                </p>
                <p className="text-xs text-gray-600 font-medium">
                  Speed {speedStability === 'stationary' ? '(Stopped)' : '(km/h)'}
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-blue-600">
                  {formatTime(duration)}
                </p>
                <p className="text-xs text-gray-600 font-medium">Duration</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-orange-500">
                  {calories}
                </p>
                <p className="text-xs text-gray-600 font-medium">Calories</p>
              </div>
              
              <div className="text-center">
                <p className="text-xl md:text-2xl font-bold text-gray-700">
                  {currentTime.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </p>
                <p className="text-xs text-gray-600 font-medium">
                  {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GPS Error Alert */}
      {gpsError && (
        <div className="absolute top-4 right-4 z-[1000] max-w-md">
          <div className={`${
            gpsError.includes('Low GPS accuracy') ? 'bg-yellow-500' : 'bg-red-500'
          }/90 backdrop-blur-lg rounded-xl px-4 py-2 text-white text-sm font-medium shadow-lg text-center`}>
            ⚠️ {gpsError}
          </div>
        </div>
      )}

      {/* Map - Full height with flexbox */}
      <div className="flex-1 w-full h-full">
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
                  <p className="font-bold">You are here</p>
                  <p className="text-sm">Lat: {currentPosition[0].toFixed(6)}</p>
                  <p className="text-sm">Lng: {currentPosition[1].toFixed(6)}</p>
                  <p className="text-sm">Speed: {speed.toFixed(1)} km/h</p>
                  {gpsError && <p className="text-xs text-red-600">{gpsError}</p>}
                </div>
              </Popup>
            </Marker>
          )}

          {route.length > 1 && (
            <Polyline
              positions={route}
              color="#8B5CF6"
              weight={4}
              opacity={0.7}
            />
          )}

          {route.length > 0 && (
            <Marker position={route[0]}>
              <Popup>Start Point</Popup>
            </Marker>
          )}

          {/* Real-time nearby boosts */}
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
                fillOpacity: 0.2
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
      <div className="absolute bottom-24 left-0 right-0 z-[1000] flex justify-center px-4">
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
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-yellow-500 hover:bg-yellow-600'
                } text-white px-8 py-4 rounded-full font-bold shadow-lg transition-all flex items-center space-x-2`}
              >
                {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopTracking}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full font-bold shadow-lg transition-all flex items-center space-x-2"
              >
                <Square className="w-6 h-6" />
                <span>Stop</span>
              </motion.button>
            </>
          )}
        </div>
      </div>

      {/* Status Indicator */}
      {isTracking && (
        <div className="absolute bottom-36 left-0 right-0 z-[1000] flex justify-center px-4">
          <div className={`${
            speedStability === 'stationary' ? 'bg-gray-500' :
            speedStability === 'stable' ? 'bg-green-500' : 'bg-yellow-500'
          }/90 backdrop-blur-lg rounded-full px-6 py-2 text-white text-sm font-medium shadow-lg`}>
            Status: {speedStability === 'stationary' ? 'Stopped' : 
                    speedStability === 'stable' ? 'Moving Smoothly' : 'GPS Adjusting'}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex-shrink-0 bg-gray-800 text-white py-3 text-center text-sm">
        <p>© 2026 Medivera - Created by Aksh & Arnav</p>
        <p className="text-xs mt-1 text-blue-400">The Future of Human-Centered Healthcare</p>
      </div>
    </div>
  );
};

export default MapTracker;
