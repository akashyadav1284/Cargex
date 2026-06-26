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

  useEffect(() => {
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
    fetchVehicles();
  }, [api]);

  const filteredVehicles = vehicles.filter(v => 
    v.numberPlate.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (v.vehicleType && v.vehicleType.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Vehicle Fleet Management</h1>
          <p className="text-zinc-400 mt-1">Track and manage your trucks, documents, and maintenance.</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
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
                      <div className="text-xs text-zinc-500 mt-1">{vehicle.vehicleType?.name} • {vehicle._id.slice(-6)}</div>
                    </TableCell>
                    <TableCell className="text-zinc-300">{vehicle.vehicleType?.capacity || '-'}</TableCell>
                    <TableCell className="text-zinc-300">
                      {vehicle.assignedDriverId ? (
                        vehicle.assignedDriverId.name
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
                        <DropdownMenuTrigger>
                          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-zinc-800 text-zinc-400 hover:text-white">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
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
  );
}
