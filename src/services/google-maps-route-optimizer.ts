/**
 * Google Maps Route Optimization Service
 * ======================================
 * 
 * Frontend service that integrates with the Python backend to provide
 * real Google Maps route optimization using multiple quantum-inspired algorithms.
 * 
 * Features:
 * - Classical, Simulated Annealing, QIEA, QAOA algorithms
 * - Real road distances via Google Maps API
 * - Complete route polylines for visualization
 * - Detailed performance metrics and comparisons
 * 
 * Author: Quantum Route Optimizer Frontend v2.0
 * Date: August 28, 2025
 */

export interface DeliveryStop {
  id: string;
  lat: number;
  lng: number;
  service_time_minutes?: number;
  time_window?: {
    start?: string;
    end?: string;
  };
}

export interface Depot {
  lat: number;
  lng: number;
}

export interface Constraints {
  vehicle_capacity?: number;
  max_travel_time?: number;
  fleet_size?: number;
  time_windows?: boolean;
}

export interface OptimizationRequest {
  stops: DeliveryStop[];
  depot?: Depot;
  constraints?: Constraints;
  routing_profile: 'driving' | 'driving-traffic';
  algorithms: string[];
  random_seed?: number;
  google_api_key: string;
}

export interface AlgorithmResult {
  route_order: string[];
  polyline: string;
  distance_km: number;
  time_min: number;
  objective_value: number;
  iterations_log: Array<{
    iter: number;
    objective: number;
    [key: string]: any;
  }>;
  seed: number;
  algorithm_params: Record<string, any>;
}

export interface OptimizationResponse {
  algorithmResults: Record<string, AlgorithmResult>;
  distanceMatrixSource: string;
  timestamp: string;
  api_version: string;
  debug: {
    warnings: string[];
    errors: string[];
    matrix_size?: number;
    total_stops?: number;
  };
}

export class GoogleMapsRouteOptimizationService {
  private readonly baseUrl: string;
  private readonly defaultApiKey: string;

  constructor(baseUrl: string = 'http://localhost:8000', defaultApiKey?: string) {
    this.baseUrl = baseUrl;
    this.defaultApiKey = defaultApiKey || 'AIzaSyBKscC204ykApm_eDhLxcVkcCSw3Vh7qHs';
  }

  /**
   * Optimize routes using multiple quantum-inspired algorithms
   */
  async optimizeRoutes(request: OptimizationRequest): Promise<OptimizationResponse> {
    try {
      // Use provided API key or default
      const requestWithKey = {
        ...request,
        google_api_key: request.google_api_key || this.defaultApiKey
      };

      const response = await fetch(`${this.baseUrl}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestWithKey)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(`Optimization failed: ${errorData.detail || response.statusText}`);
      }

      const result = await response.json();
      return result as OptimizationResponse;

    } catch (error) {
      console.error('Route optimization error:', error);
      throw error;
    }
  }

  /**
   * Get available algorithms and their information
   */
  async getAlgorithms(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/algorithms`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch algorithms: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get algorithms:', error);
      throw error;
    }
  }

  /**
   * Health check for the backend service
   */
  async healthCheck(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  /**
   * Create sample delivery stops for testing
   */
  createSampleStops(count: number = 5): DeliveryStop[] {
    const sampleLocations = [
      { lat: 37.7749, lng: -122.4194, name: 'San Francisco' },
      { lat: 37.7849, lng: -122.4094, name: 'North Beach' },
      { lat: 37.7649, lng: -122.4094, name: 'Mission District' },
      { lat: 37.7849, lng: -122.4294, name: 'Richmond' },
      { lat: 37.7549, lng: -122.4194, name: 'Potrero Hill' },
      { lat: 37.7949, lng: -122.4194, name: 'Pacific Heights' },
      { lat: 37.7749, lng: -122.3994, name: 'SOMA' },
      { lat: 37.7649, lng: -122.4394, name: 'Sunset' },
    ];

    return sampleLocations.slice(0, count).map((location, index) => ({
      id: `stop_${index + 1}`,
      lat: location.lat,
      lng: location.lng,
      service_time_minutes: Math.floor(Math.random() * 30) + 10 // 10-40 minutes
    }));
  }

  /**
   * Convert route result to Leaflet polyline format
   */
  decodePolyline(encoded: string): [number, number][] {
    if (!encoded) return [];

    const poly: [number, number][] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      poly.push([lat / 1e5, lng / 1e5]);
    }

    return poly;
  }

  /**
   * Get algorithm display colors for visualization
   */
  getAlgorithmColors(): Record<string, string> {
    return {
      classical: '#4cc3ff',    // Deep blue
      simulated: '#7d4dff',    // Purple
      qiea: '#00f7ff',         // Cyan
      qaoa: '#00ffff'          // Bright cyan
    };
  }

  /**
   * Format optimization results for display
   */
  formatResults(response: OptimizationResponse): string {
    const results = [];
    
    results.push(`📊 **Optimization Results (${response.api_version})**`);
    results.push(`🕒 Timestamp: ${new Date(response.timestamp).toLocaleString()}`);
    results.push(`📍 Data Source: ${response.distanceMatrixSource}`);
    results.push('');

    Object.entries(response.algorithmResults).forEach(([algorithm, result]) => {
      if ('error' in result) {
        results.push(`❌ **${algorithm.toUpperCase()}**: Error - ${result.error}`);
      } else {
        const algorithmResult = result as AlgorithmResult;
        results.push(`🚀 **${algorithm.toUpperCase()}**:`);
        results.push(`   📏 Distance: ${algorithmResult.distance_km.toFixed(2)} km`);
        results.push(`   ⏱️ Time: ${algorithmResult.time_min.toFixed(1)} minutes`);
        results.push(`   🎯 Objective: ${algorithmResult.objective_value.toFixed(2)}`);
        results.push(`   🔄 Iterations: ${algorithmResult.iterations_log.length}`);
        results.push(`   🎲 Seed: ${algorithmResult.seed}`);
        results.push('');
      }
    });

    if (response.debug.warnings.length > 0) {
      results.push('⚠️ **Warnings:**');
      response.debug.warnings.forEach(warning => results.push(`   • ${warning}`));
    }

    if (response.debug.errors.length > 0) {
      results.push('🚫 **Errors:**');
      response.debug.errors.forEach(error => results.push(`   • ${error}`));
    }

    return results.join('\n');
  }

  /**
   * Compare algorithm performance
   */
  compareAlgorithms(response: OptimizationResponse): any {
    const comparison = {
      best_distance: { algorithm: '', value: Infinity },
      best_time: { algorithm: '', value: Infinity },
      fastest_execution: { algorithm: '', iterations: Infinity },
      summary: {} as Record<string, any>
    };

    Object.entries(response.algorithmResults).forEach(([algorithm, result]) => {
      if ('error' in result) return;
      
      const algorithmResult = result as AlgorithmResult;
      
      // Track best distance
      if (algorithmResult.distance_km < comparison.best_distance.value) {
        comparison.best_distance = { algorithm, value: algorithmResult.distance_km };
      }
      
      // Track best time
      if (algorithmResult.time_min < comparison.best_time.value) {
        comparison.best_time = { algorithm, value: algorithmResult.time_min };
      }
      
      // Track fastest execution
      const iterations = algorithmResult.iterations_log.length;
      if (iterations < comparison.fastest_execution.iterations && iterations > 0) {
        comparison.fastest_execution = { algorithm, iterations };
      }
      
      // Summary data
      comparison.summary[algorithm] = {
        distance_km: algorithmResult.distance_km,
        time_min: algorithmResult.time_min,
        objective_value: algorithmResult.objective_value,
        iterations: iterations,
        efficiency: algorithmResult.distance_km / (algorithmResult.time_min || 1)
      };
    });

    return comparison;
  }
}
