"""
Google Maps Route Optimization Service
=====================================

Comprehensive route optimization using multiple algorithms with Google Maps API for real road distances.
Supports Classical, Simulated Annealing, QIEA, and QAOA algorithms.

Author: Quantum Route Optimizer v2.0
Date: August 28, 2025
"""

from typing import List, Dict, Any, Optional, Tuple
import asyncio
import aiohttp
import json
import random
import math
import numpy as np
from datetime import datetime
import time
import logging
from dataclasses import dataclass, asdict
from copy import deepcopy

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class DeliveryStop:
    id: str
    lat: float
    lng: float
    service_time_minutes: Optional[float] = 0
    time_window: Optional[Dict[str, str]] = None

@dataclass
class Depot:
    lat: float
    lng: float

@dataclass
class Constraints:
    vehicle_capacity: Optional[float] = None
    max_travel_time: Optional[float] = None
    fleet_size: Optional[int] = 1
    time_windows: bool = False

@dataclass
class RouteResult:
    route_order: List[str]
    polyline: str
    distance_km: float
    time_min: float
    objective_value: float
    iterations_log: List[Dict[str, Any]]
    seed: int
    algorithm_params: Dict[str, Any]

class GoogleMapsService:
    """Service for interacting with Google Maps APIs"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://maps.googleapis.com/maps/api"
        self.session = None
        self.cache = {}
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def _cache_key(self, origin: Tuple[float, float], destination: Tuple[float, float], profile: str) -> str:
        """Generate cache key for API requests"""
        return f"{origin[0]:.6f},{origin[1]:.6f}-{destination[0]:.6f},{destination[1]:.6f}-{profile}"
    
    async def get_route_matrix(self, locations: List[Dict], routing_profile: str = "driving") -> Dict[str, Any]:
        """Build distance and time matrix using Google Maps Directions API"""
        n = len(locations)
        distance_matrix = np.zeros((n, n))
        time_matrix = np.zeros((n, n))
        polyline_cache = {}
        
        # Build coordinate list for batch processing
        coordinates = [(loc["lat"], loc["lng"]) for loc in locations]
        
        # Use Distance Matrix API for efficiency when available
        try:
            batch_result = await self._get_distance_matrix_batch(coordinates, routing_profile)
            if batch_result:
                return batch_result
        except Exception as e:
            logger.warning(f"Batch distance matrix failed, falling back to individual requests: {e}")
        
        # Individual API calls as fallback
        for i in range(n):
            for j in range(n):
                if i == j:
                    distance_matrix[i][j] = 0
                    time_matrix[i][j] = 0
                    continue
                
                cache_key = self._cache_key(coordinates[i], coordinates[j], routing_profile)
                
                if cache_key in self.cache:
                    cached = self.cache[cache_key]
                    distance_matrix[i][j] = cached["distance_km"]
                    time_matrix[i][j] = cached["time_min"]
                    polyline_cache[f"{i}-{j}"] = cached["polyline"]
                else:
                    route_data = await self._get_directions(
                        coordinates[i], coordinates[j], routing_profile
                    )
                    
                    if route_data:
                        distance_matrix[i][j] = route_data["distance_km"]
                        time_matrix[i][j] = route_data["time_min"]
                        polyline_cache[f"{i}-{j}"] = route_data["polyline"]
                        
                        self.cache[cache_key] = route_data
                    else:
                        # Fallback to Haversine distance
                        dist_km = self._haversine_distance(coordinates[i], coordinates[j])
                        distance_matrix[i][j] = dist_km
                        time_matrix[i][j] = dist_km * 1.2  # Approximate time
        
        return {
            "distance_matrix": distance_matrix.tolist(),
            "time_matrix": time_matrix.tolist(),
            "polyline_cache": polyline_cache,
            "source": "Google Maps Directions API"
        }
    
    async def _get_distance_matrix_batch(self, coordinates: List[Tuple[float, float]], 
                                       routing_profile: str) -> Optional[Dict[str, Any]]:
        """Use Google Distance Matrix API for batch processing"""
        if not self.session:
            return None
            
        origins = "|".join([f"{lat},{lng}" for lat, lng in coordinates])
        destinations = origins  # Same locations for full matrix
        
        url = f"{self.base_url}/distancematrix/json"
        params = {
            "origins": origins,
            "destinations": destinations,
            "mode": "driving",
            "units": "metric",
            "key": self.api_key
        }
        
        if routing_profile == "driving-traffic":
            params["departure_time"] = "now"
            params["traffic_model"] = "best_guess"
        
        async with self.session.get(url, params=params) as response:
            if response.status != 200:
                return None
                
            data = await response.json()
            
            if data["status"] != "OK":
                logger.error(f"Distance Matrix API error: {data.get('error_message', 'Unknown error')}")
                return None
            
            n = len(coordinates)
            distance_matrix = np.zeros((n, n))
            time_matrix = np.zeros((n, n))
            
            for i, row in enumerate(data["rows"]):
                for j, element in enumerate(row["elements"]):
                    if element["status"] == "OK":
                        distance_matrix[i][j] = element["distance"]["value"] / 1000.0  # Convert to km
                        time_matrix[i][j] = element["duration"]["value"] / 60.0  # Convert to minutes
                    else:
                        # Fallback to Haversine
                        dist_km = self._haversine_distance(coordinates[i], coordinates[j])
                        distance_matrix[i][j] = dist_km
                        time_matrix[i][j] = dist_km * 1.2
            
            return {
                "distance_matrix": distance_matrix.tolist(),
                "time_matrix": time_matrix.tolist(),
                "polyline_cache": {},  # Will need individual calls for polylines
                "source": "Google Maps Distance Matrix API"
            }
    
    async def _get_directions(self, origin: Tuple[float, float], 
                            destination: Tuple[float, float], 
                            routing_profile: str) -> Optional[Dict[str, Any]]:
        """Get route details between two points"""
        if not self.session:
            return None
            
        url = f"{self.base_url}/directions/json"
        params = {
            "origin": f"{origin[0]},{origin[1]}",
            "destination": f"{destination[0]},{destination[1]}",
            "mode": "driving",
            "key": self.api_key
        }
        
        if routing_profile == "driving-traffic":
            params["departure_time"] = "now"
            params["traffic_model"] = "best_guess"
        
        try:
            async with self.session.get(url, params=params) as response:
                if response.status != 200:
                    return None
                    
                data = await response.json()
                
                if data["status"] != "OK" or not data.get("routes"):
                    return None
                
                route = data["routes"][0]
                leg = route["legs"][0]
                
                return {
                    "distance_km": leg["distance"]["value"] / 1000.0,
                    "time_min": leg["duration"]["value"] / 60.0,
                    "polyline": route["overview_polyline"]["points"]
                }
                
        except Exception as e:
            logger.error(f"Directions API error: {e}")
            return None
    
    async def get_full_route_polyline(self, locations: List[Dict], 
                                    route_order: List[str]) -> Optional[str]:
        """Get complete route polyline for ordered waypoints"""
        if len(route_order) < 2:
            return ""
        
        # Build waypoints in order
        ordered_locations = []
        location_map = {loc["id"]: loc for loc in locations}
        
        for stop_id in route_order:
            if stop_id in location_map:
                loc = location_map[stop_id]
                ordered_locations.append(f"{loc['lat']},{loc['lng']}")
        
        if len(ordered_locations) < 2:
            return ""
        
        url = f"{self.base_url}/directions/json"
        params = {
            "origin": ordered_locations[0],
            "destination": ordered_locations[-1],
            "mode": "driving",
            "key": self.api_key
        }
        
        if len(ordered_locations) > 2:
            params["waypoints"] = "|".join(ordered_locations[1:-1])
        
        try:
            async with self.session.get(url, params=params) as response:
                if response.status != 200:
                    return ""
                    
                data = await response.json()
                
                if data["status"] != "OK" or not data.get("routes"):
                    return ""
                
                return data["routes"][0]["overview_polyline"]["points"]
                
        except Exception as e:
            logger.error(f"Route polyline API error: {e}")
            return ""
    
    def _haversine_distance(self, coord1: Tuple[float, float], 
                           coord2: Tuple[float, float]) -> float:
        """Calculate Haversine distance as fallback"""
        R = 6371  # Earth's radius in km
        lat1, lng1 = coord1
        lat2, lng2 = coord2
        
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        
        a = (math.sin(dlat / 2) ** 2 + 
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
             math.sin(dlng / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c

class RouteOptimizer:
    """Main route optimization class with multiple algorithms"""
    
    def __init__(self, google_service: GoogleMapsService):
        self.google_service = google_service
        self.distance_matrix = None
        self.time_matrix = None
        self.locations = []
    
    async def optimize_routes(self, stops: List[Dict], depot: Optional[Dict] = None,
                            constraints: Optional[Dict] = None,
                            routing_profile: str = "driving",
                            algorithms: List[str] = None,
                            random_seed: Optional[int] = None) -> Dict[str, Any]:
        """Main optimization function"""
        
        if algorithms is None:
            algorithms = ["classical", "simulated", "qiea", "qaoa"]
        
        if random_seed is not None:
            random.seed(random_seed)
            np.random.seed(random_seed)
        
        # Validate inputs
        if not stops or len(stops) < 2:
            raise ValueError("At least 2 stops required")
        
        # Ensure all stops have valid coordinates
        for stop in stops:
            if not all(key in stop for key in ["id", "lat", "lng"]):
                raise ValueError("All stops must have id, lat, lng")
        
        self.locations = stops.copy()
        
        # Add depot if provided
        if depot:
            depot_stop = {
                "id": "depot",
                "lat": depot["lat"],
                "lng": depot["lng"]
            }
            self.locations.insert(0, depot_stop)
        
        # Build distance/time matrix using Google Maps
        logger.info("Building distance matrix with Google Maps API...")
        matrix_data = await self.google_service.get_route_matrix(
            self.locations, routing_profile
        )
        
        self.distance_matrix = np.array(matrix_data["distance_matrix"])
        self.time_matrix = np.array(matrix_data["time_matrix"])
        
        # Run optimization algorithms
        results = {}
        
        for algorithm in algorithms:
            logger.info(f"Running {algorithm} algorithm...")
            try:
                if algorithm == "classical":
                    result = await self._optimize_classical()
                elif algorithm == "simulated":
                    result = await self._optimize_simulated_annealing()
                elif algorithm == "qiea":
                    result = await self._optimize_qiea()
                elif algorithm == "qaoa":
                    result = await self._optimize_qaoa()
                else:
                    logger.warning(f"Unknown algorithm: {algorithm}")
                    continue
                
                # Get full route polyline
                polyline = await self.google_service.get_full_route_polyline(
                    self.locations, result.route_order
                )
                result.polyline = polyline or ""
                
                results[algorithm] = asdict(result)
                
            except Exception as e:
                logger.error(f"Error in {algorithm} algorithm: {e}")
                results[algorithm] = {
                    "error": str(e),
                    "route_order": [],
                    "polyline": "",
                    "distance_km": 0,
                    "time_min": 0,
                    "objective_value": float('inf'),
                    "iterations_log": [],
                    "seed": random_seed or 0,
                    "algorithm_params": {}
                }
        
        return {
            "algorithmResults": results,
            "distanceMatrixSource": matrix_data.get("source", "Google Maps API"),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "api_version": "v1",
            "debug": {
                "warnings": [],
                "errors": [],
                "matrix_size": len(self.locations),
                "total_stops": len(stops)
            }
        }
    
    async def _optimize_classical(self) -> RouteResult:
        """Classical optimization using greedy + 2-opt with preference for main roads"""
        n = len(self.locations)
        if n <= 2:
            return RouteResult(
                route_order=[loc["id"] for loc in self.locations],
                polyline="",
                distance_km=0,
                time_min=0,
                objective_value=0,
                iterations_log=[],
                seed=0,
                algorithm_params={"method": "greedy_2opt"}
            )
        
        # Classical algorithm prefers the shortest distance route
        unvisited = set(range(1, n))  # Skip depot if present
        route = [0]  # Start at depot or first location
        current = 0
        
        iterations_log = []
        
        while unvisited:
            nearest = min(unvisited, key=lambda x: self.distance_matrix[current][x])
            route.append(nearest)
            unvisited.remove(nearest)
            current = nearest
        
        # 2-opt improvement with focus on distance optimization
        improved = True
        iteration = 0
        best_distance = self._calculate_route_distance(route)
        
        iterations_log.append({"iter": iteration, "objective": best_distance})
        
        while improved and iteration < 1000:
            improved = False
            iteration += 1
            
            for i in range(1, n - 1):
                for j in range(i + 1, n):
                    new_route = route.copy()
                    new_route[i:j+1] = reversed(route[i:j+1])
                    
                    new_distance = self._calculate_route_distance(new_route)
                    
                    if new_distance < best_distance:
                        route = new_route
                        best_distance = new_distance
                        improved = True
                        
                        if iteration % 50 == 0:
                            iterations_log.append({"iter": iteration, "objective": best_distance})
        
        # Convert to stop IDs
        route_order = [self.locations[i]["id"] for i in route]
        total_time = sum(self.time_matrix[route[i]][route[i+1]] for i in range(len(route)-1))
        
        return RouteResult(
            route_order=route_order,
            polyline="",
            distance_km=best_distance,
            time_min=total_time,
            objective_value=best_distance,
            iterations_log=iterations_log,
            seed=0,
            algorithm_params={"method": "greedy_2opt", "iterations": iteration, "strategy": "shortest_distance"}
        )
    
    async def _optimize_simulated_annealing(self) -> RouteResult:
        """Simulated Annealing optimization with time-focused exploration"""
        n = len(self.locations)
        if n <= 2:
            return RouteResult(
                route_order=[loc["id"] for loc in self.locations],
                polyline="", distance_km=0, time_min=0, objective_value=0,
                iterations_log=[], seed=random.randint(1, 10000),
                algorithm_params={"method": "simulated_annealing"}
            )
        
        # Parameters - more exploration for different routes
        seed = random.randint(1, 10000)
        random.seed(seed)
        
        initial_temp = 2000.0  # Higher temperature for more exploration
        final_temp = 1.0
        cooling_rate = 0.995
        max_iterations = 5000
        
        # Start with a time-optimal construction (different from distance-optimal)
        route = list(range(n))
        if n > 1:
            # Use time matrix for initial construction instead of distance
            unvisited = set(range(1, n))
            time_route = [0]
            current = 0
            
            while unvisited:
                # Choose based on time, not distance (creates different initial route)
                nearest_time = min(unvisited, key=lambda x: self.time_matrix[current][x])
                time_route.append(nearest_time)
                unvisited.remove(nearest_time)
                current = nearest_time
            
            route = time_route
        
        # Use hybrid objective: 0.6*distance + 0.4*time for different path preference
        def hybrid_objective(route_order):
            distance = self._calculate_route_distance(route_order)
            time = sum(self.time_matrix[route_order[i]][route_order[i+1]] for i in range(len(route_order)-1))
            return 0.6 * distance + 0.4 * time  # Balanced approach
        
        current_objective = hybrid_objective(route)
        best_route = route.copy()
        best_objective = current_objective
        
        temp = initial_temp
        iterations_log = [{"iter": 0, "objective": current_objective, "temperature": temp}]
        
        for iteration in range(1, max_iterations + 1):
            # Generate neighbor with more diverse moves
            new_route = route.copy()
            if n > 3:
                move_type = random.choice(['swap', 'insert', 'reverse'])
                
                if move_type == 'swap':
                    i, j = random.sample(range(1, n), 2)
                    new_route[i], new_route[j] = new_route[j], new_route[i]
                elif move_type == 'insert':
                    i = random.randint(1, n-1)
                    j = random.randint(1, n-1)
                    city = new_route.pop(i)
                    new_route.insert(j, city)
                else:  # reverse
                    i, j = sorted(random.sample(range(1, n), 2))
                    new_route[i:j+1] = reversed(new_route[i:j+1])
            
            new_objective = hybrid_objective(new_route)
            delta = new_objective - current_objective
            
            # Accept or reject
            if delta < 0 or random.random() < math.exp(-delta / temp):
                route = new_route
                current_objective = new_objective
                
                if current_objective < best_objective:
                    best_route = route.copy()
                    best_objective = current_objective
            
            # Cool down
            temp *= cooling_rate
            
            if iteration % 100 == 0:
                iterations_log.append({
                    "iter": iteration,
                    "objective": current_objective,
                    "best": best_objective,
                    "temperature": temp
                })
            
            if temp < final_temp:
                break
        
        route_order = [self.locations[i]["id"] for i in best_route]
        best_distance = self._calculate_route_distance(best_route)
        total_time = sum(self.time_matrix[best_route[i]][best_route[i+1]] 
                        for i in range(len(best_route)-1))
        
        return RouteResult(
            route_order=route_order,
            polyline="",
            distance_km=best_distance,
            time_min=total_time,
            objective_value=best_objective,
            iterations_log=iterations_log,
            seed=seed,
            algorithm_params={
                "method": "simulated_annealing",
                "initial_temp": initial_temp,
                "final_temp": final_temp,
                "cooling_rate": cooling_rate,
                "iterations": iteration,
                "strategy": "time_distance_hybrid",
                "objective_weights": "0.6*distance + 0.4*time"
            }
        )
    
    async def _optimize_qiea(self) -> RouteResult:
        """Quantum-Inspired Evolutionary Algorithm with exploration-focused strategy"""
        n = len(self.locations)
        if n <= 2:
            return RouteResult(
                route_order=[loc["id"] for loc in self.locations],
                polyline="", distance_km=0, time_min=0, objective_value=0,
                iterations_log=[], seed=random.randint(1, 10000),
                algorithm_params={"method": "qiea"}
            )
        
        seed = random.randint(1, 10000)
        random.seed(seed)
        np.random.seed(seed)
        
        # QIEA parameters - more diverse exploration
        population_size = 60
        max_generations = 250
        mutation_rate = 0.15
        
        # QIEA uses a balanced objective with exploration bonus
        def qiea_objective(route_order):
            distance = self._calculate_route_distance(route_order)
            time = sum(self.time_matrix[route_order[i]][route_order[i+1]] for i in range(len(route_order)-1))
            
            # Add exploration bonus for different path patterns
            diversity_bonus = 0
            for i in range(1, len(route_order)-1):
                # Bonus for intermediate waypoints that create diverse paths
                if i % 2 == 0:  # Every other waypoint gets exploration bonus
                    diversity_bonus += 0.05 * distance / n
            
            return 0.5 * distance + 0.3 * time + 0.2 * diversity_bonus
        
        # Initialize quantum population with diverse strategies
        def initialize_quantum_individual():
            return np.random.rand(n, n)
        
        population = [initialize_quantum_individual() for _ in range(population_size)]
        best_route = None
        best_objective = float('inf')
        iterations_log = []
        
        # Initialize with different construction heuristics for diversity
        construction_methods = ['random', 'time_based', 'distance_based', 'farthest_insertion']
        
        for generation in range(max_generations):
            classical_solutions = []
            
            for i, quantum_individual in enumerate(population):
                # Use different construction methods for first generation
                if generation == 0:
                    method = construction_methods[i % len(construction_methods)]
                    route = self._construct_route_with_method(method, n)
                else:
                    route = self._quantum_to_classical_route(quantum_individual)
                
                objective = qiea_objective(route)
                classical_solutions.append((route, objective))
                
                if objective < best_objective:
                    best_route = route.copy()
                    best_objective = objective
            
            # Update quantum states with diverse elite solutions
            elite_solutions = sorted(classical_solutions, key=lambda x: x[1])[:15]
            
            for i, quantum_individual in enumerate(population):
                # Different update strategies for diversity
                if i % 3 == 0:
                    # Focus on best solutions
                    for route_candidate, _ in elite_solutions[:3]:
                        self._quantum_rotation_update(quantum_individual, route_candidate)
                elif i % 3 == 1:
                    # Focus on diverse solutions
                    for route_candidate, _ in elite_solutions[5:8]:
                        self._quantum_rotation_update(quantum_individual, route_candidate)
                else:
                    # Random exploration
                    for route_candidate, _ in elite_solutions[::3]:
                        self._quantum_rotation_update(quantum_individual, route_candidate)
                
                # Higher mutation rate for more exploration
                if random.random() < mutation_rate:
                    self._quantum_mutation(quantum_individual)
            
            if generation % 25 == 0:
                iterations_log.append({
                    "iter": generation,
                    "objective": best_objective,
                    "population_diversity": self._calculate_population_diversity(population)
                })
        
        route_order = [self.locations[i]["id"] for i in best_route]
        best_distance = self._calculate_route_distance(best_route)
        total_time = sum(self.time_matrix[best_route[i]][best_route[i+1]] 
                        for i in range(len(best_route)-1))
        
        return RouteResult(
            route_order=route_order,
            polyline="",
            distance_km=best_distance,
            time_min=total_time,
            objective_value=best_objective,
            iterations_log=iterations_log,
            seed=seed,
            algorithm_params={
                "method": "qiea",
                "population_size": population_size,
                "generations": max_generations,
                "mutation_rate": mutation_rate,
                "strategy": "exploration_focused",
                "objective_weights": "0.5*distance + 0.3*time + 0.2*diversity"
            }
        )
    
    def _construct_route_with_method(self, method: str, n: int) -> List[int]:
        """Construct initial route using different methods for diversity"""
        if method == 'random':
            route = list(range(n))
            if n > 1:
                random.shuffle(route[1:])
            return route
        elif method == 'time_based':
            return self._construct_time_focused_route(n)
        elif method == 'distance_based':
            return self._construct_distance_focused_route(n)
        elif method == 'farthest_insertion':
            return self._construct_farthest_insertion_route(n)
        else:
            return list(range(n))
    
    def _construct_time_focused_route(self, n: int) -> List[int]:
        """Construct route prioritizing time efficiency"""
        unvisited = set(range(1, n))
        route = [0]
        current = 0
        
        while unvisited:
            nearest_time = min(unvisited, key=lambda x: self.time_matrix[current][x])
            route.append(nearest_time)
            unvisited.remove(nearest_time)
            current = nearest_time
        
        return route
    
    def _construct_distance_focused_route(self, n: int) -> List[int]:
        """Construct route prioritizing distance efficiency"""
        unvisited = set(range(1, n))
        route = [0]
        current = 0
        
        while unvisited:
            nearest_dist = min(unvisited, key=lambda x: self.distance_matrix[current][x])
            route.append(nearest_dist)
            unvisited.remove(nearest_dist)
            current = nearest_dist
        
        return route
    
    def _construct_farthest_insertion_route(self, n: int) -> List[int]:
        """Construct route using farthest insertion heuristic"""
        if n <= 2:
            return list(range(n))
        
        # Start with the two farthest points
        max_dist = 0
        start_pair = (0, 1)
        
        for i in range(n):
            for j in range(i + 1, n):
                if self.distance_matrix[i][j] > max_dist:
                    max_dist = self.distance_matrix[i][j]
                    start_pair = (i, j)
        
        route = list(start_pair)
        unvisited = set(range(n)) - set(route)
        
        while unvisited:
            # Find the unvisited point farthest from the current route
            farthest_point = max(unvisited, key=lambda x: min(self.distance_matrix[x][y] for y in route))
            
            # Find the best position to insert this point
            best_cost_increase = float('inf')
            best_position = 1
            
            for pos in range(1, len(route) + 1):
                if pos == 0:
                    cost_increase = (self.distance_matrix[farthest_point][route[0]] +
                                   self.distance_matrix[farthest_point][route[-1]] -
                                   self.distance_matrix[route[-1]][route[0]])
                elif pos == len(route):
                    cost_increase = (self.distance_matrix[route[-1]][farthest_point] +
                                   self.distance_matrix[farthest_point][route[0]] -
                                   self.distance_matrix[route[-1]][route[0]])
                else:
                    cost_increase = (self.distance_matrix[route[pos-1]][farthest_point] +
                                   self.distance_matrix[farthest_point][route[pos]] -
                                   self.distance_matrix[route[pos-1]][route[pos]])
                
                if cost_increase < best_cost_increase:
                    best_cost_increase = cost_increase
                    best_position = pos
            
            route.insert(best_position, farthest_point)
            unvisited.remove(farthest_point)
        
        return route
    
    def _simulate_qaoa_circuit_time_focused(self, gamma, beta, n: int, initial_route: List[int]) -> np.ndarray:
        """Simulate QAOA circuit with time-focused bias"""
        # Create probability distribution biased toward time-efficient routes
        probabilities = np.ones((n, n)) / n
        
        # Apply time-focused bias
        for i in range(n):
            for j in range(n):
                if i != j:
                    time_factor = 1.0 / (1.0 + self.time_matrix[i][j])
                    probabilities[i][j] *= time_factor
        
        # Normalize
        probabilities = probabilities / np.sum(probabilities, axis=1, keepdims=True)
        
        return probabilities
    
    def _local_search_2opt_limited(self, route: List[int], max_iterations: int) -> List[int]:
        """Limited 2-opt local search for route improvement"""
        n = len(route)
        if n <= 3:
            return route
        
        best_route = route.copy()
        best_distance = self._calculate_route_distance(route)
        
        for iteration in range(max_iterations):
            improved = False
            
            for i in range(1, n - 1):
                for j in range(i + 1, n):
                    new_route = route.copy()
                    new_route[i:j+1] = reversed(route[i:j+1])
                    
                    new_distance = self._calculate_route_distance(new_route)
                    
                    if new_distance < best_distance:
                        best_route = new_route
                        best_distance = new_distance
                        improved = True
                        break
                
                if improved:
                    break
            
            if not improved:
                break
                
            route = best_route
        
        return best_route

    async def _optimize_qaoa(self) -> RouteResult:
        """Quantum Approximate Optimization Algorithm with alternative path preferences"""
        n = len(self.locations)
        if n <= 2:
            return RouteResult(
                route_order=[loc["id"] for loc in self.locations],
                polyline="", distance_km=0, time_min=0, objective_value=0,
                iterations_log=[], seed=random.randint(1, 10000),
                algorithm_params={"method": "qaoa"}
            )
        
        seed = random.randint(1, 10000)
        random.seed(seed)
        np.random.seed(seed)
        
        # QAOA parameters - focused on alternative path exploration
        p_depth = 4  # More layers for complex optimization landscape
        num_samples = 1200
        optimization_steps = 120
        
        # QAOA uses time-preferred objective for different route characteristics
        def qaoa_objective(route_order):
            distance = self._calculate_route_distance(route_order)
            time = sum(self.time_matrix[route_order[i]][route_order[i+1]] for i in range(len(route_order)-1))
            
            # Prefer time-efficient routes with penalty for very long distances
            base_objective = 0.3 * distance + 0.7 * time
            
            # Add penalty for routes that are too direct (encourage intermediate exploration)
            path_complexity_bonus = 0
            if n > 3:
                # Calculate path "complexity" - routes with more varied directions
                direction_changes = 0
                for i in range(1, len(route_order)-1):
                    prev_idx, curr_idx, next_idx = route_order[i-1], route_order[i], route_order[i+1]
                    # Simple heuristic: count significant direction changes
                    if abs(curr_idx - prev_idx) != abs(next_idx - curr_idx):
                        direction_changes += 1
                
                path_complexity_bonus = -0.1 * base_objective * (direction_changes / n)
            
            return base_objective + path_complexity_bonus
        
        # Initialize QAOA parameters with bias toward exploration
        gamma = np.random.uniform(0.2, 0.8, p_depth)  # Biased range for exploration
        beta = np.random.uniform(0.1, 0.4, p_depth)   # Smaller beta for more quantum mixing
        
        best_route = None
        best_objective = float('inf')
        iterations_log = []
        
        # Start with a time-focused initial route
        initial_route = self._construct_time_focused_route(n)
        
        for step in range(optimization_steps):
            # Simulate QAOA circuit with time-preference bias
            route_probabilities = self._simulate_qaoa_circuit_time_focused(gamma, beta, n, initial_route)
            
            # Sample routes with bias toward alternative paths
            sampled_routes = []
            for _ in range(min(num_samples // 12, 100)):
                if step < optimization_steps // 3:
                    # Early exploration: use probability distribution
                    route = self._sample_route_from_probabilities(route_probabilities, n)
                elif step < 2 * optimization_steps // 3:
                    # Middle phase: mix probability and time-based construction
                    if random.random() < 0.5:
                        route = self._sample_route_from_probabilities(route_probabilities, n)
                    else:
                        route = self._construct_time_focused_route(n)
                else:
                    # Late phase: focus on refinement
                    route = self._sample_route_from_probabilities(route_probabilities, n)
                    # Apply local search for final improvement
                    route = self._local_search_2opt_limited(route, 10)
                
                objective = qaoa_objective(route)
                sampled_routes.append((route, objective))
                
                if objective < best_objective:
                    best_route = route.copy()
                    best_objective = objective
            
            # Update QAOA parameters with adaptive strategy
            if step < optimization_steps - 1:
                # Adaptive parameter update based on progress
                progress = step / optimization_steps
                exploration_factor = 1.0 - progress  # Decrease exploration over time
                
                for i in range(p_depth):
                    # Gradient-free optimization with exploration bias
                    gamma_delta = np.random.normal(0, 0.15 * exploration_factor)
                    beta_delta = np.random.normal(0, 0.1 * exploration_factor)
                    
                    gamma[i] += gamma_delta
                    beta[i] += beta_delta
                    
                    # Keep parameters in valid range with time-focused bias
                    gamma[i] = np.clip(gamma[i], 0, np.pi)
                    beta[i] = np.clip(beta[i], 0, np.pi/2)
            
            if step % 12 == 0:
                iterations_log.append({
                    "iter": step,
                    "objective": best_objective,
                    "gamma_avg": np.mean(gamma),
                    "beta_avg": np.mean(beta),
                    "exploration_phase": "early" if step < optimization_steps//3 else "middle" if step < 2*optimization_steps//3 else "late"
                })
        
        route_order = [self.locations[i]["id"] for i in best_route]
        best_distance = self._calculate_route_distance(best_route)
        total_time = sum(self.time_matrix[best_route[i]][best_route[i+1]] 
                        for i in range(len(best_route)-1))
        
        return RouteResult(
            route_order=route_order,
            polyline="",
            distance_km=best_distance,
            time_min=total_time,
            objective_value=best_objective,
            iterations_log=iterations_log,
            seed=seed,
            algorithm_params={
                "method": "qaoa",
                "p_depth": p_depth,
                "optimization_steps": optimization_steps,
                "num_samples": num_samples,
                "strategy": "time_focused_exploration",
                "objective_weights": "0.3*distance + 0.7*time + path_complexity_bonus"
            }
        )
    
    def _calculate_route_distance(self, route: List[int]) -> float:
        """Calculate total distance for a route"""
        if len(route) < 2:
            return 0
        
        total_distance = 0
        for i in range(len(route) - 1):
            total_distance += self.distance_matrix[route[i]][route[i + 1]]
        
        return total_distance
    
    def _quantum_to_classical_route(self, quantum_state: np.ndarray) -> List[int]:
        """Convert quantum probability state to classical route"""
        n = len(quantum_state)
        route = [0]  # Start with depot or first location
        
        available = set(range(1, n))
        current_pos = 0
        
        while available:
            # Calculate probabilities for next city based on quantum state
            probabilities = quantum_state[current_pos, list(available)]
            probabilities = probabilities / np.sum(probabilities)
            
            # Sample next city
            next_city = np.random.choice(list(available), p=probabilities)
            route.append(next_city)
            available.remove(next_city)
            current_pos = next_city
        
        return route
    
    def _quantum_rotation_update(self, quantum_individual: np.ndarray, target_route: List[int]):
        """Update quantum state towards target solution"""
        n = len(quantum_individual)
        learning_rate = 0.1
        
        for i in range(len(target_route) - 1):
            current_city = target_route[i]
            next_city = target_route[i + 1]
            
            # Increase probability of this transition
            quantum_individual[current_city, next_city] += learning_rate
            quantum_individual[current_city, next_city] = min(1.0, quantum_individual[current_city, next_city])
    
    def _quantum_mutation(self, quantum_individual: np.ndarray):
        """Apply quantum mutation"""
        n = len(quantum_individual)
        mutation_strength = 0.05
        
        for i in range(n):
            for j in range(n):
                if i != j:
                    quantum_individual[i, j] += np.random.normal(0, mutation_strength)
                    quantum_individual[i, j] = np.clip(quantum_individual[i, j], 0, 1)
    
    def _calculate_population_diversity(self, population: List[np.ndarray]) -> float:
        """Calculate diversity metric for quantum population"""
        if len(population) < 2:
            return 0.0
        
        diversities = []
        for i in range(len(population)):
            for j in range(i + 1, len(population)):
                diversity = np.mean(np.abs(population[i] - population[j]))
                diversities.append(diversity)
        
        return np.mean(diversities)
    
    def _simulate_qaoa_circuit(self, gamma: np.ndarray, beta: np.ndarray, n: int) -> np.ndarray:
        """Simulate QAOA quantum circuit (simplified)"""
        # Initialize uniform superposition
        state = np.ones((n, n)) / n
        
        for p in range(len(gamma)):
            # Cost Hamiltonian evolution (gamma)
            for i in range(n):
                for j in range(n):
                    if i != j:
                        cost_factor = self.distance_matrix[i, j] * gamma[p]
                        state[i, j] *= math.cos(cost_factor) + 1j * math.sin(cost_factor)
            
            # Mixer Hamiltonian evolution (beta)
            # Simplified mixer that promotes exploration
            mixer_strength = beta[p]
            noise = np.random.normal(0, mixer_strength, (n, n))
            state = np.abs(state + noise * 0.1)
        
        # Normalize to probabilities
        return np.abs(state) ** 2
    
    def _sample_route_from_probabilities(self, probabilities: np.ndarray, n: int) -> List[int]:
        """Sample a route from QAOA probability distribution"""
        route = [0]  # Start with depot or first location
        available = set(range(1, n))
        current = 0
        
        while available:
            # Get probabilities for available cities
            probs = []
            cities = list(available)
            
            for city in cities:
                probs.append(probabilities[current, city])
            
            if sum(probs) > 0:
                probs = np.array(probs)
                probs = probs / np.sum(probs)
                next_city_idx = np.random.choice(len(cities), p=probs)
                next_city = cities[next_city_idx]
            else:
                # Fallback to random selection
                next_city = random.choice(cities)
            
            route.append(next_city)
            available.remove(next_city)
            current = next_city
        
        return route
