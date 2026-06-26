import { Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAgency } from '@/context/AgencyContext';

const Topbar = () => {
  const { user, logout } = useAgency();

  return (
    <div className="flex items-center justify-between h-16 px-8 bg-zinc-950 border-b border-zinc-800 text-white">
      <div className="flex items-center gap-2 w-1/3">
        <Search className="w-5 h-5 text-zinc-400 absolute ml-3" />
        <Input 
          type="text" 
          placeholder="Search drivers, vehicles, bookings..." 
          className="pl-10 bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-blue-500"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-zinc-800">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full"></span>
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-zinc-800">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-semibold text-sm">
            {user?.name ? user.name.substring(0, 2).toUpperCase() : "AG"}
          </div>
          <div className="text-sm">
            <p className="font-medium">{user?.name || "Loading..."}</p>
            <p className="text-zinc-400 text-xs">Agency Owner</p>
          </div>
          <button onClick={logout} className="ml-2 text-xs text-red-400 hover:text-red-300">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
