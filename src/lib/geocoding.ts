// Nominatim (OpenStreetMap) geocoding service - free and doesn't require API key
export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  type: string;
}

export class GeocodingService {
  private static readonly NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';
  
  static async searchAddress(query: string): Promise<GeocodingResult[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        format: 'json',
        limit: '5',
        countrycodes: 'in', // India country code
        addressdetails: '1'
      });

      const response = await fetch(`${this.NOMINATIM_API}?${params}`, {
        headers: {
          'User-Agent': 'QuantumRouting/1.0.0' // Required by Nominatim
        }
      });

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.map((item: any) => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name,
        type: item.type || 'address'
      }));
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }

  // Reverse geocoding - get address from coordinates
  static async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(),
        format: 'json',
        addressdetails: '1'
      });

      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
        headers: {
          'User-Agent': 'QuantumRouting/1.0.0'
        }
      });

      if (!response.ok) {
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }

      const data = await response.json();
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }
}

// Haversine formula for accurate distance calculation
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  
  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Predefined sample addresses for quick testing
export const SAMPLE_ADDRESSES = [
  {
    name: "Mumbai Office",
    address: "Bandra Kurla Complex, Mumbai, Maharashtra, India",
    lat: 19.0596,
    lng: 72.8656
  },
  {
    name: "Delhi Headquarters",
    address: "Connaught Place, New Delhi, Delhi, India",
    lat: 28.6304,
    lng: 77.2177
  },
  {
    name: "Bangalore Tech Hub", 
    address: "Electronic City, Bangalore, Karnataka, India",
    lat: 12.8456,
    lng: 77.6603
  },
  {
    name: "Chennai Branch",
    address: "Anna Nagar, Chennai, Tamil Nadu, India",
    lat: 13.0837,
    lng: 80.2098
  }
];
