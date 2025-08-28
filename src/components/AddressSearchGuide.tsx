import React from 'react';
import { Info, MapPin, Star, Search } from 'lucide-react';

export const AddressSearchGuide: React.FC = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 dark:bg-blue-950 dark:border-blue-800 rounded-lg p-4 relative">
      <div className="flex gap-3">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <div className="space-y-2">
            <div className="font-medium text-blue-900 dark:text-blue-100">
              How to add delivery locations:
            </div>
            <div className="space-y-1 text-blue-800 dark:text-blue-200">
              <div className="flex items-center gap-2">
                <Star className="w-3 h-3" />
                <span>Click <span className="bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded text-xs border">Quick Add</span> buttons for sample addresses</span>
              </div>
              <div className="flex items-center gap-2">
                <Search className="w-3 h-3" />
                <span>Type any address in the search box (e.g., "Gateway of India Mumbai")</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3" />
                <span>Add precise coordinates manually if needed</span>
              </div>
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300 mt-2">
              💡 Distance calculations are accurate using the Haversine formula
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
