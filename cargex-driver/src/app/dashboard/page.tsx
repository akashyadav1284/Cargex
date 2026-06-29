"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { API_URL, SOCKET_URL } from '@/lib/config';
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-surfaceHighlight flex items-center justify-center text-zinc-500 text-sm font-bold animate-pulse">
      Loading Map Services...
    </div>
  )
});

type Tab = 'dispatch' | 'profile' | 'history';
type RideStatus = 'idle' | 'incoming' | 'accepted' | 'in_progress' | 'completed';

export default function DriverDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('dispatch');
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  
  // Tab States
  const [profile, setProfile] = useState<any>(null);
  const [rides, setRides] = useState<any[]>([]);
  const [driverEarnings, setDriverEarnings] = useState({ todayEarnings: 0, totalEarnings: 0 });
  const [completedRidesCount, setCompletedRidesCount] = useState(0);

  // Socket & Live Dispatch
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [rideStatus, setRideStatus] = useState<RideStatus>('idle');
  const [liveRequest, setLiveRequest] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const locationInterval = useRef<NodeJS.Timeout | null>(null);

  // Edit State
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ phone: '', address: '', city: '', profilePhoto: '' });

  // Maps State
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpVal, setOtpVal] = useState('');
  const [otpType, setOtpType] = useState<'pickup' | 'dropoff'>('pickup');

  const fetchOpts = useCallback((opts: RequestInit = {}) => ({
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include' as RequestCredentials,
    ...opts
  }), []);

  const handleLogout = useCallback(async () => {
    try { await fetch(`${API_URL}/api/auth/logout`, fetchOpts({ method: 'POST' })); } catch(e){}
    localStorage.removeItem('driverData');
    localStorage.removeItem('driverToken');
    router.push('/login');
  }, [fetchOpts, router]);

  const handleFetchError = (e: any) => {
    console.error('Fetch Error:', e);
    alert('Failed to connect to the server. Please check your network and verify the backend is running.');
    handleLogout(); // Fallback to clear loading state
  };

  const fetchActiveRequest = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/driver/active-request`, fetchOpts());
      if (res.ok) {
        const data = await res.json();
        if (data.booking) {
          setLiveRequest(data.booking);
          setRideStatus(data.rideStatus);
        } else {
          setLiveRequest(null);
          setRideStatus('idle');
        }
      }
    } catch (e) {
      console.error("Failed to fetch active request", e);
    }
  }, [fetchOpts]);

  const fetchUnifiedData = async () => {
    try {
      const [pRes, rRes, eRes] = await Promise.all([
        fetch(`${API_URL}/api/driver/profile`, fetchOpts()),
        fetch(`${API_URL}/api/driver/rides`, fetchOpts()),
        fetch(`${API_URL}/api/driver/earnings`, fetchOpts()),
      ]);

      if (pRes.status === 401 || rRes.status === 401) return handleLogout();

      if (pRes.ok) {
        const pData = await pRes.json();
        setProfile(pData);
        setEditForm({ phone: pData.phone || '', address: pData.address || '', city: pData.city || '', profilePhoto: pData.documents?.profilePhoto || '' });
        setIsAvailable(pData.isOnline);
        fetchActiveRequest();
      } else {
        throw new Error('Profile fetch failed');
      }
      if (rRes.ok) {
        const rData = await rRes.json();
        setRides(rData.rides || rData);
      }
      if (eRes.ok) {
        const eData = await eRes.json();
        setDriverEarnings({ todayEarnings: eData.earnings?.todayEarnings || 0, totalEarnings: eData.earnings?.totalEarnings || 0 });
        setCompletedRidesCount(eData.completedRides || 0);
      }
    } catch (e) {
      handleFetchError(e);
    }
  };

  // Boot Checks
  useEffect(() => {
    const data = localStorage.getItem('driverData');
    if (!data) { router.replace('/login'); return; }
    setIsAuthChecked(true);
    fetchUnifiedData();
  }, [router]);

  // Main Socket Connection
  useEffect(() => {
    if (!isAuthChecked) return;

    const newSocket = io(SOCKET_URL, {
      withCredentials: true // Important for cookie-based socket auth
    });
    
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      // Join driver room using profile ID (from API) or localStorage fallback
      const driverId = profile?._id || JSON.parse(localStorage.getItem('driverData') || '{}')._id;
      if (driverId) {
        newSocket.emit('join_driver', driverId);
        console.log('[Socket] Joined driver room:', driverId);
      }
    });

    newSocket.on('disconnect', () => setIsConnected(false));
    
    // Core Sync Trigger — admin/socket pushes driver record updates
    newSocket.on('driver_updated', (updatedDriverRecord) => {
      setProfile(updatedDriverRecord);
      setEditForm({ phone: updatedDriverRecord.phone || '', address: updatedDriverRecord.address || '', city: updatedDriverRecord.city || '', profilePhoto: updatedDriverRecord.documents?.profilePhoto || '' });
      setIsAvailable(updatedDriverRecord.isOnline);
      if (updatedDriverRecord.isOnline) {
        fetchActiveRequest();
      }
    });

    // New ride request from a user
    newSocket.on('new_ride_request', (booking) => {
      console.log('[Socket] Incoming ride request:', booking._id);
      setLiveRequest(booking);
      setRideStatus('incoming');
    });

    // User cancelled their booking — remove it from this driver's view
    newSocket.on('ride_cancelled', (data) => {
      console.log('[Socket] Ride cancelled:', data.bookingId);
      setLiveRequest((prev: any) => {
        if (prev && prev._id === data.bookingId) {
          setRideStatus('idle');
          return null;
        }
        return prev;
      });
    });

    newSocket.on('earnings_update', () => fetchUnifiedData());

    return () => { newSocket.disconnect(); };
  }, [isAuthChecked, profile?._id]);

  // Handle Availability Toggle
  const toggleAvailableState = async () => {
    const nextState = !isAvailable;
    setIsAvailable(nextState);
    if (!nextState) {
      setLiveRequest(null); setRideStatus('idle');
    }
    // Inform backend of current manual selection
    try {
      await fetch(`${API_URL}/api/driver/availability`, fetchOpts({ method: 'PUT' }));
      if (nextState) {
        fetchActiveRequest();
      }
    } catch { }
  };

  // Real Geolocation telemetry loop
  useEffect(() => {
    let watchId: number;
    if (isAvailable && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCurrentLocation({ lat, lng });

          // Broadcast location to socket if in progress
          if (rideStatus === 'in_progress' && liveRequest && socket && profile) {
            socket.emit('driver_location_update', { driverId: profile._id, lat, lng, bookingId: liveRequest._id });
          }
        },
        (error) => console.error("GPS Error:", error),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    } else if (!isAvailable) {
      setCurrentLocation(null);
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [rideStatus, liveRequest, socket, isAvailable, profile]);



  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/driver/update-profile`, fetchOpts({
        method: 'PUT',
        body: JSON.stringify({
          phone: editForm.phone,
          address: editForm.address,
          city: editForm.city,
          documents: { profilePhoto: editForm.profilePhoto }
        })
      }));
      if (res.ok) {
        setShowEdit(false);
        fetchUnifiedData();
      } else { alert('Failed to update profile.'); }
    } catch { alert('Network error'); }
  };

  const handleAccept = async () => {
    if (!liveRequest) return; setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/api/driver/accept`, fetchOpts({ method: 'POST', body: JSON.stringify({ bookingId: liveRequest._id }) }));
      if (res.ok) setRideStatus('accepted');
      else { const e = await res.json(); alert(e.message); setRideStatus('idle'); setLiveRequest(null); }
    } catch { alert('Network error.'); } finally { setIsProcessing(false); }
  };

  const handleStartRide = async () => {
    if (!liveRequest) return; setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/api/driver/start`, fetchOpts({ method: 'POST', body: JSON.stringify({ bookingId: liveRequest._id }) }));
      if (res.ok) setRideStatus('in_progress'); else { const e = await res.json(); alert(e.message); }
    } catch { alert('Network error.'); } finally { setIsProcessing(false); }
  };

  const handleCompleteRide = async () => {
    if (!liveRequest) return; setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/api/driver/complete`, fetchOpts({ method: 'POST', body: JSON.stringify({ bookingId: liveRequest._id }) }));
      if (res.ok) { setRideStatus('completed'); fetchUnifiedData(); } else { const e = await res.json(); alert(e.message); }
    } catch { alert('Network error.'); } finally { setIsProcessing(false); }
  };

  const handleVerifyOtp = async () => {
    if (!liveRequest) return;
    const expected = otpType === 'pickup' 
      ? liveRequest._id.slice(-4).toUpperCase() 
      : liveRequest._id.slice(0, 4).toUpperCase();

    if (otpVal.trim().toUpperCase() !== expected) {
      alert(`Invalid OTP! Please verify with the customer.`);
      return;
    }

    setShowOtpModal(false);
    if (otpType === 'pickup') {
      await handleStartRide();
    } else {
      await handleCompleteRide();
    }
  };

  if (!isAuthChecked || !profile) return (
    <div className="min-h-screen bg-surface flex items-center justify-center font-sans">
      <div className="text-center"><div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-muted text-sm">Synchronizing driver profile...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface text-foreground font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span className="text-xl font-black tracking-tight text-primary">Cargex Driver</span>
            <nav className="hidden md:flex items-center gap-1 bg-surface rounded-lg p-1">
              {[
                { id: 'dispatch', label: 'Live Dispatch' },
                { id: 'profile', label: 'My Profile' },
                { id: 'history', label: 'Earnings & History' }
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id as Tab)} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${tab === t.id ? 'bg-white shadow-sm text-black' : 'text-muted hover:text-black hover:bg-black/5'}`}>
                  {t.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleLogout} className="text-sm text-muted hover:text-primary transition-colors font-semibold hidden md:block">Logout</button>
            <button onClick={toggleAvailableState} disabled={rideStatus !== 'idle' && rideStatus !== 'incoming' && isAvailable}
              className={`px-5 py-2 rounded-full font-bold transition-all text-sm disabled:opacity-50 ${isAvailable ? 'bg-black text-white px-8' : 'bg-surface text-primary border border-border hover:bg-border'}`}>
              {isAvailable ? '● Online' : 'Offline'}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <div className="md:hidden bg-white border-b border-border flex justify-around p-2">
        <button onClick={() => setTab('dispatch')} className={`px-4 py-2 text-sm font-bold ${tab === 'dispatch' ? 'text-black border-b-2 border-black' : 'text-muted'}`}>Dispatch</button>
        <button onClick={() => setTab('profile')} className={`px-4 py-2 text-sm font-bold ${tab === 'profile' ? 'text-black border-b-2 border-black' : 'text-muted'}`}>Profile</button>
        <button onClick={() => setTab('history')} className={`px-4 py-2 text-sm font-bold ${tab === 'history' ? 'text-black border-b-2 border-black' : 'text-muted'}`}>History</button>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* DISPATCH TAB */}
        {tab === 'dispatch' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {!isAvailable && (
                <div className="bg-white rounded-2xl border-dashed border-2 border-border p-16 flex flex-col items-center justify-center text-center shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-6">
                    <span className="text-3xl grayscale">💤</span>
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-2">You are offline</h3>
                  <p className="text-muted max-w-sm text-sm">Toggle your status to online to start receiving shipments.</p>
                </div>
              )}

              {isAvailable && (
                <div className="bg-white rounded-2xl border flex flex-col overflow-hidden border-border shadow-sm p-4 h-[400px]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-primary flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live GPS System</h3>
                    <span className="text-xs text-muted font-mono">{currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : 'Locating...'}</span>
                  </div>
                  <div className="flex-1 rounded-xl overflow-hidden relative" style={{ minHeight: '350px' }}>
                    <LeafletMap
                      currentLocation={currentLocation}
                      liveRequest={liveRequest}
                      rideStatus={rideStatus}
                      darkMode={false}
                    />
                  </div>
                </div>
              )}

              {/* Ride Flow logic copied over and consolidated */}
              {isAvailable && rideStatus === 'incoming' && liveRequest && (
                <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-border">
                    <div className="flex justify-between items-start mb-6">
                      <div><span className="inline-block px-2.5 py-1 bg-black text-white text-[10px] font-bold rounded-full mb-3 uppercase tracking-wider animate-pulse">Incoming Dispatch</span></div>
                      <div className="text-right">
                        <p className="text-3xl font-black text-primary">₹{Math.round((liveRequest.pricing?.totalFare || liveRequest.price?.total || 0) * 0.80)}</p>
                        <p className="text-muted text-[10px] font-bold uppercase mt-1">Your Earning</p>
                      </div>
                    </div>
                    <div className="relative pl-6 space-y-6 my-6 border-l border-border ml-2">
                       <div className="absolute w-3 h-3 bg-black rounded-full -left-[6.5px] top-1 ring-4 ring-white"></div>
                       <div><p className="text-xs text-muted uppercase font-semibold">Pickup</p><p className="text-sm text-primary font-medium mt-1">{liveRequest.pickupLocation?.address}</p></div>
                       <div className="absolute w-3 h-3 bg-white border-2 border-black rounded-sm -left-[6.5px] top-[calc(100%-1.25rem)]"></div>
                       <div><p className="text-xs text-muted uppercase font-semibold">Drop-off</p><p className="text-sm text-primary font-medium mt-1">{liveRequest.dropLocation?.address}</p></div>
                    </div>
                  </div>
                  <div className="p-6 bg-white flex gap-3">
                    <button onClick={handleAccept} disabled={isProcessing} className="flex-1 bg-black text-white font-bold py-4 rounded-xl shadow-lg">{isProcessing ? 'Claiming...' : 'Accept'}</button>
                    <button onClick={() => { setRideStatus('idle'); setLiveRequest(null); }} className="flex-1 bg-surface border hover:bg-border font-bold py-4 rounded-xl transition-colors">Pass</button>
                  </div>
                </div>
              )}

              {rideStatus === 'accepted' && liveRequest && (
                <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
                  <h3 className="text-2xl font-black mb-1">Ride Secured</h3>
                  <p className="text-muted text-sm mb-6">Navigate to the pickup location: {liveRequest.pickupLocation?.address}</p>
                  <div className="flex gap-4">
                    <button onClick={() => { setOtpType('pickup'); setOtpVal(''); setShowOtpModal(true); }} disabled={isProcessing} className="flex-1 bg-black text-white py-4 rounded-xl font-bold shadow-lg">{isProcessing ? 'Starting...' : 'Arrived — Start Ride'}</button>
                    {currentLocation && (
                      <a href={`https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${liveRequest.pickupLocation?.latitude},${liveRequest.pickupLocation?.longitude}`} target="_blank" className="flex-1 bg-blue-600 text-white flex items-center justify-center py-4 rounded-xl font-bold shadow-lg">Start Navigation ↗</a>
                    )}
                  </div>
                </div>
              )}

              {rideStatus === 'in_progress' && liveRequest && (
                <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
                  <h3 className="text-2xl font-black mb-4">In Transit 🚚</h3>
                  <div className="bg-surface rounded-xl p-4 border border-border mb-6"><p className="text-xs text-muted uppercase font-bold">Destination</p><p className="font-semibold">{liveRequest.dropLocation?.address}</p></div>
                  <div className="flex gap-4">
                    <button onClick={() => { setOtpType('dropoff'); setOtpVal(''); setShowOtpModal(true); }} disabled={isProcessing} className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg">Complete Delivery</button>
                    {currentLocation && (
                      <a href={`https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${liveRequest.dropLocation?.latitude},${liveRequest.dropLocation?.longitude}`} target="_blank" className="flex-1 bg-blue-600 text-white flex items-center justify-center py-4 rounded-xl font-bold shadow-lg">Navigate Dropoff ↗</a>
                    )}
                  </div>
                </div>
              )}
              
              {rideStatus === 'completed' && liveRequest && (
                <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
                  <h3 className="text-2xl font-black mb-1">🎉 Delivery Complete</h3>
                  <button onClick={() => { setRideStatus('idle'); setLiveRequest(null); }} className="w-full max-w-sm bg-black text-white py-4 rounded-xl font-bold mt-6 shadow-lg">Clear Grid</button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-border shadow-sm p-6 line-clamp-1">
                <p className="text-muted text-xs font-bold uppercase tracking-wider mb-2 text-center w-full">Vehicle Signature</p>
                <div className="flex bg-surface p-4 rounded-xl items-center justify-between border border-border mt-4">
                  <div>
                    <span className="px-2 py-0.5 bg-black text-white rounded text-xs font-bold">{profile.vehicleDetails?.numberPlate || 'UNREGISTERED'}</span>
                    <p className="text-sm font-semibold mt-2">{profile.vehicleDetails?.name || 'Loading Name...'}</p>
                  </div>
                  <span className="text-3xl opacity-50">🚛</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-surface px-3 py-2 border rounded-lg"><p className="text-[10px] text-muted font-bold uppercase">Capacity</p><p className="font-bold text-sm">{profile.vehicleDetails?.capacity || 0} kg</p></div>
                  <div className="bg-surface px-3 py-2 border rounded-lg"><p className="text-[10px] text-muted font-bold uppercase">Class</p><p className="font-bold text-sm">{profile.vehicleDetails?.type || 'Standard'}</p></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {tab === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-border p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-accent/20 to-info/20"></div>
               <div className="relative z-10 w-24 h-24 rounded-full border-4 border-white shadow-md bg-surface overflow-hidden shrink-0 mt-8">
                 {profile.documents?.profilePhoto ? (
                   <img src={profile.documents.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                   <span className="w-full h-full flex items-center justify-center font-bold text-2xl text-muted">👤</span>
                 )}
               </div>
               <div className="relative z-10 text-center md:text-left mt-0 md:mt-12 flex-1">
                 <h1 className="text-2xl font-black">{profile.fullName}</h1>
                 <p className="text-muted text-sm">{profile.email}</p>
                 <div className="mt-3 flex gap-2 justify-center md:justify-start">
                   <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase text-white ${profile.status === 'blocked' ? 'bg-danger' : profile.isApproved ? 'bg-success' : 'bg-warning'}`}>
                     {profile.status === 'blocked' ? 'Account Blocked' : profile.isApproved ? 'Approved Partner' : 'KYC Pending'}
                   </span>
                 </div>
               </div>
               <button onClick={() => setShowEdit(true)} className="relative z-10 bg-black text-white px-6 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform mt-4 md:mt-12">Edit Details</button>
            </div>

            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-5">
              <h3 className="font-bold border-b pb-3 border-border">Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div><p className="text-xs uppercase text-muted font-bold tracking-wider">Phone</p><p className="font-medium bg-surface px-4 py-2 mt-1 rounded-lg border">{profile.phone || 'N/A'}</p></div>
                 <div><p className="text-xs uppercase text-muted font-bold tracking-wider">City</p><p className="font-medium bg-surface px-4 py-2 mt-1 rounded-lg border">{profile.city || 'N/A'}</p></div>
                 <div className="sm:col-span-2"><p className="text-xs uppercase text-muted font-bold tracking-wider">Full Address</p><p className="font-medium bg-surface px-4 py-2 mt-1 rounded-lg border">{profile.address || 'N/A'}</p></div>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY & EARNINGS TAB */}
        {tab === 'history' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-2xl border shadow-sm p-6">
                  <h3 className="text-sm font-bold text-muted uppercase tracking-wider">Today's Revenue</h3>
                  <p className="text-4xl font-black mt-2">₹{driverEarnings.todayEarnings.toLocaleString()}</p>
                </div>
                <div className="bg-surface rounded-2xl border shadow-sm p-6">
                  <h3 className="text-sm font-bold text-muted uppercase tracking-wider">Lifetime Payout</h3>
                  <p className="text-3xl font-bold mt-2">₹{driverEarnings.totalEarnings.toLocaleString()}</p>
                  <p className="text-xs font-semibold text-muted mt-2">Total Deliveries: {completedRidesCount}</p>
                </div>
             </div>
             <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden min-h-[400px]">
                  <div className="p-4 border-b border-border bg-surfaceHighlight"><h3 className="font-bold">Past Deliveries</h3></div>
                  {rides.length === 0 ? (
                    <div className="p-12 text-center text-muted font-medium">No rides found in your history ledger.</div>
                  ) : (
                    <div className="divide-y divide-border h-[500px] overflow-y-auto">
                      {rides.map(ride => {
                        const totalFare = ride.pricing?.totalFare || ride.price?.total || 0;
                        const earned = Math.round(totalFare * 0.80);
                        return (
                        <div key={ride._id} className="p-4 hover:bg-surface transition-colors">
                          <div className="flex justify-between items-center">
                            <div>
                               <p className="text-sm font-semibold text-primary">{new Date(ride.createdAt).toLocaleDateString()} at {new Date(ride.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                               <p className="text-[10px] text-muted flex font-mono uppercase mt-1">{ride.vehicleType} • {ride.distance ? `${ride.distance} km` : ''}</p>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-success block">+₹{earned}</span>
                              <span className="text-[10px] text-muted">of ₹{totalFare}</span>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
             </div>
          </div>
        )}

      </main>

      {/* Profile Edit Modal Overlay */}
      {showEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
              <button onClick={() => setShowEdit(false)} className="absolute top-4 right-4 text-muted hover:text-black">✖</button>
              <h2 className="text-xl font-black mb-6">Edit Contact Profile</h2>
              
              <div className="bg-warning/10 text-warning px-4 py-3 rounded-xl text-xs font-bold mb-6">
                 Note: Your Full Name and Vehicle Plate are restricted for compliance verification. Contact Admin for changes.
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                 <div>
                   <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">Phone Number</label>
                   <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-surface border border-border px-4 py-3 rounded-xl font-medium" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="col-span-2">
                     <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">Address</label>
                     <input type="text" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} className="w-full bg-surface border border-border px-4 py-3 rounded-xl font-medium" />
                   </div>
                   <div className="col-span-2">
                     <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">City</label>
                     <input type="text" value={editForm.city} onChange={e => setEditForm({...editForm, city: e.target.value})} className="w-full bg-surface border border-border px-4 py-3 rounded-xl font-medium" />
                   </div>
                 </div>
                 <div>
                   <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">Profile Photo URL (Optional)</label>
                   <input type="url" placeholder="https://" value={editForm.profilePhoto} onChange={e => setEditForm({...editForm, profilePhoto: e.target.value})} className="w-full bg-surface border border-border px-4 py-3 rounded-xl font-medium text-xs" />
                 </div>
                 
                 <button type="submit" className="w-full bg-black text-white font-bold py-4 rounded-xl mt-4 hover:scale-[1.02] transition-transform">Save Securely</button>
              </form>
           </div>
        </div>
      )}

      {/* Footer helpline quote */}
      <footer className="w-full bg-white border-t border-border py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-muted">
          <p className="font-semibold">"Driven by reliability, supported by our team."</p>
          <p className="mt-1 font-bold text-primary">Instant Driver Partner Helpline: +91 9467658854</p>
        </div>
      </footer>

      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <h3 className="text-xl font-bold mb-2">Enter {otpType === 'pickup' ? 'PICKUP' : 'DROPOFF'} OTP</h3>
            <p className="text-xs text-muted mb-4">Verify the 4-digit code provided by the customer to proceed.</p>
            <input 
              type="text" 
              maxLength={4}
              placeholder="0000"
              value={otpVal}
              onChange={e => setOtpVal(e.target.value)}
              className="w-full text-center tracking-widest text-2xl font-black bg-zinc-50 border border-zinc-300 rounded-xl py-3.5 focus:outline-none focus:ring-2 focus:ring-black mb-4 font-mono text-primary"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowOtpModal(false)} className="flex-1 bg-surface hover:bg-border font-bold py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={handleVerifyOtp} className="flex-1 bg-black text-white font-bold py-2.5 rounded-xl text-sm hover:bg-zinc-800 shadow-md">Verify & Proceed</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
