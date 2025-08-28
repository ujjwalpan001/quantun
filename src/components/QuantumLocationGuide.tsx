import React from 'react';
import { motion } from 'framer-motion';
import { Star, Search, MapPin, Zap } from 'lucide-react';

export const QuantumLocationGuide: React.FC = () => {
  return (
    <motion.div 
      className="quantum-glass rounded-lg p-4 relative overflow-hidden border border-quantum-primary/30"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-quantum-primary rounded-full"
            style={{
              left: `${20 + i * 20}%`,
              top: `${30 + i * 10}%`
            }}
            animate={{
              scale: [0.5, 1, 0.5],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{
              duration: 2 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex gap-3">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <Zap className="h-5 w-5 text-quantum-primary quantum-glow flex-shrink-0" />
        </motion.div>
        
        <div className="text-sm">
          <div className="space-y-3">
            <motion.div 
              className="quantum-heading text-base font-semibold"
              animate={{ 
                textShadow: [
                  '0 0 5px currentColor',
                  '0 0 20px currentColor',
                  '0 0 5px currentColor'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              Quantum Location Input
            </motion.div>
            
            <div className="space-y-2 quantum-text">
              <motion.div 
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  }}
                >
                  <Star className="w-4 h-4 text-quantum-primary quantum-glow" />
                </motion.div>
                <span className="text-quantum-cyan">
                  Click <span className="quantum-glass px-2 py-1 rounded text-xs border border-quantum-primary/50 text-quantum-primary font-mono">Quick Add</span> for samples
                </span>
              </motion.div>
              
              <motion.div 
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Search className="w-4 h-4 text-quantum-secondary quantum-glow" />
                </motion.div>
                <span className="text-quantum-cyan">
                  Search any address: <span className="text-quantum-electric font-mono">"Gateway of India Mumbai"</span>
                </span>
              </motion.div>
              
              <motion.div 
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <motion.div
                  animate={{ 
                    y: [-2, 2, -2],
                    rotate: [0, 5, 0, -5, 0]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <MapPin className="w-4 h-4 text-quantum-purple quantum-glow" />
                </motion.div>
                <span className="text-quantum-cyan">
                  Add precise coordinates manually
                </span>
              </motion.div>
            </div>
            
            {/* Enhanced tip with animation */}
            <motion.div 
              className="quantum-glass p-2 rounded border border-quantum-electric/30 mt-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-center gap-2 text-xs">
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                    scale: [0.8, 1.2, 0.8]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                >
                  <span className="text-quantum-electric text-sm">⚡</span>
                </motion.div>
                <span className="text-quantum-electric font-medium">
                  Quantum-accurate distance calculations using Haversine formula
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Quantum energy border animation */}
      <motion.div
        className="absolute inset-0 rounded-lg border-2 border-transparent"
        style={{
          background: `linear-gradient(45deg, 
            transparent, 
            rgba(0, 247, 255, 0.3), 
            transparent, 
            rgba(125, 77, 255, 0.3), 
            transparent)`
        }}
        animate={{ 
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  );
};
