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

  // Additional action states
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [vehicleToUpdateDocs, setVehicleToUpdateDocs] = useState<any | null>(null);
  const [vehicleToLogMaintenance, setVehicleToLogMaintenance] = useState<any | null>(null);

  // Forms states
  const [docsForm, setDocsForm] = useState({ rc: "", insurance: "", pollution: "", verifiedStatus: "pending" });
  const [maintenanceForm, setMaintenanceForm] = useState({ lastServiceDate: "", nextServiceDate: "", notes: "", status: "active" });

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

  const handleUpdateDocsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleToUpdateDocs) return;
    setSubmitting(true);
    try {
      const res = await api.put(`/api/agency/vehicles/${vehicleToUpdateDocs._id}/documents`, docsForm);
      if (res.status === 200 || res.data.success) {
        setVehicleToUpdateDocs(null);
        fetchVehicles();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update documents');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleToLogMaintenance) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/api/agency/vehicles/${vehicleToLogMaintenance._id}/maintenance`, maintenanceForm);
      if (res.status === 200 || res.data.success) {
        setVehicleToLogMaintenance(null);
        fetchVehicles();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to log maintenance');
    } finally {
      setSubmitting(false);
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
                          <DropdownMenuItem 
                            onClick={() => setSelectedVehicle(vehicle)}
                            className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer"
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setVehicleToUpdateDocs(vehicle);
                              setDocsForm({
                                rc: vehicle.documents?.rc || "",
                                insurance: vehicle.documents?.insurance || "",
                                pollution: vehicle.documents?.pollution || "",
                                verifiedStatus: vehicle.docsStatus || vehicle.documents?.verifiedStatus || "pending"
                              });
                            }}
                            className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer"
                          >
                            Update Documents
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-zinc-800" />
                          <DropdownMenuItem 
                            onClick={() => {
                              setVehicleToLogMaintenance(vehicle);
                              setMaintenanceForm({
                                lastServiceDate: vehicle.maintenance?.lastServiceDate ? new Date(vehicle.maintenance.lastServiceDate).toISOString().split('T')[0] : "",
                                nextServiceDate: vehicle.maintenance?.nextServiceDate ? new Date(vehicle.maintenance.nextServiceDate).toISOString().split('T')[0] : "",
                                notes: vehicle.maintenance?.notes || "",
                                status: vehicle.status || "active"
                              });
                            }}
                            className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer"
                          >
                            Log Maintenance
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
    </div>      {/* Add Vehicle Modal */}
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

      {/* View Vehicle Details Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Truck className="w-5 h-5 text-orange-500" />
                  {selectedVehicle.numberPlate}
                </h2>
                <p className="text-xs text-zinc-500 font-mono mt-1">ID: {selectedVehicle._id}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${
                selectedVehicle.status === "active" ? "bg-green-500/10 text-green-500" :
                selectedVehicle.status === "maintenance" ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-500"
              }`}>
                {selectedVehicle.status}
              </span>
            </div>

            <div className="space-y-4">
              {/* Specs info */}
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-zinc-500">Brand / Name</div>
                  <div className="text-sm font-semibold">{selectedVehicle.name || "N/A"}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Model Year</div>
                  <div className="text-sm font-semibold">{selectedVehicle.model || "N/A"}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Fuel Type</div>
                  <div className="text-sm font-semibold capitalize">{selectedVehicle.fuelType || "N/A"}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Load Capacity</div>
                  <div className="text-sm font-semibold">{selectedVehicle.typeId?.capacityKg ? `${selectedVehicle.typeId.capacityKg} kg` : `${selectedVehicle.capacity || 0} kg`}</div>
                </div>
              </div>

              {/* Driver Association */}
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Assigned Driver</h3>
                {selectedVehicle.driverId ? (
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-semibold">{selectedVehicle.driverId.fullName || selectedVehicle.driverId.name}</div>
                      <div className="text-xs text-zinc-400">{selectedVehicle.driverId.phone}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-zinc-500 italic">No driver assigned to this vehicle. Assign a vehicle from the Drivers tab.</div>
                )}
              </div>

              {/* Document details */}
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Documents Verification</h3>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded bg-zinc-950/40 border border-zinc-800/50">
                    <div className="text-zinc-500 mb-1">RC Book</div>
                    <span className="font-semibold text-zinc-300">{selectedVehicle.documents?.rc ? 'Uploaded' : 'Missing'}</span>
                  </div>
                  <div className="p-2.5 rounded bg-zinc-950/40 border border-zinc-800/50">
                    <div className="text-zinc-500 mb-1">Insurance</div>
                    <span className="font-semibold text-zinc-300">{selectedVehicle.documents?.insurance ? 'Uploaded' : 'Missing'}</span>
                  </div>
                  <div className="p-2.5 rounded bg-zinc-950/40 border border-zinc-800/50">
                    <div className="text-zinc-500 mb-1">Pollution</div>
                    <span className="font-semibold text-zinc-300">{selectedVehicle.documents?.pollution ? 'Uploaded' : 'Missing'}</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span className="text-xs text-zinc-500 font-medium">VERIFICATION STATUS:</span>
                  <span className={`text-xs font-bold uppercase ${
                    (selectedVehicle.docsStatus || selectedVehicle.documents?.verifiedStatus) === "verified" ? "text-green-500" :
                    (selectedVehicle.docsStatus || selectedVehicle.documents?.verifiedStatus) === "rejected" ? "text-red-500" : "text-yellow-500"
                  }`}>
                    {selectedVehicle.docsStatus || selectedVehicle.documents?.verifiedStatus || 'Pending'}
                  </span>
                </div>
              </div>

              {/* Maintenance Log */}
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Maintenance History</h3>
                <div className="grid grid-cols-2 gap-4 text-xs text-zinc-300">
                  <div>
                    <span className="text-zinc-500">Last Service Date:</span>
                    <div className="font-semibold mt-0.5">
                      {selectedVehicle.maintenance?.lastServiceDate ? new Date(selectedVehicle.maintenance.lastServiceDate).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-500">Next Service Due:</span>
                    <div className="font-semibold mt-0.5">
                      {selectedVehicle.maintenance?.nextServiceDate ? new Date(selectedVehicle.maintenance.nextServiceDate).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
                {selectedVehicle.maintenance?.notes && (
                  <div className="mt-3 bg-zinc-950/40 p-2.5 rounded border border-zinc-800/50 text-xs text-zinc-400">
                    <span className="font-semibold text-zinc-500 block mb-0.5">Maintenance Notes:</span>
                    {selectedVehicle.maintenance.notes}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-zinc-800">
              <Button
                variant="outline"
                className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                onClick={() => setSelectedVehicle(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Update Documents Modal */}
      {vehicleToUpdateDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-250">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 text-white animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-1">Update Vehicle Documents</h2>
            <p className="text-sm text-zinc-400 mb-4">Provide document details for vehicle {vehicleToUpdateDocs.numberPlate}</p>

            <form onSubmit={handleUpdateDocsSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Registration Certificate (RC) Link/No.</label>
                <Input
                  type="text"
                  placeholder="RC Book reference"
                  className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500"
                  value={docsForm.rc}
                  onChange={(e) => setDocsForm({ ...docsForm, rc: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Insurance Policy Link/No.</label>
                <Input
                  type="text"
                  placeholder="Insurance reference"
                  className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500"
                  value={docsForm.insurance}
                  onChange={(e) => setDocsForm({ ...docsForm, insurance: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Pollution Certificate Link/No.</label>
                <Input
                  type="text"
                  placeholder="Pollution certificate reference"
                  className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500"
                  value={docsForm.pollution}
                  onChange={(e) => setDocsForm({ ...docsForm, pollution: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Verification Status</label>
                <select
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  value={docsForm.verifiedStatus}
                  onChange={(e) => setDocsForm({ ...docsForm, verifiedStatus: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800">
                <Button
                  type="button"
                  variant="ghost"
                  className="hover:bg-zinc-800 text-zinc-400 hover:text-white"
                  onClick={() => setVehicleToUpdateDocs(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
                >
                  {submitting ? "Updating..." : "Update Documents"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Maintenance Modal */}
      {vehicleToLogMaintenance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-250">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 text-white animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-1">Log Vehicle Maintenance</h2>
            <p className="text-sm text-zinc-400 mb-4">Record service dates and logs for {vehicleToLogMaintenance.numberPlate}</p>

            <form onSubmit={handleLogMaintenanceSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Last Service Date</label>
                <Input
                  type="date"
                  required
                  className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500 text-white fill-white [color-scheme:dark]"
                  value={maintenanceForm.lastServiceDate}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, lastServiceDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Next Service Due Date</label>
                <Input
                  type="date"
                  required
                  className="bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500 text-white fill-white [color-scheme:dark]"
                  value={maintenanceForm.nextServiceDate}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, nextServiceDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Maintenance / Service Notes</label>
                <textarea
                  placeholder="Describe service details (e.g. engine oil change, tire rotation)..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-blue-500 min-h-[80px]"
                  value={maintenanceForm.notes}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Vehicle Fleet Status</label>
                <select
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  value={maintenanceForm.status}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, status: e.target.value })}
                >
                  <option value="active">Active (Available)</option>
                  <option value="idle">Idle (No Driver)</option>
                  <option value="maintenance">Maintenance (Out of Service)</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800">
                <Button
                  type="button"
                  variant="ghost"
                  className="hover:bg-zinc-800 text-zinc-400 hover:text-white"
                  onClick={() => setVehicleToLogMaintenance(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
                >
                  {submitting ? "Logging..." : "Log Maintenance"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
