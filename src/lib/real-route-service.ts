import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

export interface RoutingWaypoint {
  lat: number;
  lng: number;
  name?: string;
}

export interface RealRouteResult {
  coordinates: [number, number][];
  distance: number; // in meters
  time: number; // in seconds
  instructions: string[];
  waypoints: RoutingWaypoint[];
}

export class RealRouteService {
  private static instance: RealRouteService;
  
  private constructor() {}

  static getInstance(): RealRouteService {
    if (!RealRouteService.instance) {
      RealRouteService.instance = new RealRouteService();
    }
    return RealRouteService.instance;
  }

  /**
   * Get real road route between waypoints using OSRM routing service
   */
  async getRealRoute(waypoints: RoutingWaypoint[]): Promise<RealRouteResult | null> {
    if (waypoints.length < 2) {
      throw new Error('At least 2 waypoints are required for routing');
    }

    try {
      // Use OSRM public API for routing
      const coordString = waypoints.map(wp => `${wp.lng},${wp.lat}`).join(';');
      const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson&steps=true`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Routing API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.routes || data.routes.length === 0) {
        throw new Error('No route found');
      }

      const route = data.routes[0];
      const geometry = route.geometry.coordinates;
      
      // Convert coordinates from [lng, lat] to [lat, lng] for Leaflet
      const routeCoordinates: [number, number][] = geometry.map((coord: [number, number]) => [coord[1], coord[0]]);
      
      // Extract turn-by-turn instructions
      const instructions: string[] = [];
      if (route.legs) {
        route.legs.forEach((leg: any) => {
          if (leg.steps) {
            leg.steps.forEach((step: any) => {
              if (step.maneuver && step.maneuver.instruction) {
                instructions.push(step.maneuver.instruction);
              }
            });
          }
        });
      }

      return {
        coordinates: routeCoordinates,
        distance: route.distance, // meters
        time: route.duration, // seconds
        instructions,
        waypoints
      };
    } catch (error) {
      console.error('Real routing failed:', error);
      
      // Fallback to straight line routing
      return this.getFallbackRoute(waypoints);
    }
  }

  /**
   * Fallback to straight line routing if real routing fails
   */
  private getFallbackRoute(waypoints: RoutingWaypoint[]): RealRouteResult {
    const coordinates: [number, number][] = waypoints.map(wp => [wp.lat, wp.lng]);
    
    // Calculate approximate distance using Haversine formula
    let totalDistance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const distance = this.calculateHaversineDistance(
        waypoints[i].lat, waypoints[i].lng,
        waypoints[i + 1].lat, waypoints[i + 1].lng
      );
      totalDistance += distance;
    }

    // Estimate time based on average speed (50 km/h in urban areas)
    const averageSpeedKmh = 50;
    const timeSeconds = (totalDistance / 1000) * (3600 / averageSpeedKmh);

    return {
      coordinates,
      distance: totalDistance,
      time: timeSeconds,
      instructions: ['Fallback: Direct route used due to routing service unavailability'],
      waypoints
    };
  }

  /**
   * Calculate Haversine distance between two points
   */
  private calculateHaversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  /**
   * Get route between multiple waypoints (multi-segment route)
   */
  async getMultiSegmentRoute(waypoints: RoutingWaypoint[]): Promise<{
    segments: RealRouteResult[];
    totalDistance: number;
    totalTime: number;
    fullCoordinates: [number, number][];
  }> {
    const segments: RealRouteResult[] = [];
    let totalDistance = 0;
    let totalTime = 0;
    const fullCoordinates: [number, number][] = [];

    // Get route for each segment
    for (let i = 0; i < waypoints.length - 1; i++) {
      const segmentWaypoints = [waypoints[i], waypoints[i + 1]];
      const segmentRoute = await this.getRealRoute(segmentWaypoints);
      
      if (segmentRoute) {
        segments.push(segmentRoute);
        totalDistance += segmentRoute.distance;
        totalTime += segmentRoute.time;
        
        // Add coordinates (avoid duplicating waypoints)
        if (i === 0) {
          fullCoordinates.push(...segmentRoute.coordinates);
        } else {
          // Skip first coordinate as it's the same as the last coordinate of previous segment
          fullCoordinates.push(...segmentRoute.coordinates.slice(1));
        }
      }
    }

    return {
      segments,
      totalDistance,
      totalTime,
      fullCoordinates
    };
  }
}

export const realRouteService = RealRouteService.getInstance();
