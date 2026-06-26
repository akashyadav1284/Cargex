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

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get('/api/agency/bookings');
        setBookings(res.data.data || res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [api]);

  const filteredBookings = bookings.filter(b => {
    const term = searchTerm.toLowerCase();
    return (
      (b._id && b._id.toLowerCase().includes(term)) ||
      (b.driverId?.fullName && b.driverId.fullName.toLowerCase().includes(term)) ||
      (b.pickupAddress && b.pickupAddress.toLowerCase().includes(term))
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
                          <span className="truncate">{booking.pickupAddress || 'N/A'}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-zinc-300">
                          <MapPin className="w-4 h-4 mt-0.5 text-red-500 shrink-0" />
                          <span className="truncate">{booking.dropoffAddress || 'N/A'}</span>
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
                      ₹{booking.fare || 0}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-zinc-800 text-zinc-400 hover:text-white">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-200">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer">View Full Details</DropdownMenuItem>
                          {(booking.status === "requested" || booking.status === "pending") && (
                            <DropdownMenuItem className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer text-blue-500">Assign Driver</DropdownMenuItem>
                          )}
                          {(booking.status === "requested" || booking.status === "accepted") && (
                            <DropdownMenuItem className="hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer text-red-500">Cancel Booking</DropdownMenuItem>
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
    </div>
  );
}
