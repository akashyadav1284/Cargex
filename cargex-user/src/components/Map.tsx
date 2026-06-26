import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface MapProps {
  pickupLocation: Location | null;
  dropoffLocation: Location | null;
  driverLocation: Location | null;
  darkMode?: boolean;
}

export default function Map({ pickupLocation, dropoffLocation, driverLocation, darkMode = false }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routesRef = useRef<L.Polyline[]>([]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const defaultCenter: L.LatLngExpression = [28.6139, 77.2090]; // Delhi
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView(defaultCenter, 13);

    mapRef.current = map;

    // Clean up on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Tiles based on Dark Mode
  useEffect(() => {
    if (!mapRef.current) return;

    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }

    const tileUrl = darkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
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

    // Custom Icon Definitions
    const pickupIcon = L.divIcon({
      className: 'custom-pin-pickup',
      html: `<div style="background-color: #10B981; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; shadow: 0 2px 4px rgba(0,0,0,0.3)">A</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const dropoffIcon = L.divIcon({
      className: 'custom-pin-dropoff',
      html: `<div style="background-color: #EF4444; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; shadow: 0 2px 4px rgba(0,0,0,0.3)">B</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const driverIcon = L.divIcon({
      className: 'custom-pin-driver',
      html: `<div style="background-color: #3B82F6; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3)">🚚</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    // 1. Add Pickup Marker
    if (pickupLocation) {
      const marker = L.marker([pickupLocation.lat, pickupLocation.lng], { icon: pickupIcon })
        .addTo(map)
        .bindPopup(pickupLocation.address || 'Pickup Point');
      markersRef.current.push(marker);
      bounds.push([pickupLocation.lat, pickupLocation.lng]);
    }

    // 2. Add Dropoff Marker
    if (dropoffLocation) {
      const marker = L.marker([dropoffLocation.lat, dropoffLocation.lng], { icon: dropoffIcon })
        .addTo(map)
        .bindPopup(dropoffLocation.address || 'Destination Point');
      markersRef.current.push(marker);
      bounds.push([dropoffLocation.lat, dropoffLocation.lng]);
    }

    // 3. Add Driver Marker
    if (driverLocation) {
      const marker = L.marker([driverLocation.lat, driverLocation.lng], { icon: driverIcon })
        .addTo(map)
        .bindPopup('Driver Location');
      markersRef.current.push(marker);
      bounds.push([driverLocation.lat, driverLocation.lng]);
    }

    // 4. Fetch and Draw Route Lines using OSRM
    const drawRoutes = async () => {
      // Draw pickup to destination route
      if (pickupLocation && dropoffLocation) {
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${pickupLocation.lng},${pickupLocation.lat};${dropoffLocation.lng},${dropoffLocation.lat}?overview=full&geometries=geojson`;
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
          console.error('OSRM Main route fetch failed', err);
        }
      }

      // Draw driver to pickup route
      if (driverLocation && pickupLocation) {
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${driverLocation.lng},${driverLocation.lat};${pickupLocation.lng},${pickupLocation.lat}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
            const polyline = L.polyline(coords as L.LatLngExpression[], {
              color: '#3B82F6',
              weight: 4,
              dashArray: '5, 8',
              opacity: 0.8
            }).addTo(map);
            routesRef.current.push(polyline);
          }
        } catch (err) {
          console.error('OSRM Driver route fetch failed', err);
        }
      }
    };

    drawRoutes();

    // 5. Fit bounds to contain all coordinates
    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], maxZoom: 15 });
    }
  }, [pickupLocation, dropoffLocation, driverLocation]);

  return (
    <div className="h-full w-full relative">
      <div ref={mapContainerRef} className="h-full w-full" style={{ minHeight: '300px' }} />
    </div>
  );
}
