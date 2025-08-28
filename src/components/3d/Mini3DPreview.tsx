import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Line, Sphere, Text, OrbitControls } from '@react-three/drei';
import { useRoutingStore } from '../../lib/store';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { RotateCcw, ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';

// Enhanced 3D Route Visualization Component - Fixed automatic scaling issue
const Route3D: React.FC<{ 
  locations: any[], 
  route: string[], 
  scale: number,
  showLabels: boolean 
}> = ({ locations, route, scale, showLabels }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // REMOVED auto-rotation to prevent automatic increasing/scaling
  // This was the main cause of the "increasing automatically" issue

  if (!locations.length || !route.length) return null;

  const locationMap = Object.fromEntries(locations.map((loc: any) => [loc.id, loc]));
  const routePoints = route.map(id => locationMap[id]).filter(Boolean);

  // Fixed coordinate conversion - no more random elements
  const to3D = (lat: number, lng: number) => {
    // Simple, predictable scaling around India's center
    const x = ((lng - 78) / 30) * scale * 2; // Center on India longitude (78°E)
    const z = ((lat - 20) / 30) * scale * 2; // Center on India latitude (20°N)
    const y = 0; // Fixed height - no randomness
    return new THREE.Vector3(x, y, z);
  };

  const points = routePoints.map((loc: any) => to3D(loc.lat, loc.lng));

  return (
    <group ref={groupRef}>
      {/* Route Lines */}
      <Line
        points={points}
        color="#3b82f6"
        lineWidth={3}
        dashed={false}
      />
      
      {/* Location Spheres */}
      {routePoints.map((location: any, index: number) => {
        const pos = to3D(location.lat, location.lng);
        const isStart = index === 0;
        const isEnd = index === routePoints.length - 1;
        
        return (
          <group key={location.id} position={pos}>
            <Sphere
              args={[0.3 * scale, 16, 16]}
              position={[0, 0, 0]}
            >
              <meshStandardMaterial 
                color={isStart ? '#22c55e' : isEnd ? '#ef4444' : '#3b82f6'}
                emissive={isStart ? '#22c55e' : isEnd ? '#ef4444' : '#3b82f6'}
                emissiveIntensity={0.2}
              />
            </Sphere>
            
            {/* Location Labels */}
            {showLabels && (
              <Text
                position={[0, 0.8 * scale, 0]}
                fontSize={0.4 * scale}
                color="#1f2937"
                anchorX="center"
                anchorY="middle"
              >
                {location.address.split(',')[0]}
              </Text>
            )}
            
            {/* Route Order Numbers */}
            <Text
              position={[0, 0, 0]}
              fontSize={0.3 * scale}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {index + 1}
            </Text>
          </group>
        );
      })}
      
      {/* Connecting Lines with Animation */}
      {points.slice(0, -1).map((point, index) => (
        <Line
          key={index}
          points={[point, points[index + 1]]}
          color="#6366f1"
          lineWidth={2}
          dashed={true}
        />
      ))}
    </group>
  );
};

// Enhanced Camera Controller
const CameraController: React.FC<{ 
  zoomLevel: number, 
  resetTrigger: number 
}> = ({ zoomLevel, resetTrigger }) => {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(5 * zoomLevel, 5 * zoomLevel, 5 * zoomLevel);
    camera.lookAt(0, 0, 0);
  }, [camera, zoomLevel, resetTrigger]);
  
  return null;
};

// 3D Route Visualization Component
const RouteVisualization: React.FC = () => {
  const { locations, currentRoute } = useRoutingStore();
  const routeRef = useRef<THREE.Group>(null);

  // Convert lat/lng to 3D coordinates (simplified projection)
  const projectTo3D = (lat: number, lng: number, elevation = 0) => {
    const scale = 0.1;
    return [lng * scale, elevation, -lat * scale] as [number, number, number];
  };

  // Create route path points
  const routePoints = useMemo(() => {
    if (!currentRoute || currentRoute.waypoints.length < 2) return [];
    
    return currentRoute.waypoints.map(wp => 
      new THREE.Vector3(...projectTo3D(wp.lat, wp.lng, 0.1))
    );
  }, [currentRoute]);

  // Animate route flow
  useFrame(() => {
    if (routeRef.current && routePoints.length > 0) {
      // Animation logic would go here
      // const t = (clock.elapsedTime * 0.5) % 1;
      // Could animate particles or other elements along the route
    }
  });

  if (locations.length === 0) {
    return null;
  }

  return (
    <group ref={routeRef}>
      {/* Location markers */}
      {locations.map((location, index) => {
        const position = projectTo3D(location.lat, location.lng, 0);
        return (
          <group key={location.id} position={position}>
            <Sphere args={[0.05]} position={[0, 0, 0]}>
              <meshStandardMaterial color={index === 0 ? "#10b981" : "#3b82f6"} />
            </Sphere>
            <Text
              position={[0, 0.15, 0]}
              fontSize={0.08}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {index === 0 ? 'START' : `${index}`}
            </Text>
          </group>
        );
      })}

      {/* Route lines */}
      {routePoints.length > 1 && (
        <Line
          points={routePoints}
          color="#3b82f6"
          lineWidth={3}
        />
      )}

      {/* Animated route flow (particles) */}
      {routePoints.length > 1 && (
        <AnimatedRouteFlow points={routePoints} />
      )}
    </group>
  );
};

// Animated particles along route
const AnimatedRouteFlow: React.FC<{ points: THREE.Vector3[] }> = ({ points }) => {
  const particlesRef = useRef<THREE.Group>(null);
  const particleCount = 5;

  useFrame(({ clock }) => {
    if (!particlesRef.current) return;

    const time = clock.elapsedTime;
    particlesRef.current.children.forEach((particle, index) => {
      const offset = (index / particleCount) * 0.2;
      const t = ((time * 0.3 + offset) % 1);
      
      if (points.length > 1) {
        const segmentIndex = Math.floor(t * (points.length - 1));
        const localT = (t * (points.length - 1)) % 1;
        
        if (segmentIndex < points.length - 1) {
          const start = points[segmentIndex];
          const end = points[segmentIndex + 1];
          
          particle.position.lerpVectors(start, end, localT);
        }
      }
    });
  });

  return (
    <group ref={particlesRef}>
      {Array.from({ length: particleCount }, (_, i) => (
        <Sphere key={i} args={[0.02]}>
          <meshStandardMaterial 
            color="#fbbf24" 
            emissive="#fbbf24" 
            emissiveIntensity={0.3}
          />
        </Sphere>
      ))}
    </group>
  );
};

const ControlButton: React.FC<{ 
  icon: React.ReactNode; 
  onClick: () => void; 
  label: string;
  isActive?: boolean;
}> = ({ icon, onClick, label, isActive = false }) => (
  <button
    onClick={onClick}
    className={`
      p-2 backdrop-blur-sm rounded-lg shadow-lg border transition-all duration-200 hover:scale-105
      ${isActive 
        ? 'bg-blue-500/20 border-blue-400/50 text-blue-400' 
        : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20 hover:border-white/40'
      }
    `}
    title={label}
  >
    {icon}
  </button>
);

export const Mini3DPreview: React.FC = () => {
  const { locations, currentRoute } = useRoutingStore();
  const [scale, setScale] = useState([1]);
  const [zoomLevel, setZoomLevel] = useState([1]);
  const [showLabels, setShowLabels] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);

  const route = currentRoute?.route || [];
  const scaleValue = scale[0];
  const zoomValue = zoomLevel[0];

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const resetView = () => {
    setScale([1]);
    setZoomLevel([1]);
    setResetTrigger(prev => prev + 1);
  };

  const containerClass = isFullscreen 
    ? "fixed inset-0 z-50 bg-white dark:bg-gray-900 p-4" 
    : "relative";

  const cardClass = isFullscreen 
    ? "w-full h-full bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-800 dark:to-gray-900 border-0 shadow-xl overflow-hidden"
    : "h-96 bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-800 dark:to-gray-900 border-0 shadow-xl overflow-hidden";

  return (
    <motion.div 
      className={containerClass}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        transition: { duration: isFullscreen ? 0.3 : 0.5 }
      }}
      layout
    >
      <motion.div
        className={cardClass}
        layout
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        
        {/* Header Controls */}
        <div className={`absolute top-4 left-4 right-4 z-10 flex justify-between items-center ${isFullscreen ? 'p-2 bg-black/20 rounded-lg backdrop-blur-sm' : ''}`}>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm">
              🌌 3D Route Visualization
            </Badge>
            {locations.length > 0 && (
              <Badge variant="outline" className="bg-white/60 backdrop-blur-sm">
                {locations.length} locations
              </Badge>
            )}
            {isFullscreen && (
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                🖥️ Fullscreen Mode - Press ESC to exit
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLabels(!showLabels)}
              className={`bg-white/60 backdrop-blur-sm hover:bg-white/80 ${isFullscreen ? 'text-white hover:text-black' : ''}`}
            >
              🏷️ {showLabels ? 'Hide' : 'Show'} Labels
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetView}
              className={`bg-white/60 backdrop-blur-sm hover:bg-white/80 ${isFullscreen ? 'text-white hover:text-black' : ''}`}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size={isFullscreen ? "lg" : "sm"}
              onClick={toggleFullscreen}
              className={`bg-white/60 backdrop-blur-sm hover:bg-white/80 ${isFullscreen ? 'text-white hover:text-black px-4 py-2' : ''}`}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-4 h-4" />}
              {isFullscreen && <span className="ml-2">Exit Fullscreen</span>}
            </Button>
          </div>
        </div>

        {/* 3D Canvas */}
        <div className={`w-full ${isFullscreen ? 'h-full' : 'h-full'}`}>
          <Canvas
            camera={{ position: [5, 5, 5], fov: 50 }}
            className="bg-gradient-to-b from-blue-100 to-indigo-200 dark:from-gray-700 dark:to-gray-800"
            style={{ width: '100%', height: '100%' }}
          >
            <CameraController zoomLevel={zoomValue} resetTrigger={resetTrigger} />
            
            {/* Enhanced Lighting */}
            <ambientLight intensity={0.6} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4338ca" />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            
            {/* Interactive Controls */}
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              autoRotate={!isFullscreen}
              autoRotateSpeed={1}
            />
            
            {/* 3D Route */}
            <Route3D 
              locations={locations} 
              route={route} 
              scale={scaleValue}
              showLabels={showLabels}
            />
            
            {/* Grid Helper */}
            <gridHelper 
              args={[20 * scaleValue, 20, '#e5e7eb', '#f3f4f6']} 
              position={[0, -1, 0]} 
            />
          </Canvas>
        </div>

        {/* Bottom Controls */}
        <div className={`absolute bottom-4 left-4 right-4 z-10 ${isFullscreen ? 'bottom-8' : ''}`}>
          <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 space-y-3 ${isFullscreen ? 'max-w-md mx-auto' : ''}`}>
            
            {/* Scale Control */}
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium min-w-16 ${isFullscreen ? 'text-gray-800 dark:text-gray-200' : ''}`}>📏 Scale:</span>
              <Slider
                value={scale}
                onValueChange={setScale}
                min={0.5}
                max={3}
                step={0.1}
                className="flex-1"
              />
              <span className={`text-sm text-gray-600 min-w-12 ${isFullscreen ? 'text-gray-800 dark:text-gray-200' : ''}`}>{scaleValue.toFixed(1)}x</span>
            </div>

            {/* Zoom Control */}
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium min-w-16 ${isFullscreen ? 'text-gray-800 dark:text-gray-200' : ''}`}>🔍 Zoom:</span>
              <Slider
                value={zoomLevel}
                onValueChange={setZoomLevel}
                min={0.5}
                max={2}
                step={0.1}
                className="flex-1"
              />
              <span className={`text-sm text-gray-600 min-w-12 ${isFullscreen ? 'text-gray-800 dark:text-gray-200' : ''}`}>{zoomValue.toFixed(1)}x</span>
            </div>

            {/* Quick Actions */}
            <div className="flex justify-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setZoomLevel([Math.max(0.5, zoomValue - 0.2)])}
                className="bg-white/60 hover:bg-white/80"
              >
                <ZoomOut className="w-3 h-3" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setZoomLevel([Math.min(2, zoomValue + 0.2)])}
                className="bg-white/60 hover:bg-white/80"
              >
                <ZoomIn className="w-3 h-3" />
              </Button>
              {isFullscreen && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsFullscreen(false)}
                  className="bg-red-100 hover:bg-red-200 text-red-700 ml-4"
                >
                  <Minimize2 className="w-3 h-3 mr-1" />
                  Exit
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* No Data State */}
        {locations.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-3 p-8">
              <div className="text-6xl">🗺️</div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                No Routes to Display
              </h3>
              <p className="text-sm text-gray-500">
                Add some locations to see the 3D route visualization
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
