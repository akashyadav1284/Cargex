import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

interface MapProps {
  currentLocation: { lat: number; lng: number } | null;
  liveRequest: {
    pickupLocation?: Location;
    dropLocation?: Location;
  } | null;
  rideStatus: 'idle' | 'incoming' | 'accepted' | 'in_progress' | 'completed';
  darkMode?: boolean;
}

export default function Map({ currentLocation, liveRequest, rideStatus, darkMode = false }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routesRef = useRef<L.Polyline[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const defaultCenter: L.LatLngExpression = [28.6139, 77.2090];
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView(defaultCenter, 15);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Set Light / Dark theme tiles
  useEffect(() => {
    if (!mapRef.current) return;
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }

    const tileUrl = darkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19
    }).addTo(mapRef.current);

    tileLayerRef.current = tileLayer;
  }, [darkMode]);

  // Update Markers and Routes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    // Clear old routes
    routesRef.current.forEach((r) => map.removeLayer(r));
    routesRef.current = [];

    const bounds: L.LatLngExpression[] = [];

    const pickupIcon = L.divIcon({
      className: 'custom-pin-pickup',
      html: `<div style="background-color: #10B981; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3)">A</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const dropoffIcon = L.divIcon({
      className: 'custom-pin-dropoff',
      html: `<div style="background-color: #EF4444; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3)">B</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const driverIcon = L.divIcon({
      className: 'custom-pin-driver',
      html: `<div style="background-color: #3B82F6; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3)">🚚</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    // 1. Current Driver Location Marker
    if (currentLocation) {
      const marker = L.marker([currentLocation.lat, currentLocation.lng], { icon: driverIcon })
        .addTo(map)
        .bindPopup('Your Current Location');
      markersRef.current.push(marker);
      bounds.push([currentLocation.lat, currentLocation.lng]);
    }

    // 2. Incoming Request Marker (A)
    if (rideStatus === 'incoming' && liveRequest?.pickupLocation) {
      const pickup = liveRequest.pickupLocation;
      const marker = L.marker([pickup.latitude, pickup.longitude], { icon: pickupIcon })
        .addTo(map)
        .bindPopup(pickup.address || 'Pickup Location');
      markersRef.current.push(marker);
      bounds.push([pickup.latitude, pickup.longitude]);
    }

    // 3. Accepted / In Progress Active Booking Destination Marker
    if ((rideStatus === 'accepted' || rideStatus === 'in_progress') && liveRequest) {
      const activeLoc = rideStatus === 'accepted' ? liveRequest.pickupLocation : liveRequest.dropLocation;
      const icon = rideStatus === 'accepted' ? pickupIcon : dropoffIcon;
      const label = rideStatus === 'accepted' ? 'Pickup Location' : 'Destination Location';

      if (activeLoc) {
        const marker = L.marker([activeLoc.latitude, activeLoc.longitude], { icon })
          .addTo(map)
          .bindPopup(activeLoc.address || label);
        markersRef.current.push(marker);
        bounds.push([activeLoc.latitude, activeLoc.longitude]);

        // Draw Route Line from Driver Current Location to Active point using OSRM
        if (currentLocation) {
          const drawRoute = async () => {
            try {
              const url = `https://router.project-osrm.org/route/v1/driving/${currentLocation.lng},${currentLocation.lat};${activeLoc.longitude},${activeLoc.latitude}?overview=full&geometries=geojson`;
              const res = await fetch(url);
              const data = await res.json();
              if (data.routes && data.routes.length > 0) {
                const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
                const polyline = L.polyline(coords as L.LatLngExpression[], {
                  color: '#10B981',
                  weight: 5,
                  opacity: 0.8
                }).addTo(map);
                routesRef.current.push(polyline);
              }
            } catch (err) {
              console.error('OSRM route fetch failed for driver', err);
            }
          };
          drawRoute();
        }
      }
    }

    // 4. Zoom map view
    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], maxZoom: 16 });
    } else if (currentLocation) {
      map.setView([currentLocation.lat, currentLocation.lng], 15);
    }
  }, [currentLocation, liveRequest, rideStatus]);

  return (
    <div className="h-full w-full relative">
      <div ref={mapContainerRef} className="h-full w-full" style={{ minHeight: '350px' }} />
    </div>
  );
}
