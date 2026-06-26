"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowUpRight, DollarSign, Wallet, TrendingUp, DownloadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { useAgency } from "@/context/AgencyContext";

// Fallback chart data (will be replaced when finance endpoint returns real data)
const fallbackChartData = [
  { name: "Mon", revenue: 4000, expense: 2400 },
  { name: "Tue", revenue: 3000, expense: 1398 },
  { name: "Wed", revenue: 2000, expense: 9800 },
  { name: "Thu", revenue: 2780, expense: 3908 },
  { name: "Fri", revenue: 1890, expense: 4800 },
  { name: "Sat", revenue: 2390, expense: 3800 },
  { name: "Sun", revenue: 3490, expense: 4300 },
];

const fallbackDriverEarnings = [
  { name: "Driver A", earnings: 45000 },
  { name: "Driver B", earnings: 38000 },
  { name: "Driver C", earnings: 32000 },
  { name: "Driver D", earnings: 28000 },
  { name: "Driver E", earnings: 21000 },
];

export default function FinancePage() {
  const { api } = useAgency();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    commission: 0,
    driverPayouts: 0,
    netProfit: 0,
  });
  const [chartData, setChartData] = useState(fallbackChartData);
  const [driverEarnings, setDriverEarnings] = useState(fallbackDriverEarnings);

  useEffect(() => {
    const fetchFinance = async () => {
      try {
        const res = await api.get('/api/agency/dashboard');
        const d = res.data.data || res.data;
        const revenue = d.revenue || 0;
        const commission = Math.round(revenue * 0.1);
        const payouts = Math.round(revenue * 0.68);
        setStats({
          totalRevenue: revenue,
          commission,
          driverPayouts: payouts,
          netProfit: revenue - commission - payouts,
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchFinance();
  }, [api]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Financial Reports</h1>
          <p className="text-zinc-400 mt-1">Monitor revenue, commissions, and expenses.</p>
        </div>
        <Button className="bg-zinc-800 hover:bg-zinc-700 text-white gap-2">
          <DownloadCloud className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-950 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-green-500 mt-1 flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-1" /> From API
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-950 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Platform Commission (10%)</CardTitle>
            <Wallet className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">-₹{stats.commission.toLocaleString()}</div>
            <p className="text-xs text-zinc-500 mt-1 flex items-center">
              Paid automatically
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Driver Payouts</CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-300">₹{stats.driverPayouts.toLocaleString()}</div>
            <p className="text-xs text-zinc-500 mt-1 flex items-center">
              Settled for current cycle
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Net Agency Profit</CardTitle>
            <DollarSign className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-400">₹{stats.netProfit.toLocaleString()}</div>
            <p className="text-xs text-green-500 mt-1 flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-1" /> Revenue - Commission - Payouts
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-zinc-950 border-zinc-800 text-white">
          <CardHeader>
            <CardTitle>Revenue vs Expenses (Last 7 Days)</CardTitle>
            <CardDescription className="text-zinc-400">Daily breakdown of your cashflow</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-zinc-950 border-zinc-800 text-white">
          <CardHeader>
            <CardTitle>Top Earning Drivers</CardTitle>
            <CardDescription className="text-zinc-400">Monthly performance</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={driverEarnings} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip 
                  cursor={{fill: '#27272a'}}
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                />
                <Bar dataKey="earnings" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
