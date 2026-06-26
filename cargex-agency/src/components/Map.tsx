import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface DriverLocation {
  _id: string;
  name: string;
  lat: number;
  lng: number;
  status: string;
  vehicle: string;
  speed: string;
}

interface MapProps {
  drivers: DriverLocation[];
  activeDriver: DriverLocation | null;
  onSelectDriver: (driver: DriverLocation | null) => void;
  darkMode?: boolean;
}

export default function Map({ drivers, activeDriver, onSelectDriver, darkMode = true }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const defaultCenter: L.LatLngExpression = [19.0760, 72.8777]; // Mumbai
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView(defaultCenter, 11);

    mapRef.current = map;

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

  // Handle markers updating dynamically
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Get current marker IDs to keep
    const driverIds = new Set(drivers.map(d => d._id));

    // Remove obsolete markers
    Object.keys(markersRef.current).forEach(id => {
      if (!driverIds.has(id)) {
        map.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });

    // Add or update markers
    drivers.forEach(driver => {
      const activeIcon = L.divIcon({
        className: 'custom-pin-driver-active',
        html: `<div style="background-color: #22c55e; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 8px rgba(34,197,94,0.5)">🚚</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const idleIcon = L.divIcon({
        className: 'custom-pin-driver-idle',
        html: `<div style="background-color: #eab308; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 8px rgba(234,179,8,0.5)">🚚</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const icon = driver.status === 'Active' ? activeIcon : idleIcon;

      if (markersRef.current[driver._id]) {
        // Update existing marker position & icon
        const marker = markersRef.current[driver._id];
        marker.setLatLng([driver.lat, driver.lng]);
        marker.setIcon(icon);
      } else {
        // Create new marker
        const marker = L.marker([driver.lat, driver.lng], { icon })
          .addTo(map)
          .on('click', () => {
            onSelectDriver(driver);
          });
        markersRef.current[driver._id] = marker;
      }
    });
  }, [drivers, onSelectDriver]);

  // Center on active driver if selected
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activeDriver) return;

    map.setView([activeDriver.lat, activeDriver.lng], 14);

    // Open popup for active driver
    const activeMarker = markersRef.current[activeDriver._id];
    if (activeMarker) {
      activeMarker.bindPopup(
        `<div style="color: #000; font-family: sans-serif; padding: 2px; min-width: 120px;">
          <h4 style="margin: 0 0 4px 0; font-weight: bold; font-size: 14px;">${activeDriver.name}</h4>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #555;">${activeDriver.vehicle}</p>
          <p style="margin: 0; font-size: 12px; font-weight: bold; color: #2563EB;">⚡ ${activeDriver.speed}</p>
         </div>`,
         { closeButton: true }
      ).openPopup();
    }
  }, [activeDriver]);

  return (
    <div className="h-full w-full relative">
      <div ref={mapContainerRef} className="h-full w-full" style={{ minHeight: '400px' }} />
    </div>
  );
}
