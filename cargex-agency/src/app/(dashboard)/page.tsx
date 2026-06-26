"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Truck, Route, DollarSign } from 'lucide-react';
import { useAgency } from '@/context/AgencyContext';

export default function DashboardOverview() {
  const { api } = useAgency();
  const [stats, setStats] = useState({
    totalDrivers: 0,
    totalVehicles: 0,
    totalRevenue: 0,
    activeBookings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/api/agency/dashboard');
        const apiData = res.data.data || res.data;
        setStats({
          totalDrivers: apiData.totalDrivers || 0,
          totalVehicles: apiData.totalVehicles || 0,
          totalRevenue: apiData.revenue || 0,
          activeBookings: apiData.activeTrips || 0,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [api]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Agency Dashboard</h1>
        <p className="text-zinc-400 mt-1">Overview of your fleet and earnings.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-zinc-500 mt-1">Total accumulated revenue</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Drivers</CardTitle>
            <Users className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDrivers}</div>
            <p className="text-xs text-zinc-500 mt-1">Registered drivers</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Vehicles</CardTitle>
            <Truck className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVehicles}</div>
            <p className="text-xs text-zinc-500 mt-1">Registered vehicles</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Active Bookings</CardTitle>
            <Route className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeBookings}</div>
            <p className="text-xs text-zinc-500 mt-1">Currently in progress</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-zinc-900 border-zinc-800 text-white">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center text-zinc-500">
            [Chart Area Placeholder]
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-zinc-900 border-zinc-800 text-white">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Driver Rajesh completed a trip</p>
                    <p className="text-sm text-zinc-500">2 hours ago</p>
                  </div>
                  <div className="font-medium text-sm text-green-500">+₹450</div>
                </div>
             ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
