import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Moon, 
  Sun, 
  Settings, 
  Activity,
  Atom,
  Cpu,
  Layers,
  MapPin
} from 'lucide-react';
import { useRoutingStore } from '../lib/store';
import { QuantumButton, QuantumBadge } from './ui/QuantumUI';

export const QuantumTopBar: React.FC = () => {
  const { theme, toggleTheme, isOptimizing, isComparing, locations, comparisonResults } = useRoutingStore();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      {/* Main TopBar */}
      <motion.header 
        className="sticky top-0 z-50 quantum-glass border-b border-white/10 backdrop-blur-xl"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo & Title */}
          <motion.div 
            className="flex items-center gap-4"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="relative"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Atom className="w-8 h-8 text-quantum-primary quantum-glow" />
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: [0, -360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="w-4 h-4 text-quantum-cyan absolute top-0 left-1/2 transform -translate-x-1/2" />
              </motion.div>
            </motion.div>
            
            <div>
              <motion.h1 
                className="quantum-heading text-xl md:text-2xl font-bold"
                animate={{ 
                  textShadow: [
                    '0 0 5px currentColor',
                    '0 0 20px currentColor, 0 0 30px currentColor',
                    '0 0 5px currentColor'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                Quantum Route
              </motion.h1>
              <p className="quantum-text text-sm opacity-80">
                AI-Powered Optimization
              </p>
            </div>
          </motion.div>

          {/* Status Indicators */}
          <div className="hidden md:flex items-center gap-4">
            <AnimatePresence>
              {locations.length > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-quantum-electric" />
                  <QuantumBadge variant="success" pulse>
                    {locations.length} Locations
                  </QuantumBadge>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {comparisonResults.length > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Layers className="w-4 h-4 text-quantum-secondary" />
                  <QuantumBadge variant="secondary" pulse>
                    {comparisonResults.length} Algorithms
                  </QuantumBadge>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {(isOptimizing || isComparing) && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Cpu className="w-4 h-4 text-quantum-primary" />
                  </motion.div>
                  <QuantumBadge variant="primary" pulse>
                    {isComparing ? 'Comparing' : 'Optimizing'}
                  </QuantumBadge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            
            {/* System Status */}
            <motion.div
              className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg quantum-glass"
              animate={{ 
                boxShadow: [
                  '0 0 10px rgba(0, 247, 255, 0.2)',
                  '0 0 20px rgba(0, 247, 255, 0.4)',
                  '0 0 10px rgba(0, 247, 255, 0.2)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Activity className="w-4 h-4 text-quantum-electric" />
              </motion.div>
              <span className="text-xs quantum-text">
                System Active
              </span>
            </motion.div>

            {/* Theme Toggle */}
            <QuantumButton
              variant="secondary"
              size="sm"
              onClick={toggleTheme}
              icon={theme === 'light' ? Moon : Sun}
            >
              <span className="hidden sm:inline">
                {theme === 'light' ? 'Dark' : 'Light'}
              </span>
            </QuantumButton>

            {/* Settings */}
            <QuantumButton
              variant="accent"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              icon={Settings}
            >
              <span className="hidden sm:inline">Settings</span>
            </QuantumButton>
          </div>
        </div>

        {/* Quantum Energy Lines */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-quantum-primary to-transparent"
          animate={{
            opacity: [0.3, 1, 0.3],
            scaleX: [0.8, 1, 0.8]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.header>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              className="fixed top-20 right-4 quantum-card max-w-sm"
              initial={{ opacity: 0, x: 100, y: -20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 100, y: -20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="quantum-heading text-lg mb-4">Quantum Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="quantum-text">Theme</span>
                  <QuantumButton size="sm" onClick={toggleTheme}>
                    {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                  </QuantumButton>
                </div>
                <div className="flex items-center justify-between">
                  <span className="quantum-text">Animations</span>
                  <QuantumBadge variant="success">Enabled</QuantumBadge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="quantum-text">3D Effects</span>
                  <QuantumBadge variant="primary">Active</QuantumBadge>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
