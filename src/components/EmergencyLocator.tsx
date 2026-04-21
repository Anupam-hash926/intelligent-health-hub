import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { MapPin, Navigation, AlertTriangle, Settings2, Activity, Phone } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons missing shadows
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom pulsing blue dot for the user's current location
const userLocationIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `<div style="width: 16px; height: 16px; background-color: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(59, 130, 246, 0.8); animation: pulse 2s infinite;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Red marker specifically for hospitals
const redHospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Fallback dictionary for hospitals missing contact tags in OpenStreetMap
const HOSPITAL_CONTACTS: Record<string, string> = {
  "ramaiah memorial": "+91 80 6215 3300",
  "ramaiah dental": "080 2360 2079",
  "ramaiah medical": "1800 123 1133"
};

interface Hospital {
  id: number;
  lat: number;
  lon: number;
  center?: { lat: number; lon: number };
  distance?: number;
  tags: {
    name?: string;
    amenity?: string;
    emergency?: string;
    phone?: string;
    "contact:phone"?: string;
    "contact:mobile"?: string;
  };
}

// Helper component to auto-zoom the map when a route is selected or radius changes
function MapController({ center, routeCoords, radius }: { center: [number, number] | null, routeCoords: [number, number][], radius: number }) {
  const map = useMap();
  useEffect(() => {
    if (routeCoords.length > 0) {
      const bounds = L.latLngBounds(routeCoords);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (center) {
      const zoomLevel = radius <= 2000 ? 14 : radius <= 4000 ? 13 : 12;
      map.flyTo(center, zoomLevel); 
    }
  }, [routeCoords, center, map, radius]);
  return null;
}

// Smart Zoom Handler for Trackpads
function SmartZoomHandler() {
  const map = useMap();
  
  useEffect(() => {
    const container = map.getContainer();
    
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        map.scrollWheelZoom.enable();
      } else {
        map.scrollWheelZoom.disable();
      }
    };

    container.addEventListener('wheel', handleWheel, { capture: true });
    
    return () => {
      container.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, [map]);
  
  return null;
}

export default function EmergencyLocator() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(false);
  const [routing, setRouting] = useState(false);
  const [error, setError] = useState('');
  
  const [searchRadius, setSearchRadius] = useState<number>(2000);

  const findNearbyHospitals = () => {
    setLoading(true);
    setError('');
    setSelectedHospital(null);
    setRouteCoords([]);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });

        const query = `
          [out:json];
          (
            nwr["amenity"="hospital"](around:${searchRadius}, ${latitude}, ${longitude});
            nwr["healthcare"="hospital"](around:${searchRadius}, ${latitude}, ${longitude});
          );
          out center;
        `;
        const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

        try {
          const response = await fetch(overpassUrl);
          const data = await response.json();
          
          const userLatLng = L.latLng(latitude, longitude);
          
          const processedHospitals = data.elements.map((hospital: Hospital) => {
            const lat = hospital.lat || hospital.center?.lat || 0;
            const lon = hospital.lon || hospital.center?.lon || 0;
            const hospitalLatLng = L.latLng(lat, lon);
            const distanceInMeters = userLatLng.distanceTo(hospitalLatLng);
            
            // Extract Name and Phone
            const name = (hospital.tags.name || '').toLowerCase();
            let resolvedPhone = hospital.tags.phone || hospital.tags["contact:phone"] || hospital.tags["contact:mobile"];
            
            // 1. If OSM lacks the number, check the hardcoded fallback dictionary
            if (!resolvedPhone) {
              for (const [key, val] of Object.entries(HOSPITAL_CONTACTS)) {
                if (name.includes(key)) {
                  resolvedPhone = val;
                  break;
                }
              }
            }

            // 2. If it's still missing, assign the default toll-free emergency number
            if (!resolvedPhone) {
              resolvedPhone = "108 (Toll Free Emergency)";
            }
            
            return { 
              ...hospital, 
              lat, 
              lon, 
              distance: distanceInMeters,
              tags: {
                ...hospital.tags,
                phone: resolvedPhone
              }
            };
          }).sort((a: Hospital, b: Hospital) => (a.distance || 0) - (b.distance || 0));

          setHospitals(processedHospitals);
        } catch (err) {
          setError('Failed to fetch nearby hospitals.');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError('Unable to retrieve your location. Please check browser permissions.');
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const getRouteToHospital = async (hospital: Hospital) => {
    if (!location) return;
    
    setSelectedHospital(hospital);
    setRouting(true);

    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${location.lng},${location.lat};${hospital.lon},${hospital.lat}?overview=full&geometries=geojson`
      );
      const data = await response.json();

      if (data.routes && data.routes[0]) {
        const coords = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
        setRouteCoords(coords);
      }
    } catch (err) {
      console.error("Failed to fetch route", err);
    } finally {
      setRouting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-destructive flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Emergency Locator
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Find and route to the nearest medical facilities within {searchRadius / 1000}km.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative flex items-center">
            <Settings2 className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <select
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              disabled={loading}
              className="appearance-none h-[48px] pl-9 pr-10 py-2 rounded-lg border border-border bg-background text-foreground shadow-sm focus:ring-2 focus:ring-destructive focus:border-destructive outline-none cursor-pointer disabled:opacity-50 font-medium"
            >
              <option value={2000}>2 km Radius</option>
              <option value={4000}>4 km Radius</option>
              <option value={5000}>5 km Radius</option>
            </select>
            <div className="absolute right-3 pointer-events-none text-muted-foreground">
              <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>

          <button
            onClick={findNearbyHospitals}
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold h-[48px] px-6 rounded-lg shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {loading ? 'Locating...' : 'Scan Area'}
            <Activity className={loading ? "h-4 w-4 animate-pulse" : "h-4 w-4"} />
          </button>
        </div>
      </div>

      {error && <p className="text-destructive bg-destructive/10 p-4 rounded-lg border border-destructive/20">{error}</p>}

      {location && (
        <div className="space-y-6 flex flex-col">
          {/* Map Section */}
          <div className="h-[500px] w-full rounded-xl overflow-hidden shadow-lg border border-border relative z-0">
            <MapContainer 
              center={[location.lat, location.lng]} 
              zoom={14} 
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%', zIndex: 0 }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              <MapController center={[location.lat, location.lng]} routeCoords={routeCoords} radius={searchRadius} />
              
              <SmartZoomHandler />

              <Marker position={[location.lat, location.lng]} icon={userLocationIcon}>
                <Popup>You are here</Popup>
              </Marker>
              
              {hospitals.map((hospital) => (
                <Marker key={hospital.id} position={[hospital.lat, hospital.lon]} icon={redHospitalIcon}>
                  <Popup>
                    <div className="font-sans">
                      <strong className="block text-base mb-1">{hospital.tags.name || 'Unknown Facility'}</strong>
                      {hospital.distance && (
                        <span className="block text-sm font-medium text-blue-600 mb-1">
                          {(hospital.distance / 1000).toFixed(2)} km away
                        </span>
                      )}
                      <span className="text-xs text-gray-500 block mb-1">
                        Emergency: {hospital.tags.emergency === 'yes' ? 'Available' : 'Unknown'}
                      </span>
                      <span className="text-xs font-semibold text-gray-700">
                        {hospital.tags.phone}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {routeCoords.length > 0 && (
                <Polyline positions={routeCoords} color="#3b82f6" weight={5} opacity={0.8} dashArray="10, 10" className="animate-pulse" />
              )}
            </MapContainer>
          </div>

          {/* Recommendations List Section */}
          <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-foreground">
                Facilities within {searchRadius / 1000}km
              </h3>
              <span className="text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                {hospitals.length} Found
              </span>
            </div>
            
            {hospitals.length === 0 ? (
              <p className="text-muted-foreground">No hospitals found within {searchRadius / 1000}km.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hospitals.map((hospital) => (
                  <div 
                    key={hospital.id} 
                    onClick={() => getRouteToHospital(hospital)}
                    className={`p-4 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                      selectedHospital?.id === hospital.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    <div>
                      <h4 className="font-medium text-foreground text-lg mb-1 line-clamp-2">
                        {hospital.tags.name || 'Unnamed Medical Center'}
                      </h4>
                      
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span className="font-medium text-foreground">
                          {hospital.distance ? (hospital.distance / 1000).toFixed(2) : '?'} km
                        </span>
                        <span>straight-line distance</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full font-medium">
                          Hospital
                        </span>
                        {hospital.tags.emergency === 'yes' && (
                          <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full font-medium">
                            Emergency Ward
                          </span>
                        )}
                      </div>
                    </div>

                    <button 
                      className={`w-full py-2 px-3 rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors mt-auto ${
                        selectedHospital?.id === hospital.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {routing && selectedHospital?.id === hospital.id ? (
                        'Calculating Route...'
                      ) : (
                        <>
                          <Navigation className="h-4 w-4" />
                          {selectedHospital?.id === hospital.id ? 'Route Displayed' : 'Get Directions'}
                        </>
                      )}
                    </button>

                    {/* Phone Number Display */}
                    {hospital.tags.phone && (
                      <div className="mt-3 pt-3 border-t border-border flex justify-center">
                        <a 
                          // Ensures the tel: link strips text for proper dialing, while keeping the UI text intact
                          href={`tel:${hospital.tags.phone.includes('108') ? '108' : hospital.tags.phone.replace(/[^0-9+]/g, '')}`} 
                          className="text-sm font-semibold text-primary hover:text-primary/80 hover:underline flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()} 
                        >
                          <Phone className="h-4 w-4" />
                          {hospital.tags.phone}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
      `}</style>
    </div>
  );
}