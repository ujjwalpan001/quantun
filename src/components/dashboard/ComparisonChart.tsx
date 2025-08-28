import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useRoutingStore } from '../../lib/store';
import { motion } from 'framer-motion';

export const ComparisonChart: React.FC = () => {
  const { comparisonResults } = useRoutingStore();

  if (comparisonResults.length === 0) {
    return (
      <motion.div 
        className="h-64 flex items-center justify-center text-quantum-text/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center quantum-glass p-8 rounded-xl border border-quantum-primary/20">
          <motion.div 
            className="text-6xl mb-4"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            📊
          </motion.div>
          <p className="quantum-subheading">Run algorithm comparison to see quantum route analysis</p>
        </div>
      </motion.div>
    );
  }

  const chartData = comparisonResults.map((result) => ({
    algorithm: result.algorithm.split(' ')[0] || result.algorithm, // Shorten names for chart
    distance: Number(result.totalDistanceKm) || 0,
    time: Number(result.estimatedTimeMin) || 0,
    computationTime: Number(result.stats?.durationMs) || 0,
  }));

  // Quantum color scheme
  const quantumColors = {
    distance: '#00f7ff',  // Quantum primary
    time: '#7d4dff',      // Quantum secondary  
    computation: '#00ffff' // Quantum cyan
  };

  return (
    <div className="space-y-6">
      {/* Distance Comparison */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="quantum-glass p-6 rounded-xl border border-quantum-primary/20"
      >
        <h4 className="quantum-subheading text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-2xl">📏</span>
          Route Distance Comparison
        </h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 247, 255, 0.1)" />
            <XAxis 
              dataKey="algorithm" 
              tick={{ fill: '#ffffff', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(0, 247, 255, 0.3)' }}
            />
            <YAxis 
              tick={{ fill: '#ffffff', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(0, 247, 255, 0.3)' }}
            />
            <Tooltip 
              formatter={(value: number) => [`${value.toFixed(2)} km`, 'Distance']}
              contentStyle={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(0, 247, 255, 0.3)',
                borderRadius: '8px',
                color: '#ffffff'
              }}
            />
            <Legend wrapperStyle={{ color: '#ffffff' }} />
            <Bar 
              dataKey="distance" 
              fill={quantumColors.distance}
              style={{ filter: 'drop-shadow(0 0 8px rgba(0, 247, 255, 0.6))' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Time Comparison */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="quantum-glass p-6 rounded-xl border border-quantum-primary/20"
      >
        <h4 className="quantum-subheading text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-2xl">⏱️</span>
          Estimated Travel Time
        </h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 247, 255, 0.1)" />
            <XAxis 
              dataKey="algorithm" 
              tick={{ fill: '#ffffff', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(0, 247, 255, 0.3)' }}
            />
            <YAxis 
              tick={{ fill: '#ffffff', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(0, 247, 255, 0.3)' }}
            />
            <Tooltip 
              formatter={(value: number) => [
                `${Math.floor(value / 60)}h ${Math.floor(value % 60)}m`, 
                'Time'
              ]}
              contentStyle={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(125, 77, 255, 0.3)',
                borderRadius: '8px',
                color: '#ffffff'
              }}
            />
            <Legend wrapperStyle={{ color: '#ffffff' }} />
            <Bar 
              dataKey="time" 
              fill={quantumColors.time}
              style={{ filter: 'drop-shadow(0 0 8px rgba(125, 77, 255, 0.6))' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Computation Time */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="quantum-glass p-6 rounded-xl border border-quantum-primary/20"
      >
        <h4 className="quantum-subheading text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          Algorithm Performance
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 247, 255, 0.1)" />
            <XAxis 
              dataKey="algorithm" 
              tick={{ fill: '#ffffff', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(0, 247, 255, 0.3)' }}
            />
            <YAxis 
              tick={{ fill: '#ffffff', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(0, 247, 255, 0.3)' }}
            />
            <Tooltip 
              formatter={(value: number) => [`${value.toFixed(0)}ms`, 'Computation Time']}
              contentStyle={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                borderRadius: '8px',
                color: '#ffffff'
              }}
            />
            <Legend wrapperStyle={{ color: '#ffffff' }} />
            <Bar 
              dataKey="computationTime" 
              fill={quantumColors.computation}
              style={{ filter: 'drop-shadow(0 0 8px rgba(0, 255, 255, 0.6))' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};
