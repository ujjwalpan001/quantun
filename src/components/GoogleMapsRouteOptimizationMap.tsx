/**
 * Advanced Google Maps Route Optimization Component
 * =================================================
 * 
 * A comprehensive route optimization interface that integrates with the Python backend
 * to provide real Google Maps route optimization using multiple quantum-inspired algorithms.
 */

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMapsRouteOptimizationService } from '../services/google-maps-route-optimizer';
import type { 
  DeliveryStop, 
  OptimizationResponse,
  AlgorithmResult 
} from '../services/google-maps-route-optimizer';

// Fix for default markers
import 'leaflet/dist/leaflet.css';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RouteOptimizationMapProps {
  onResults?: (results: OptimizationResponse) => void;
}

const GoogleMapsRouteOptimizationMap: React.FC<RouteOptimizationMapProps> = ({ onResults }) => {
  const [stops, setStops] = useState<DeliveryStop[]>([]);
  const [depot, setDepot] = useState<{ lat: number; lng: number } | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [results, setResults] = useState<OptimizationResponse | null>(null);
  // Algorithm-specific colors for distinct route visualization
  const algorithmColors = {
    classical: '#3B82F6',    // Blue - shortest distance route
    simulated: '#10B981',    // Green - balanced time/distance route  
    qiea: '#F59E0B',         // Orange - exploration-focused route
    qaoa: '#EF4444'          // Red - time-focused route
  };

  // Algorithm display names and strategies
  const algorithmInfo = {
    classical: { name: 'Classical (2-opt)', strategy: 'Shortest Distance', description: 'Greedy nearest neighbor with 2-opt optimization' },
    simulated: { name: 'Simulated Annealing', strategy: 'Time-Distance Hybrid', description: 'Temperature-based exploration with 0.6*distance + 0.4*time objective' },
    qiea: { name: 'Quantum-Inspired Evolutionary', strategy: 'Exploration-Focused', description: 'Population-based search with diversity bonus for alternative paths' },
    qaoa: { name: 'Quantum Approximate Optimization', strategy: 'Time-Focused', description: 'Quantum circuit simulation with 0.3*distance + 0.7*time + complexity bonus' }
  };

  const [selectedAlgorithms, setSelectedAlgorithms] = useState(['classical', 'simulated', 'qiea', 'qaoa']);
  const [routingProfile, setRoutingProfile] = useState<'driving' | 'driving-traffic'>('driving');
  const [showSettings, setShowSettings] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  
  const optimizerService = useRef(new GoogleMapsRouteOptimizationService());
  const mapCenter: [number, number] = [37.7749, -122.4194]; // San Francisco

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      await optimizerService.current.healthCheck();
      setBackendStatus('online');
    } catch (error) {
      console.error('Backend health check failed:', error);
      setBackendStatus('offline');
    }
  };

  // Map click handler component
  const MapEvents: React.FC = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        
        if (depot === null) {
          // First click sets the depot
          setDepot({ lat, lng });
        } else {
          // Subsequent clicks add delivery stops
          const newStop: DeliveryStop = {
            id: `stop_${stops.length + 1}`,
            lat,
            lng,
            service_time_minutes: 15
          };
          setStops(prev => [...prev, newStop]);
        }
      }
    });
    return null;
  };

  const clearAll = () => {
    setStops([]);
    setDepot(null);
    setResults(null);
  };

  const addSampleStops = () => {
    const sampleStops = optimizerService.current.createSampleStops(6);
    setStops(sampleStops);
    setDepot({ lat: 37.7749, lng: -122.4194 }); // San Francisco center
  };

  const optimizeRoutes = async () => {
    if (stops.length < 2) {
      alert('Please add at least 2 delivery stops to optimize routes.');
      return;
    }

    setIsOptimizing(true);
    try {
      const request = {
        stops,
        depot: depot || undefined,
        routing_profile: routingProfile,
        algorithms: selectedAlgorithms,
        google_api_key: 'AIzaSyBKscC204ykApm_eDhLxcVkcCSw3Vh7qHs' // Your API key
      };

      const optimizationResults = await optimizerService.current.optimizeRoutes(request);
      setResults(optimizationResults);
      onResults?.(optimizationResults);
      
    } catch (error) {
      console.error('Optimization failed:', error);
      alert(`Optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const getAlgorithmColor = (algorithm: string): string => {
    return algorithmColors[algorithm as keyof typeof algorithmColors] || '#6B7280';
  };

  const renderRoutePolylines = () => {
    if (!results) return null;

    return Object.entries(results.algorithmResults).map(([algorithm, result]) => {
      if ('error' in result) return null;

      
      const algorithmResult = result as AlgorithmResult;
      if (!algorithmResult.polyline) return null;

      const coordinates = optimizerService.current.decodePolyline(algorithmResult.polyline);
      if (coordinates.length < 2) return null;

      const algorithmData = algorithmInfo[algorithm as keyof typeof algorithmInfo];

      return (
        <Polyline
          key={algorithm}
          positions={coordinates}
          color={getAlgorithmColor(algorithm)}
          weight={5}
          opacity={0.85}
          dashArray={algorithm === 'classical' ? '0' : algorithm === 'simulated' ? '10, 5' : algorithm === 'qiea' ? '15, 10, 5, 10' : '20, 10'}
        >
          <Popup>
            <div className="font-inter text-sm max-w-xs">
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: getAlgorithmColor(algorithm) }}
                ></div>
                <h3 className="font-bold text-base">{algorithmData?.name || algorithm.toUpperCase()}</h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Strategy:</span>
                  <span className="font-medium text-accent-teal">{algorithmData?.strategy}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">📏 Distance:</span>
                  <span className="font-medium">{algorithmResult.distance_km.toFixed(2)} km</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">⏱️ Time:</span>
                  <span className="font-medium">{algorithmResult.time_min.toFixed(1)} min</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">🎯 Objective:</span>
                  <span className="font-medium">{algorithmResult.objective_value.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">🔄 Iterations:</span>
                  <span className="font-medium">{algorithmResult.iterations_log.length}</span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">{algorithmData?.description}</p>
              </div>
            </div>
          </Popup>
        </Polyline>
      );
    });
  };

  const renderMarkers = () => {
    const markers = [];

    // Depot marker
    if (depot) {
      markers.push(
        <Marker key="depot" position={[depot.lat, depot.lng]}>
          <Popup>
            <div className="font-mono text-sm">
              <h3 className="font-bold text-lg mb-2">🏢 Depot</h3>
              <p>Lat: {depot.lat.toFixed(6)}</p>
              <p>Lng: {depot.lng.toFixed(6)}</p>
            </div>
          </Popup>
        </Marker>
      );
    }

    // Stop markers
    stops.forEach((stop) => {
      markers.push(
        <Marker key={stop.id} position={[stop.lat, stop.lng]}>
          <Popup>
            <div className="font-mono text-sm">
              <h3 className="font-bold text-lg mb-2">📦 {stop.id}</h3>
              <p>Lat: {stop.lat.toFixed(6)}</p>
              <p>Lng: {stop.lng.toFixed(6)}</p>
              <p>Service Time: {stop.service_time_minutes} min</p>
              <button
                onClick={() => setStops(prev => prev.filter(s => s.id !== stop.id))}
                className="mt-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          </Popup>
        </Marker>
      );
    });

    return markers;
  };

  return (
    <div className="w-full h-full bg-black rounded-lg border border-cyan-400 shadow-cyan-400/20 shadow-lg overflow-hidden">
      {/* Header Controls */}
      <div className="bg-gray-900 border-b border-cyan-400 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-cyan-400">
            🗺️ Google Maps Route Optimizer v2.0
          </h2>
          <div className="flex items-center space-x-2">
            {/* Backend Status */}
            <div className={`flex items-center space-x-1 px-2 py-1 rounded ${
              backendStatus === 'online' ? 'bg-green-900 text-green-400' :
              backendStatus === 'offline' ? 'bg-red-900 text-red-400' :
              'bg-yellow-900 text-yellow-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                backendStatus === 'online' ? 'bg-green-400' :
                backendStatus === 'offline' ? 'bg-red-400' :
                'bg-yellow-400'
              }`} />
              <span className="text-xs font-mono">
                {backendStatus === 'online' ? 'Backend Online' :
                 backendStatus === 'offline' ? 'Backend Offline' :
                 'Checking...'}
              </span>
            </div>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-3 py-1 bg-purple-900 text-purple-400 rounded hover:bg-purple-800 transition-colors"
            >
              ⚙️ Settings
            </button>
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <span className="text-cyan-400 text-sm font-mono">
              Stops: {stops.length} | Depot: {depot ? '✓' : '✗'}
            </span>
            
            <button
              onClick={clearAll}
              className="px-3 py-1 bg-red-900 text-red-400 rounded hover:bg-red-800 transition-colors"
            >
              🗑️ Clear All
            </button>
            
            <button
              onClick={addSampleStops}
              className="px-3 py-1 bg-blue-900 text-blue-400 rounded hover:blue-800 transition-colors"
            >
              📍 Add Samples
            </button>
          </div>

          <button
            onClick={optimizeRoutes}
            disabled={isOptimizing || stops.length < 2 || backendStatus !== 'online'}
            className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-cyan-500 hover:to-purple-500 transition-all"
          >
            {isOptimizing ? (
              <><span className="animate-spin">⚡</span> Optimizing...</>
            ) : (
              <>🚀 Optimize Routes</>
            )}
          </button>
        </div>
      </div>

  {/* Quantum Dashboard Settings */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gray-800 border-b border-cyan-400 p-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Algorithm Selection */}
              <div>
                <label className="block text-accent-teal text-sm font-semibold mb-2">
                  Algorithms to Run:
                </label>
                <div className="space-y-2">
                  {['classical', 'simulated', 'qiea', 'qaoa'].map(algo => {
                    const info = algorithmInfo[algo as keyof typeof algorithmInfo];
                    return (
                      <label key={algo} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedAlgorithms.includes(algo)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAlgorithms(prev => [...prev, algo]);
                            } else {
                              setSelectedAlgorithms(prev => prev.filter(a => a !== algo));
                            }
                          }}
                          className="form-checkbox h-4 w-4 text-accent-teal rounded"
                        />
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: getAlgorithmColor(algo) }}
                          ></div>
                          <span className="text-text-primary text-sm font-medium">
                            {info?.name || algo.toUpperCase()}
                          </span>
                          <span className="text-text-muted text-xs">
                            ({info?.strategy})
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Routing Profile */}
              <div>
                <label className="block text-accent-teal text-sm font-semibold mb-2">
                  Routing Profile:
                </label>
                <select
                  value={routingProfile}
                  onChange={(e) => setRoutingProfile(e.target.value as 'driving' | 'driving-traffic')}
                  className="w-full p-2 bg-dark-panel border border-dark-border rounded text-text-primary focus:border-accent-teal focus:outline-none"
                >
                  <option value="driving">Driving (Standard)</option>
                  <option value="driving-traffic">Driving (Traffic-Aware)</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* Circular Map Visualization */}
      <div className="relative flex-1 flex items-center justify-center" style={{ height: 'calc(100% - 120px)' }}>
        <div className="rounded-full overflow-hidden shadow-lg border-4 border-accent-teal" style={{ width: '600px', height: '600px', background: 'radial-gradient(circle at 60% 40%, #222 80%, #111 100%)' }}>
          <MapContainer
            center={mapCenter}
            zoom={12}
            className="w-full h-full"
            style={{ borderRadius: '50%', width: '100%', height: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapEvents />
            {renderMarkers()}
            {renderRoutePolylines()}
          </MapContainer>
          {/* Instructions Overlay */}
          {stops.length === 0 && !depot && (
            <div className="absolute inset-4 bg-black bg-opacity-80 rounded-full flex items-center justify-center pointer-events-none" style={{ width: '100%', height: '100%' }}>
              <div className="text-center text-cyan-400 font-mono">
                <div className="text-4xl mb-4">🗺️</div>
                <h3 className="text-xl mb-2">Click to Add Locations</h3>
                <p className="text-sm">First click: Depot (optional)</p>
                <p className="text-sm">Additional clicks: Delivery stops</p>
                <p className="text-sm mt-2">Or use "Add Samples" for quick testing</p>
              </div>
            </div>
          )}
        </div>
      </div>

  {/* Quantum Route Results */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gray-900 border-t border-cyan-400 p-4 max-h-60 overflow-y-auto"
          >
            <h3 className="text-lg font-bold text-cyan-400 mb-3">📊 Optimization Results</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(results.algorithmResults).map(([algorithm, result]) => {
                if ('error' in result) {
                  return (
                    <div key={algorithm} className="bg-red-900 bg-opacity-30 p-3 rounded border border-red-500">
                      <h4 className="font-bold text-red-400 mb-1">{algorithm.toUpperCase()}</h4>
                      <p className="text-red-300 text-sm">Error: {String(result.error)}</p>
                    </div>
                  );
                }
                
                const algorithmResult = result as AlgorithmResult;
                const color = getAlgorithmColor(algorithm);
                
                return (
                  <div key={algorithm} className="bg-gray-800 p-3 rounded border" style={{ borderColor: color }}>
                    <h4 className="font-bold mb-2" style={{ color }}>{algorithm.toUpperCase()}</h4>
                    <div className="space-y-1 text-xs font-mono">
                      <div>📏 {algorithmResult.distance_km.toFixed(2)} km</div>
                      <div>⏱️ {algorithmResult.time_min.toFixed(1)} min</div>
                      <div>🎯 {algorithmResult.objective_value.toFixed(2)}</div>
                      <div>🔄 {algorithmResult.iterations_log.length} iterations</div>
                      <div>🎲 Seed: {algorithmResult.seed}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 text-xs text-gray-400 font-mono">
              Source: {results.distanceMatrixSource} | Processed: {new Date(results.timestamp).toLocaleString()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GoogleMapsRouteOptimizationMap;
