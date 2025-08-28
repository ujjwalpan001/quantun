import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';
import { Button } from '../ui/button';
import 'leaflet/dist/leaflet.css';
import { useRoutingStore } from '../../lib/store';

// Fix for default markers
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map Controls Component
const MapControls: React.FC<{ 
  onZoomIn: () => void, 
  onZoomOut: () => void, 
  onReset: () => void,
  onFitBounds: () => void 
}> = ({ onZoomIn, onZoomOut, onReset, onFitBounds }) => {
  return (
    <motion.div 
      className="absolute top-4 right-4 z-10 flex flex-col gap-2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          size="sm"
          variant="outline"
          onClick={onZoomIn}
          className="bg-white/90 backdrop-blur-sm shadow-md border"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
      </motion.div>
      
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          size="sm"
          variant="outline"
          onClick={onZoomOut}
          className="bg-white/90 backdrop-blur-sm shadow-md border"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
      </motion.div>
      
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          size="sm"
          variant="outline"
          onClick={onFitBounds}
          className="bg-white/90 backdrop-blur-sm shadow-md border"
          title="Fit all locations"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </motion.div>
      
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          size="sm"
          variant="outline"
          onClick={onReset}
          className="bg-white/90 backdrop-blur-sm shadow-md border"
          title="Reset to India view"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
};

// Map Controller Component
const MapController: React.FC<{ 
  locations: any[], 
  onMapReady: (map: any) => void,
  shouldFitBounds: boolean,
  onFitComplete: () => void 
}> = ({ locations, onMapReady, shouldFitBounds, onFitComplete }) => {
  const map = useMap();
  
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);

  useEffect(() => {
    if (shouldFitBounds && locations.length > 1) {
      const bounds = locations.map(loc => [loc.lat, loc.lng] as [number, number]);
      map.fitBounds(bounds, { padding: [20, 20] });
      onFitComplete();
    }
  }, [shouldFitBounds, locations, map, onFitComplete]);

  return null;
};

interface MapViewProps {
  className?: string;
}

export const MapView: React.FC<MapViewProps> = ({ className }) => {
  const { locations, currentRoute } = useRoutingStore();
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [shouldFitBounds, setShouldFitBounds] = useState(false);

  // Default center for India (New Delhi)
  const defaultCenter: [number, number] = [20.5937, 78.9629]; // Center of India
  
  const center: [number, number] = locations.length > 0 
    ? [locations[0].lat, locations[0].lng]
    : defaultCenter;

  // Create route path from current route
  const routePath = currentRoute && currentRoute.waypoints
    ? currentRoute.waypoints.map(wp => [wp.lat, wp.lng] as [number, number])
    : [];

  const handleZoomIn = () => {
    if (mapInstance) {
      mapInstance.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstance) {
      mapInstance.zoomOut();
    }
  };

  const handleReset = () => {
    if (mapInstance) {
      mapInstance.setView(defaultCenter, 5);
    }
  };

  const handleFitBounds = () => {
    setShouldFitBounds(true);
  };

  const handleFitComplete = () => {
    setShouldFitBounds(false);
  };

  return (
    <div className={`relative h-full w-full rounded-xl overflow-hidden ${className || ''}`}>
      {/* Enhanced Map Container with India-specific styling */}
      <motion.div 
        className="h-full w-full"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <MapContainer
          center={center}
          zoom={5}
          className="h-full w-full"
          zoomControl={false}
        >
          <MapController 
            locations={locations}
            onMapReady={setMapInstance}
            shouldFitBounds={shouldFitBounds}
            onFitComplete={handleFitComplete}
          />
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Markers for each location */}
          {locations.map((location, index) => (
            <Marker 
              key={location.id} 
              position={[location.lat, location.lng]}
            >
              <Popup>
                <div className="text-center">
                  <div className="font-semibold text-blue-600">Stop {index + 1}</div>
                  <div className="text-sm">{location.address}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Route line */}
          {routePath.length > 1 && (
            <Polyline 
              positions={routePath} 
              color="#3b82f6"
              weight={4}
              opacity={0.8}
              dashArray="10, 5"
            />
          )}
        </MapContainer>
      </motion.div>

      {/* Custom Map Controls */}
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        onFitBounds={handleFitBounds}
      />

      {/* Map Status Indicator */}
      <motion.div 
        className="absolute bottom-4 left-4 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md border text-xs">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${locations.length > 0 ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-gray-700">
              {locations.length === 0 ? 'No locations added' : 
               locations.length === 1 ? '1 location' : 
               `${locations.length} locations`}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
