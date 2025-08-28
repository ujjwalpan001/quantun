import React from 'react';
import { Route, Clock, Truck, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useRoutingStore } from '../../lib/store';

export const RouteSummaryCard: React.FC = () => {
  const { currentRoute, locations } = useRoutingStore();

  if (!currentRoute || locations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="w-5 h-5" />
            Route Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Route className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Add locations and optimize to see route summary</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="w-5 h-5" />
          Route Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Algorithm Used */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Algorithm</span>
          <span className="text-sm font-medium">{currentRoute.algorithm}</span>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Route className="w-4 h-4" />
              Distance
            </div>
            <div className="text-lg font-semibold">
              {currentRoute.totalDistanceKm.toFixed(1)} km
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              Time
            </div>
            <div className="text-lg font-semibold">
              {Math.floor(currentRoute.estimatedTimeMin / 60)}h {Math.floor(currentRoute.estimatedTimeMin % 60)}m
            </div>
          </div>
        </div>

        {/* Vehicle Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="w-4 h-4" />
            Vehicles Needed
          </div>
          <span className="text-sm font-medium">{currentRoute.vehicleCount}</span>
        </div>

        {/* Constraints Satisfaction */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Constraints</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              {currentRoute.constraintSatisfaction.capacity ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className={
                currentRoute.constraintSatisfaction.capacity 
                  ? 'text-green-700 dark:text-green-400' 
                  : 'text-red-700 dark:text-red-400'
              }>
                Capacity Constraint
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {currentRoute.constraintSatisfaction.maxTravelTime ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className={
                currentRoute.constraintSatisfaction.maxTravelTime 
                  ? 'text-green-700 dark:text-green-400' 
                  : 'text-red-700 dark:text-red-400'
              }>
                Time Constraint
              </span>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="pt-2 border-t space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Computation Time</span>
            <span>{currentRoute.stats.durationMs}ms</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Iterations</span>
            <span>{currentRoute.stats.iterations}</span>
          </div>
          {currentRoute.stats.acceptanceRate && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Acceptance Rate</span>
              <span>{(currentRoute.stats.acceptanceRate * 100).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
