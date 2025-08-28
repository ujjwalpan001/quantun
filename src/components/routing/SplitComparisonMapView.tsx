import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Import side-by-side plugin
import 'leaflet-side-by-side';
// Import polyline decorator for arrows
import 'leaflet-polylinedecorator';
import { useRoutingStore } from '../../lib/store';
import { realRouteService, type RoutingWaypoint, type RealRouteResult } from '../../lib/real-route-service';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Split, ArrowLeftRight } from 'lucide-react';
import { motion } from 'framer-motion';

// Algorithm colors for comparison
const ALGORITHM_COLORS = {
  classical: '#3b82f6',      // Blue
  sqa: '#10b981',           // Green  
  qiea: '#f59e0b',          // Amber
  qaoa: '#8b5cf6',          // Purple
} as const;

const ALGORITHM_NAMES = {
  classical: 'Classical',
  sqa: 'SQA', 
  qiea: 'QI-EA',
  qaoa: 'QAOA',
} as const;

// Fix leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface SplitComparisonMapViewProps {
  className?: string;
}

export const SplitComparisonMapView: React.FC<SplitComparisonMapViewProps> = ({ className }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const leftLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const rightLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const sideBySideControlRef = useRef<any>(null);
  
  const { locations, comparisonResults } = useRoutingStore();
  const [selectedLeftAlgorithm, setSelectedLeftAlgorithm] = useState<string>('qaoa');
  const [selectedRightAlgorithm, setSelectedRightAlgorithm] = useState<string>('qiea');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [leftRealRoute, setLeftRealRoute] = useState<RealRouteResult | null>(null);
  const [rightRealRoute, setRightRealRoute] = useState<RealRouteResult | null>(null);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);

  // Get available algorithms from comparison results
  const availableAlgorithms = React.useMemo(() => {
    if (comparisonResults.length === 0) return [];
    
    return comparisonResults.map(result => {
      const algorithmKey = result.algorithm.toLowerCase().includes('classical') ? 'classical' :
                         result.algorithm.toLowerCase().includes('sqa') ? 'sqa' :
                         result.algorithm.toLowerCase().includes('qiea') ? 'qiea' :
                         result.algorithm.toLowerCase().includes('qaoa') ? 'qaoa' : 'classical';
      return {
        key: algorithmKey,
        name: ALGORITHM_NAMES[algorithmKey as keyof typeof ALGORITHM_NAMES],
        color: ALGORITHM_COLORS[algorithmKey as keyof typeof ALGORITHM_COLORS],
        data: result
      };
    });
  }, [comparisonResults]);

  // Fetch real routes for selected algorithms
  const fetchRealRoutes = async (leftAlgorithm: any, rightAlgorithm: any) => {
    if (!leftAlgorithm || !rightAlgorithm || locations.length < 2) return;

    setIsLoadingRoutes(true);
    try {
      // Convert algorithm routes to waypoints
      const leftWaypoints: RoutingWaypoint[] = leftAlgorithm.data.route.map((locationId: string) => {
        const location = locations.find(loc => loc.id === locationId);
        return location ? {
          lat: location.lat,
          lng: location.lng,
          name: location.address
        } : null;
      }).filter((wp: any): wp is RoutingWaypoint => wp !== null);

      const rightWaypoints: RoutingWaypoint[] = rightAlgorithm.data.route.map((locationId: string) => {
        const location = locations.find(loc => loc.id === locationId);
        return location ? {
          lat: location.lat,
          lng: location.lng,
          name: location.address
        } : null;
      }).filter((wp: any): wp is RoutingWaypoint => wp !== null);

      // Fetch real routes concurrently
      const [leftRoute, rightRoute] = await Promise.all([
        realRouteService.getRealRoute(leftWaypoints),
        realRouteService.getRealRoute(rightWaypoints)
      ]);

      setLeftRealRoute(leftRoute);
      setRightRealRoute(rightRoute);
    } catch (error) {
      console.error('Failed to fetch real routes:', error);
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  // Fetch real routes when algorithms change
  useEffect(() => {
    const leftAlgorithm = availableAlgorithms.find(alg => alg.key === selectedLeftAlgorithm);
    const rightAlgorithm = availableAlgorithms.find(alg => alg.key === selectedRightAlgorithm);
    
    if (leftAlgorithm && rightAlgorithm && locations.length >= 2) {
      fetchRealRoutes(leftAlgorithm, rightAlgorithm);
    }
  }, [selectedLeftAlgorithm, selectedRightAlgorithm, availableAlgorithms, locations]);

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !leafletMapRef.current) {
      // Create the main map
      leafletMapRef.current = L.map(mapRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: false
      });

      // Add base tile layer
      const baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      });
      baseLayer.addTo(leafletMapRef.current);

      // Initialize layer groups for left and right sides
      leftLayerGroupRef.current = L.layerGroup();
      rightLayerGroupRef.current = L.layerGroup();

      // Add layer groups to map
      leftLayerGroupRef.current.addTo(leafletMapRef.current);
      rightLayerGroupRef.current.addTo(leafletMapRef.current);

      // Create side-by-side control
      try {
        // Use proper import for side-by-side control
        const sideBySide = (L as any).control.sideBySide;
        if (sideBySide) {
          sideBySideControlRef.current = sideBySide(
            leftLayerGroupRef.current,
            rightLayerGroupRef.current
          );
          sideBySideControlRef.current.addTo(leafletMapRef.current);
        }
      } catch (error) {
        console.warn('Side-by-side control not available:', error);
      }
    }

    return () => {
      if (sideBySideControlRef.current && leafletMapRef.current) {
        leafletMapRef.current.removeControl(sideBySideControlRef.current);
      }
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update routes when algorithms or comparison results change
  useEffect(() => {
    if (!leafletMapRef.current || !leftLayerGroupRef.current || !rightLayerGroupRef.current || availableAlgorithms.length === 0) return;

    // Clear existing layers
    leftLayerGroupRef.current.clearLayers();
    rightLayerGroupRef.current.clearLayers();

    // Get selected algorithm data
    const leftAlgorithm = availableAlgorithms.find(alg => alg.key === selectedLeftAlgorithm);
    const rightAlgorithm = availableAlgorithms.find(alg => alg.key === selectedRightAlgorithm);

    // Add markers to both sides (shared locations)
    locations.forEach((location, index) => {
      const isStart = index === 0;
      const isEnd = index === locations.length - 1 && locations.length > 1;
      
      // Create enhanced markers for left side
      const leftMarkerColor = isStart ? '#10b981' : isEnd ? '#ef4444' : leftAlgorithm?.color || '#3b82f6';
      const leftMarkerIcon = L.divIcon({
        html: `
          <div style="
            background: ${leftMarkerColor}; 
            color: white; 
            width: 30px; 
            height: 30px; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-weight: bold; 
            font-size: 12px;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">
            ${isStart ? 'S' : isEnd ? 'E' : index + 1}
          </div>
        `,
        className: 'custom-marker-left',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const leftMarker = L.marker([location.lat, location.lng], { icon: leftMarkerIcon });

      leftMarker.bindPopup(`
        <div class="p-3 min-w-48">
          <strong>${location.address || 'Location'}</strong><br>
          <small>Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}</small><br>
          <span class="text-xs font-semibold" style="color: ${leftAlgorithm?.color || '#3b82f6'}">
            ${isStart ? '🟢 Start Point' : isEnd ? '🔴 End Point' : `📍 Stop ${index + 1}`} - ${leftAlgorithm?.name || 'Left'} Side
          </span>
          <div class="mt-2 text-xs text-gray-600">
            Route Position: ${index + 1} of ${locations.length}
          </div>
        </div>
      `);

      // Create enhanced markers for right side  
      const rightMarkerColor = isStart ? '#10b981' : isEnd ? '#ef4444' : rightAlgorithm?.color || '#8b5cf6';
      const rightMarkerIcon = L.divIcon({
        html: `
          <div style="
            background: ${rightMarkerColor}; 
            color: white; 
            width: 30px; 
            height: 30px; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-weight: bold; 
            font-size: 12px;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">
            ${isStart ? 'S' : isEnd ? 'E' : index + 1}
          </div>
        `,
        className: 'custom-marker-right',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const rightMarker = L.marker([location.lat, location.lng], { icon: rightMarkerIcon });

      rightMarker.bindPopup(`
        <div class="p-3 min-w-48">
          <strong>${location.address || 'Location'}</strong><br>
          <small>Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}</small><br>
          <span class="text-xs font-semibold" style="color: ${rightAlgorithm?.color || '#8b5cf6'}">
            ${isStart ? '🟢 Start Point' : isEnd ? '🔴 End Point' : `📍 Stop ${index + 1}`} - ${rightAlgorithm?.name || 'Right'} Side
          </span>
          <div class="mt-2 text-xs text-gray-600">
            Route Position: ${index + 1} of ${locations.length}
          </div>
        </div>
      `);

      leftLayerGroupRef.current?.addLayer(leftMarker);
      rightLayerGroupRef.current?.addLayer(rightMarker);
    });

    // Add left algorithm route (using real roads)
    if (leftAlgorithm && leftRealRoute) {
      // Use real route coordinates if available
      const routeCoordinates = leftRealRoute.coordinates;

      if (routeCoordinates.length > 1) {
        // Create polyline following real roads
        const polyline = L.polyline(routeCoordinates, {
          color: leftAlgorithm.color,
          weight: 5,
          opacity: 0.8,
          dashArray: '8, 4',
          className: 'route-segment-left'
        });

        polyline.bindPopup(`
          <div class="p-3 min-w-48">
            <strong style="color: ${leftAlgorithm.color}">Real Road Route - ${leftAlgorithm.name}</strong><br>
            <div class="mt-2 space-y-1">
              <div>� Real Distance: <strong>${(leftRealRoute.distance / 1000).toFixed(2)} km</strong></div>
              <div>⏱️ Estimated Time: <strong>${(leftRealRoute.time / 60).toFixed(0)} min</strong></div>
              <div>🚛 Algorithm: <strong>${leftAlgorithm.name}</strong></div>
              <div>🎯 Waypoints: <strong>${leftRealRoute.waypoints.length}</strong></div>
              <div>� Route Points: <strong>${routeCoordinates.length}</strong></div>
              <div style="color: ${leftAlgorithm.color}">🛣️ Following real roads</div>
            </div>
            ${leftRealRoute.instructions.length > 0 ? `
              <div class="mt-2 pt-2 border-t border-gray-200">
                <div class="text-xs font-semibold">Sample Instructions:</div>
                <div class="text-xs text-gray-600 max-h-20 overflow-y-auto">
                  ${leftRealRoute.instructions.slice(0, 3).join('<br>')}
                  ${leftRealRoute.instructions.length > 3 ? '<br>...' : ''}
                </div>
              </div>
            ` : ''}
          </div>
        `);

        leftLayerGroupRef.current?.addLayer(polyline);

        // Add waypoint markers along the route
        leftRealRoute.waypoints.forEach((waypoint, index) => {
          const isStart = index === 0;
          const isEnd = index === leftRealRoute.waypoints.length - 1;
          
          const waypointIcon = L.divIcon({
            html: `<div style="background: ${leftAlgorithm.color}; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${isStart ? 'S' : isEnd ? 'E' : index}</div>`,
            className: 'real-route-waypoint-left',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });

          const waypointMarker = L.marker([waypoint.lat, waypoint.lng], { icon: waypointIcon });
          waypointMarker.bindPopup(`
            <div class="p-2">
              <strong>${waypoint.name || `Waypoint ${index + 1}`}</strong><br>
              <small>Real road navigation point</small>
            </div>
          `);
          
          leftLayerGroupRef.current?.addLayer(waypointMarker);
        });

        // Add route summary
        const centerIndex = Math.floor(routeCoordinates.length / 2);
        const centerCoord = routeCoordinates[centerIndex];
        
        const summaryIcon = L.divIcon({
          html: `<div style="background: ${leftAlgorithm.color}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${leftAlgorithm.name} - Real Roads</div>`,
          className: 'route-summary-left',
          iconSize: [120, 24],
          iconAnchor: [60, 12]
        });

        const summaryMarker = L.marker(centerCoord, { icon: summaryIcon });
        leftLayerGroupRef.current?.addLayer(summaryMarker);
      }
    }

    // Add right algorithm route (using real roads)
    if (rightAlgorithm && rightRealRoute) {
      // Use real route coordinates if available
      const routeCoordinates = rightRealRoute.coordinates;

      if (routeCoordinates.length > 1) {
        // Create polyline following real roads
        const polyline = L.polyline(routeCoordinates, {
          color: rightAlgorithm.color,
          weight: 5,
          opacity: 0.8,
          dashArray: '12, 8',
          className: 'route-segment-right'
        });

        polyline.bindPopup(`
          <div class="p-3 min-w-48">
            <strong style="color: ${rightAlgorithm.color}">Real Road Route - ${rightAlgorithm.name}</strong><br>
            <div class="mt-2 space-y-1">
              <div>� Real Distance: <strong>${(rightRealRoute.distance / 1000).toFixed(2)} km</strong></div>
              <div>⏱️ Estimated Time: <strong>${(rightRealRoute.time / 60).toFixed(0)} min</strong></div>
              <div>🚛 Algorithm: <strong>${rightAlgorithm.name}</strong></div>
              <div>🎯 Waypoints: <strong>${rightRealRoute.waypoints.length}</strong></div>
              <div>� Route Points: <strong>${routeCoordinates.length}</strong></div>
              <div style="color: ${rightAlgorithm.color}">🛣️ Following real roads</div>
            </div>
            ${rightRealRoute.instructions.length > 0 ? `
              <div class="mt-2 pt-2 border-t border-gray-200">
                <div class="text-xs font-semibold">Sample Instructions:</div>
                <div class="text-xs text-gray-600 max-h-20 overflow-y-auto">
                  ${rightRealRoute.instructions.slice(0, 3).join('<br>')}
                  ${rightRealRoute.instructions.length > 3 ? '<br>...' : ''}
                </div>
              </div>
            ` : ''}
          </div>
        `);

        rightLayerGroupRef.current?.addLayer(polyline);

        // Add waypoint markers along the route
        rightRealRoute.waypoints.forEach((waypoint, index) => {
          const isStart = index === 0;
          const isEnd = index === rightRealRoute.waypoints.length - 1;
          
          const waypointIcon = L.divIcon({
            html: `<div style="background: ${rightAlgorithm.color}; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${isStart ? 'S' : isEnd ? 'E' : index}</div>`,
            className: 'real-route-waypoint-right',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });

          const waypointMarker = L.marker([waypoint.lat, waypoint.lng], { icon: waypointIcon });
          waypointMarker.bindPopup(`
            <div class="p-2">
              <strong>${waypoint.name || `Waypoint ${index + 1}`}</strong><br>
              <small>Real road navigation point</small>
            </div>
          `);
          
          rightLayerGroupRef.current?.addLayer(waypointMarker);
        });

        // Add route summary
        const centerIndex = Math.floor(routeCoordinates.length / 2);
        const centerCoord = routeCoordinates[centerIndex];
        
        const summaryIcon = L.divIcon({
          html: `<div style="background: ${rightAlgorithm.color}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${rightAlgorithm.name} - Real Roads</div>`,
          className: 'route-summary-right',
          iconSize: [120, 24],
          iconAnchor: [60, 12]
        });

        const summaryMarker = L.marker(centerCoord, { icon: summaryIcon });
        rightLayerGroupRef.current?.addLayer(summaryMarker);
      }
    }

    // Fit map to show all locations
    if (locations.length > 0) {
      const group = L.featureGroup();
      locations.forEach(loc => {
        group.addLayer(L.marker([loc.lat, loc.lng]));
      });
      leafletMapRef.current?.fitBounds(group.getBounds().pad(0.1));
    }
  }, [locations, selectedLeftAlgorithm, selectedRightAlgorithm, availableAlgorithms, leftRealRoute, rightRealRoute]);

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

  if (availableAlgorithms.length < 2) {
    return (
      <Card className={`h-full ${className} quantum-glass border border-quantum-primary/20 shadow-2xl`}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4 p-8">
            <div className="text-6xl">⚖️</div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Need Multiple Algorithms
            </h3>
            <p className="text-sm text-gray-500 max-w-md">
              Run "Compare All Algorithms" to see side-by-side route comparison. You need at least 2 different algorithm results.
            </p>
          </div>
        </div>
      </Card>
    );
  }

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
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm shadow-lg flex items-center gap-2">
              <Split className="w-4 h-4" />
              Split Route Comparison
            </Badge>
            
            {/* Algorithm Selectors */}
            <div className="flex gap-2 items-center">
              {/* Left Algorithm Selector */}
              <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-sm">
                <span className="text-xs font-medium">Left:</span>
                <select 
                  value={selectedLeftAlgorithm}
                  onChange={(e) => setSelectedLeftAlgorithm(e.target.value)}
                  className="text-xs border-none bg-transparent font-medium outline-none"
                  style={{ color: ALGORITHM_COLORS[selectedLeftAlgorithm as keyof typeof ALGORITHM_COLORS] }}
                >
                  {availableAlgorithms.map(alg => (
                    <option key={alg.key} value={alg.key}>{alg.name}</option>
                  ))}
                </select>
              </div>

              <ArrowLeftRight className="w-4 h-4 text-gray-400" />

              {/* Right Algorithm Selector */}
              <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-sm">
                <span className="text-xs font-medium">Right:</span>
                <select 
                  value={selectedRightAlgorithm}
                  onChange={(e) => setSelectedRightAlgorithm(e.target.value)}
                  className="text-xs border-none bg-transparent font-medium outline-none"
                  style={{ color: ALGORITHM_COLORS[selectedRightAlgorithm as keyof typeof ALGORITHM_COLORS] }}
                >
                  {availableAlgorithms.map(alg => (
                    <option key={alg.key} value={alg.key}>{alg.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isLoadingRoutes && (
              <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm shadow-lg animate-pulse">
                🛣️ Loading real routes...
              </Badge>
            )}
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
              className="w-full h-full opacity-10"
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
        <div className="absolute bottom-4 left-4 z-[1000] max-w-sm">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
            <h4 className="font-semibold text-sm mb-2 text-gray-800 dark:text-gray-200">
              📊 Algorithm Comparison
            </h4>
            <div className="space-y-2 text-xs">
              {/* Left Algorithm Stats */}
              {availableAlgorithms.find(alg => alg.key === selectedLeftAlgorithm) && (
                <div className="flex items-center justify-between">
                  <span 
                    className="font-medium"
                    style={{ color: ALGORITHM_COLORS[selectedLeftAlgorithm as keyof typeof ALGORITHM_COLORS] }}
                  >
                    {ALGORITHM_NAMES[selectedLeftAlgorithm as keyof typeof ALGORITHM_NAMES]} (Left):
                  </span>
                  <span className="text-gray-600 dark:text-gray-300">
                    {leftRealRoute ? (
                      <>🛣️ {(leftRealRoute.distance / 1000).toFixed(1)}km | {(leftRealRoute.time / 60).toFixed(0)}min</>
                    ) : (
                      (() => {
                        const alg = availableAlgorithms.find(a => a.key === selectedLeftAlgorithm);
                        return `📏 ${(alg?.data.totalDistanceKm || 0).toFixed(1)}km | ${(alg?.data.estimatedTimeMin || 0).toFixed(0)}min`;
                      })()
                    )}
                  </span>
                </div>
              )}
              
              {/* Right Algorithm Stats */}
              {availableAlgorithms.find(alg => alg.key === selectedRightAlgorithm) && (
                <div className="flex items-center justify-between">
                  <span 
                    className="font-medium"
                    style={{ color: ALGORITHM_COLORS[selectedRightAlgorithm as keyof typeof ALGORITHM_COLORS] }}
                  >
                    {ALGORITHM_NAMES[selectedRightAlgorithm as keyof typeof ALGORITHM_NAMES]} (Right):
                  </span>
                  <span className="text-gray-600 dark:text-gray-300">
                    {rightRealRoute ? (
                      <>🛣️ {(rightRealRoute.distance / 1000).toFixed(1)}km | {(rightRealRoute.time / 60).toFixed(0)}min</>
                    ) : (
                      (() => {
                        const alg = availableAlgorithms.find(a => a.key === selectedRightAlgorithm);
                        return `📏 ${(alg?.data.totalDistanceKm || 0).toFixed(1)}km | ${(alg?.data.estimatedTimeMin || 0).toFixed(0)}min`;
                      })()
                    )}
                  </span>
                </div>
              )}
              
              {/* Difference Indicator */}
              {(() => {
                if (leftRealRoute && rightRealRoute) {
                  // Use real route data for comparison
                  const leftDist = leftRealRoute.distance / 1000;
                  const rightDist = rightRealRoute.distance / 1000;
                  const diff = Math.abs(leftDist - rightDist);
                  const percentage = ((diff / Math.min(leftDist, rightDist)) * 100).toFixed(1);
                  return (
                    <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
                      <span className="text-gray-500">
                        🛣️ Real Route Difference: <strong>{diff.toFixed(1)}km ({percentage}%)</strong>
                      </span>
                    </div>
                  );
                } else {
                  // Fallback to algorithm data
                  const leftAlg = availableAlgorithms.find(a => a.key === selectedLeftAlgorithm);
                  const rightAlg = availableAlgorithms.find(a => a.key === selectedRightAlgorithm);
                  if (leftAlg && rightAlg) {
                    const leftDist = leftAlg.data.totalDistanceKm || 0;
                    const rightDist = rightAlg.data.totalDistanceKm || 0;
                    const diff = Math.abs(leftDist - rightDist);
                    const percentage = ((diff / Math.min(leftDist, rightDist)) * 100).toFixed(1);
                    return (
                      <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
                        <span className="text-gray-500">
                          📏 Algorithm Difference: <strong>{diff.toFixed(1)}km ({percentage}%)</strong>
                        </span>
                      </div>
                    );
                  }
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
