export interface Location {
  id: string;
  lat: number;
  lng: number;
  address?: string;
  serviceTime?: number; // in minutes
  demand?: number;
}

export interface Vehicle {
  id: string;
  capacity: number;
  speedKmh: number;
  type: 'van' | 'truck' | 'bike';
}

export interface Constraints {
  minimize: 'time' | 'distance';
  capacity: number;
  maxTravelTime: number;
  vehicleCount?: number;
  // Fleet optimization parameters
  vehicle_capacity?: number;
  max_travel_time?: number;
  max_vehicles?: number;
  fuel_cost_per_km?: number;
  driver_cost_per_day?: number;
  maintenance_per_km?: number;
}

export interface RouteResult {
  algorithm: string;
  route: string[];
  waypoints: Location[];
  totalDistanceKm: number;
  estimatedTimeMin: number;
  vehicleCount: number;
  stats: {
    iterations: number;
    acceptanceRate?: number;
    populationSize?: number;
    durationMs: number;
  };
  constraintSatisfaction: {
    capacity: boolean;
    maxTravelTime: boolean;
  };
}

export interface ComparisonResult {
  results: RouteResult[];
  best: {
    algorithm: string;
    distance: number;
  };
}

export type AlgorithmType = 'classical' | 'sqa' | 'qiea' | 'qaoa';

export interface OptimizeRequest {
  locations: Location[];
  constraints: Constraints;
  algorithm: AlgorithmType;
  options?: {
    iterations?: number;
    seed?: number;
    populationSize?: number;
    temperature?: number;
  };
}

export interface StreamUpdate {
  progress: number;
  currentBest?: RouteResult;
  message?: string;
}
