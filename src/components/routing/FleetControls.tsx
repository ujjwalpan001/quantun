import React from 'react';
import { motion } from 'framer-motion';
import { Truck, Clock, Package, DollarSign, Users } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { useRoutingStore } from '../../lib/store';

export const FleetControls: React.FC = () => {
  const { constraints, setConstraints, locations } = useRoutingStore();

  const updateConstraint = (key: string, value: number) => {
    setConstraints({ ...constraints, [key]: value });
  };

  // Calculate derived metrics
  const totalLocations = locations.length;
  const vehicleCapacity = constraints.vehicle_capacity || 20;
  const estimatedVehiclesNeeded = Math.max(1, Math.ceil(totalLocations / vehicleCapacity));
  const driverCost = constraints.driver_cost_per_day || 800;
  const fuelCostPerKm = constraints.fuel_cost_per_km || 8.5;
  const dailyCostEstimate = (estimatedVehiclesNeeded * driverCost) + (100 * fuelCostPerKm); // Assume 100km average

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6 space-y-6 bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-800 dark:to-gray-900 border-0 shadow-lg">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            Fleet Configuration
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure your fleet parameters for optimal routing
          </p>
        </div>

        {/* Fleet Metrics Overview */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-white/60 rounded-lg">
            <div className="text-lg font-bold text-emerald-600">{estimatedVehiclesNeeded}</div>
            <div className="text-xs text-gray-600">Est. Vehicles</div>
          </div>
          <div className="text-center p-3 bg-white/60 rounded-lg">
            <div className="text-lg font-bold text-teal-600">{totalLocations}</div>
            <div className="text-xs text-gray-600">Total Stops</div>
          </div>
          <div className="text-center p-3 bg-white/60 rounded-lg">
            <div className="text-lg font-bold text-blue-600">₹{dailyCostEstimate.toFixed(0)}</div>
            <div className="text-xs text-gray-600">Est. Daily Cost</div>
          </div>
        </div>

        {/* Vehicle Capacity Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Package className="w-4 h-4 text-amber-600" />
              Vehicle Capacity
            </Label>
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              {vehicleCapacity} packages/vehicle
            </Badge>
          </div>
          
          <Slider
            value={[vehicleCapacity]}
            onValueChange={([value]) => updateConstraint('vehicle_capacity', value)}
            min={5}
            max={50}
            step={5}
            className="w-full"
          />
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>🚚 Small (5-15)</span>
            <span>🚛 Medium (20-30)</span>
            <span>🚜 Large (35-50)</span>
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-800">
              <strong>💡 What this means:</strong> Each vehicle can carry {vehicleCapacity} packages maximum. 
              Higher capacity means fewer vehicles needed but longer routes per vehicle.
            </p>
          </div>
        </div>

        {/* Max Travel Time Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="w-4 h-4 text-indigo-600" />
              Max Travel Time
            </Label>
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
              {Math.floor((constraints.max_travel_time || 480) / 60)}h {(constraints.max_travel_time || 480) % 60}m
            </Badge>
          </div>
          
          <Slider
            value={[constraints.max_travel_time || 480]}
            onValueChange={([value]) => updateConstraint('max_travel_time', value)}
            min={120}
            max={720}
            step={30}
            className="w-full"
          />
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>⏰ 2h (Quick)</span>
            <span>🕐 8h (Standard)</span>
            <span>🕒 12h (Extended)</span>
          </div>

          <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
            <p className="text-xs text-indigo-800">
              <strong>💡 What this means:</strong> Maximum time each vehicle can travel per day including driving and service time. 
              Longer times allow more deliveries per vehicle but may require overtime pay.
            </p>
          </div>
        </div>

        {/* Max Vehicles Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Truck className="w-4 h-4 text-purple-600" />
              Max Fleet Size
            </Label>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              {constraints.max_vehicles || 10} vehicles max
            </Badge>
          </div>
          
          <Slider
            value={[constraints.max_vehicles || 10]}
            onValueChange={([value]) => updateConstraint('max_vehicles', value)}
            min={1}
            max={25}
            step={1}
            className="w-full"
          />
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>🚐 1-5 (Small)</span>
            <span>🚛 6-15 (Medium)</span>
            <span>🏢 16-25 (Enterprise)</span>
          </div>

          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-xs text-purple-800">
              <strong>💡 What this means:</strong> Maximum number of vehicles available in your fleet. 
              More vehicles can handle larger orders but increase fixed costs (drivers, fuel, maintenance).
            </p>
          </div>
        </div>

        {/* Cost Controls */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Cost Parameters (Indian Rupees)
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fuel Cost */}
            <div className="space-y-2">
              <Label className="text-xs">Fuel Cost per KM</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs">₹</span>
                <Slider
                  value={[fuelCostPerKm]}
                  onValueChange={([value]) => updateConstraint('fuel_cost_per_km', value)}
                  min={5}
                  max={15}
                  step={0.5}
                  className="flex-1"
                />
                <Badge variant="outline" className="text-xs">
                  ₹{fuelCostPerKm.toFixed(1)}
                </Badge>
              </div>
            </div>

            {/* Driver Cost */}
            <div className="space-y-2">
              <Label className="text-xs">Driver Cost per Day</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs">₹</span>
                <Slider
                  value={[driverCost]}
                  onValueChange={([value]) => updateConstraint('driver_cost_per_day', value)}
                  min={500}
                  max={1500}
                  step={50}
                  className="flex-1"
                />
                <Badge variant="outline" className="text-xs">
                  ₹{driverCost}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Impact Summary */}
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-4 rounded-lg border border-green-200">
          <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Current Configuration Impact
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
            <div>• Vehicles needed: ~{estimatedVehiclesNeeded}</div>
            <div>• Max capacity: {vehicleCapacity * estimatedVehiclesNeeded} packages</div>
            <div>• Daily driver cost: ₹{driverCost * estimatedVehiclesNeeded}</div>
            <div>• Max working time: {Math.floor((constraints.max_travel_time || 480) / 60)}h per vehicle</div>
          </div>
        </div>

      </Card>
    </motion.div>
  );
};
