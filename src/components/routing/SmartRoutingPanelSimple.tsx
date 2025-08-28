import React from 'react';
import { Play, MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import { LocationInput } from './LocationInputSimple';
import { useRoutingStore } from '../../lib/store';
import { apiClient } from '../../lib/api-client';

export const SmartRoutingPanelSimple: React.FC = () => {
  const {
    locations,
    isOptimizing,
    setIsOptimizing,
    setCurrentRoute,
  } = useRoutingStore();

  const [progress, setProgress] = React.useState(0);

  const handleOptimize = async () => {
    if (locations.length < 2) return;

    setIsOptimizing(true);
    setProgress(0);
    
    // Simple progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 15, 95));
    }, 200);

    try {
      const result = await apiClient.mockOptimize({
        locations,
        constraints: { 
          minimize: 'distance', 
          capacity: 10, 
          maxTravelTime: 480 
        },
        algorithm: 'classical',
      });
      setProgress(100);
      setCurrentRoute(result);
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsOptimizing(false);
        setProgress(0);
      }, 500);
    }
  };

  const canOptimize = locations.length >= 2 && !isOptimizing;

  return (
    <div className="p-6 h-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Plan Your Route
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          Add locations and find the shortest path
        </p>
      </div>

      {/* Location Input */}
      <div className="mb-6">
        <LocationInput />
      </div>

      {/* Progress Bar */}
      {isOptimizing && (
        <div className="mb-6">
          <div className="mb-2 text-sm font-medium text-gray-700">
            Finding best route...
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {Math.round(progress)}% complete
          </div>
        </div>
      )}
      
      {/* Optimize Button */}
      <Button 
        onClick={handleOptimize}
        disabled={!canOptimize}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base"
        size="lg"
      >
        <Play className="w-4 h-4 mr-2" />
        {isOptimizing ? 'Optimizing...' : 'Find Best Route'}
      </Button>

      {/* Status */}
      <div className="mt-4 text-center text-sm text-gray-500">
        {locations.length === 0 && "Add at least 2 locations to start"}
        {locations.length === 1 && "Add 1 more location to optimize"}
        {locations.length >= 2 && !isOptimizing && `Ready to optimize ${locations.length} locations!`}
      </div>
    </div>
  );
};
