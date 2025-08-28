from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import asyncio
import logging
from datetime import datetime
import json

from route_optimizer import (
    GoogleMapsService, 
    RouteOptimizer, 
    DeliveryStop, 
    Depot, 
    Constraints
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Quantum-Inspired Smart Routing API v2.0",
    description="Advanced routing optimization using quantum-inspired algorithms with Google Maps integration",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response validation
class DeliveryStopModel(BaseModel):
    id: str = Field(..., description="Unique identifier for the stop")
    lat: float = Field(..., description="Latitude coordinate")
    lng: float = Field(..., description="Longitude coordinate")
    service_time_minutes: Optional[float] = Field(0, description="Service time at this stop in minutes")
    time_window: Optional[Dict[str, str]] = Field(None, description="Time window constraints")

class DepotModel(BaseModel):
    lat: float = Field(..., description="Depot latitude")
    lng: float = Field(..., description="Depot longitude")

class ConstraintsModel(BaseModel):
    vehicle_capacity: Optional[float] = Field(None, description="Maximum vehicle capacity")
    max_travel_time: Optional[float] = Field(None, description="Maximum travel time in minutes")
    fleet_size: Optional[int] = Field(1, description="Number of vehicles")
    time_windows: bool = Field(False, description="Whether to enforce time window constraints")

class OptimizationRequest(BaseModel):
    stops: List[DeliveryStopModel] = Field(..., description="List of delivery stops")
    depot: Optional[DepotModel] = Field(None, description="Depot location (optional)")
    constraints: Optional[ConstraintsModel] = Field(None, description="Optimization constraints")
    routing_profile: str = Field("driving", description="Routing profile: 'driving' or 'driving-traffic'")
    algorithms: List[str] = Field(["classical", "simulated", "qiea", "qaoa"], description="Algorithms to run")
    random_seed: Optional[int] = Field(None, description="Random seed for reproducible results")
    google_api_key: str = Field(..., description="Google Maps API key")

class AlgorithmResult(BaseModel):
    route_order: List[str]
    polyline: str
    distance_km: float
    time_min: float
    objective_value: float
    iterations_log: List[Dict[str, Any]]
    seed: int
    algorithm_params: Dict[str, Any]

class OptimizationResponse(BaseModel):
    algorithmResults: Dict[str, Any]
    distanceMatrixSource: str
    timestamp: str
    api_version: str
    debug: Dict[str, Any]

@app.get("/")
async def root():
    """API health check"""
    return {
        "service": "Quantum-Inspired Smart Routing API",
        "version": "2.0.0",
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "features": [
            "Google Maps API integration",
            "Classical TSP/CVRP optimization",
            "Simulated Annealing",
            "Quantum-Inspired Evolutionary Algorithm (QIEA)",
            "Quantum Approximate Optimization Algorithm (QAOA)",
            "Real road distance matrix",
            "Complete route polylines",
            "Multi-algorithm comparison"
        ]
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "components": {
            "api": "operational",
            "algorithms": ["classical", "simulated", "qiea", "qaoa"],
            "google_maps": "ready"
        }
    }

@app.post("/optimize", response_model=OptimizationResponse)
async def optimize_routes(request: OptimizationRequest):
    """
    Optimize delivery routes using multiple quantum-inspired algorithms
    
    This endpoint takes a list of delivery stops and returns optimized routes
    using Classical, Simulated Annealing, QIEA, and QAOA algorithms.
    All distance calculations use Google Maps API for real road distances.
    """
    try:
        # Validate inputs
        if not request.stops or len(request.stops) < 2:
            raise HTTPException(
                status_code=400, 
                detail="At least 2 delivery stops are required"
            )
        
        if not request.google_api_key:
            raise HTTPException(
                status_code=400,
                detail="Google API key is required"
            )
        
        # Validate routing profile
        valid_profiles = ["driving", "driving-traffic"]
        if request.routing_profile not in valid_profiles:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid routing profile. Must be one of: {valid_profiles}"
            )
        
        # Validate algorithms
        valid_algorithms = ["classical", "simulated", "qiea", "qaoa"]
        invalid_algorithms = set(request.algorithms) - set(valid_algorithms)
        if invalid_algorithms:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid algorithms: {invalid_algorithms}. Valid options: {valid_algorithms}"
            )
        
        logger.info(f"Starting optimization for {len(request.stops)} stops using algorithms: {request.algorithms}")
        
        # Convert Pydantic models to dictionaries
        stops = [stop.dict() for stop in request.stops]
        depot = request.depot.dict() if request.depot else None
        constraints = request.constraints.dict() if request.constraints else None
        
        # Initialize Google Maps service and optimizer
        async with GoogleMapsService(request.google_api_key) as google_service:
            optimizer = RouteOptimizer(google_service)
            
            # Run optimization
            result = await optimizer.optimize_routes(
                stops=stops,
                depot=depot,
                constraints=constraints,
                routing_profile=request.routing_profile,
                algorithms=request.algorithms,
                random_seed=request.random_seed
            )
        
        logger.info("Optimization completed successfully")
        return OptimizationResponse(**result)
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        logger.error(f"Optimization error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during optimization: {str(e)}"
        )

@app.get("/algorithms")
async def list_algorithms():
    """Get information about available optimization algorithms"""
    return {
        "algorithms": {
            "classical": {
                "name": "Classical Optimization",
                "description": "Greedy nearest neighbor construction with 2-opt improvement",
                "type": "deterministic",
                "best_for": "Small to medium problem sizes, guaranteed improvement",
                "parameters": ["iterations", "improvement_method"]
            },
            "simulated": {
                "name": "Simulated Annealing", 
                "description": "Probabilistic optimization inspired by metallurgical annealing",
                "type": "metaheuristic",
                "best_for": "Escaping local optima, medium to large problems",
                "parameters": ["temperature", "cooling_rate", "iterations"]
            },
            "qiea": {
                "name": "Quantum-Inspired Evolutionary Algorithm",
                "description": "Evolutionary algorithm using quantum probability amplitudes",
                "type": "quantum-inspired",
                "best_for": "Complex landscapes, population-based search",
                "parameters": ["population_size", "generations", "mutation_rate"]
            },
            "qaoa": {
                "name": "Quantum Approximate Optimization Algorithm",
                "description": "Variational quantum algorithm for combinatorial optimization",
                "type": "quantum-inspired",
                "best_for": "Near-term quantum computing simulation, complex constraints",
                "parameters": ["p_depth", "gamma", "beta", "optimization_steps"]
            }
        }
    }

@app.get("/test-endpoints")
async def test_endpoints():
    """Test endpoint for development purposes"""
    return {
        "message": "All endpoints operational",
        "available_endpoints": [
            "GET / - API root and health check",
            "GET /health - Detailed health check", 
            "POST /optimize - Main route optimization endpoint",
            "GET /algorithms - Algorithm information",
            "GET /test-endpoints - This endpoint"
        ],
        "sample_request": {
            "stops": [
                {"id": "stop1", "lat": 37.7749, "lng": -122.4194},
                {"id": "stop2", "lat": 37.7849, "lng": -122.4094}
            ],
            "algorithms": ["classical", "simulated"],
            "routing_profile": "driving",
            "google_api_key": "your-api-key-here"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
