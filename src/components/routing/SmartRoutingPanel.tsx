import React from 'react';
import { Play, BarChart3, Cpu, Atom, Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { LocationInput } from './LocationInput';
import { ConstraintsPanel } from './ConstraintsPanel';
import { RouteSummaryCard } from './RouteSummaryCard';
import { useRoutingStore } from '../../lib/store';
import { apiClient } from '../../lib/api-client';

const algorithmStyles = {
  classical: { color: 'from-blue-500 to-blue-700', icon: Cpu, emoji: '⚡' },
  sqa: { color: 'from-purple-500 to-purple-700', icon: Atom, emoji: '🌌' },
  qiea: { color: 'from-pink-500 to-pink-700', icon: Sparkles, emoji: '✨' },
  qaoa: { color: 'from-green-500 to-green-700', icon: Zap, emoji: '🎯' },
};

export const SmartRoutingPanel: React.FC = () => {
  const {
    locations,
    constraints,
    selectedAlgorithm,
    setSelectedAlgorithm,
    isOptimizing,
    isComparing,
    setIsOptimizing,
    setIsComparing,
    setCurrentRoute,
    setComparisonResults,
  } = useRoutingStore();

  const [progress, setProgress] = React.useState(0);

  const canOptimize = locations.length >= 2 && !isOptimizing && !isComparing;

  const handleOptimize = async () => {
    if (locations.length < 2) return;

    setIsOptimizing(true);
    setProgress(0);
    
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 15, 95));
    }, 200);

    try {
      const result = await apiClient.mockOptimize({
        locations,
        constraints,
        algorithm: selectedAlgorithm,
        options: { iterations: 1000 },
      });
      setProgress(100);
      setCurrentRoute(result);
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsOptimizing(false);
        setProgress(0);
      }, 500);
    }
  };

  const handleCompareAlgorithms = async () => {
    if (locations.length < 2) return;

    setIsComparing(true);
    setProgress(0);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 10, 95));
    }, 300);

    try {
      const result = await apiClient.mockCompare({
        locations,
        constraints,
        algorithms: ['classical', 'sqa', 'qiea', 'qaoa'],
      });
      setProgress(100);
      setComparisonResults(result.results);
      setCurrentRoute(result.results.find(r => r.algorithm.includes(result.best.algorithm)) || result.results[0]);
    } catch (error) {
      console.error('Comparison failed:', error);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsComparing(false);
        setProgress(0);
      }, 500);
    }
  };

  return (
    <motion.div 
      className="h-full flex flex-col gap-6"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Location Input */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <LocationInput />
      </motion.div>

      {/* Algorithm Selection Panel */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="p-4 rounded-xl bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border"
      >
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Cpu className="w-4 h-4" />
          Quantum Algorithm Selection
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(algorithmStyles).map(([key, style]) => {
            const IconComponent = style.icon;
            const isSelected = selectedAlgorithm === key;
            return (
              <motion.button
                key={key}
                onClick={() => setSelectedAlgorithm(key as any)}
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  isSelected 
                    ? `bg-gradient-to-r ${style.color} text-white border-transparent shadow-md` 
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={isSelected ? { 
                  boxShadow: ['0 0 0 0 rgba(59, 130, 246, 0.4)', '0 0 0 10px rgba(59, 130, 246, 0)', '0 0 0 0 rgba(59, 130, 246, 0)'],
                } : {}}
                transition={{ duration: 1.5, repeat: isSelected ? Infinity : 0 }}
              >
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-base">{style.emoji}</span>
                  <IconComponent className="w-3 h-3" />
                </div>
                <div className="text-xs font-medium mt-1 capitalize">
                  {key === 'qiea' ? 'QI-EA' : key.toUpperCase()}
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Constraints Panel */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <ConstraintsPanel />
      </motion.div>

      {/* Action Buttons */}
      <motion.div 
        className="grid grid-cols-1 gap-3"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {/* Enhanced Progress Bar with Particle Effects */}
        {(isOptimizing || isComparing) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 p-6 rounded-xl bg-gradient-to-r from-blue-50/80 via-purple-50/80 to-pink-50/80 dark:from-blue-950/40 dark:via-purple-950/40 dark:to-pink-950/40 border-2 border-gradient-to-r from-blue-200 to-purple-200"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center justify-center gap-3"
            >
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.2, 1],
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                {isOptimizing ? (
                  <div className="text-2xl">🌌</div>
                ) : (
                  <div className="text-2xl">⚡</div>
                )}
              </motion.div>
              <div className="text-center">
                <motion.div 
                  className="text-sm font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {isOptimizing ? 'Quantum Route Optimization in Progress...' : 'Multi-Algorithm Quantum Analysis...'}
                </motion.div>
                <motion.div 
                  className="text-xs text-gray-600 dark:text-gray-400 mt-1"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                >
                  {Math.round(progress)}% Complete • Using {selectedAlgorithm.toUpperCase()} Algorithm
                </motion.div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              className="relative"
            >
              <Progress 
                value={progress} 
                className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full"
                style={{ width: `${progress}%` }}
                animate={{
                  boxShadow: [
                    '0 0 5px rgba(59, 130, 246, 0.5)',
                    '0 0 20px rgba(147, 51, 234, 0.5)',
                    '0 0 5px rgba(236, 72, 153, 0.5)',
                    '0 0 5px rgba(59, 130, 246, 0.5)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>

            {/* Floating Particles Animation */}
            <div className="relative h-4 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                  animate={{
                    x: [-10, window.innerWidth || 300],
                    y: [Math.random() * 20, Math.random() * 20],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
        
        <motion.div 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }}
          animate={isOptimizing ? {
            boxShadow: ['0 0 20px rgba(59, 130, 246, 0.3)', '0 0 30px rgba(59, 130, 246, 0.1)', '0 0 20px rgba(59, 130, 246, 0.3)'],
          } : {}}
          transition={{ duration: 1.5, repeat: isOptimizing ? Infinity : 0 }}
        >
          <Button 
            onClick={handleOptimize}
            disabled={!canOptimize || isOptimizing}
            className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 h-12 text-white shadow-lg"
            size="lg"
          >
            {isOptimizing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
                <span className="ml-2">Quantum Optimizing...</span>
              </>
            ) : (
              <>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Play className="w-4 h-4" />
                </motion.div>
                <span className="ml-2">{`Optimize with ${selectedAlgorithm.toUpperCase()}`}</span>
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {algorithmStyles[selectedAlgorithm as keyof typeof algorithmStyles] && (
                    <span className="ml-2 text-lg">
                      {algorithmStyles[selectedAlgorithm as keyof typeof algorithmStyles].emoji}
                    </span>
                  )}
                </motion.div>
              </>
            )}
          </Button>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }}
          animate={isComparing ? {
            borderColor: ['#8b5cf6', '#06b6d4', '#10b981', '#8b5cf6'],
          } : {}}
          transition={{ duration: 2, repeat: isComparing ? Infinity : 0 }}
        >
          <Button
            variant="outline"
            onClick={handleCompareAlgorithms}
            disabled={!canOptimize || isComparing}
            className="w-full border-2 border-purple-200 hover:border-purple-400 bg-gradient-to-r from-purple-50/50 to-pink-50/50 hover:from-purple-100/50 hover:to-pink-100/50 transition-all duration-300 h-12"
            size="lg"
          >
            {isComparing ? (
              <>
                <motion.div
                  animate={{ rotate: [0, 180, 360] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                </motion.div>
                <span className="ml-2 text-purple-700">Quantum Analysis...</span>
              </>
            ) : (
              <>
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                </motion.div>
                <span className="ml-2 text-purple-700">Compare All Algorithms</span>
                <motion.span 
                  className="ml-2 text-sm"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ⚡🌌✨🎯
                </motion.span>
              </>
            )}
          </Button>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="ghost"
            disabled={!canOptimize}
            className="w-full hover:bg-muted/50 transition-all duration-200"
            size="lg"
          >
            <Zap className="w-4 h-4 mr-2" />
            Simulate Route
          </Button>
        </motion.div>
      </motion.div>

      {/* Route Summary */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <RouteSummaryCard />
      </motion.div>
    </motion.div>
  );
};
