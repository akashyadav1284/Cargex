"use client";

import { useState } from "react";
import { Search, Plus, Filter, MoreHorizontal, Truck, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAgency } from "@/context/AgencyContext";
import { useEffect } from "react";

export default function VehiclesPage() {
  const { api } = useAgency();
  const [searchTerm, setSearchTerm] = useState("");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ numberPlate: "", name: "", model: "", typeId: "", driverId: "" });
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/api/agency/vehicles');
      setVehicles(res.data.data || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [api]);

  const handleOpenModal = async () => {
    setShowModal(true);
    setErrorMsg("");
    try {
      const [typesRes, driversRes] = await Promise.all([
        api.get('/api/agency/vehicle-types'),
        api.get('/api/agency/drivers')
      ]);
      setVehicleTypes(typesRes.data.data || typesRes.data);
      
      const allDrivers = driversRes.data.data || driversRes.data;
      const unassigned = allDrivers.filter((d: any) => !d.assignedVehicleId);
      setDrivers(unassigned);
    } catch (err) {
      console.error("Failed to load form lookup data", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    try {
      await api.post('/api/agency/vehicles', formData);
      setShowModal(false);
      setFormData({ numberPlate: "", name: "", model: "", typeId: "", driverId: "" });
      fetchVehicles();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to add vehicle.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.numberPlate.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (v.typeId && v.typeId.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Vehicle Fleet Management</h1>
          <p className="text-zinc-400 mt-1">Track and manage your trucks, documents, and maintenance.</p>
        </div>
        <Button onClick={handleOpenModal} className="bg-orange-600 hover:bg-orange-700 text-white gap-2 cursor-pointer">
          <Plus className="w-4 h-4" /> Add New Vehicle
        </Button>
      </div>

      <Card className="bg-zinc-950 border-zinc-800 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2 w-full max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search by number plate or type..."
                className="pl-8 bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white shrink-0">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-zinc-800">
            <Table>
              <TableHeader className="bg-zinc-900/50">
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Vehicle Info</TableHead>
                  <TableHead className="text-zinc-400">Capacity</TableHead>
                  <TableHead className="text-zinc-400">Assigned Driver</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400">Documents</TableHead>
                  <TableHead className="text-zinc-400 w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                      Loading vehicles...
                    </TableCell>
                  </TableRow>
                ) : filteredVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                      No vehicles found.
                    </TableCell>
                  </TableRow>
                ) : filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle._id} className="border-zinc-800 hover:bg-zinc-900/50">
                    <TableCell>
                      <div className="font-medium text-white flex items-center gap-2">
                        <Truck className="w-4 h-4 text-zinc-500" />
                        {vehicle.numberPlate}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">{vehicle.typeId?.name || 'N/A'} • {vehicle._id.slice(-6)}</div>
                    </TableCell>
                    <TableCell className="text-zinc-300">{vehicle.typeId?.capacityKg ? `${vehicle.typeId.capacityKg} kg` : '-'}</TableCell>
                    <TableCell className="text-zinc-300">
                      {vehicle.driverId ? (
                        vehicle.driverId.fullName || vehicle.driverId.name
                      ) : (
                        <span className="text-yellow-500 text-xs font-medium bg-yellow-500/10 px-2 py-1 rounded-full">No Driver</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {vehicle.status === "Maintenance" && <Wrench className="w-4 h-4 text-red-500" />}
                        <span className={`text-sm capitalize ${
                          vehicle.status === "active" ? "text-green-500" : 
                          vehicle.status === "maintenance" ? "text-red-500" :
                          vehicle.status === "inactive" ? "text-zinc-500" : "text-yellow-500"
                        }`}>{vehicle.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        vehicle.docsStatus === "verified" ? "bg-green-500/10 text-green-500" :
                        vehicle.docsStatus === "expired" ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-500"
                      }`}>
                        {vehicle.docsStatus || 'Pending'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 w-8 p-0 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center rounded-md transition-colors outline-none cursor-pointer">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-200">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer">View Details</DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer">Update Documents</DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-zinc-800" />
                          <DropdownMenuItem className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer">Log Maintenance</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>

      {/* Add Vehicle Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-250">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 text-white animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-1">Add New Vehicle</h2>
            <p className="text-sm text-zinc-400 mb-4">Register a new vehicle under your fleet.</p>
            
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-sm mb-4 font-semibold">
                {errorMsg}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Number Plate</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. MH 12 AB 1234"
                  className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500 uppercase"
                  value={formData.numberPlate}
                  onChange={(e) => setFormData({ ...formData, numberPlate: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Brand/Name</label>
                  <Input
                    type="text"
                    placeholder="e.g. Tata Ace"
                    className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Model Year</label>
                  <Input
                    type="text"
                    placeholder="e.g. 2024"
                    className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Vehicle Type (Category)</label>
                <select
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  value={formData.typeId}
                  onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
                >
                  <option value="">-- Select Type --</option>
                  {vehicleTypes.map((type) => (
                    <option key={type._id} value={type._id}>
                      {type.name} ({type.capacityKg} kg)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Assign Driver (Optional)</label>
                <select
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  value={formData.driverId}
                  onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                >
                  <option value="">-- Leave Unassigned --</option>
                  {drivers.map((driver) => (
                    <option key={driver._id} value={driver._id}>
                      {driver.fullName || driver.name} ({driver.phone})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800">
                <Button
                  type="button"
                  variant="ghost"
                  className="hover:bg-zinc-800 text-zinc-400 hover:text-white"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
                >
                  {submitting ? "Adding..." : "Add Vehicle"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
