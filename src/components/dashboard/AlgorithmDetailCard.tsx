import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import type { RouteResult } from '../../types/routing';

interface AlgorithmDetailCardProps {
  result: RouteResult;
  isSelected?: boolean;
  onClick?: () => void;
}

export const AlgorithmDetailCard: React.FC<AlgorithmDetailCardProps> = ({
  result,
  isSelected = false,
  onClick,
}) => {
  const getAlgorithmDescription = (algorithm: string) => {
    if (algorithm.includes('Classical')) {
      return 'Uses greedy nearest neighbor with 2-OPT improvements. Fast and reliable for small to medium problems.';
    }
    if (algorithm.includes('Simulated Quantum Annealing')) {
      return 'Quantum-inspired optimization using temperature-based acceptance probability for escaping local optima.';
    }
    if (algorithm.includes('Quantum-Inspired Evolutionary')) {
      return 'Population-based approach with quantum-inspired operators for exploration and exploitation balance.';
    }
    if (algorithm.includes('QAOA')) {
      return 'Variational quantum algorithm adaptation using parameterized quantum circuits principles.';
    }
    return 'Advanced optimization algorithm for complex routing problems.';
  };

  const getAlgorithmColor = (algorithm: string) => {
    if (algorithm.includes('Classical')) return 'border-blue-200 bg-blue-50/50';
    if (algorithm.includes('Simulated Quantum Annealing')) return 'border-purple-200 bg-purple-50/50';
    if (algorithm.includes('Quantum-Inspired Evolutionary')) return 'border-green-200 bg-green-50/50';
    if (algorithm.includes('QAOA')) return 'border-orange-200 bg-orange-50/50';
    return 'border-gray-200 bg-gray-50/50';
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      } ${getAlgorithmColor(result.algorithm)}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{result.algorithm}</CardTitle>
        <CardDescription className="text-sm">
          {getAlgorithmDescription(result.algorithm)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">
              {result.totalDistanceKm.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">km</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {Math.floor(result.estimatedTimeMin / 60)}:{String(Math.floor(result.estimatedTimeMin % 60)).padStart(2, '0')}
            </div>
            <div className="text-xs text-muted-foreground">hours</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {result.vehicleCount}
            </div>
            <div className="text-xs text-muted-foreground">vehicles</div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Iterations:</span>
            <span className="font-medium">{result.stats.iterations}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Computation:</span>
            <span className="font-medium">{result.stats.durationMs}ms</span>
          </div>
          {result.stats.acceptanceRate && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Acceptance:</span>
              <span className="font-medium">
                {(result.stats.acceptanceRate * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {/* Constraint Satisfaction */}
        <div className="flex gap-2 pt-2 border-t">
          <div className={`flex-1 text-center py-1 px-2 rounded text-xs font-medium ${
            result.constraintSatisfaction.capacity
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {result.constraintSatisfaction.capacity ? '✓' : '✗'} Capacity
          </div>
          <div className={`flex-1 text-center py-1 px-2 rounded text-xs font-medium ${
            result.constraintSatisfaction.maxTravelTime
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {result.constraintSatisfaction.maxTravelTime ? '✓' : '✗'} Time
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
