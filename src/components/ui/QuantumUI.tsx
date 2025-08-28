import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface QuantumButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const QuantumButton: React.FC<QuantumButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled = false,
  loading = false,
  className = ''
}) => {
  const variants = {
    primary: 'border-quantum-primary text-quantum-primary hover:border-quantum-cyan hover:text-quantum-cyan',
    secondary: 'border-quantum-secondary text-quantum-secondary hover:border-quantum-cyan hover:text-quantum-cyan',
    accent: 'border-quantum-cyan text-quantum-cyan hover:border-quantum-primary hover:text-quantum-primary'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <motion.button
      className={`
        quantum-btn relative overflow-hidden font-orbitron font-semibold
        ${variants[variant]} ${sizes[size]} ${className}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onClick={!disabled && !loading ? onClick : undefined}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.05, y: -2 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98, y: 0 } : {}}
      transition={{ duration: 0.2 }}
    >
      {/* Ripple Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
        animate={{ x: ['0%', '200%'] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
          <div className="quantum-loader w-4 h-4" />
        ) : (
          <>
            {Icon && <Icon className="w-5 h-5 quantum-icon" />}
            {children}
          </>
        )}
      </div>
      
      {/* Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-lg opacity-0"
        style={{
          background: `radial-gradient(circle, ${
            variant === 'primary' ? 'rgba(0, 247, 255, 0.4)' :
            variant === 'secondary' ? 'rgba(125, 77, 255, 0.4)' :
            'rgba(0, 255, 255, 0.4)'
          } 0%, transparent 70%)`
        }}
        animate={{
          opacity: [0, 0.6, 0],
          scale: [0.8, 1.3, 0.8]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.button>
  );
};

interface QuantumCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  title?: string;
  icon?: LucideIcon;
}

export const QuantumCard: React.FC<QuantumCardProps> = ({
  children,
  className = '',
  hover = true,
  glow = false,
  title,
  icon: Icon
}) => {
  return (
    <motion.div
      className={`quantum-card relative ${className} ${glow ? 'quantum-glow' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { 
        y: -8, 
        scale: 1.02,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(0, 247, 255, 0.3)'
      } : {}}
      transition={{ duration: 0.3 }}
    >
      {/* Animated Border */}
      <motion.div
        className="absolute -inset-1 rounded-2xl opacity-0 bg-gradient-to-r from-quantum-primary via-quantum-secondary to-quantum-accent blur-sm"
        animate={{
          opacity: [0, 0.7, 0],
          rotate: [0, 360]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      {/* Card Header */}
      {(title || Icon) && (
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
          {Icon && (
            <motion.div
              className="quantum-icon text-2xl"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Icon />
            </motion.div>
          )}
          {title && (
            <h3 className="quantum-heading text-xl">{title}</h3>
          )}
        </div>
      )}
      
      {/* Card Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Floating Particles */}
      {glow && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-quantum-primary rounded-full"
              style={{
                left: `${20 + i * 30}%`,
                top: `${30 + i * 20}%`
              }}
              animate={{
                y: [-10, -30, -10],
                opacity: [0.3, 1, 0.3],
                scale: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

interface QuantumInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number';
  disabled?: boolean;
  icon?: LucideIcon;
  label?: string;
  className?: string;
}

export const QuantumInput: React.FC<QuantumInputProps> = ({
  placeholder,
  value,
  onChange,
  type = 'text',
  disabled = false,
  icon: Icon,
  label,
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-quantum-cyan mb-2 quantum-subheading">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-quantum-primary">
            <Icon className="w-5 h-5 quantum-icon" />
          </div>
        )}
        <motion.input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className={`
            quantum-input w-full font-exo
            ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-3
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          whileFocus={{
            scale: 1.02,
            boxShadow: '0 0 20px rgba(0, 247, 255, 0.4)',
          }}
          transition={{ duration: 0.2 }}
        />
        
        {/* Focus Glow */}
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-quantum-primary opacity-0 pointer-events-none"
          whileFocus={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      </div>
    </div>
  );
};

interface QuantumBadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  pulse?: boolean;
  className?: string;
}

export const QuantumBadge: React.FC<QuantumBadgeProps> = ({
  children,
  variant = 'primary',
  pulse = false,
  className = ''
}) => {
  const variants = {
    primary: 'bg-quantum-primary/20 text-quantum-primary border-quantum-primary',
    secondary: 'bg-quantum-secondary/20 text-quantum-secondary border-quantum-secondary',
    success: 'bg-quantum-electric/20 text-quantum-electric border-quantum-electric',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-400',
    error: 'bg-red-500/20 text-red-400 border-red-400'
  };

  return (
    <motion.span
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border
        backdrop-filter backdrop-blur-sm font-rajdhani
        ${variants[variant]} ${className}
        ${pulse ? 'quantum-pulse' : ''}
      `}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.span>
  );
};
