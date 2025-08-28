import React from 'react';
import { motion } from 'framer-motion';
import { Truck, Clock, Package, DollarSign, Zap, Atom } from 'lucide-react';
import { QuantumCard, QuantumBadge } from '../ui/QuantumUI';
import { Slider } from '../ui/slider';
import { useRoutingStore } from '../../lib/store';

export const QuantumFleetControls: React.FC = () => {
  const { constraints, setConstraints, locations } = useRoutingStore();

  const updateConstraint = (key: string, value: number) => {
    setConstraints({ ...constraints, [key]: value });
  };

  // Calculate derived metrics
  const totalLocations = locations.length;
  const vehicleCapacity = constraints.vehicle_capacity || 20;
  const estimatedVehiclesNeeded = Math.max(1, Math.ceil(totalLocations / vehicleCapacity));
  const maxTravelTime = constraints.max_travel_time || 8;

  // Cost calculations
  const fuelCostPerKm = constraints.fuel_cost_per_km || 0.8;
  const driverCostPerDay = constraints.driver_cost_per_day || 200;
  const totalDailyCost = estimatedVehiclesNeeded * (500 + driverCostPerDay);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <QuantumCard 
        className="p-6 space-y-6" 
        title="Fleet Configuration"
        icon={Zap}
        glow={true}
        hover={true}
      >
        {/* Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            className="text-center quantum-glass p-4 rounded-lg"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              className="quantum-icon text-2xl mb-2"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Truck />
            </motion.div>
            <div className="quantum-heading text-lg font-bold">{estimatedVehiclesNeeded}</div>
            <div className="quantum-text text-xs">Vehicles Needed</div>
          </motion.div>

          <motion.div
            className="text-center quantum-glass p-4 rounded-lg"
            whileHover={{ scale: 1.05 }}
          >
            <Package className="quantum-icon text-2xl mb-2 mx-auto" />
            <div className="quantum-heading text-lg font-bold">{totalLocations}</div>
            <div className="quantum-text text-xs">Total Stops</div>
          </motion.div>

          <motion.div
            className="text-center quantum-glass p-4 rounded-lg"
            whileHover={{ scale: 1.05 }}
          >
            <Clock className="quantum-icon text-2xl mb-2 mx-auto" />
            <div className="quantum-heading text-lg font-bold">{maxTravelTime}h</div>
            <div className="quantum-text text-xs">Max Travel Time</div>
          </motion.div>

          <motion.div
            className="text-center quantum-glass p-4 rounded-lg"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <DollarSign className="quantum-icon text-2xl mb-2 mx-auto" />
            </motion.div>
            <div className="quantum-heading text-lg font-bold">${totalDailyCost}</div>
            <div className="quantum-text text-xs">Daily Cost</div>
          </motion.div>
        </div>

        {/* Vehicle Capacity Control */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <label className="quantum-subheading flex items-center gap-2 text-sm font-semibold">
              <Truck className="w-4 h-4 quantum-icon" />
              Vehicle Capacity
            </label>
            <QuantumBadge variant="warning" pulse>
              {vehicleCapacity} stops
            </QuantumBadge>
          </div>
          <Slider
            value={[vehicleCapacity]}
            onValueChange={(value) => updateConstraint('vehicle_capacity', value[0])}
            min={5}
            max={50}
            step={1}
            className="quantum-slider"
          />
          <div className="flex justify-between text-xs quantum-text">
            <span>5 stops</span>
            <span>50 stops</span>
          </div>
        </motion.div>

        {/* Travel Time Control */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <label className="quantum-subheading flex items-center gap-2 text-sm font-semibold">
              <Clock className="w-4 h-4 quantum-icon" />
              Max Travel Time
            </label>
            <QuantumBadge variant="primary" pulse>
              {maxTravelTime} hours
            </QuantumBadge>
          </div>
          <Slider
            value={[maxTravelTime]}
            onValueChange={(value) => updateConstraint('max_travel_time', value[0])}
            min={2}
            max={12}
            step={0.5}
            className="quantum-slider"
          />
          <div className="flex justify-between text-xs quantum-text">
            <span>2 hours</span>
            <span>12 hours</span>
          </div>
        </motion.div>

        {/* Operating Costs */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between">
            <label className="quantum-subheading flex items-center gap-2 text-sm font-semibold">
              <DollarSign className="w-4 h-4 quantum-icon" />
              Operating Costs
            </label>
            <QuantumBadge variant="secondary">
              Daily: ${totalDailyCost}
            </QuantumBadge>
          </div>

          {/* Cost Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-xs quantum-text">Fuel Cost per KM</div>
              <Slider
                value={[fuelCostPerKm]}
                onValueChange={(value) => updateConstraint('fuel_cost_per_km', value[0])}
                min={0.3}
                max={2.0}
                step={0.1}
                className="quantum-slider"
              />
              <div className="text-center">
                <QuantumBadge variant="success" className="text-xs">
                  ${fuelCostPerKm}/km
                </QuantumBadge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs quantum-text">Driver Cost per Day</div>
              <Slider
                value={[driverCostPerDay]}
                onValueChange={(value) => updateConstraint('driver_cost_per_day', value[0])}
                min={100}
                max={500}
                step={25}
                className="quantum-slider"
              />
              <div className="text-center">
                <QuantumBadge variant="success" className="text-xs">
                  ${driverCostPerDay}/day
                </QuantumBadge>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Fleet Impact Summary */}
        <motion.div
          className="mt-6 quantum-glass p-4 rounded-lg border border-quantum-primary/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Atom className="w-5 h-5 quantum-icon" />
            </motion.div>
            <h4 className="quantum-heading text-sm font-semibold">Fleet Impact Analysis</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <div className="flex justify-between quantum-text">
                <span>Efficiency Score:</span>
                <QuantumBadge variant="primary">
                  {Math.round((vehicleCapacity / totalLocations) * 100)}%
                </QuantumBadge>
              </div>
              <div className="flex justify-between quantum-text">
                <span>Cost per Location:</span>
                <QuantumBadge variant="secondary">
                  ${Math.round(totalDailyCost / Math.max(totalLocations, 1))}
                </QuantumBadge>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between quantum-text">
                <span>Route Utilization:</span>
                <QuantumBadge variant="success">
                  {Math.round((totalLocations / (estimatedVehiclesNeeded * vehicleCapacity)) * 100)}%
                </QuantumBadge>
              </div>
              <div className="flex justify-between quantum-text">
                <span>Fleet Size:</span>
                <QuantumBadge variant="secondary">
                  {estimatedVehiclesNeeded} vehicles
                </QuantumBadge>
              </div>
            </div>
          </div>
        </motion.div>
      </QuantumCard>
    </motion.div>
  );
};
