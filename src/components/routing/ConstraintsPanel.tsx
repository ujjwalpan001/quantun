import React from 'react';
import { Settings2, Clock, Truck, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Slider } from '../ui/slider';
import { Button } from '../ui/button';
import { useRoutingStore } from '../../lib/store';

export const ConstraintsPanel: React.FC = () => {
  const { 
    constraints, 
    setConstraints, 
    selectedAlgorithm, 
    setSelectedAlgorithm 
  } = useRoutingStore();

  const algorithms = [
    { id: 'classical', name: 'Classical', description: 'Greedy + 2-OPT' },
    { id: 'sqa', name: 'SQA', description: 'Simulated Quantum Annealing' },
    { id: 'qiea', name: 'QI-EA', description: 'Quantum-Inspired Evolutionary' },
    { id: 'qaoa', name: 'QAOA', description: 'QAOA-Inspired Heuristic' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="w-5 h-5" />
          Route Constraints
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Optimization Goal */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Optimization Goal</label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={constraints.minimize === 'time' ? 'default' : 'outline'}
              onClick={() => setConstraints({ minimize: 'time' })}
              className="justify-start"
            >
              <Clock className="w-4 h-4 mr-2" />
              Time
            </Button>
            <Button
              variant={constraints.minimize === 'distance' ? 'default' : 'outline'}
              onClick={() => setConstraints({ minimize: 'distance' })}
              className="justify-start"
            >
              <Truck className="w-4 h-4 mr-2" />
              Distance
            </Button>
          </div>
        </div>

        {/* Vehicle Capacity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Vehicle Capacity
            </label>
            <span className="text-sm text-muted-foreground">{constraints.capacity} units</span>
          </div>
          <Slider
            value={[constraints.capacity]}
            onValueChange={([value]) => setConstraints({ capacity: value })}
            min={10}
            max={200}
            step={10}
          />
        </div>

        {/* Max Travel Time */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Max Travel Time</label>
            <span className="text-sm text-muted-foreground">
              {Math.floor(constraints.maxTravelTime / 60)}h {constraints.maxTravelTime % 60}m
            </span>
          </div>
          <Slider
            value={[constraints.maxTravelTime]}
            onValueChange={([value]) => setConstraints({ maxTravelTime: value })}
            min={60}
            max={720}
            step={15}
          />
        </div>

        {/* Algorithm Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Algorithm</label>
          <div className="grid grid-cols-2 gap-2">
            {algorithms.map((algo) => (
              <Button
                key={algo.id}
                variant={selectedAlgorithm === algo.id ? 'default' : 'outline'}
                onClick={() => setSelectedAlgorithm(algo.id as any)}
                className="flex flex-col h-auto p-3 text-left"
              >
                <div className="font-medium">{algo.name}</div>
                <div className="text-xs text-muted-foreground">{algo.description}</div>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
