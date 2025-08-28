import { create } from 'zustand';
import type { Location, RouteResult, AlgorithmType, Constraints } from '../types/routing';

interface RoutingState {
  locations: Location[];
  constraints: Constraints;
  selectedAlgorithm: AlgorithmType;
  currentRoute: RouteResult | null;
  comparisonResults: RouteResult[];
  isOptimizing: boolean;
  isComparing: boolean;
  theme: 'light' | 'dark';
  
  // Actions
  addLocation: (location: Location) => void;
  removeLocation: (id: string) => void;
  updateLocation: (id: string, location: Partial<Location>) => void;
  reorderLocations: (fromIndex: number, toIndex: number) => void;
  
  setConstraints: (constraints: Partial<Constraints>) => void;
  setSelectedAlgorithm: (algorithm: AlgorithmType) => void;
  setCurrentRoute: (route: RouteResult | null) => void;
  setComparisonResults: (results: RouteResult[]) => void;
  setIsOptimizing: (optimizing: boolean) => void;
  setIsComparing: (comparing: boolean) => void;
  toggleTheme: () => void;
}

export const useRoutingStore = create<RoutingState>((set) => ({
  locations: [],
  constraints: {
    minimize: 'time',
    capacity: 100,
    maxTravelTime: 480, // 8 hours
    // Fleet optimization defaults
    vehicle_capacity: 20,
    max_travel_time: 480,
    max_vehicles: 10,
    fuel_cost_per_km: 8.5,
    driver_cost_per_day: 800,
    maintenance_per_km: 2.0,
  },
  selectedAlgorithm: 'classical',
  currentRoute: null,
  comparisonResults: [],
  isOptimizing: false,
  isComparing: false,
  theme: 'light',

  addLocation: (location) =>
    set((state) => ({
      locations: [...state.locations, location],
    })),

  removeLocation: (id) =>
    set((state) => ({
      locations: state.locations.filter((loc) => loc.id !== id),
    })),

  updateLocation: (id, updates) =>
    set((state) => ({
      locations: state.locations.map((loc) =>
        loc.id === id ? { ...loc, ...updates } : loc
      ),
    })),

  reorderLocations: (fromIndex, toIndex) =>
    set((state) => {
      const newLocations = [...state.locations];
      const [removed] = newLocations.splice(fromIndex, 1);
      newLocations.splice(toIndex, 0, removed);
      return { locations: newLocations };
    }),

  setConstraints: (constraints) =>
    set((state) => ({
      constraints: { ...state.constraints, ...constraints },
    })),

  setSelectedAlgorithm: (algorithm) =>
    set(() => ({ selectedAlgorithm: algorithm })),

  setCurrentRoute: (route) =>
    set(() => ({ currentRoute: route })),

  setComparisonResults: (results) =>
    set(() => ({ comparisonResults: results })),

  setIsOptimizing: (optimizing) =>
    set(() => ({ isOptimizing: optimizing })),

  setIsComparing: (comparing) =>
    set(() => ({ isComparing: comparing })),

  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    })),
}));
