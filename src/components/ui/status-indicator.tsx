import React from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, Clock, Zap, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';

interface StatusIndicatorProps {
  status: 'idle' | 'optimizing' | 'comparing' | 'complete' | 'error';
  message?: string;
  progress?: number;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  status, 
  message,
  progress = 0
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'idle':
        return {
          icon: Activity,
          color: 'text-gray-500',
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          badgeVariant: 'secondary' as const,
          label: 'Ready'
        };
      case 'optimizing':
        return {
          icon: Clock,
          color: 'text-blue-500',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          badgeVariant: 'default' as const,
          label: 'Optimizing'
        };
      case 'comparing':
        return {
          icon: Zap,
          color: 'text-purple-500',
          bgColor: 'bg-purple-100 dark:bg-purple-900/30',
          badgeVariant: 'default' as const,
          label: 'Comparing'
        };
      case 'complete':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          badgeVariant: 'default' as const,
          label: 'Complete'
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          badgeVariant: 'destructive' as const,
          label: 'Error'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <motion.div
          className={`p-2 rounded-lg ${config.bgColor}`}
          animate={{ 
            scale: status === 'optimizing' || status === 'comparing' ? [1, 1.1, 1] : 1 
          }}
          transition={{ 
            duration: 2, 
            repeat: status === 'optimizing' || status === 'comparing' ? Infinity : 0 
          }}
        >
          <Icon className={`w-5 h-5 ${config.color} ${
            status === 'optimizing' || status === 'comparing' ? 'animate-pulse' : ''
          }`} />
        </motion.div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">System Status</span>
            <Badge variant={config.badgeVariant}>{config.label}</Badge>
          </div>
          {message && (
            <p className="text-xs text-muted-foreground mt-1">{message}</p>
          )}
          {(status === 'optimizing' || status === 'comparing') && progress > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <motion.div 
                  className={`h-1.5 rounded-full ${
                    status === 'optimizing' ? 'bg-blue-500' : 'bg-purple-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
