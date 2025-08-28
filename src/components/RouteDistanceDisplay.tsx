import React from 'react';
import { Route, MapPin, Clock, Truck } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { calculateDistance } from '../lib/geocoding';
import type { Location } from '../types/routing';

interface RouteDistanceDisplayProps {
  locations: Location[];
}

export const RouteDistanceDisplay: React.FC<RouteDistanceDisplayProps> = ({ locations }) => {
  if (locations.length < 2) return null;

  const calculateTotalDistance = () => {
    let total = 0;
    for (let i = 0; i < locations.length - 1; i++) {
      const current = locations[i];
      const next = locations[i + 1];
      total += calculateDistance(current.lat, current.lng, next.lat, next.lng);
    }
    return total;
  };

  const calculateEstimatedTime = (distance: number) => {
    // Assume average speed of 50 km/h in city + 5 minutes per stop
    const travelTime = (distance / 50) * 60; // minutes
    const serviceTime = locations.length * 5; // 5 minutes per stop
    return travelTime + serviceTime;
  };

  const totalDistance = calculateTotalDistance();
  const estimatedTime = calculateEstimatedTime(totalDistance);

  return (
    <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200 dark:border-green-800">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Route className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-green-900 dark:text-green-100">
            Route Preview
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400">
              <MapPin className="w-3 h-3" />
              <span className="text-xs font-medium">Distance</span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {totalDistance.toFixed(1)} km
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-orange-600 dark:text-orange-400">
              <Clock className="w-3 h-3" />
              <span className="text-xs font-medium">Time</span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {Math.round(estimatedTime)} min
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-purple-600 dark:text-purple-400">
              <Truck className="w-3 h-3" />
              <span className="text-xs font-medium">Stops</span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {locations.length}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            Haversine Formula
          </Badge>
          <span className="text-xs text-muted-foreground">
            Accurate distance calculation
          </span>
        </div>
      </div>
    </Card>
  );
};
