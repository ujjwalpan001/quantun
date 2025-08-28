import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRoutingStore } from '../../lib/store';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

// Algorithm colors for comparison
const ALGORITHM_COLORS = {
  classical: '#3b82f6',      // Blue
  sqa: '#10b981',           // Green
  qiea: '#f59e0b',          // Amber
  qaoa: '#8b5cf6',          // Purple
  single: '#ef4444'         // Red for single route
};

const ALGORITHM_NAMES = {
  classical: 'Classical',
  sqa: 'SQA',
  qiea: 'QI-EA',
  qaoa: 'QAOA',
  single: 'Route'
};

// Fix leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ComparisonMapViewProps {
  className?: string;
}

export const ComparisonMapView: React.FC<ComparisonMapViewProps> = ({ className }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const routeLayersRef = useRef<{ [key: string]: L.LayerGroup }>({});
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  
  const { locations, comparisonResults, currentRoute } = useRoutingStore();
  const [visibleAlgorithms, setVisibleAlgorithms] = useState<{ [key: string]: boolean }>({
    classical: true,
    sqa: true,
    qiea: true,
    qaoa: true,
    single: true
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !leafletMapRef.current) {
      leafletMapRef.current = L.map(mapRef.current).setView([20.5937, 78.9629], 5);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(leafletMapRef.current);

      // Initialize layers
      markersLayerRef.current = L.layerGroup().addTo(leafletMapRef.current);
      
      // Initialize route layers
      Object.keys(ALGORITHM_COLORS).forEach(algorithm => {
        routeLayersRef.current[algorithm] = L.layerGroup().addTo(leafletMapRef.current!);
      });
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update markers when locations change
  useEffect(() => {
    if (!leafletMapRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    locations.forEach((location, index) => {
      const isStart = index === 0;
      const isEnd = index === locations.length - 1 && locations.length > 1;
      
      const markerColor = isStart ? 'green' : isEnd ? 'red' : 'blue';
      
      const marker = L.circleMarker([location.lat, location.lng], {
        radius: 8,
        fillColor: markerColor,
        color: 'white',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      });

      marker.bindPopup(`
        <div class="p-2">
          <strong>${location.address || 'Location'}</strong><br>
          <small>Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}</small><br>
          <span class="text-xs ${isStart ? 'text-green-600' : isEnd ? 'text-red-600' : 'text-blue-600'}">
            ${isStart ? '🟢 Start' : isEnd ? '🔴 End' : '📍 Stop'}
          </span>
        </div>
      `);

      markersLayerRef.current?.addLayer(marker);
    });

    // Fit map to show all markers
    if (locations.length > 0) {
      const group = L.featureGroup();
      locations.forEach(loc => {
        group.addLayer(L.marker([loc.lat, loc.lng]));
      });
      leafletMapRef.current?.fitBounds(group.getBounds().pad(0.1));
    }
  }, [locations]);

  // Update routes for comparison
  useEffect(() => {
    if (!leafletMapRef.current) return;

    // Clear existing routes
    Object.values(routeLayersRef.current).forEach(layer => layer.clearLayers());

    // Draw comparison results
    if (comparisonResults.length > 0) {
      comparisonResults.forEach((result: any) => {
        const algorithmKey = result.algorithm.toLowerCase().includes('classical') ? 'classical' :
                           result.algorithm.toLowerCase().includes('sqa') ? 'sqa' :
                           result.algorithm.toLowerCase().includes('qiea') ? 'qiea' :
                           result.algorithm.toLowerCase().includes('qaoa') ? 'qaoa' : 'single';

        if (!visibleAlgorithms[algorithmKey]) return;

        const routeCoordinates = result.route.map((locationId: string) => {
          const location = locations.find(loc => loc.id === locationId);
          return location ? [location.lat, location.lng] : null;
        }).filter(Boolean);

        if (routeCoordinates.length > 1) {
          const polyline = L.polyline(routeCoordinates as L.LatLngExpression[], {
            color: ALGORITHM_COLORS[algorithmKey as keyof typeof ALGORITHM_COLORS],
            weight: 4,
            opacity: 0.8,
            dashArray: algorithmKey === 'classical' ? undefined : '10, 5'
          });

          polyline.bindPopup(`
            <div class="p-3 min-w-48">
              <strong style="color: ${ALGORITHM_COLORS[algorithmKey as keyof typeof ALGORITHM_COLORS]}">${result.algorithm}</strong><br>
              <div class="mt-2 space-y-1">
                <div>📏 Distance: <strong>${(result.total_distance_km || result.totalDistanceKm || 0).toFixed(2)} km</strong></div>
                <div>⏱️ Time: <strong>${(result.estimated_time_min || result.estimatedTimeMin || 0).toFixed(0)} min</strong></div>
                <div>🚛 Vehicles: <strong>${result.vehicle_count || result.vehicleCount || 1}</strong></div>
              </div>
            </div>
          `);

          routeLayersRef.current[algorithmKey].addLayer(polyline);
        }
      });
    } 
    // Draw single route if no comparison
    else if (currentRoute && currentRoute.route) {
      const routeCoordinates = currentRoute.route.map((locationId: string) => {
        const location = locations.find(loc => loc.id === locationId);
        return location ? [location.lat, location.lng] : null;
      }).filter(Boolean);

      if (routeCoordinates.length > 1 && visibleAlgorithms.single) {
        const polyline = L.polyline(routeCoordinates as L.LatLngExpression[], {
          color: ALGORITHM_COLORS.single,
          weight: 5,
          opacity: 0.9
        });

        polyline.bindPopup(`
          <div class="p-3 min-w-48">
            <strong style="color: ${ALGORITHM_COLORS.single}">${currentRoute.algorithm}</strong><br>
            <div class="mt-2 space-y-1">
              <div>📏 Distance: <strong>${currentRoute.totalDistanceKm.toFixed(2)} km</strong></div>
              <div>⏱️ Time: <strong>${currentRoute.estimatedTimeMin.toFixed(0)} min</strong></div>
              <div>🚛 Vehicles: <strong>${currentRoute.vehicleCount || 1}</strong></div>
            </div>
          </div>
        `);

        routeLayersRef.current.single.addLayer(polyline);
      }
    }
  }, [comparisonResults, currentRoute, locations, visibleAlgorithms]);

  const toggleAlgorithmVisibility = (algorithm: string) => {
    setVisibleAlgorithms(prev => ({
      ...prev,
      [algorithm]: !prev[algorithm]
    }));
  };

  const zoomIn = () => leafletMapRef.current?.zoomIn();
  const zoomOut = () => leafletMapRef.current?.zoomOut();
  const resetView = () => {
    if (leafletMapRef.current && locations.length > 0) {
      const group = L.featureGroup();
      locations.forEach(loc => {
        group.addLayer(L.marker([loc.lat, loc.lng]));
      });
      leafletMapRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  };

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const containerClass = isFullscreen 
    ? "fixed inset-0 z-50 bg-white dark:bg-gray-900" 
    : "relative";

  const getActiveResults = () => {
    return comparisonResults.length > 0 ? comparisonResults : (currentRoute ? [currentRoute] : []);
  };

  return (
    <motion.div 
      className={containerClass}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`${isFullscreen ? 'h-full rounded-none' : 'h-full'} ${className} overflow-hidden quantum-glass border border-quantum-primary/20 shadow-2xl`}>
        
        {/* Header Controls */}
        <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-start">
          <div className="flex flex-col gap-2">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm shadow-lg">
              🗺️ {comparisonResults.length > 0 ? 'Algorithm Comparison Map' : 'Route Optimization Map'}
            </Badge>
            
            {/* Algorithm Legend & Toggles */}
            {getActiveResults().length > 0 && (
              <div className="flex flex-wrap gap-2">
                {comparisonResults.length > 0 ? (
                  // Multiple algorithms
                  Object.entries(ALGORITHM_COLORS).filter(([key]) => key !== 'single').map(([algorithm, color]) => (
                    <Button
                      key={algorithm}
                      variant={visibleAlgorithms[algorithm] ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleAlgorithmVisibility(algorithm)}
                      className="h-8 px-3 text-xs bg-white/90 backdrop-blur-sm shadow-sm"
                      style={{
                        backgroundColor: visibleAlgorithms[algorithm] ? color : 'transparent',
                        borderColor: color,
                        color: visibleAlgorithms[algorithm] ? 'white' : color
                      }}
                    >
                      {visibleAlgorithms[algorithm] ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                      {ALGORITHM_NAMES[algorithm as keyof typeof ALGORITHM_NAMES]}
                    </Button>
                  ))
                ) : (
                  // Single route
                  <Button
                    variant={visibleAlgorithms.single ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleAlgorithmVisibility('single')}
                    className="h-8 px-3 text-xs bg-white/90 backdrop-blur-sm shadow-sm"
                    style={{
                      backgroundColor: visibleAlgorithms.single ? ALGORITHM_COLORS.single : 'transparent',
                      borderColor: ALGORITHM_COLORS.single,
                      color: visibleAlgorithms.single ? 'white' : ALGORITHM_COLORS.single
                    }}
                  >
                    {visibleAlgorithms.single ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                    Route
                  </Button>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="bg-white/90 backdrop-blur-sm shadow-sm">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Map Container with Quantum Grid Overlay */}
        <div 
          ref={mapRef} 
          className="w-full h-full relative quantum-map"
          style={{ minHeight: isFullscreen ? '100vh' : '24rem' }}
        >
          {/* Holographic Grid Overlay */}
          <div className="absolute inset-0 z-[999] pointer-events-none">
            <div 
              className="w-full h-full opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(0, 247, 255, 0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0, 247, 255, 0.3) 1px, transparent 1px)
                `,
                backgroundSize: '30px 30px',
                animation: 'quantumGridFlow 10s linear infinite'
              }}
            />
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
          <Button variant="ghost" size="sm" onClick={zoomIn} className="bg-white/90 backdrop-blur-sm shadow-sm">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={zoomOut} className="bg-white/90 backdrop-blur-sm shadow-sm">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={resetView} className="bg-white/90 backdrop-blur-sm shadow-sm">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Statistics Panel */}
        {getActiveResults().length > 0 && (
          <div className="absolute bottom-4 left-4 z-[1000] max-w-sm">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
              <h4 className="font-semibold text-sm mb-2 text-gray-800 dark:text-gray-200">
                📊 Route Statistics
              </h4>
              <div className="space-y-1 text-xs">
                {getActiveResults().map((result: any, index: number) => {
                  const algorithmKey = result.algorithm.toLowerCase().includes('classical') ? 'classical' :
                                     result.algorithm.toLowerCase().includes('sqa') ? 'sqa' :
                                     result.algorithm.toLowerCase().includes('qiea') ? 'qiea' :
                                     result.algorithm.toLowerCase().includes('qaoa') ? 'qaoa' : 'single';
                  
                  if (!visibleAlgorithms[algorithmKey]) return null;
                  
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <span 
                        className="font-medium"
                        style={{ color: ALGORITHM_COLORS[algorithmKey as keyof typeof ALGORITHM_COLORS] }}
                      >
                        {result.algorithm.split('(')[0].trim()}:
                      </span>
                      <span className="text-gray-600 dark:text-gray-300">
                        {(result.total_distance_km || result.totalDistanceKm || 0).toFixed(1)}km | {(result.estimated_time_min || result.estimatedTimeMin || 0).toFixed(0)}min
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* No Data State */}
        {locations.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50">
            <div className="text-center space-y-3 p-8">
              <div className="text-6xl">🗺️</div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                No Locations Added
              </h3>
              <p className="text-sm text-gray-500">
                Add some locations to see the route visualization
              </p>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};
