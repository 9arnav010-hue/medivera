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
      // Force map to recalculate size
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, [center, zoom, map]);
  
  return null;
}

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
  
  const watchIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const pauseTimeRef = useRef(null);
  const intervalRef = useRef(null);

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

      // Watch position continuously
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

  // Calculate distance
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

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
        const { latitude, longitude, accuracy, speed: gpsSpeed } = position.coords;
        
        console.log('Position update:', { latitude, longitude, accuracy });
        
        if (accuracy < 100) {
          const newPoint = [latitude, longitude];
          setCurrentPosition(newPoint);
          
          // Update speed
          if (gpsSpeed !== null && gpsSpeed >= 0) {
            setSpeed(Math.max(0, gpsSpeed * 3.6)); // m/s to km/h
          }
          
          setRoute((prevRoute) => {
            if (prevRoute.length > 0) {
              const lastPoint = prevRoute[prevRoute.length - 1];
              const dist = calculateDistance(
                lastPoint[0], lastPoint[1],
                latitude, longitude
              );
              
              // Add if moved more than 3 meters
              if (dist > 0.003) {
                setDistance((prev) => prev + dist);
                return [...prevRoute, newPoint];
              }
              return prevRoute;
            }
            return [newPoint];
          });
        }
      },
      (error) => {
        console.error('Tracking error:', error);
        setGpsError(error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
        distanceFilter: 3
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
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsTracking(false);

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
            duration: Math.floor(duration / 60), // Convert to minutes
            pace: distance > 0 ? parseFloat((duration / 60 / distance).toFixed(2)) : 0,
            calories,
            route: {
              coordinates: route.map(point => [point[1], point[0]]) // Convert to [lng, lat]
            }
          };

          await axios.post(`${API_URL}/runs`, runData, config);
          alert(`Run Saved! 🎉\nDistance: ${distance.toFixed(2)} km\nDuration: ${formatTime(duration)}\nCalories: ${calories}`);
        }
      } catch (error) {
        console.error('Error saving run:', error);
        alert(`Run Complete!\nDistance: ${distance.toFixed(2)} km\nDuration: ${formatTime(duration)}\n(Could not save to server)`);
      }
    }
    
    // Reset
    setRoute([]);
    setDistance(0);
    setDuration(0);
    setSpeed(0);
    setCalories(0);
    setIsPaused(false);
  };

  // Calculate calories
  useEffect(() => {
    if (distance > 0) {
      setCalories(Math.round(distance * 60));
    }
  }, [distance]);

  // Format time
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const defaultCenter = currentPosition || [22.4734, 82.5194];
  const mapZoom = currentPosition ? 17 : 13;

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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center">
                <p className="text-2xl md:text-4xl font-bold text-purple-600">
                  {distance.toFixed(2)}
                </p>
                <p className="text-xs text-gray-600 font-medium">km</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl md:text-4xl font-bold text-blue-600">
                  {speed.toFixed(1)}
                </p>
                <p className="text-xs text-gray-600 font-medium">km/h</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl md:text-4xl font-bold text-green-600">
                  {formatTime(duration)}
                </p>
                <p className="text-xs text-gray-600 font-medium">h:m:s</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl md:text-4xl font-bold text-orange-500">
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
      {gpsError && !isTracking && (
        <div className="absolute top-20 left-4 right-4 z-[1000] max-w-2xl mx-auto">
          <div className="bg-yellow-500/90 backdrop-blur-lg rounded-xl px-6 py-3 text-white text-sm font-medium shadow-lg text-center">
            ⚠️ GPS: {gpsError} - Using approximate location
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
                  {gpsError && <p className="text-xs text-red-600">{gpsError}</p>}
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

      {/* Footer */}
      <div className="flex-shrink-0 bg-gray-800 text-white py-3 text-center text-sm">
        <p>© 2026 Medivera - Created by Aksh & Arnav</p>
        <p className="text-xs mt-1 text-blue-400">The Future of Human-Centered Healthcare</p>
      </div>
    </div>
  );
};

export default MapTracker;