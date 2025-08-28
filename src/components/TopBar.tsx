import React from 'react';
import { Sun, Moon, HelpCircle, Zap, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useRoutingStore } from '../lib/store';

export const TopBar: React.FC = () => {
  const { theme, toggleTheme, isOptimizing, isComparing, locations } = useRoutingStore();

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60"
    >
      <motion.div 
        className="flex items-center gap-4"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2">
          <motion.div
            className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Zap className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              QuantumRoute India
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Smart Routing for Indian Cities
            </p>
          </div>
        </div>
        
        {/* Status Indicators */}
        <div className="hidden md:flex items-center gap-2">
          {locations.length > 0 && (
            <Badge variant="secondary">
              {locations.length} location{locations.length !== 1 ? 's' : ''}
            </Badge>
          )}
          
          {isOptimizing && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Badge variant="warning" className="animate-pulse">
                Optimizing...
              </Badge>
            </motion.div>
          )}
          
          {isComparing && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Badge variant="success" className="animate-pulse">
                Comparing Algorithms...
              </Badge>
            </motion.div>
          )}
        </div>
      </motion.div>
      
      <motion.div 
        className="flex items-center gap-2"
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground transition-all hover:scale-105"
        >
          <Settings className="w-4 h-4" />
          <span className="sr-only">Settings</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground transition-all hover:scale-105"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="sr-only">Help</span>
        </Button>
        
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground transition-all"
          >
            <motion.div
              initial={false}
              animate={{ rotate: theme === 'dark' ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </motion.div>
            <span className="sr-only">Toggle theme</span>
          </Button>
        </motion.div>
      </motion.div>
    </motion.header>
  );
};
