import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuantumTopBar } from './components/QuantumTopBar';
import { SmartRoutingPanel } from './components/routing/SmartRoutingPanel';
import { InteractiveDashboard } from './components/dashboard/InteractiveDashboard';
import { QuantumFleetControls } from './components/routing/QuantumFleetControls';
import { Quantum3DBackground } from './components/background/Quantum3DBackground';
import { useRoutingStore } from './lib/store';
import { Monitor, PanelLeftOpen, PanelRightOpen } from 'lucide-react';
import './styles/enhanced-globals.css';

type PanelView = 'split' | 'left' | 'right';

function App() {
  const { theme } = useRoutingStore();
  const [panelView, setPanelView] = useState<PanelView>('split');

  useEffect(() => {
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const togglePanel = (view: PanelView) => {
    setPanelView(view);
  };

  return (
    <div className="min-h-screen relative overflow-hidden quantum-bg">
      {/* Quantum 3D Background */}
      <div className="quantum-background" />
      <Quantum3DBackground />
      
      {/* Quantum Panel Toggle Controls */}
      <motion.div 
        className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 flex gap-2"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.button
          onClick={() => togglePanel('left')}
          className={`quantum-btn quantum-glass px-4 py-2 flex items-center gap-2 border ${
            panelView === 'left' 
              ? 'border-quantum-cyan shadow-quantum-cyan/50' 
              : 'border-quantum-primary/30'
          }`}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          animate={panelView === 'left' ? { 
            boxShadow: [
              '0 0 10px rgba(0, 247, 255, 0.3)',
              '0 0 30px rgba(0, 247, 255, 0.5)',
              '0 0 10px rgba(0, 247, 255, 0.3)'
            ]
          } : {}}
          transition={{ duration: 2, repeat: panelView === 'left' ? Infinity : 0 }}
        >
          <PanelLeftOpen className="w-4 h-4" />
          <span className="text-xs font-medium">Controls</span>
        </motion.button>

        <motion.button
          onClick={() => togglePanel('split')}
          className={`quantum-btn quantum-glass px-4 py-2 flex items-center gap-2 border ${
            panelView === 'split' 
              ? 'border-quantum-cyan shadow-quantum-cyan/50' 
              : 'border-quantum-primary/30'
          }`}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          animate={panelView === 'split' ? { 
            boxShadow: [
              '0 0 10px rgba(0, 247, 255, 0.3)',
              '0 0 30px rgba(0, 247, 255, 0.5)',
              '0 0 10px rgba(0, 247, 255, 0.3)'
            ]
          } : {}}
          transition={{ duration: 2, repeat: panelView === 'split' ? Infinity : 0 }}
        >
          <Monitor className="w-4 h-4" />
          <span className="text-xs font-medium">Split</span>
        </motion.button>

        <motion.button
          onClick={() => togglePanel('right')}
          className={`quantum-btn quantum-glass px-4 py-2 flex items-center gap-2 border ${
            panelView === 'right' 
              ? 'border-quantum-cyan shadow-quantum-cyan/50' 
              : 'border-quantum-primary/30'
          }`}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          animate={panelView === 'right' ? { 
            boxShadow: [
              '0 0 10px rgba(0, 247, 255, 0.3)',
              '0 0 30px rgba(0, 247, 255, 0.5)',
              '0 0 10px rgba(0, 247, 255, 0.3)'
            ]
          } : {}}
          transition={{ duration: 2, repeat: panelView === 'right' ? Infinity : 0 }}
        >
          <PanelRightOpen className="w-4 h-4" />
          <span className="text-xs font-medium">Analysis</span>
        </motion.button>
      </motion.div>
      
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <QuantumTopBar />
          
          <main className="container mx-auto p-4 max-w-7xl">
            <motion.div 
              className="relative h-[calc(100vh-5rem)] overflow-hidden"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {/* Left Panel */}
              <AnimatePresence>
                {(panelView === 'split' || panelView === 'left') && (
                  <motion.div
                    className={`absolute top-0 left-0 h-full space-y-6 overflow-auto z-10 ${
                      panelView === 'left' ? 'w-full' : 'w-[50%]'
                    }`}
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 30,
                      duration: 0.8 
                    }}
                  >
                    <motion.div 
                      className="quantum-glass rounded-2xl border border-quantum-primary/20 shadow-2xl quantum-glow h-fit"
                      whileHover={{ scale: 1.01, y: -4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SmartRoutingPanel />
                    </motion.div>
                    
                    {/* Quantum Fleet Controls */}
                    <motion.div
                      whileHover={{ scale: 1.01, y: -4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <QuantumFleetControls />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Right Panel */}
              <AnimatePresence>
                {(panelView === 'split' || panelView === 'right') && (
                  <motion.div
                    className={`absolute top-0 h-full ${
                      panelView === 'right' ? 'w-full left-0' : 'w-[50%] right-0'
                    }`}
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 100, opacity: 0 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 30,
                      duration: 0.8 
                    }}
                  >
                    <motion.div 
                      className="quantum-glass rounded-2xl p-6 border border-quantum-primary/20 shadow-2xl h-full quantum-glow"
                      whileHover={{ scale: 1.005, y: -2 }}
                      transition={{ duration: 0.2 }}
                    >
                      <InteractiveDashboard />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </main>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default App;
