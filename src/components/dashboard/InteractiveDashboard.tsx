import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { StatusIndicator } from '../ui/status-indicator';
import { ComparisonChart } from './ComparisonChart';
import { AlgorithmDetailCard } from './AlgorithmDetailCard';
import { ComparisonMapView } from '../routing/ComparisonMapView';
import { SplitComparisonMapView } from '../routing/SplitComparisonMapView';
import { MapView } from '../routing/MapView';
import GoogleMapsRouteOptimizationMap from '../GoogleMapsRouteOptimizationMap';
import { useRoutingStore } from '../../lib/store';

const algorithmInfo = {
  comparison: { label: 'Overview', icon: '📊', color: 'bg-blue-500' },
  split: { label: 'Split Compare', icon: '⚖️', color: 'bg-cyan-500' },
  gmaps: { label: 'Google Maps', icon: '🗺️', color: 'bg-red-500' },
  classical: { label: 'Classical', icon: '🏛️', color: 'bg-gray-500' },
  sqa: { label: 'SQA', icon: '🌀', color: 'bg-purple-500' },
  qiea: { label: 'QI-EA', icon: '🧬', color: 'bg-green-500' },
  qaoa: { label: 'QAOA', icon: '⚛️', color: 'bg-orange-500' },
};

export const InteractiveDashboard: React.FC = () => {
  const { comparisonResults, setCurrentRoute, currentRoute, isOptimizing, isComparing } = useRoutingStore();
  const [activeTab, setActiveTab] = useState('comparison');

  // Determine current status
  const getSystemStatus = () => {
    if (isOptimizing) return 'optimizing';
    if (isComparing) return 'comparing';
    if (comparisonResults.length > 0) return 'complete';
    return 'idle';
  };

  const getResultByAlgorithm = (algorithm: string) => {
    return comparisonResults.find(result => {
      const algoName = result.algorithm.toLowerCase();
      switch (algorithm) {
        case 'classical':
          return algoName.includes('classical');
        case 'sqa':
          return algoName.includes('simulated quantum annealing');
        case 'qiea':
          return algoName.includes('quantum-inspired evolutionary');
        case 'qaoa':
          return algoName.includes('qaoa');
        default:
          return false;
      }
    });
  };

  const renderTabContent = () => {
    if (activeTab === 'comparison') {
      return (
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <ComparisonChart />
          
          {/* Comparison Map View - Full Height */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="h-full"
          >
            <ComparisonMapView className="h-[70vh]" />
          </motion.div>
          
          {comparisonResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Algorithm Performance
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comparisonResults.map((result, index) => (
                  <motion.div
                    key={result.algorithm}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <AlgorithmDetailCard
                      result={result}
                      isSelected={currentRoute?.algorithm === result.algorithm}
                      onClick={() => setCurrentRoute(result)}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      );
    }

    // Split Comparison Tab
    if (activeTab === 'split') {
      return (
        <motion.div 
          className="space-y-6 h-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Split Comparison Map View - Full Height */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="h-full"
          >
            <SplitComparisonMapView className="h-[80vh]" />
          </motion.div>
        </motion.div>
      );
    }

    // Google Maps Route Optimization Tab
    if (activeTab === 'gmaps') {
      return (
        <motion.div 
          className="space-y-6 h-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Google Maps Route Optimization - Full Height */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="h-full"
          >
            <GoogleMapsRouteOptimizationMap onResults={(results) => {
              console.log('Google Maps Optimization Results:', results);
            }} />
          </motion.div>
        </motion.div>
      );
    }

    // Individual algorithm tab
    const result = getResultByAlgorithm(activeTab);
    if (!result) {
      return (
        <motion.div 
          className="h-64 flex items-center justify-center text-muted-foreground"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center">
            <motion.div 
              className="text-6xl mb-4"
              animate={{ rotate: [0, 10, 0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {algorithmInfo[activeTab as keyof typeof algorithmInfo]?.icon || '📊'}
            </motion.div>
            <p className="text-lg font-medium">No results available</p>
            <p className="text-sm mt-2">Run comparison to see detailed results for this algorithm</p>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {/* Individual Algorithm Map */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <MapView className="mb-6" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <AlgorithmDetailCard
            result={result}
            onClick={() => setCurrentRoute(result)}
          />
        </motion.div>
        
        {/* Algorithm-specific insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{algorithmInfo[activeTab as keyof typeof algorithmInfo]?.icon}</span>
                Algorithm Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <div className="text-2xl font-bold text-primary">
                    {result.stats.iterations.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Iterations</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <div className="text-2xl font-bold text-green-600">
                    {result.stats.durationMs}ms
                  </div>
                  <div className="text-sm text-muted-foreground">Execution Time</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <div className="text-2xl font-bold text-orange-600">
                    {(result.totalDistanceKm / result.estimatedTimeMin * 60).toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Efficiency Score</div>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground leading-relaxed">
                <p>
                  This algorithm achieved a {result.totalDistanceKm.toFixed(1)}km route with an estimated 
                  travel time of {Math.floor(result.estimatedTimeMin / 60)}h {Math.floor(result.estimatedTimeMin % 60)}m. 
                  Performance analysis shows {result.constraintSatisfaction.capacity ? 'successful' : 'failed'} capacity 
                  constraint satisfaction and {result.constraintSatisfaction.maxTravelTime ? 'met' : 'exceeded'} time limits.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <motion.div 
      className="h-full flex flex-col gap-4"
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Status Indicator */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <StatusIndicator 
          status={getSystemStatus() as any}
          message={
            isOptimizing ? 'Running optimization algorithm...' :
            isComparing ? 'Comparing multiple algorithms...' :
            comparisonResults.length > 0 ? 'Route optimization complete' :
            'Ready for route optimization'
          }
        />
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        {/* Tab Navigation */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <TabsList className="grid w-full grid-cols-7 mb-6 p-1 bg-muted/50 backdrop-blur-sm">
            {Object.entries(algorithmInfo).map(([key, info]) => (
              <TabsTrigger 
                key={key} 
                value={key}
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <span className="text-lg">{info.icon}</span>
                <span className="hidden sm:inline font-medium">{info.label}</span>
                {key !== 'comparison' && key !== 'split' && getResultByAlgorithm(key) && (
                  <Badge variant="secondary" className="ml-1 scale-75">
                    ✓
                  </Badge>
                )}
                {key === 'split' && comparisonResults.length >= 2 && (
                  <Badge variant="secondary" className="ml-1 scale-75">
                    ✓
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </motion.div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            {Object.keys(algorithmInfo).map(key => (
              <TabsContent key={key} value={key} className="h-full">
                {renderTabContent()}
              </TabsContent>
            ))}
          </AnimatePresence>
        </div>
      </Tabs>
    </motion.div>
  );
};
