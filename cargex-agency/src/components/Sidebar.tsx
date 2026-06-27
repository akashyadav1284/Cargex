import Link from 'next/link';
import { Truck, Users, LayoutDashboard, Calendar, DollarSign, Settings, LogOut, Activity } from 'lucide-react';

const Sidebar = () => {
  return (
    <div className="flex flex-col w-64 h-screen px-4 py-8 bg-zinc-950 border-r border-zinc-800 text-white">
      <div className="flex items-center gap-2 mb-10 px-2">
        <Activity className="w-8 h-8 text-blue-500" />
        <h2 className="text-2xl font-bold tracking-tight">Cargex<span className="text-blue-500">Agency</span></h2>
      </div>

      <nav className="flex-1 space-y-2">
        <Link href="/" className="flex items-center gap-3 px-3 py-2 text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors">
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>
        <Link href="/drivers" className="flex items-center gap-3 px-3 py-2 text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors">
          <Users className="w-5 h-5" />
          <span>Drivers</span>
        </Link>
        <Link href="/vehicles" className="flex items-center gap-3 px-3 py-2 text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors">
          <Truck className="w-5 h-5" />
          <span>Vehicles</span>
        </Link>
        <Link href="/bookings" className="flex items-center gap-3 px-3 py-2 text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors">
          <Calendar className="w-5 h-5" />
          <span>Bookings</span>
        </Link>
        <Link href="/tracking" className="flex items-center gap-3 px-3 py-2 text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors">
          <Activity className="w-5 h-5" />
          <span>Live Tracking</span>
        </Link>
        <Link href="/finance" className="flex items-center gap-3 px-3 py-2 text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors">
          <DollarSign className="w-5 h-5" />
          <span>Finance</span>
        </Link>
      </nav>

      <div className="mt-auto space-y-2">
        <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>
        <button className="flex items-center gap-3 px-3 py-2 w-full text-zinc-300 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
        <div className="border-t border-zinc-800 pt-3 mt-2 text-[10px] text-zinc-500 space-y-1">
          <p className="font-semibold text-zinc-400">"We are here to support your fleet 24/7."</p>
          <p className="font-bold text-blue-500">Helpline: +91 9467658854</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
