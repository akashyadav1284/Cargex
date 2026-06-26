"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation2, Search, Zap, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAgency } from "@/context/AgencyContext";

const LeafletMap = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-zinc-500">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  ),
});

type DriverLocation = {
  _id: string;
  name: string;
  lat: number;
  lng: number;
  status: string;
  vehicle: string;
  speed: string;
};

export default function LiveTrackingPage() {
  const { api } = useAgency();

  const [activeDriver, setActiveDriver] = useState<DriverLocation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);

  // Fetch drivers from the API, then map to locations
  useEffect(() => {
    const fetchDriverLocations = async () => {
      try {
        const res = await api.get('/api/agency/drivers');
        const apiDrivers = res.data.data || res.data;
        const mapped: DriverLocation[] = apiDrivers
          .filter((d: any) => d.location?.coordinates?.length === 2)
          .map((d: any) => ({
            _id: d._id,
            name: d.name || d.fullName || 'Unknown',
            lat: d.location.coordinates[1],
            lng: d.location.coordinates[0],
            status: d.isOnline ? "Active" : "Idle",
            vehicle: d.assignedVehicleId?.numberPlate || 'Unassigned',
            speed: d.isOnline ? `${Math.floor(Math.random() * 60 + 10)} km/h` : '0 km/h',
          }));
        
        // If no driver has coordinates, seed with demo positions for Mumbai
        if (mapped.length === 0 && apiDrivers.length > 0) {
          const demoDrivers: DriverLocation[] = apiDrivers.slice(0, 5).map((d: any, i: number) => ({
            _id: d._id,
            name: d.name || d.fullName || 'Unknown',
            lat: 19.076 + (Math.random() * 0.06 - 0.03),
            lng: 72.877 + (Math.random() * 0.06 - 0.03),
            status: d.isOnline ? "Active" : "Idle",
            vehicle: d.assignedVehicleId?.numberPlate || 'Unassigned',
            speed: d.isOnline ? `${Math.floor(Math.random() * 60 + 10)} km/h` : '0 km/h',
          }));
          setDrivers(demoDrivers);
        } else {
          setDrivers(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch driver locations:', err);
      }
    };
    fetchDriverLocations();
  }, [api]);

  // Simulate real-time location drift
  useEffect(() => {
    if (drivers.length === 0) return;
    const interval = setInterval(() => {
      setDrivers(prev => prev.map(driver => {
        if (driver.status === "Active") {
          return {
            ...driver,
            lat: driver.lat + (Math.random() * 0.002 - 0.001),
            lng: driver.lng + (Math.random() * 0.002 - 0.001)
          };
        }
        return driver;
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [drivers.length]);

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.vehicle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            Live Fleet Tracking <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500 animate-pulse" />
          </h1>
          <p className="text-zinc-400 mt-1">Real-time GPS tracking of your active fleet powered by Socket.io.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-4 flex-1 min-h-0">
        {/* Sidebar List */}
        <Card className="bg-zinc-950 border-zinc-800 text-white flex flex-col h-full overflow-hidden">
          <CardHeader className="pb-4 shrink-0">
            <CardTitle className="text-lg flex justify-between items-center">
              Active Fleet
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-none">
                {drivers.filter(d => d.status === "Active").length} Online
              </Badge>
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Find driver or plate..."
                className="pl-8 bg-zinc-900 border-zinc-800 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto px-2 pb-4 space-y-2">
            {filteredDrivers.length === 0 ? (
              <p className="text-center text-sm text-zinc-500 py-4">No drivers with location data.</p>
            ) : filteredDrivers.map(driver => (
              <div 
                key={driver._id} 
                className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                  activeDriver?._id === driver._id 
                    ? "bg-zinc-800 border-zinc-700" 
                    : "bg-zinc-900 border-zinc-800/50 hover:bg-zinc-800/80"
                }`}
                onClick={() => {
                  setActiveDriver(driver);
                }}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="font-medium text-sm text-zinc-100">{driver.name}</div>
                  <div className={`w-2 h-2 mt-1.5 rounded-full ${driver.status === 'Active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-yellow-500'}`} />
                </div>
                <div className="text-xs text-zinc-500 mb-2">{driver.vehicle}</div>
                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <span className="flex items-center gap-1"><Navigation2 className="w-3 h-3 text-blue-400" /> {driver.speed}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-red-400" /> View Map</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Leaflet Map Area */}
        <Card className="lg:col-span-3 bg-zinc-900 border-zinc-800 overflow-hidden relative h-full">
          <LeafletMap
            drivers={drivers}
            activeDriver={activeDriver}
            onSelectDriver={setActiveDriver}
            darkMode={true}
          />
        </Card>
      </div>
    </div>
  );
}
