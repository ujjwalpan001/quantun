import React from 'react';
import { MapPin, X, Plus, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { useRoutingStore } from '../../lib/store';
import { GeocodingService } from '../../lib/geocoding';
import type { Location } from '../../types/routing';

const SAMPLE_LOCATIONS = [
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Delhi', lat: 28.7041, lng: 77.1025 },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
];

export const LocationInput: React.FC = () => {
  const { locations, addLocation, removeLocation } = useRoutingStore();
  const [addressInput, setAddressInput] = React.useState('');
  const [isGeocoding, setIsGeocoding] = React.useState(false);
  const [geocodingError, setGeocodingError] = React.useState('');

  const addSampleLocation = (sample: typeof SAMPLE_LOCATIONS[0]) => {
    const newLocation: Location = {
      id: Date.now().toString(),
      lat: sample.lat,
      lng: sample.lng,
      address: sample.name,
    };
    addLocation(newLocation);
  };

  const addCustomAddress = async () => {
    if (!addressInput.trim()) return;

    setIsGeocoding(true);
    setGeocodingError('');

    try {
      // Use the existing GeocodingService for real coordinates
      const results = await GeocodingService.searchAddress(addressInput.trim());
      
      if (results.length > 0) {
        const result = results[0]; // Take the first result
        const newLocation: Location = {
          id: Date.now().toString(),
          lat: result.lat,
          lng: result.lng,
          address: result.displayName.split(',').slice(0, 3).join(','), // Clean up address
        };

        addLocation(newLocation);
        setAddressInput('');
      } else {
        setGeocodingError('Address not found in India. Try a more specific address.');
      }
    } catch (error) {
      setGeocodingError(error instanceof Error ? error.message : 'Failed to find address. Check your internet connection.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isGeocoding) {
      addCustomAddress();
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Add Cities */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Add:</h3>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_LOCATIONS.slice(0, 6).map((location) => (
            <Button
              key={location.name}
              variant="outline"
              size="sm"
              onClick={() => addSampleLocation(location)}
              className="text-xs"
              disabled={locations.some(loc => loc.address === location.name)}
            >
              <Plus className="w-3 h-3 mr-1" />
              {location.name}
            </Button>
          ))}
        </div>
        {SAMPLE_LOCATIONS.length > 6 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {SAMPLE_LOCATIONS.slice(6).map((location) => (
              <Button
                key={location.name}
                variant="outline"
                size="sm"
                onClick={() => addSampleLocation(location)}
                className="text-xs"
                disabled={locations.some(loc => loc.address === location.name)}
              >
                <Plus className="w-3 h-3 mr-1" />
                {location.name}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Custom Address Input with Real Geocoding */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Custom Address:</h3>
        <div className="flex gap-2">
          <Input
            value={addressInput}
            onChange={(e) => {
              setAddressInput(e.target.value);
              setGeocodingError(''); // Clear error when typing
            }}
            onKeyPress={handleKeyPress}
            placeholder="Enter Indian address (e.g., Connaught Place, New Delhi)..."
            className="flex-1"
            disabled={isGeocoding}
          />
          <Button 
            onClick={addCustomAddress}
            disabled={!addressInput.trim() || isGeocoding}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isGeocoding ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Finding...
              </>
            ) : (
              <>
                <Plus className="w-3 h-3 mr-1" />
                Add
              </>
            )}
          </Button>
        </div>
        
        {/* Error message */}
        {geocodingError && (
          <p className="text-sm text-red-600 mt-1 bg-red-50 p-2 rounded">
            ⚠️ {geocodingError}
          </p>
        )}
        
        {/* Help text */}
        <p className="text-xs text-gray-500 mt-1">
          💡 Use specific addresses like "Gateway of India Mumbai" or "Red Fort Delhi" for accurate coordinates
        </p>
      </div>

      {/* Location List */}
      {locations.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Locations ({locations.length}):
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {locations.map((location, index) => (
              <Card key={location.id} className="p-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-medium rounded-full">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{location.address}</div>
                      <div className="text-xs text-gray-500">
                        {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLocation(location.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {locations.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No locations added yet</p>
          <p className="text-xs">Click quick add buttons or enter a custom address</p>
        </div>
      )}

      {/* Sample test addresses */}
      {locations.length === 0 && (
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-800 mb-1">🧪 Try these sample addresses:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-blue-700">
            <button 
              onClick={() => setAddressInput("Red Fort, Delhi")}
              className="text-left hover:underline"
            >
              • Red Fort, Delhi
            </button>
            <button 
              onClick={() => setAddressInput("Gateway of India, Mumbai")}
              className="text-left hover:underline"
            >
              • Gateway of India, Mumbai
            </button>
            <button 
              onClick={() => setAddressInput("Mysore Palace, Bangalore")}
              className="text-left hover:underline"
            >
              • Mysore Palace, Bangalore
            </button>
            <button 
              onClick={() => setAddressInput("Marina Beach, Chennai")}
              className="text-left hover:underline"
            >
              • Marina Beach, Chennai
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
