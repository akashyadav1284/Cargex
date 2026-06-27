"use client";

import { useState, useEffect } from "react";
import { Search, Filter, MapPin, Calendar as CalendarIcon, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAgency } from "@/context/AgencyContext";

export default function BookingsPage() {
  const { api } = useAgency();
  const [searchTerm, setSearchTerm] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Action states
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [bookingToAssign, setBookingToAssign] = useState<any | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/agency/bookings');
      setBookings(res.data.data || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await api.get('/api/agency/drivers');
      setDrivers(res.data.data || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchDrivers();
  }, [api]);

  const handleCancelBooking = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await api.post(`/api/agency/bookings/${id}/cancel`, {});
      if (res.status === 200 || res.data.success) {
        fetchBookings();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const handleAssignDriverSubmit = async (driverId: string) => {
    if (!bookingToAssign) return;
    try {
      const res = await api.post(`/api/agency/bookings/${bookingToAssign._id}/assign`, { driverId });
      if (res.status === 200 || res.data.success) {
        setBookingToAssign(null);
        fetchBookings();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign driver');
    }
  };

  const filteredBookings = bookings.filter(b => {
    const term = searchTerm.toLowerCase();
    return (
      (b._id && b._id.toLowerCase().includes(term)) ||
      (b.driverId?.fullName && b.driverId.fullName.toLowerCase().includes(term)) ||
      (b.pickupLocation?.address && b.pickupLocation.address.toLowerCase().includes(term))
    );
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/10 text-green-500";
      case "in_progress": return "bg-blue-500/10 text-blue-500";
      case "accepted": case "arrived": return "bg-indigo-500/10 text-indigo-400";
      case "cancelled": return "bg-red-500/10 text-red-500";
      default: return "bg-yellow-500/10 text-yellow-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Booking History</h1>
          <p className="text-zinc-400 mt-1">Monitor all requested, active, and past bookings.</p>
        </div>
      </div>

      <Card className="bg-zinc-950 border-zinc-800 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2 w-full max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search by ID, driver or location..."
                className="pl-8 bg-zinc-900 border-zinc-800 focus-visible:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white shrink-0">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white shrink-0">
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-zinc-800">
            <Table>
              <TableHeader className="bg-zinc-900/50">
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Booking Details</TableHead>
                  <TableHead className="text-zinc-400">Route</TableHead>
                  <TableHead className="text-zinc-400">Driver & Vehicle</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400 text-right">Fare</TableHead>
                  <TableHead className="text-zinc-400 w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                      Loading bookings...
                    </TableCell>
                  </TableRow>
                ) : filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                      No bookings found.
                    </TableCell>
                  </TableRow>
                ) : filteredBookings.map((booking) => (
                  <TableRow key={booking._id} className="border-zinc-800 hover:bg-zinc-900/50">
                    <TableCell>
                      <div className="font-medium text-white">#{booking._id.slice(-8)}</div>
                      <div className="text-xs text-zinc-500">{new Date(booking.createdAt).toLocaleString()}</div>
                      <div className="text-xs text-zinc-500 mt-1">{booking.distance ? `${booking.distance} km` : '-'}</div>
                    </TableCell>
                     <TableCell>
                      <div className="flex flex-col gap-1 max-w-[200px]">
                        <div className="flex items-start gap-2 text-sm text-zinc-300">
                          <MapPin className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
                          <span className="truncate">{booking.pickupLocation?.address || 'N/A'}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-zinc-300">
                          <MapPin className="w-4 h-4 mt-0.5 text-red-500 shrink-0" />
                          <span className="truncate">{booking.dropLocation?.address || 'N/A'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-white">{booking.driverId?.fullName || 'Unassigned'}</div>
                      <div className="text-xs text-zinc-500">{booking.vehicleId?.numberPlate || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getStatusStyle(booking.status)}`}>
                        {booking.status?.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium text-white">
                      ₹{booking.pricing?.totalFare || booking.price?.total || booking.fare || 0}
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
                            onClick={() => setSelectedBooking(booking)}
                            className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer"
                          >
                            View Full Details
                          </DropdownMenuItem>
                          {(booking.status === "requested" || booking.status === "pending") && (
                            <DropdownMenuItem 
                              onClick={() => setBookingToAssign(booking)}
                              className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer text-blue-500"
                            >
                              Assign Driver
                            </DropdownMenuItem>
                          )}
                          {(booking.status === "requested" || booking.status === "accepted") && (
                            <DropdownMenuItem 
                              onClick={() => handleCancelBooking(booking._id)}
                              className="hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer text-red-500"
                            >
                              Cancel Booking
                            </DropdownMenuItem>
                          )}
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

      {/* View Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">Booking Details</h2>
                <p className="text-xs text-zinc-500 font-mono mt-1">ID: {selectedBooking._id}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${getStatusStyle(selectedBooking.status)}`}>
                {selectedBooking.status?.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-4">
              {/* Category and Items */}
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Cargo & Category</h3>
                <div className="text-sm font-semibold">{selectedBooking.category || "General Logistics"}</div>
                {selectedBooking.items && selectedBooking.items.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedBooking.items.map((item: string, idx: number) => (
                      <span key={idx} className="bg-zinc-800 text-zinc-300 text-xs px-2 py-0.5 rounded-md">
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Route */}
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80 space-y-3">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Route Details</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-zinc-500 font-medium">PICKUP</div>
                      <div className="text-sm text-zinc-300">{selectedBooking.pickupLocation?.address || "N/A"}</div>
                      {selectedBooking.pickupLocation?.contactName && (
                        <div className="text-xs text-zinc-400 mt-0.5">
                          Contact: {selectedBooking.pickupLocation.contactName} ({selectedBooking.pickupLocation.contactPhone})
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-zinc-500 font-medium">DROP-OFF</div>
                      <div className="text-sm text-zinc-300">{selectedBooking.dropLocation?.address || "N/A"}</div>
                      {selectedBooking.dropLocation?.contactName && (
                        <div className="text-xs text-zinc-400 mt-0.5">
                          Contact: {selectedBooking.dropLocation.contactName} ({selectedBooking.dropLocation.contactPhone})
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Driver & Vehicle */}
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Assigned Driver & Vehicle</h3>
                {selectedBooking.driverId ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-zinc-500">DRIVER</div>
                      <div className="text-sm font-semibold">{selectedBooking.driverId.fullName || selectedBooking.driverId.name}</div>
                      <div className="text-xs text-zinc-400">{selectedBooking.driverId.phone}</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">VEHICLE</div>
                      <div className="text-sm font-semibold">{selectedBooking.vehicleId?.numberPlate || "Assigned Plate"}</div>
                      <div className="text-xs text-zinc-400">{selectedBooking.vehicleId?.model || "Model N/A"}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-zinc-500 italic">No driver assigned to this booking yet.</div>
                )}
              </div>

              {/* Price Details */}
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Price Breakdown</h3>
                <div className="space-y-1.5 text-sm">
                  {selectedBooking.pricing && (
                    <>
                      <div className="flex justify-between text-zinc-400">
                        <span>Base Fare</span>
                        <span>₹{selectedBooking.pricing.baseFare || 0}</span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>Distance Fare ({selectedBooking.distance || 0} km)</span>
                        <span>₹{selectedBooking.pricing.distanceFare || 0}</span>
                      </div>
                      {selectedBooking.pricing.loadSurcharge > 0 && (
                        <div className="flex justify-between text-zinc-400">
                          <span>Load Surcharge</span>
                          <span>₹{selectedBooking.pricing.loadSurcharge}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex justify-between font-bold text-white border-t border-zinc-800 pt-2 mt-2">
                    <span>Total Fare</span>
                    <span>₹{selectedBooking.pricing?.totalFare || selectedBooking.price?.total || selectedBooking.fare || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-zinc-800">
              <Button
                variant="outline"
                className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                onClick={() => setSelectedBooking(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Driver Modal */}
      {bookingToAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 text-white max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <h2 className="text-xl font-bold mb-1">Assign Driver</h2>
            <p className="text-sm text-zinc-400 mb-4">Select an agency driver to assign to booking #{bookingToAssign._id.slice(-8)}</p>

            <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
              {drivers.length === 0 ? (
                <div className="text-zinc-500 text-center py-6 text-sm italic">
                  No drivers registered in your agency. Add drivers in the Drivers tab.
                </div>
              ) : (
                drivers.map((driver) => {
                  const isAvailable = driver.availabilityStatus === "active" || (!driver.availabilityStatus && driver.isOnline);
                  return (
                    <div 
                      key={driver._id} 
                      className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60 transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-sm flex items-center gap-2">
                          {driver.fullName || driver.name}
                          <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-zinc-500'}`} />
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {driver.phone} • {driver.assignedVehicleId?.numberPlate || 'No assigned vehicle'}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAssignDriverSubmit(driver._id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium cursor-pointer"
                      >
                        Assign
                      </Button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-zinc-800">
              <Button
                variant="ghost"
                className="hover:bg-zinc-800 text-zinc-400 hover:text-white"
                onClick={() => setBookingToAssign(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
