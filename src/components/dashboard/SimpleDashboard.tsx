import React from 'react';
import { Clock, Route, MapPin } from 'lucide-react';
import { Card } from '../ui/card';
import { useRoutingStore } from '../../lib/store';

export const SimpleDashboard: React.FC = () => {
  const { locations, currentRoute } = useRoutingStore();

  if (locations.length === 0) {
    return (
      <div className="p-6 h-full">
        <div className="text-center py-12">
          <Route className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">No Route Yet</h3>
          <p className="text-sm text-gray-400">
            Add locations on the left to see your optimized route here
          </p>
        </div>
      </div>
    );
  }

  if (!currentRoute) {
    return (
      <div className="p-6 h-full">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Route Results</h2>
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">Ready to Optimize</h3>
          <p className="text-sm text-gray-400">
            Click "Find Best Route" to see the optimized path
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Route Results</h2>
      
      {/* Route Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="p-4 bg-blue-50">
          <div className="flex items-center gap-3">
            <Route className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-sm text-gray-600">Total Distance</div>
              <div className="text-lg font-semibold text-gray-900">
                {currentRoute.totalDistanceKm?.toFixed(1) || 'N/A'} km
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-green-50">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-sm text-gray-600">Est. Time</div>
              <div className="text-lg font-semibold text-gray-900">
                {currentRoute.estimatedTimeMin ? `${Math.round(currentRoute.estimatedTimeMin)} min` : 'N/A'}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Route Order */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Optimized Route</h3>
        <div className="space-y-3">
          {currentRoute.route?.map((locationId, index) => {
            const location = locations.find(loc => loc.id === locationId);
            if (!location) return null;
            
            return (
              <div key={locationId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white text-sm font-medium rounded-full">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{location.address}</div>
                </div>
                {index < currentRoute.route.length - 1 && (
                  <div className="text-gray-400">→</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Algorithm Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Algorithm Used</h4>
        <p className="text-sm text-gray-600">
          {currentRoute.algorithm || 'Classical Optimization'} - 
          Fast and efficient route calculation
        </p>
      </div>
    </div>
  );
};
