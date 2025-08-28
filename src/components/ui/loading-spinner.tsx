import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'quantum' | 'pulse';
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  variant = 'default',
  message 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'quantum':
        return (
          <motion.div
            className="relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className={`${sizeClasses[size]} rounded-full border-2 border-blue-500/20`}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className={`absolute inset-0 ${sizeClasses[size]} rounded-full border-2 border-t-blue-500 border-r-purple-500`}
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className={`absolute inset-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-600`}
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        );
      
      case 'pulse':
        return (
          <motion.div
            className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600`}
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        );
      
      default:
        return (
          <Loader2 
            className={`${sizeClasses[size]} animate-spin text-blue-600`} 
          />
        );
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {renderSpinner()}
      <AnimatePresence>
        {message && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-muted-foreground text-center"
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};
