import React, { useState, useRef } from 'react';
import { Plus, MapPin, GripVertical, X, Search, Star } from 'lucide-react';
import { Reorder, motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { QuantumLocationGuide } from '../QuantumLocationGuide';
import { RouteDistanceDisplay } from '../RouteDistanceDisplay';
import { useRoutingStore } from '../../lib/store';
import { GeocodingService, SAMPLE_ADDRESSES, type GeocodingResult } from '../../lib/geocoding';
import type { Location } from '../../types/routing';

export const LocationInput: React.FC = () => {
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: '', lng: '' });
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);
  
  const { locations, addLocation, removeLocation, reorderLocations } = useRoutingStore();

  const handleAddressSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await GeocodingService.searchAddress(query);
      setSearchResults(results);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddressChange = (value: string) => {
    setAddress(value);
    
    // Debounce the search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      handleAddressSearch(value);
    }, 300);
  };

  const handleAddLocation = (result: GeocodingResult) => {
    const newLocation: Location = {
      id: Date.now().toString(),
      lat: result.lat,
      lng: result.lng,
      address: result.displayName,
    };
    
    addLocation(newLocation);
    setAddress('');
    setSearchResults([]);
    setShowSuggestions(false);
  };

  const handleAddByAddress = () => {
    if (!address.trim() || searchResults.length === 0) return;
    handleAddLocation(searchResults[0]);
  };

  const handleAddSample = (sample: typeof SAMPLE_ADDRESSES[0]) => {
    const newLocation: Location = {
      id: Date.now().toString(),
      lat: sample.lat,
      lng: sample.lng,
      address: sample.address,
    };
    
    addLocation(newLocation);
  };

  const handleAddByCoordinates = async () => {
    const lat = parseFloat(coordinates.lat);
    const lng = parseFloat(coordinates.lng);
    
    if (isNaN(lat) || isNaN(lng)) return;
    
    try {
      const address = await GeocodingService.reverseGeocode(lat, lng);
      const newLocation: Location = {
        id: Date.now().toString(),
        lat,
        lng,
        address,
      };
      
      addLocation(newLocation);
      setCoordinates({ lat: '', lng: '' });
    } catch (error) {
      // Fallback to coordinates if reverse geocoding fails
      const newLocation: Location = {
        id: Date.now().toString(),
        lat,
        lng,
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      };
      
      addLocation(newLocation);
      setCoordinates({ lat: '', lng: '' });
    }
  };

  return (
    <Card className="quantum-glass border-quantum-primary/30">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 4, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <MapPin className="w-6 h-6 quantum-icon text-quantum-primary" />
          </motion.div>
          <motion.span
            className="quantum-heading text-xl"
            animate={{ 
              textShadow: [
                '0 0 5px currentColor',
                '0 0 20px currentColor',
                '0 0 5px currentColor'
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            Delivery Locations
          </motion.span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quantum Guide */}
        {locations.length === 0 && <QuantumLocationGuide />}

        {/* Quick Sample Addresses */}
        <div className="space-y-3">
          <motion.label 
            className="quantum-subheading text-sm font-semibold flex items-center gap-2"
            animate={{ 
              textShadow: [
                '0 0 5px currentColor',
                '0 0 15px currentColor',
                '0 0 5px currentColor'
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Star className="w-4 h-4 quantum-icon" />
            </motion.div>
            Quantum Sample Locations
          </motion.label>
          <div className="grid grid-cols-2 gap-3">
            {SAMPLE_ADDRESSES.map((sample, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddSample(sample)}
                  className="quantum-glass text-xs p-3 h-auto w-full flex flex-col items-start border-quantum-primary/30 hover:border-quantum-cyan/50 hover:bg-quantum-primary/10 transition-all duration-300"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <motion.div
                      animate={{ 
                        rotate: index % 2 === 0 ? [0, 360] : [360, 0],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ 
                        rotate: { duration: 3 + index, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                      }}
                    >
                      {index === 0 ? 
                        <Star className="w-3 h-3 text-quantum-primary" /> : 
                        <MapPin className="w-3 h-3 text-quantum-secondary" />
                      }
                    </motion.div>
                    <span className="quantum-heading text-xs font-medium">{sample.name}</span>
                  </div>
                  <div className="quantum-text text-xs opacity-80 truncate w-full text-left">
                    {sample.address.split(',')[0]}
                  </div>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quantum Address Search */}
        <div className="space-y-3">
          <motion.label 
            className="quantum-subheading text-sm font-semibold flex items-center gap-2"
            animate={{ 
              textShadow: [
                '0 0 5px currentColor',
                '0 0 15px currentColor',
                '0 0 5px currentColor'
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Search className="w-4 h-4 quantum-icon" />
            </motion.div>
            Quantum Address Search
          </motion.label>
          <div className="relative">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <motion.div
                  whileFocus={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Input
                    placeholder="Enter address or landmark..."
                    value={address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddByAddress()}
                    className="quantum-input border-quantum-primary/30 focus:border-quantum-cyan focus:ring-quantum-primary"
                  />
                </motion.div>
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Search className="w-4 h-4 text-quantum-primary quantum-glow" />
                    </motion.div>
                  </div>
                )}
              </div>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={handleAddByAddress} 
                  size="sm" 
                  disabled={!address.trim() || searchResults.length === 0}
                  className="quantum-btn quantum-glass border-quantum-primary/50 hover:border-quantum-cyan px-4"
                >
                  <motion.div
                    animate={!address.trim() ? {} : { rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Plus className="w-4 h-4" />
                  </motion.div>
                </Button>
              </motion.div>
            </div>
            
            {/* Quantum Search Results Dropdown */}
            {showSuggestions && searchResults.length > 0 && (
              <motion.div 
                className="absolute top-full left-0 right-0 mt-1 quantum-glass border border-quantum-primary/20 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto backdrop-blur-lg"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {searchResults.map((result, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleAddLocation(result)}
                    className="w-full text-left p-3 hover:bg-quantum-primary/10 transition-all duration-200 border-b border-quantum-primary/10 last:border-b-0 group"
                    whileHover={{ scale: 1.01, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div className="font-medium text-sm quantum-text group-hover:text-quantum-cyan transition-colors">
                      {result.displayName.split(',')[0]}
                      <motion.span
                        className="ml-2 opacity-0 group-hover:opacity-100"
                        initial={{ scale: 0 }}
                        whileHover={{ scale: 1.2 }}
                      >
                        ✨
                      </motion.span>
                    </motion.div>
                    <div className="text-xs text-quantum-text/70">
                      {result.displayName}
                    </div>
                    <div className="text-xs text-quantum-primary/80 mt-1 font-mono">
                      {result.lat.toFixed(4)}, {result.lng.toFixed(4)}
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Quantum Coordinate Input Section */}
        <motion.div 
          className="space-y-4 p-5 quantum-glass border border-quantum-primary/30 rounded-xl quantum-glow"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2">
            <motion.div
              className="p-2 rounded-lg bg-gradient-to-r from-quantum-primary/20 to-quantum-cyan/20 border border-quantum-primary/30"
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <MapPin className="w-4 h-4 quantum-icon" />
            </motion.div>
            <motion.label 
              className="quantum-subheading font-semibold flex items-center gap-2"
              animate={{ 
                textShadow: [
                  '0 0 5px currentColor',
                  '0 0 15px currentColor', 
                  '0 0 5px currentColor'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              Quantum Coordinates (India)
              <motion.span
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                🌟
              </motion.span>
            </motion.label>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              <Input
                placeholder="Latitude (e.g., 28.7041)"
                value={coordinates.lat}
                onChange={(e) => setCoordinates(prev => ({ ...prev, lat: e.target.value }))}
                className="quantum-input border-quantum-primary/30 focus:border-quantum-cyan focus:ring-quantum-primary"
              />
              <div className="text-xs text-quantum-text/70 font-mono">North: 8° to 37°</div>
            </motion.div>
            
            <motion.div
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              <Input
                placeholder="Longitude (e.g., 77.1025)"
                value={coordinates.lng}
                onChange={(e) => setCoordinates(prev => ({ ...prev, lng: e.target.value }))}
                className="quantum-input border-quantum-primary/30 focus:border-quantum-cyan focus:ring-quantum-primary"
              />
              <div className="text-xs text-quantum-text/70 font-mono">East: 68° to 97°</div>
            </motion.div>
          </div>
          
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="flex justify-center pt-2"
          >
            <Button 
              onClick={handleAddByCoordinates} 
              className="quantum-btn quantum-glass border-quantum-primary/50 hover:border-quantum-cyan px-6"
              disabled={!coordinates.lat.trim() || !coordinates.lng.trim()}
            >
              <motion.div
                className="flex items-center gap-2"
                animate={coordinates.lat.trim() && coordinates.lng.trim() ? { 
                  scale: [1, 1.05, 1],
                  textShadow: ['0 0 5px currentColor', '0 0 15px currentColor', '0 0 5px currentColor']
                } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Plus className="w-4 h-4" />
                Add Quantum Location
              </motion.div>
            </Button>
          </motion.div>
          
          {/* Quantum coordinate examples for India */}
          <div className="flex flex-wrap gap-2 pt-2">
            <motion.div 
              className="text-xs quantum-text/80 mb-2 w-full font-semibold flex items-center gap-1"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              ⚡ Quantum Examples:
            </motion.div>
            {[
              { name: 'Delhi', lat: '28.7041', lng: '77.1025', icon: '🏛️' },
              { name: 'Mumbai', lat: '19.0760', lng: '72.8777', icon: '🌊' },
              { name: 'Bangalore', lat: '12.9716', lng: '77.5946', icon: '💻' }
            ].map((example) => (
              <motion.button
                key={example.name}
                className="text-xs px-3 py-2 quantum-glass border border-quantum-primary/30 hover:border-quantum-cyan quantum-text rounded-lg transition-all duration-200 quantum-glow"
                onClick={() => setCoordinates({ lat: example.lat, lng: example.lng })}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="mr-1">{example.icon}</span>
                {example.name}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Location List */}
        {locations.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Stops ({locations.length})</label>
            <Reorder.Group 
              axis="y" 
              values={locations} 
              onReorder={(newOrder) => {
                // Update store with reordered locations
                newOrder.forEach((location, index) => {
                  const oldIndex = locations.findIndex(l => l.id === location.id);
                  if (oldIndex !== index && oldIndex !== -1) {
                    reorderLocations(oldIndex, index);
                  }
                });
              }}
              className="space-y-2"
            >
              {locations.map((location, index) => (
                <Reorder.Item 
                  key={location.id} 
                  value={location}
                  className="flex items-center gap-2 p-3 bg-muted rounded-lg cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {location.address || `Stop ${index + 1}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLocation(location.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {/* Route Distance Display */}
        <RouteDistanceDisplay locations={locations} />
      </CardContent>
    </Card>
  );
};
