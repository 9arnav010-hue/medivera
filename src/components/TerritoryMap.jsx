import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ArrowLeft, Map as MapIcon, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to auto-center map on user position
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

const TerritoryMap = ({ isDarkMode, setCurrentPage }) => {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [territories, setTerritories] = useState([]);
  const [userTerritories, setUserTerritories] = useState(0);
  const [totalArea, setTotalArea] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userRank, setUserRank] = useState('Unranked');
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Real-time territory data fetching
  useEffect(() => {
    loadTerritories();
    
    // Refresh territories every 30 seconds
    const interval = setInterval(() => {
      loadTerritories();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadTerritories = async () => {
    try {
      const token = localStorage.getItem('healthsphere_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Fetch user territories and rank
      const [territoriesRes, rankRes] = await Promise.allSettled([
        axios.get(`${API_URL}/territories/user`, config),
        axios.get(`${API_URL}/leaderboard/rank?type=territory`, config)
      ]);

      if (territoriesRes.status === 'fulfilled' && territoriesRes.value) {
        const data = territoriesRes.value.data;
        setTerritories(data.territories || []);
        setUserTerritories(data.stats?.total || 0);
        setTotalArea(data.stats?.totalArea || 0);
      }

      if (rankRes.status === 'fulfilled' && rankRes.value) {
        const rank = rankRes.value.data.rank;
        setUserRank(rank ? `#${rank}` : 'Unranked');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading territories:', error);
      setLoading(false);
    }
  };

  // Get initial location and update real-time
  useEffect(() => {
    if (navigator.geolocation) {
      // Get initial position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentPosition([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setCurrentPosition([22.4734, 82.5194]); // Default to Singrauli
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000
        }
      );

      // Watch position continuously for real-time updates
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentPosition([position.coords.latitude, position.coords.longitude]);
        },
        (error) => console.error('Watch position error:', error),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      setCurrentPosition([22.4734, 82.5194]);
    }
  }, []);

  // Update current time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const defaultCenter = currentPosition || [22.4734, 82.5194];
  const mapZoom = currentPosition ? 15 : 13;

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-900">
      {/* Back Button - Top Left */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setCurrentPage('runner')}
        className="absolute top-4 left-4 z-[1001] flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/95 backdrop-blur-lg text-gray-900 shadow-lg hover:shadow-xl transition-all"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Back</span>
      </motion.button>

      {/* Stats Bar - Real-time updates */}
      <div className="absolute top-20 left-4 right-4 z-[1000] max-w-4xl mx-auto">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl px-4 py-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Your Territories */}
            <div className="text-center">
              <p className="text-2xl md:text-4xl font-bold text-purple-600">
                {userTerritories}
              </p>
              <p className="text-xs text-gray-600 font-medium">captured</p>
            </div>
            
            {/* Total Area */}
            <div className="text-center">
              <p className="text-2xl md:text-4xl font-bold text-blue-600">
                {totalArea.toFixed(0)}
              </p>
              <p className="text-xs text-gray-600 font-medium">m²</p>
            </div>
            
            {/* Territory Rank */}
            <div className="text-center">
              <p className="text-xl md:text-3xl font-bold text-green-600">
                {userRank}
              </p>
              <p className="text-xs text-gray-600 font-medium">global</p>
            </div>
            
            {/* Current Time */}
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

      {/* Map Container - Full Screen with proper height */}
      <div className="flex-1 w-full h-full">
        {loading ? (
          <div className="flex items-center justify-center h-full bg-gray-800">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white">Loading map...</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={defaultCenter}
            zoom={mapZoom}
            className="w-full h-full"
            zoomControl={true}
            style={{ height: '100%', width: '100%' }}
            whenCreated={(map) => {
              setTimeout(() => {
                map.invalidateSize();
              }, 100);
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />

            <MapUpdater center={currentPosition} zoom={mapZoom} />

            {/* Current Position Marker */}
            {currentPosition && (
              <Marker position={currentPosition}>
                <Popup>You are here</Popup>
              </Marker>
            )}

            {/* Territories - Real-time rendering */}
            {territories.map((territory) => {
              // Convert coordinates from [lng, lat] to [lat, lng] for Leaflet
              const coordinates = territory.coordinates[0].map(coord => [coord[1], coord[0]]);
              const color = territory.status === 'active' ? '#8B5CF6' : '#EF4444';
              
              return (
                <Polygon
                  key={territory._id}
                  positions={coordinates}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.3,
                    weight: 2
                  }}
                >
                  <Popup>
                    <div className="text-center">
                      <h3 className="font-bold">{territory.routeName}</h3>
                      <p className="text-sm">Stage: {territory.evolutionStage}</p>
                      <p className="text-sm">Level: {territory.level}</p>
                      <p className="text-xs text-gray-600">Area: {territory.area.toFixed(0)} m²</p>
                      <p className="text-xs text-gray-500">
                        {new Date(territory.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Popup>
                </Polygon>
              );
            })}
          </MapContainer>
        )}
      </div>

      {/* Info Panel - Bottom Center */}
      {territories.length === 0 && !loading && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-[1000] w-full max-w-xl px-4">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-6 text-center">
            <MapIcon className="w-12 h-12 mx-auto mb-3 text-purple-600" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Start Running to Capture Territories
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Run through areas to claim them as your territory and compete with other runners
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage('run')}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all inline-flex items-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>Start Running</span>
            </motion.button>
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

export default TerritoryMap;