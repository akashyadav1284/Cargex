"use client";

import { useState } from "react";
import { Search, Plus, Filter, MoreHorizontal, CheckCircle, XCircle } from "lucide-react";
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

export default function DriversPage() {
  const { api } = useAgency();
  const [searchTerm, setSearchTerm] = useState("");
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ fullName: "", phone: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Additional action states
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null);
  const [driverToAssignVehicle, setDriverToAssignVehicle] = useState<any | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);

  const fetchDrivers = async () => {
    try {
      const res = await api.get('/api/agency/drivers');
      setDrivers(res.data.data || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/api/agency/vehicles');
      setVehicles(res.data.data || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (id: string) => {
    if (!confirm('Are you sure you want to change this driver\'s status?')) return;
    try {
      const res = await api.post(`/api/agency/drivers/${id}/toggle-status`, {});
      if (res.status === 200 || res.data.success) {
        fetchDrivers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle driver status');
    }
  };

  const handleAssignVehicleSubmit = async (vehicleId: string) => {
    if (!driverToAssignVehicle) return;
    try {
      const res = await api.post(`/api/agency/drivers/${driverToAssignVehicle._id}/assign-vehicle`, { vehicleId });
      if (res.status === 200 || res.data.success) {
        setDriverToAssignVehicle(null);
        fetchDrivers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign vehicle');
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [api]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    try {
      await api.post('/api/agency/drivers', formData);
      setShowModal(false);
      setFormData({ fullName: "", phone: "", email: "", password: "" });
      fetchDrivers();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to add driver.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDrivers = drivers.filter(driver => 
    (driver.fullName || driver.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (driver.phone && driver.phone.includes(searchTerm))
  );

  return (
    <>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Drivers Management</h1>
          <p className="text-zinc-400 mt-1">Manage your agency fleet drivers and their profiles.</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 cursor-pointer">
          <Plus className="w-4 h-4" /> Add New Driver
        </Button>
      </div>

      <Card className="bg-zinc-950 border-zinc-800 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2 w-full max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search drivers by name or phone..."
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
                  <TableHead className="text-zinc-400">Driver Info</TableHead>
                  <TableHead className="text-zinc-400">Assigned Vehicle</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400 text-right">Trips</TableHead>
                  <TableHead className="text-zinc-400 text-right">Rating</TableHead>
                  <TableHead className="text-zinc-400 w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                      Loading drivers...
                    </TableCell>
                  </TableRow>
                ) : filteredDrivers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                      No drivers found.
                    </TableCell>
                  </TableRow>
                ) : filteredDrivers.map((driver) => (
                  <TableRow key={driver._id} className="border-zinc-800 hover:bg-zinc-900/50">
                    <TableCell>
                      <div className="font-medium text-white">{driver.fullName || driver.name}</div>
                      <div className="text-xs text-zinc-500">{driver.phone || 'No phone'} • {driver._id.slice(-6)}</div>
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {driver.assignedVehicleId ? (
                        <span className="text-white">{driver.assignedVehicleId.numberPlate}</span>
                      ) : (
                        <span className="text-yellow-500 text-xs font-medium bg-yellow-500/10 px-2 py-1 rounded-full">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {(driver.availabilityStatus === "active" || (!driver.availabilityStatus && driver.isOnline)) && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {(driver.availabilityStatus === "offline" || (!driver.availabilityStatus && !driver.isOnline)) && <XCircle className="w-4 h-4 text-zinc-500" />}
                        {driver.availabilityStatus === "on_trip" && <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />}
                        <span className={`text-sm capitalize ${
                          (driver.availabilityStatus === "active" || (!driver.availabilityStatus && driver.isOnline)) ? "text-green-500" : 
                          (driver.availabilityStatus === "offline" || (!driver.availabilityStatus && !driver.isOnline)) ? "text-zinc-400" : "text-blue-500"
                        }`}>{((driver.availabilityStatus || (driver.isOnline ? "active" : "offline"))).replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-zinc-300">-</TableCell>
                    <TableCell className="text-right text-zinc-300">
                      {(driver.ratings?.averageRating || driver.rating || 0) > 0 ? (
                        <span className="flex items-center justify-end gap-1">
                          {driver.ratings?.averageRating || driver.rating} <span className="text-yellow-500">★</span>
                        </span>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 w-8 p-0 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center rounded-md transition-colors outline-none cursor-pointer">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-200">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem 
                            onClick={() => setSelectedDriver(driver)}
                            className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer"
                          >
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={async () => {
                              setDriverToAssignVehicle(driver);
                              await fetchVehicles();
                            }}
                            className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer"
                          >
                            Assign Vehicle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-zinc-800" />
                          <DropdownMenuItem 
                            onClick={() => handleToggleStatus(driver._id)}
                            className="text-red-500 hover:bg-red-500/10 hover:text-red-500 focus:bg-red-500/10 focus:text-red-500 cursor-pointer"
                          >
                            {driver.status === 'blocked' ? 'Activate Driver' : 'Deactivate Driver'}
                          </DropdownMenuItem>
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

      {/* Add Driver Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-250">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 text-white animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-1">Add New Driver</h2>
            <p className="text-sm text-zinc-400 mb-4">Register a new driver under your agency.</p>
            
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-sm mb-4 font-semibold">
                {errorMsg}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Full Name</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Phone Number</label>
                <Input
                  type="tel"
                  required
                  placeholder="e.g. +91 9988776655"
                  className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Email Address</label>
                <Input
                  type="email"
                  placeholder="e.g. john@example.com (optional)"
                  className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Login Password</label>
                <Input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
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
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {submitting ? "Adding..." : "Add Driver"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Driver Profile Modal */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold">{selectedDriver.fullName || selectedDriver.name}</h2>
                <p className="text-xs text-zinc-500 font-mono mt-1">ID: {selectedDriver._id}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${
                selectedDriver.status === "approved" ? "bg-green-500/10 text-green-500" :
                selectedDriver.status === "blocked" ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-500"
              }`}>
                {selectedDriver.status || "Pending"}
              </span>
            </div>

            <div className="space-y-4">
              {/* Contact info */}
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-zinc-500">Phone</div>
                  <div className="text-sm font-semibold">{selectedDriver.phone || "No phone"}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Email</div>
                  <div className="text-sm font-semibold">{selectedDriver.email || "No email"}</div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/80 text-center">
                  <div className="text-xs text-zinc-500">Completed Rides</div>
                  <div className="text-lg font-bold text-white mt-1">{selectedDriver.completedRides || selectedDriver.totalRides || 0}</div>
                </div>
                <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/80 text-center">
                  <div className="text-xs text-zinc-500">Rating</div>
                  <div className="text-lg font-bold text-yellow-500 mt-1 flex items-center justify-center gap-1">
                    {selectedDriver.ratings?.averageRating || selectedDriver.rating || 0} <span>★</span>
                  </div>
                </div>
                <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/80 text-center">
                  <div className="text-xs text-zinc-500">Total Earnings</div>
                  <div className="text-lg font-bold text-green-500 mt-1">₹{selectedDriver.earnings?.totalEarnings || 0}</div>
                </div>
              </div>

              {/* Vehicle Assignment */}
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Assigned Vehicle Details</h3>
                {selectedDriver.assignedVehicleId ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-zinc-500">PLATE NUMBER</div>
                      <div className="text-sm font-semibold">{selectedDriver.assignedVehicleId.numberPlate}</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">MODEL & TYPE</div>
                      <div className="text-sm font-semibold">
                        {selectedDriver.assignedVehicleId.model || "N/A"} • {selectedDriver.vehicleDetails?.type || "N/A"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-zinc-500 italic">No vehicle assigned to this driver. Use 'Assign Vehicle' action to link one.</div>
                )}
              </div>

              {/* Document details */}
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Documents Verification</h3>
                <div className="grid grid-cols-2 gap-2.5 text-xs text-zinc-300">
                  <div className="flex justify-between p-2 rounded bg-zinc-950/40">
                    <span>Driving License:</span>
                    <span className="font-semibold text-zinc-400">{selectedDriver.documents?.license ? 'Uploaded' : 'Missing'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-zinc-950/40">
                    <span>Registration Certificate (RC):</span>
                    <span className="font-semibold text-zinc-400">{selectedDriver.documents?.rc ? 'Uploaded' : 'Missing'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-zinc-950/40">
                    <span>Insurance Proof:</span>
                    <span className="font-semibold text-zinc-400">{selectedDriver.documents?.insurance ? 'Uploaded' : 'Missing'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-zinc-950/40">
                    <span>ID Proof:</span>
                    <span className="font-semibold text-zinc-400">{selectedDriver.documents?.idProof ? 'Uploaded' : 'Missing'}</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span className="text-xs text-zinc-500 font-medium">VERIFICATION STATUS:</span>
                  <span className={`text-xs font-bold uppercase ${
                    selectedDriver.documents?.verifiedStatus === "verified" ? "text-green-500" :
                    selectedDriver.documents?.verifiedStatus === "rejected" ? "text-red-500" : "text-yellow-500"
                  }`}>
                    {selectedDriver.documents?.verifiedStatus || 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-zinc-800">
              <Button
                variant="outline"
                className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                onClick={() => setSelectedDriver(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Vehicle Modal */}
      {driverToAssignVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 text-white max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <h2 className="text-xl font-bold mb-1">Assign Vehicle</h2>
            <p className="text-sm text-zinc-400 mb-4">Select a fleet vehicle to assign to {driverToAssignVehicle.fullName || driverToAssignVehicle.name}</p>

            <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
              <div 
                onClick={() => handleAssignVehicleSubmit("")}
                className="flex items-center justify-between p-3 rounded-xl border border-dashed border-red-500/30 bg-red-500/5 hover:bg-red-500/10 cursor-pointer transition-colors text-red-400 text-sm font-semibold"
              >
                <span>Unassign / Clear Vehicle</span>
                <span>Remove association</span>
              </div>

              {vehicles.length === 0 ? (
                <div className="text-zinc-500 text-center py-6 text-sm italic">
                  No vehicles registered in your fleet. Add vehicles in the Vehicles tab.
                </div>
              ) : (
                vehicles.map((vehicle) => {
                  const isAssigned = vehicle.driverId && vehicle.driverId._id !== driverToAssignVehicle._id;
                  return (
                    <div 
                      key={vehicle._id} 
                      onClick={() => !isAssigned && handleAssignVehicleSubmit(vehicle._id)}
                      className={`flex items-center justify-between p-3 rounded-xl border border-zinc-800 transition-colors ${
                        isAssigned ? 'bg-zinc-900/10 opacity-55 cursor-not-allowed' : 'bg-zinc-900/30 hover:bg-zinc-900/60 cursor-pointer'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-sm">
                          {vehicle.numberPlate}
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {vehicle.name} ({vehicle.model || 'No model'}) • {vehicle.typeId?.name || 'Category N/A'}
                        </div>
                      </div>
                      {isAssigned ? (
                        <span className="text-xs text-zinc-500 italic">Assigned to: {vehicle.driverId.fullName || vehicle.driverId.name}</span>
                      ) : (
                        <span className="text-xs text-blue-500 font-semibold">Select</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-zinc-800">
              <Button
                variant="ghost"
                className="hover:bg-zinc-800 text-zinc-400 hover:text-white"
                onClick={() => setDriverToAssignVehicle(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
