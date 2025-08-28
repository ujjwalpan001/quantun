/**
 * Google Maps Multi-Algorithm Route Visualization
 * ===============================================
 * 
 * JavaScript snippet for displaying multiple distinct routes from different
 * quantum-inspired algorithms on Google Maps with color-coded polylines.
 * 
 * Each algorithm produces different route characteristics:
 * - Classical (Blue): Shortest distance route using greedy + 2-opt
 * - Simulated Annealing (Green): Time-distance hybrid with exploration
 * - QIEA (Orange): Exploration-focused with diversity bonus
 * - QAOA (Red): Time-focused with path complexity consideration
 */

class QuantumRouteVisualizer {
  constructor(mapElement, apiKey) {
    this.map = null;
    this.directionsService = null;
    this.apiKey = apiKey;
    this.mapElement = mapElement;
    
    // Algorithm-specific styling
    this.algorithmStyles = {
      classical: {
        color: '#3B82F6',        // Blue
        name: 'Classical (2-opt)',
        strategy: 'Shortest Distance',
        strokeWeight: 5,
        strokeOpacity: 0.8,
        dashPattern: []          // Solid line
      },
      simulated: {
        color: '#10B981',        // Green
        name: 'Simulated Annealing',
        strategy: 'Time-Distance Hybrid',
        strokeWeight: 5,
        strokeOpacity: 0.8,
        dashPattern: [10, 5]     // Dashed line
      },
      qiea: {
        color: '#F59E0B',        // Orange
        name: 'Quantum-Inspired Evolutionary',
        strategy: 'Exploration-Focused',
        strokeWeight: 5,
        strokeOpacity: 0.8,
        dashPattern: [15, 10, 5, 10]  // Dash-dot-dash pattern
      },
      qaoa: {
        color: '#EF4444',        // Red
        name: 'Quantum Approximate Optimization',
        strategy: 'Time-Focused',
        strokeWeight: 5,
        strokeOpacity: 0.8,
        dashPattern: [20, 10]    // Long dash pattern
      }
    };

    this.currentRoutes = new Map(); // Store active route renderers
    this.routeVisibility = new Set(['classical', 'simulated', 'qiea', 'qaoa']);
    
    this.initializeMap();
  }

  async initializeMap() {
    // Initialize Google Maps
    this.map = new google.maps.Map(this.mapElement, {
      center: { lat: 37.7749, lng: -122.4194 }, // San Francisco
      zoom: 12,
      mapTypeId: 'roadmap',
      styles: [
        // Dark theme for better route visibility
        { elementType: 'geometry', stylers: [{ color: '#1a1b23' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1b23' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#d0d0d0' }] },
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{ color: '#2a2a3c' }]
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#4dd0e1', lightness: -20 }]
        }
      ]
    });

    this.directionsService = new google.maps.DirectionsService();
    this.createControlPanel();
  }

  /**
   * Main function to display multiple algorithm routes
   * @param {Array} waypoints - Array of {lat, lng} waypoint objects
   * @param {Object} algorithmResults - Results from backend optimization
   */
  async displayMultiAlgorithmRoutes(waypoints, algorithmResults) {
    // Clear existing routes
    this.clearAllRoutes();

    // Process each algorithm's route
    for (const [algorithmName, result] of Object.entries(algorithmResults)) {
      if (result.error) {
        console.warn(`Algorithm ${algorithmName} returned error:`, result.error);
        continue;
      }

      await this.displayAlgorithmRoute(algorithmName, waypoints, result);
    }

    // Adjust map bounds to show all routes
    this.fitMapToRoutes();
  }

  /**
   * Display a single algorithm's route
   */
  async displayAlgorithmRoute(algorithmName, waypoints, result) {
    const style = this.algorithmStyles[algorithmName];
    if (!style) {
      console.warn(`Unknown algorithm: ${algorithmName}`);
      return;
    }

    try {
      // Get the optimized waypoint order
      const orderedWaypoints = this.reorderWaypoints(waypoints, result.route_order);
      
      // Request route from Google Maps Directions API
      const directionsRequest = {
        origin: orderedWaypoints[0],
        destination: orderedWaypoints[orderedWaypoints.length - 1],
        waypoints: orderedWaypoints.slice(1, -1).map(point => ({
          location: point,
          stopover: true
        })),
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false, // We already have the optimized order
        avoidHighways: algorithmName === 'qiea', // QIEA explores alternative paths
        avoidTolls: algorithmName === 'qaoa'     // QAOA focuses on time-efficient routes
      };

      const directionsResponse = await new Promise((resolve, reject) => {
        this.directionsService.route(directionsRequest, (result, status) => {
          if (status === 'OK') {
            resolve(result);
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        });
      });

      // Create custom polyline renderer
      const routeRenderer = this.createCustomPolylineRenderer(
        directionsResponse,
        style,
        result
      );

      // Store the route for management
      this.currentRoutes.set(algorithmName, {
        renderer: routeRenderer,
        result: result,
        directionsResponse: directionsResponse,
        visible: this.routeVisibility.has(algorithmName)
      });

      // Set visibility
      routeRenderer.setMap(this.routeVisibility.has(algorithmName) ? this.map : null);

    } catch (error) {
      console.error(`Failed to display route for ${algorithmName}:`, error);
    }
  }

  /**
   * Create custom polyline renderer with algorithm-specific styling
   */
  createCustomPolylineRenderer(directionsResponse, style, algorithmResult) {
    const route = directionsResponse.routes[0];
    const path = route.overview_path;

    // Create custom polyline with dashed pattern support
    const polyline = new google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: style.color,
      strokeOpacity: style.strokeOpacity,
      strokeWeight: style.strokeWeight,
      icons: this.createDashPattern(style.dashPattern, style.color)
    });

    // Add click listener for route information
    polyline.addListener('click', (event) => {
      this.showRouteInfoWindow(event, style, algorithmResult, route);
    });

    return polyline;
  }

  /**
   * Create dash pattern using repeated symbols
   */
  createDashPattern(dashArray, color) {
    if (!dashArray || dashArray.length === 0) {
      return []; // Solid line
    }

    const icons = [];
    let offset = 0;

    for (let i = 0; i < dashArray.length; i += 2) {
      const dashLength = dashArray[i];
      const gapLength = dashArray[i + 1] || 0;

      // Add dash symbol
      if (dashLength > 0) {
        icons.push({
          icon: {
            path: 'M 0,-1 0,1',
            strokeOpacity: 1,
            strokeColor: color,
            strokeWeight: 3,
            scale: dashLength
          },
          offset: offset + '%',
          repeat: (dashLength + gapLength) + 'px'
        });
      }

      offset += dashLength + gapLength;
    }

    return icons;
  }

  /**
   * Show information window when route is clicked
   */
  showRouteInfoWindow(event, style, algorithmResult, route) {
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="font-family: 'Inter', sans-serif; max-width: 300px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
            <div style="width: 16px; height: 16px; border-radius: 50%; background-color: ${style.color};"></div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1a1b23;">${style.name}</h3>
          </div>
          
          <div style="margin-bottom: 12px; padding: 8px; background-color: #f8f9fa; border-radius: 6px;">
            <div style="font-size: 12px; color: #6b7280; font-weight: 500;">Strategy:</div>
            <div style="font-size: 14px; color: #4dd0e1; font-weight: 600;">${style.strategy}</div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
            <div>
              <div style="font-size: 11px; color: #6b7280;">📏 Distance</div>
              <div style="font-size: 14px; font-weight: 600; color: #1a1b23;">${algorithmResult.distance_km.toFixed(2)} km</div>
            </div>
            <div>
              <div style="font-size: 11px; color: #6b7280;">⏱️ Time</div>
              <div style="font-size: 14px; font-weight: 600; color: #1a1b23;">${algorithmResult.time_min.toFixed(1)} min</div>
            </div>
            <div>
              <div style="font-size: 11px; color: #6b7280;">🎯 Objective</div>
              <div style="font-size: 14px; font-weight: 600; color: #1a1b23;">${algorithmResult.objective_value.toFixed(2)}</div>
            </div>
            <div>
              <div style="font-size: 11px; color: #6b7280;">🔄 Iterations</div>
              <div style="font-size: 14px; font-weight: 600; color: #1a1b23;">${algorithmResult.iterations_log.length}</div>
            </div>
          </div>

          <div style="font-size: 11px; color: #6b7280; line-height: 1.4;">
            <strong>Google Maps Route:</strong> ${route.legs.length} segments, 
            ${route.legs.reduce((sum, leg) => sum + leg.distance.value, 0) / 1000} km total
          </div>
        </div>
      `,
      position: event.latLng
    });

    infoWindow.open(this.map);
  }

  /**
   * Create control panel for route visibility
   */
  createControlPanel() {
    const controlDiv = document.createElement('div');
    controlDiv.style.cssText = `
      background: rgba(26, 27, 35, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid #4dd0e1;
      border-radius: 8px;
      padding: 12px;
      margin: 10px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      font-family: 'Inter', sans-serif;
      max-width: 280px;
    `;

    const title = document.createElement('div');
    title.style.cssText = `
      color: #4dd0e1;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 10px;
    `;
    title.textContent = 'Route Comparison';

    controlDiv.appendChild(title);

    // Create toggle buttons for each algorithm
    Object.entries(this.algorithmStyles).forEach(([algorithmName, style]) => {
      const button = document.createElement('div');
      button.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        margin: 4px 0;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid transparent;
      `;

      const colorIndicator = document.createElement('div');
      colorIndicator.style.cssText = `
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: ${style.color};
      `;

      const label = document.createElement('span');
      label.style.cssText = `
        color: #d0d0d0;
        font-size: 12px;
        font-weight: 500;
        flex-grow: 1;
      `;
      label.textContent = style.name;

      button.appendChild(colorIndicator);
      button.appendChild(label);

      // Toggle functionality
      button.addEventListener('click', () => {
        this.toggleRouteVisibility(algorithmName);
        this.updateControlButton(button, algorithmName);
      });

      // Initial state
      this.updateControlButton(button, algorithmName);

      controlDiv.appendChild(button);
    });

    // Add control to map
    this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(controlDiv);
  }

  /**
   * Toggle route visibility
   */
  toggleRouteVisibility(algorithmName) {
    if (this.routeVisibility.has(algorithmName)) {
      this.routeVisibility.delete(algorithmName);
    } else {
      this.routeVisibility.add(algorithmName);
    }

    // Update route visibility on map
    const routeData = this.currentRoutes.get(algorithmName);
    if (routeData) {
      routeData.renderer.setMap(
        this.routeVisibility.has(algorithmName) ? this.map : null
      );
      routeData.visible = this.routeVisibility.has(algorithmName);
    }
  }

  /**
   * Update control button styling
   */
  updateControlButton(button, algorithmName) {
    const isVisible = this.routeVisibility.has(algorithmName);
    button.style.backgroundColor = isVisible ? 'rgba(77, 208, 225, 0.15)' : 'transparent';
    button.style.borderColor = isVisible ? '#4dd0e1' : 'transparent';
    
    const label = button.querySelector('span');
    label.style.color = isVisible ? '#e6e6e6' : '#9ca3af';
    
    const colorIndicator = button.querySelector('div');
    colorIndicator.style.opacity = isVisible ? '1' : '0.5';
  }

  /**
   * Reorder waypoints according to algorithm result
   */
  reorderWaypoints(originalWaypoints, routeOrder) {
    // Map route_order (stop IDs) to waypoint positions
    const orderedWaypoints = [];
    
    routeOrder.forEach(stopId => {
      const waypointIndex = originalWaypoints.findIndex((wp, idx) => 
        wp.id === stopId || `stop_${idx + 1}` === stopId
      );
      
      if (waypointIndex !== -1) {
        orderedWaypoints.push(originalWaypoints[waypointIndex]);
      }
    });

    return orderedWaypoints.length > 0 ? orderedWaypoints : originalWaypoints;
  }

  /**
   * Clear all routes from map
   */
  clearAllRoutes() {
    this.currentRoutes.forEach(routeData => {
      routeData.renderer.setMap(null);
    });
    this.currentRoutes.clear();
  }

  /**
   * Fit map bounds to show all visible routes
   */
  fitMapToRoutes() {
    const bounds = new google.maps.LatLngBounds();
    let hasVisibleRoutes = false;

    this.currentRoutes.forEach((routeData, algorithmName) => {
      if (this.routeVisibility.has(algorithmName) && routeData.directionsResponse) {
        const route = routeData.directionsResponse.routes[0];
        route.overview_path.forEach(point => bounds.extend(point));
        hasVisibleRoutes = true;
      }
    });

    if (hasVisibleRoutes) {
      this.map.fitBounds(bounds);
      
      // Ensure minimum zoom level for readability
      google.maps.event.addListenerOnce(this.map, 'bounds_changed', () => {
        if (this.map.getZoom() > 15) {
          this.map.setZoom(15);
        }
      });
    }
  }

  /**
   * Get comparison statistics
   */
  getRouteComparison() {
    const comparison = {};
    
    this.currentRoutes.forEach((routeData, algorithmName) => {
      const result = routeData.result;
      comparison[algorithmName] = {
        distance_km: result.distance_km,
        time_min: result.time_min,
        objective_value: result.objective_value,
        strategy: this.algorithmStyles[algorithmName].strategy,
        visible: this.routeVisibility.has(algorithmName)
      };
    });

    return comparison;
  }
}

// Usage Example:
/*
// Initialize the visualizer
const mapElement = document.getElementById('map');
const apiKey = 'YOUR_GOOGLE_MAPS_API_KEY';
const visualizer = new QuantumRouteVisualizer(mapElement, apiKey);

// Sample waypoints
const waypoints = [
  { id: 'depot', lat: 37.7749, lng: -122.4194 },
  { id: 'stop_1', lat: 37.7849, lng: -122.4094 },
  { id: 'stop_2', lat: 37.7649, lng: -122.4294 },
  { id: 'stop_3', lat: 37.7949, lng: -122.4394 }
];

// Sample algorithm results from backend
const algorithmResults = {
  classical: {
    route_order: ['depot', 'stop_1', 'stop_2', 'stop_3'],
    distance_km: 12.5,
    time_min: 25.3,
    objective_value: 12.5,
    iterations_log: [...]
  },
  simulated: {
    route_order: ['depot', 'stop_2', 'stop_1', 'stop_3'],
    distance_km: 13.2,
    time_min: 24.1,
    objective_value: 17.6,
    iterations_log: [...]
  },
  // ... other algorithms
};

// Display all routes
await visualizer.displayMultiAlgorithmRoutes(waypoints, algorithmResults);

// Get comparison data
const comparison = visualizer.getRouteComparison();
console.log('Route Comparison:', comparison);
*/

export { QuantumRouteVisualizer };
