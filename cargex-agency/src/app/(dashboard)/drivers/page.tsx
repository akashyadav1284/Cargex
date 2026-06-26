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

  useEffect(() => {
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
    fetchDrivers();
  }, [api]);

  const filteredDrivers = drivers.filter(driver => 
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (driver.phone && driver.phone.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Drivers Management</h1>
          <p className="text-zinc-400 mt-1">Manage your agency fleet drivers and their profiles.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
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
                      <div className="font-medium text-white">{driver.name}</div>
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
                        {driver.availabilityStatus === "active" && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {driver.availabilityStatus === "offline" && <XCircle className="w-4 h-4 text-zinc-500" />}
                        {driver.availabilityStatus === "on_trip" && <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />}
                        <span className={`text-sm capitalize ${
                          driver.availabilityStatus === "active" ? "text-green-500" : 
                          driver.availabilityStatus === "offline" ? "text-zinc-400" : "text-blue-500"
                        }`}>{driver.availabilityStatus.replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-zinc-300">-</TableCell>
                    <TableCell className="text-right text-zinc-300">
                      {driver.rating > 0 ? (
                        <span className="flex items-center justify-end gap-1">
                          {driver.rating} <span className="text-yellow-500">★</span>
                        </span>
                      ) : "-"}
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
                          <DropdownMenuItem className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer">View Profile</DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer">Assign Vehicle</DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-zinc-800" />
                          <DropdownMenuItem className="text-red-500 hover:bg-red-500/10 hover:text-red-500 focus:bg-red-500/10 focus:text-red-500 cursor-pointer">
                            Deactivate Driver
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
  );
}
