"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';
import { io, Socket } from 'socket.io-client';
import { API_URL, SOCKET_URL } from '@/lib/config';
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full flex-col items-center justify-center text-zinc-500">
      <svg className="w-12 h-12 text-zinc-500 z-10 mb-2 opacity-50 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
      <span className="text-zinc-500 tracking-widest text-xs uppercase font-bold z-10 opacity-50">Loading Map...</span>
    </div>
  )
});

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

const CATEGORY_ITEMS: Record<string, string[]> = {
  "Construction Material": ["Cement", "Bricks", "Sand", "Gravel", "Steel Rods", "Tiles", "Marble", "Granite", "Concrete Blocks", "Pipes"],
  "Business / Commercial": ["Office Furniture", "Office Equipment", "Retail Goods", "Electronics", "Industrial Supplies", "Packaging Materials"],
  "Household Goods": ["Sofa", "Bed", "Mattress", "Refrigerator", "Washing Machine", "TV", "Dining Table", "Boxes", "Kitchen Items"],
  "Personal Delivery": ["Documents", "Parcel", "Gift", "Small Package", "Electronics", "Bags"],
  "Heavy Equipment Transport": ["JCB", "Excavator", "Bulldozer", "Crane", "Tractor", "Road Roller", "Generator"],
  "Vehicle Transport": ["Bike", "Scooter", "Car", "SUV", "Pickup", "Tractor"],
  "Food & Agriculture": ["Fruits", "Vegetables", "Milk", "Grain", "Fertilizer", "Animal Feed", "Seeds"]
};

const VEHICLE_METADATA: Record<string, { capacity: string, dimensions: string, cargo: string, emoji: string }> = {
  "Tata Ace": { capacity: "750 kg", dimensions: "7.2 ft x 4.8 ft x 4.9 ft", cargo: "Household shifting, boxes, retail goods", emoji: "🚚" },
  "Tata Ace / Chota Hathi": { capacity: "750 kg", dimensions: "7.2 ft x 4.8 ft x 4.9 ft", cargo: "Household shifting, boxes, retail goods", emoji: "🚚" },
  "Ashok Leyland Dost": { capacity: "1.2 ton", dimensions: "8.2 ft x 5.3 ft x 5.5 ft", cargo: "Commercial bulk, construction materials", emoji: "🚚" },
  "Pickup Truck": { capacity: "1.0 ton", dimensions: "8.0 ft x 5.0 ft x 5.0 ft", cargo: "Furniture, wholesale delivery, agricultural bags", emoji: "🛻" },
  "Pickup": { capacity: "1.0 ton", dimensions: "8.0 ft x 5.0 ft x 5.0 ft", cargo: "Furniture, wholesale delivery, agricultural bags", emoji: "🛻" },
  "Mini Truck": { capacity: "1.5 ton", dimensions: "10 ft x 5.5 ft x 5.5 ft", cargo: "Medium household items, commercial delivery", emoji: "🚛" },
  "Mini Truck (14 ft)": { capacity: "2.5 ton", dimensions: "14 ft x 6 ft x 6.5 ft", cargo: "B2B deliveries, full 1-2 BHK house shifting", emoji: "🚛" },
  "14 ft Truck": { capacity: "2.5 ton", dimensions: "14 ft x 6 ft x 6.5 ft", cargo: "B2B deliveries, full 1-2 BHK house shifting", emoji: "🚛" },
  "Medium Truck (17 ft)": { capacity: "4.0 ton", dimensions: "17 ft x 7 ft x 7.5 ft", cargo: "Large machinery, factory goods, 3BHK relocation", emoji: "🚛" },
  "17 ft Truck": { capacity: "4.0 ton", dimensions: "17 ft x 7 ft x 7.5 ft", cargo: "Large machinery, factory goods, 3BHK relocation", emoji: "🚛" },
  "Closed Truck": { capacity: "4.0 ton", dimensions: "17 ft x 7 ft x 7.5 ft", cargo: "Large machinery, factory goods, 3BHK relocation", emoji: "📦" },
  "Container Truck": { capacity: "5.0 ton", dimensions: "20 ft x 8 ft x 8 ft", cargo: "FMCG products, electronics, B2B wholesale", emoji: "📦" },
  "Tipper": { capacity: "10 ton", dimensions: "Open Tipper Bed", cargo: "Loose gravel, sand, bricks, aggregate", emoji: "🚜" },
  "Tipper Truck": { capacity: "10 ton", dimensions: "Open Tipper Bed", cargo: "Loose gravel, sand, bricks, aggregate", emoji: "🚜" },
  "Trailer": { capacity: "25 ton", dimensions: "40 ft Flatbed", cargo: "Heavy machinery, cranes, JCBs, steel columns", emoji: "🚛" },
  "Low Bed Trailer": { capacity: "30 ton", dimensions: "Modular lowbed", cargo: "Heavy plant machinery, tractors, excavators", emoji: "🚛" },
  "Bike": { capacity: "20 kg", dimensions: "Courier Backpack", cargo: "Documents, parcels, gifts, electronics", emoji: "🛵" },
  "Bike Courier": { capacity: "20 kg", dimensions: "Courier Backpack", cargo: "Documents, parcels, gifts, electronics", emoji: "🛵" },
  "Bike Courier (small items)": { capacity: "20 kg", dimensions: "Courier Backpack", cargo: "Documents, parcels, gifts, electronics", emoji: "🛵" },
  "Scooter": { capacity: "15 kg", dimensions: "Courier Bag", cargo: "Small parcels, food items, retail gifts", emoji: "🛵" },
  "Auto Cargo": { capacity: "500 kg", dimensions: "5 ft x 4 ft x 4 ft", cargo: "Luggage, small crates, business samples", emoji: "🛺" },
  "Auto Rickshaw Cargo": { capacity: "500 kg", dimensions: "5 ft x 4 ft x 4 ft", cargo: "Luggage, small crates, business samples", emoji: "🛺" },
  "Car Carrier": { capacity: "5.0 ton", dimensions: "Single car ramp", cargo: "Cars, SUVs, vehicle towing", emoji: "🚚" },
  "Car Carrier Truck": { capacity: "5.0 ton", dimensions: "Single car ramp", cargo: "Cars, SUVs, vehicle towing", emoji: "🚚" },
  "Bike Carrier": { capacity: "1.0 ton", dimensions: "2-wheeler deck", cargo: "Motorcycles, scooters", emoji: "🚚" },
  "Tow Truck": { capacity: "3.0 ton", dimensions: "Flatbed towing bed", cargo: "Damaged vehicles, recovery", emoji: "🚚" },
  "Flatbed Tow Truck": { capacity: "3.0 ton", dimensions: "Flatbed towing bed", cargo: "Damaged vehicles, recovery", emoji: "🚚" },
  "Flatbed": { capacity: "15 ton", dimensions: "32 ft Flatbed", cargo: "Heavy steel coils, heavy equipment, industrial cargo", emoji: "🚛" },
  "Reefer Truck": { capacity: "3.5 ton", dimensions: "Chilled container", cargo: "Dairy, frozen meat, vaccines, pharma", emoji: "❄️" },
  "Tractor Trolley": { capacity: "3.0 ton", dimensions: "Trolley trailer", cargo: "Agricultural grain bags, animal feed, seeds", emoji: "🚜" }
};

export default function UserDashboard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  const [categories, setCategories] = useState<string[]>([]);
  const [cargoTypes, setCargoTypes] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedCargo, setSelectedCargo] = useState<any | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);

  // Landmarks and Contacts state
  const [pickupLandmark, setPickupLandmark] = useState('');
  const [pickupContactName, setPickupContactName] = useState('');
  const [pickupContactPhone, setPickupContactPhone] = useState('');
  const [dropoffLandmark, setDropoffLandmark] = useState('');
  const [dropoffContactName, setDropoffContactName] = useState('');
  const [dropoffContactPhone, setDropoffContactPhone] = useState('');

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [booking, setBooking] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'booking' | 'history'>('booking');
  const [historyBookings, setHistoryBookings] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const headers: any = {};
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (userData.token) {
          headers['Authorization'] = `Bearer ${userData.token}`;
        }
      } catch {}
      const res = await fetch(`${API_URL}/api/users/bookings`, { 
        credentials: 'include',
        headers
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryBookings(data.bookings || []);
      }
    } catch (e) {
      console.error("Failed to fetch ride history", e);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);
  
  // Maps & Routing State (Leaflet/Nominatim)
  const [pickupLocation, setPickupLocation] = useState<{lat: number, lng: number, address: string} | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<{lat: number, lng: number, address: string} | null>(null);
  const [tripDistance, setTripDistance] = useState<number>(0);
  const [tripDuration, setTripDuration] = useState<number>(0);

  // Address text just for UI fields
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');

  // Suggestions state
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<any[]>([]);
  const [isPickupFocused, setIsPickupFocused] = useState(false);
  const [isDropoffFocused, setIsDropoffFocused] = useState(false);

  const [rideStatus, setRideStatus] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<{lat: number, lng: number} | null>(null);
  const [assignedDriver, setAssignedDriver] = useState<any | null>(null);

  // Debounced suggestions for pickup
  useEffect(() => {
    if (!pickupAddress || pickupLocation) {
      setPickupSuggestions([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pickupAddress)}&limit=5`);
        const data = await res.json();
        setPickupSuggestions(data || []);
      } catch (e) {
        console.error(e);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [pickupAddress, pickupLocation]);

  // Debounced suggestions for dropoff
  useEffect(() => {
    if (!dropoffAddress || dropoffLocation) {
      setDropoffSuggestions([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dropoffAddress)}&limit=5`);
        const data = await res.json();
        setDropoffSuggestions(data || []);
      } catch (e) {
        console.error(e);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [dropoffAddress, dropoffLocation]);

  const handleSelectPickup = (item: any) => {
    setPickupLocation({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      address: item.display_name
    });
    setPickupAddress(item.display_name);
    setPickupSuggestions([]);
  };

  const handleSelectDropoff = (item: any) => {
    setDropoffLocation({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      address: item.display_name
    });
    setDropoffAddress(item.display_name);
    setDropoffSuggestions([]);
  };

  // OSRM Driving Route and Distance/Duration Calculation
  useEffect(() => {
    if (!pickupLocation || !dropoffLocation) return;
    
    const fetchOSRMRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pickupLocation.lng},${pickupLocation.lat};${dropoffLocation.lng},${dropoffLocation.lat}?overview=full`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          setTripDistance(route.distance / 1000); // meters to km
          setTripDuration(Math.ceil(route.duration / 60)); // seconds to mins
        }
      } catch (err) {
        console.error('OSRM route fetch failed for user', err);
        // Fallback to Haversine
        const R = 6371; // km
        const dLat = (dropoffLocation.lat - pickupLocation.lat) * Math.PI / 180;
        const dLon = (dropoffLocation.lng - pickupLocation.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(pickupLocation.lat * Math.PI / 180) * Math.cos(dropoffLocation.lat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        setTripDistance(distance);
        setTripDuration(Math.ceil(distance * 2));
      }
    };
    
    fetchOSRMRoute();
  }, [pickupLocation, dropoffLocation]);

  // Auth guard — Clerk-based
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();

  // Sync Clerk user to backend MongoDB on first load
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !clerkUser) return;
    const syncUser = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/clerk-sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            clerkId: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress,
            fullName: clerkUser.fullName || clerkUser.firstName || 'Cargex User',
            imageUrl: clerkUser.imageUrl,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('userData', JSON.stringify(data));
          setIsAuthChecked(true);
        } else {
          console.error('Clerk sync failed');
          setIsAuthChecked(true); // Still allow access — Clerk already authed
        }
      } catch (e) {
        console.error('Clerk sync error:', e);
        setIsAuthChecked(true);
      }
    };
    syncUser();
  }, [isLoaded, isSignedIn, clerkUser]);

  const getIconForCategory = (cat: string) => {
    if (cat.includes('Household')) return '🏠';
    if (cat.includes('Commercial')) return '🏢';
    if (cat.includes('Food')) return '🌾';
    if (cat.includes('Construction')) return '🏗️';
    if (cat.includes('Heavy') || cat.includes('Industrial')) return '🚜';
    if (cat.includes('Vehicle')) return '🚗';
    return '📦';
  };

  // Socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      withCredentials: true
    });
    setSocket(newSocket);
    newSocket.on('connect', () => {
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (userData._id) newSocket.emit('join_user', userData._id);
      } catch {}
    });
    newSocket.on('driver_assigned', (booking: any) => {
      if (booking._id === bookingId) { 
        setAssignedDriver(booking.driverId); 
        setRideStatus('accepted'); 
        setBooking(booking);
      }
    });
    newSocket.on('ride_status_update', (data: any) => {
      if (data.bookingId === bookingId) { 
        setRideStatus(data.status); 
        if (data.driver) setAssignedDriver(data.driver); 
        setBooking((prev: any) => prev ? { ...prev, status: data.status, driverId: data.driver || prev.driverId } : null);
      }
    });
    newSocket.on('live_location', (data) => { setDriverLocation({ lat: data.lat, lng: data.lng }); });
    return () => { newSocket.disconnect(); };
  }, [bookingId]);

  // Fetch categories
  useEffect(() => {
    fetch(`${API_URL}/api/universal/categories`)
      .then(r => r.json())
      .then(j => { 
        if (j.success) {
          // Filter out Waste/Disposal from displaying
          const filtered = j.data.filter((cat: string) => !cat.toLowerCase().includes('waste') && !cat.toLowerCase().includes('disposal'));
          setCategories(filtered); 
        } 
      })
      .catch(() => {});
  }, []);

  const geocodeAddress = async (address: string, fallbackLat: number, fallbackLng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          address: data[0].display_name
        };
      }
    } catch (err) {
      console.error("OSM Geocoding failed", err);
    }
    return {
      lat: fallbackLat,
      lng: fallbackLng,
      address: address
    };
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        setPickupLocation({ lat: latitude, lng: longitude, address: "Fetching address..." });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.display_name) {
            setPickupLocation({ lat: latitude, lng: longitude, address: data.display_name });
            setPickupAddress(data.display_name);
          } else {
            setPickupLocation({ lat: latitude, lng: longitude, address: `Coordinates: ${latitude}, ${longitude}` });
            setPickupAddress(`Coordinates: ${latitude}, ${longitude}`);
          }
        } catch {
          setPickupLocation({ lat: latitude, lng: longitude, address: `Coordinates: ${latitude}, ${longitude}` });
          setPickupAddress(`Coordinates: ${latitude}, ${longitude}`);
        }
      }, () => {
        alert("Unable to retrieve your location.");
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleCategorySelect = useCallback(async (catName: string) => {
    setSelectedCategory(catName); 
    setSelectedItems([]);
    setSelectedCargo(null); 
    setSelectedVehicle(null); 
    setStep(2); 
    setIsLoading(true);
    try { 
      const res = await fetch(`${API_URL}/api/universal/cargo/${catName}`); 
      const j = await res.json(); 
      if (j.success) setCargoTypes(j.data); 
    } catch {} finally { setIsLoading(false); }
  }, []);

  const handleItemsContinue = async () => {
    if (selectedItems.length === 0) {
      alert("Please select at least one item.");
      return;
    }
    setIsLoading(true);
    setStep(3);

    try {
      // Find a matching subcategory in database
      let matchedCargo = cargoTypes[0];
      for (const item of selectedItems) {
        const found = cargoTypes.find(c => c.name.toLowerCase().includes(item.toLowerCase()) || item.toLowerCase().includes(c.name.toLowerCase()));
        if (found) {
          matchedCargo = found;
          break;
        }
      }
      setSelectedCargo(matchedCargo);

      // Recommendations call with 15km default distance
      const res = await fetch(`${API_URL}/api/universal/recommend`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ cargoTypeId: matchedCargo._id, distanceKm: 15, weightKg: 500 }) 
      });
      const j = await res.json(); 
      if (j.success) setRecommendations(j.data); 
      else setRecommendations([]);
    } catch { 
      setRecommendations([]); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleVehicleSelect = useCallback((v: any) => { 
    setSelectedVehicle(v); 
    setStep(4); 
  }, []);

  const handleLocationContinue = async () => {
    if (!pickupAddress || !dropoffAddress || !pickupContactName || !pickupContactPhone || !dropoffContactName || !dropoffContactPhone) {
      alert("Please enter all details including pickup & delivery contact information.");
      return;
    }

    setIsLoading(true);

    let currentPickup = pickupLocation;
    if (!currentPickup) {
      currentPickup = await geocodeAddress(pickupAddress, 28.6139, 77.2090);
      setPickupLocation(currentPickup);
    }

    let currentDropoff = dropoffLocation;
    if (!currentDropoff) {
      currentDropoff = await geocodeAddress(dropoffAddress, 28.7041, 77.1025);
      setDropoffLocation(currentDropoff);
    }

    if (!currentPickup || !currentDropoff) {
      alert("Could not geocode locations. Please verify inputs.");
      setIsLoading(false);
      return;
    }

    // Calculate actual route distance & duration via OSRM
    try {
      let distance = 15;
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${currentPickup.lng},${currentPickup.lat};${currentDropoff.lng},${currentDropoff.lat}?overview=full`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          distance = data.routes[0].distance / 1000;
          setTripDistance(distance);
          setTripDuration(Math.ceil(data.routes[0].duration / 60));
        }
      } catch {
        // Haversine fallback
        const R = 6371; 
        const dLat = (currentDropoff.lat - currentPickup.lat) * Math.PI / 180;
        const dLon = (currentDropoff.lng - currentPickup.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(currentPickup.lat * Math.PI / 180) * Math.cos(currentDropoff.lat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distance = R * c;
        setTripDistance(distance);
        setTripDuration(Math.ceil(distance * 2));
      }

      // Re-fetch recommendations based on calculated OSRM route distance
      const res = await fetch(`${API_URL}/api/universal/recommend`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ cargoTypeId: selectedCargo._id, distanceKm: distance, weightKg: 500 }) 
      });
      const j = await res.json(); 
      if (j.success && j.data.length > 0) {
        const updatedVeh = j.data.find((v: any) => v.name === selectedVehicle.name);
        if (updatedVeh) {
          setSelectedVehicle(updatedVeh);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setStep(5);
    }
  };

  const handleConfirmBooking = async () => {
    setIsBooking(true);
    try {
      // Append landmarks and contact names/phones to the address string for display clarity
      const pickupAddressWithDetails = `${pickupAddress} (Landmark: ${pickupLandmark || 'None'} | Contact: ${pickupContactName} - ${pickupContactPhone})`;
      const dropAddressWithDetails = `${dropoffAddress} (Landmark: ${dropoffLandmark || 'None'} | Contact: ${dropoffContactName} - ${dropoffContactPhone})`;

      const headers: any = { 'Content-Type': 'application/json' };
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (userData.token) {
          headers['Authorization'] = `Bearer ${userData.token}`;
        }
      } catch {}

      const res = await fetch(`${API_URL}/api/users/bookings`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          pickupLocation: { 
            address: pickupAddressWithDetails, 
            latitude: pickupLocation?.lat || 28.6139, 
            longitude: pickupLocation?.lng || 77.2090 
          },
          dropLocation: { 
            address: dropAddressWithDetails, 
            latitude: dropoffLocation?.lat || 28.7041, 
            longitude: dropoffLocation?.lng || 77.1025 
          },
          distance: tripDistance || 15, 
          duration: tripDuration || 35, 
          vehicleType: selectedVehicle.name,
          category: selectedCategory, 
          subcategory: selectedItems.join(', '),
          loadType: selectedCargo?.name || 'small',
          paymentMethod,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setBookingId(data._id); 
        setBooking(data);
        setBookingSuccess(true);
        if (socket) socket.emit('join_booking_room', data._id);
      } else {
        const err = await res.json();
        if (res.status === 401) { alert('Session expired. Redirecting...'); router.push('/login'); }
        else alert('Booking failed: ' + err.message);
      }
    } catch { alert('Network error'); } finally { setIsBooking(false); }
  };

  const resetBooking = async () => {
    if (bookingId) {
      try {
        const headers: any = { 'Content-Type': 'application/json' };
        try {
          const userData = JSON.parse(localStorage.getItem('userData') || '{}');
          if (userData.token) {
            headers['Authorization'] = `Bearer ${userData.token}`;
          }
        } catch {}

        await fetch(`${API_URL}/api/users/bookings/${bookingId}/cancel`, {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify({ reason: 'Cancelled by user' }),
        });
      } catch (e) {
        console.error('Cancel API failed:', e);
      }
    }
    setStep(1); 
    setSelectedCategory(null); 
    setSelectedItems([]);
    setSelectedCargo(null); 
    setSelectedVehicle(null); 
    setPickupLandmark('');
    setPickupContactName('');
    setPickupContactPhone('');
    setDropoffLandmark('');
    setDropoffContactName('');
    setDropoffContactPhone('');
    setPickupAddress('');
    setDropoffAddress('');
    setPickupLocation(null);
    setDropoffLocation(null);
    setBookingSuccess(false); 
    setBookingId(null); 
    setBooking(null);
    setPaymentMethod('Cash'); 
    setRideStatus(null); 
    setAssignedDriver(null);
  };

  const handleLogout = async () => { 
    try { await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' }); } catch(e){}
    localStorage.removeItem('userData'); 
    router.push('/login'); 
  };

  if (!isLoaded || !isSignedIn || !isAuthChecked) return (
    <div className="min-h-screen bg-surface flex items-center justify-center font-sans">
      <div className="text-center"><div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-muted text-sm">Authenticating...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-surface font-sans">
      <nav className="h-16 bg-white border-b border-border flex items-center justify-between px-4 md:px-8 shrink-0 z-20 sticky top-0 shadow-sm">
        <div className="flex items-center gap-8">
          <span className="text-2xl font-bold tracking-tight text-primary">Cargex</span>
          <div className="hidden md:flex gap-6">
            <button onClick={() => setActiveTab('booking')} className={`text-sm font-medium h-16 transition-all ${activeTab === 'booking' ? 'text-primary border-b-2 border-primary' : 'text-muted hover:text-primary'}`}>Booking</button>
            <button onClick={() => setActiveTab('history')} className={`text-sm font-medium h-16 transition-all ${activeTab === 'history' ? 'text-primary border-b-2 border-primary' : 'text-muted hover:text-primary'}`}>Ride History</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                userButtonAvatarBox: 'w-9 h-9 ring-2 ring-border',
                userButtonPopoverCard: 'bg-white shadow-xl border border-border rounded-xl',
              }
            }}
          />
        </div>
      </nav>

      <div className="flex-1 flex flex-col-reverse md:flex-row relative overflow-hidden">
        <div className="w-full md:w-[480px] lg:w-[550px] bg-white md:h-[calc(100vh-64px)] overflow-y-auto z-10 shadow-[4px_0_24px_rgba(0,0,0,0.04)] border-r border-border shrink-0 pb-24 md:pb-0 flex flex-col">
          {activeTab === 'booking' ? (
            <div className="p-6 border-b border-border bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4 mb-2">
                {step > 1 && <button onClick={() => setStep(step - 1)} className="w-8 h-8 rounded-full bg-surface flex items-center justify-center hover:bg-border transition-colors"><span className="text-primary font-bold">&larr;</span></button>}
                <h1 className="text-2xl font-bold tracking-tight text-primary">
                  {step === 1 && "Select Category"}
                  {step === 2 && "Select Items"}
                  {step === 3 && "Select Vehicle Type"}
                  {step === 4 && "Enter Details"}
                  {step === 5 && "Review & Confirm"}
                </h1>
              </div>
              <div className="flex justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-2">
                <span className={step === 1 ? 'text-black' : ''}>Category</span>
                <span className={step === 2 ? 'text-black' : ''}>Items</span>
                <span className={step === 3 ? 'text-black' : ''}>Vehicle</span>
                <span className={step === 4 ? 'text-black' : ''}>Location</span>
                <span className={step === 5 ? 'text-black' : ''}>Review</span>
              </div>
              <div className="flex gap-2 mt-1">{[1,2,3,4,5].map(s => <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-surfaceHighlight'}`}></div>)}</div>
            </div>
          ) : (
            <div className="p-6 border-b border-border bg-white sticky top-0 z-10">
              <h1 className="text-2xl font-bold tracking-tight text-primary">Ride History</h1>
              <p className="text-xs text-muted mt-1">Complete log of your bookings and deliveries</p>
            </div>
          )}

          <div className="p-6 flex-1 overflow-y-auto">
            {activeTab === 'booking' ? (
              <>
                {step === 1 && (
                  <div className="grid grid-cols-2 gap-4">
                    {categories.length === 0 ? <p className="col-span-2 text-muted text-sm text-center py-8">Loading Categories...</p> :
                      categories.map((cat, i) => (
                        <button key={i} onClick={() => handleCategorySelect(cat)} className="p-4 border-2 border-transparent border-b-border bg-white rounded-2xl hover:border-black active:scale-[0.98] transition-all text-left shadow-sm flex flex-col gap-3 group relative overflow-hidden">
                          <span className="text-3xl bg-surface w-12 h-12 flex items-center justify-center rounded-xl group-hover:scale-115 transition-transform duration-300">{getIconForCategory(cat)}</span>
                          <h3 className="font-bold text-primary tracking-tight">{cat}</h3>
                          <div className="absolute right-4 bottom-4 text-zinc-300 group-hover:text-black group-hover:translate-x-1 transition-all duration-300 font-bold">&rarr;</div>
                        </button>
                      ))
                    }
                  </div>
                )}

                {step === 2 && selectedCategory && (
                  <div className="space-y-4">
                    <div className="bg-surfaceHighlight border border-border rounded-xl p-4 flex items-center gap-4">
                      <span className="text-3xl">{getIconForCategory(selectedCategory)}</span>
                      <div><span className="text-xs text-muted uppercase font-bold tracking-wider">Category Selected</span><h3 className="font-bold text-primary">{selectedCategory}</h3></div>
                    </div>
                    <h4 className="font-bold text-lg mb-2 text-primary">Select Items to Transport</h4>
                    <p className="text-xs text-muted mb-4">You can select multiple items to continue.</p>

                    <div className="flex flex-wrap gap-2.5">
                      {CATEGORY_ITEMS[selectedCategory]?.map((item) => {
                        const isSelected = selectedItems.includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedItems(selectedItems.filter(i => i !== item));
                              } else {
                                setSelectedItems([...selectedItems, item]);
                              }
                            }}
                            className={`px-4 py-3 rounded-xl border text-sm font-semibold tracking-tight transition-all duration-200 flex items-center gap-2 ${
                              isSelected
                                ? 'bg-black border-black text-white shadow-sm'
                                : 'bg-zinc-50 border-border text-zinc-700 hover:border-zinc-400 hover:bg-zinc-100'
                            }`}
                          >
                            <span className={`w-4 h-4 flex items-center justify-center rounded border transition-colors ${
                              isSelected ? 'bg-white border-white text-black' : 'border-zinc-300'
                            }`}>
                              {isSelected && <span className="text-[10px] font-bold">✓</span>}
                            </span>
                            {item}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-8 pt-4 border-t border-border flex justify-end">
                      <button
                        onClick={handleItemsContinue}
                        disabled={selectedItems.length === 0}
                        className="btn-primary flex items-center gap-2 bg-black text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed font-bold py-3 px-6 rounded-xl transition-all"
                      >
                        Continue &rarr;
                      </button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="bg-zinc-950 text-white p-4 rounded-xl flex justify-between items-center shadow-md">
                      <div>
                        <span className="text-[10px] font-bold tracking-wider uppercase opacity-75">Selected Items</span>
                        <h3 className="font-bold text-sm truncate max-w-[280px]">{selectedItems.join(', ')}</h3>
                      </div>
                      <span className="text-2xl">✨</span>
                    </div>

                    <h4 className="font-bold text-lg mb-2 text-primary font-bold">Select Vehicle Type</h4>
                    <p className="text-xs text-muted mb-4">Choose the vehicle that fits your load specifications.</p>

                    {isLoading ? <p className="text-muted text-sm py-4">Matching vehicles...</p> : recommendations.length === 0 ?
                      <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl"><p className="font-bold">No Vehicles Available</p></div> :
                      recommendations.map((veh) => {
                        const meta = VEHICLE_METADATA[veh.name] || {
                          capacity: `${veh.capacity} kg`,
                          dimensions: "Standard Open Bed",
                          cargo: "General cargo",
                          emoji: "🚚"
                        };
                        const isSelected = selectedVehicle?.name === veh.name;

                        return (
                          <button 
                            key={veh.vehicleTypeId} 
                            onClick={() => handleVehicleSelect(veh)} 
                            className={`w-full text-left border-2 rounded-2xl p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                              isSelected ? 'border-black bg-zinc-50 shadow-sm' : 'border-border bg-white hover:border-zinc-400 hover:shadow-xs'
                            }`}
                          >
                            <div className="flex gap-4 items-center">
                              <div className="w-16 h-16 bg-surface rounded-xl flex items-center justify-center border border-border shrink-0">
                                <span className="text-4xl">{meta.emoji}</span>
                              </div>
                              <div className="space-y-1">
                                <h3 className="font-black text-primary text-lg leading-tight">{veh.name}</h3>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs bg-zinc-200 px-2.5 py-0.5 rounded-md font-bold text-zinc-800">{meta.capacity}</span>
                                  <span className="text-xs text-muted font-medium">{meta.dimensions}</span>
                                </div>
                                <p className="text-[11px] text-zinc-500 leading-tight">
                                  <span className="font-semibold text-zinc-700">Cargo:</span> {meta.cargo}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0 flex flex-row md:flex-col justify-between items-center md:items-end w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-zinc-100">
                              <div>
                                <p className="text-[10px] uppercase font-bold text-zinc-400">Est. Fare</p>
                                <p className="font-black text-2xl text-primary">₹{veh.estimatedPrice}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    }
                  </div>
                )}

                {step === 4 && selectedVehicle && (
                  <div className="space-y-6">
                    <div className="bg-surfaceHighlight border border-border rounded-xl p-4 flex justify-between items-center">
                      <div><span className="text-xs text-muted uppercase font-bold tracking-wider block mb-1">Selected Vehicle</span><h3 className="font-bold text-primary">{selectedVehicle.name}</h3></div>
                      <p className="font-black text-xl text-primary">₹{selectedVehicle.estimatedPrice}</p>
                    </div>

                    <h4 className="font-bold text-lg mb-2 text-primary font-bold">Location & Contact Details</h4>

                    <div className="space-y-5">
                      {/* Pickup Details */}
                      <div className="p-4 border border-zinc-200 rounded-xl bg-white space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-green-600 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 bg-green-500 rounded-full inline-block"></span>
                            PICKUP DETAILS
                          </span>
                          <button
                            type="button"
                            onClick={handleGetCurrentLocation}
                            className="text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-3 py-1.5 rounded-lg flex items-center gap-1 border border-zinc-300 transition-colors"
                          >
                            📍 Use Current Location
                          </button>
                        </div>

                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="Search Pickup Address" 
                            value={pickupAddress} 
                            onChange={e => { setPickupAddress(e.target.value); setPickupLocation(null); }} 
                            onFocus={() => setIsPickupFocused(true)}
                            onBlur={() => setTimeout(() => setIsPickupFocused(false), 200)}
                            className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black text-primary font-medium" 
                          />
                          {isPickupFocused && pickupSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto bg-white border border-border rounded-lg shadow-lg z-[100]">
                              {pickupSuggestions.map((item, idx) => (
                                <div 
                                  key={idx} 
                                  onMouseDown={() => handleSelectPickup(item)} 
                                  className="px-4 py-2.5 hover:bg-zinc-50 text-xs text-primary font-medium cursor-pointer transition-colors border-b border-border last:border-0 truncate"
                                >
                                  📍 {item.display_name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input
                            type="text"
                            placeholder="Landmark"
                            value={pickupLandmark}
                            onChange={e => setPickupLandmark(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-black text-primary"
                          />
                          <input
                            type="text"
                            placeholder="Contact Name"
                            value={pickupContactName}
                            onChange={e => setPickupContactName(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-black text-primary"
                          />
                          <input
                            type="text"
                            placeholder="Contact Phone"
                            value={pickupContactPhone}
                            onChange={e => setPickupContactPhone(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-black text-primary"
                          />
                        </div>
                      </div>

                      {/* Delivery Details */}
                      <div className="p-4 border border-zinc-200 rounded-xl bg-white space-y-3">
                        <span className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block"></span>
                          DELIVERY DETAILS
                        </span>

                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="Search Delivery Address" 
                            value={dropoffAddress} 
                            onChange={e => { setDropoffAddress(e.target.value); setDropoffLocation(null); }} 
                            onFocus={() => setIsDropoffFocused(true)}
                            onBlur={() => setTimeout(() => setIsDropoffFocused(false), 200)}
                            className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black text-primary font-medium" 
                          />
                          {isDropoffFocused && dropoffSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto bg-white border border-border rounded-lg shadow-lg z-[100]">
                              {dropoffSuggestions.map((item, idx) => (
                                <div 
                                  key={idx} 
                                  onMouseDown={() => handleSelectDropoff(item)} 
                                  className="px-4 py-2.5 hover:bg-zinc-50 text-xs text-primary font-medium cursor-pointer transition-colors border-b border-border last:border-0 truncate"
                                >
                                  📍 {item.display_name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input
                            type="text"
                            placeholder="Landmark"
                            value={dropoffLandmark}
                            onChange={e => setDropoffLandmark(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-black text-primary"
                          />
                          <input
                            type="text"
                            placeholder="Contact Name"
                            value={dropoffContactName}
                            onChange={e => setDropoffContactName(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-black text-primary"
                          />
                          <input
                            type="text"
                            placeholder="Contact Phone"
                            value={dropoffContactPhone}
                            onChange={e => setDropoffContactPhone(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-black text-primary"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-border flex justify-end">
                      <button
                        onClick={handleLocationContinue}
                        disabled={
                          !pickupAddress || !dropoffAddress || 
                          !pickupContactName || !pickupContactPhone || 
                          !dropoffContactName || !dropoffContactPhone || isLoading
                        }
                        className="btn-primary flex items-center gap-2 bg-black text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed font-bold py-3 px-6 rounded-xl transition-all"
                      >
                        {isLoading ? 'Routing...' : 'Continue'} &rarr;
                      </button>
                    </div>
                  </div>
                )}

                {step === 5 && selectedVehicle && (
                  <div className="space-y-6 pb-10">
                    <h4 className="font-bold text-lg text-primary">Review Booking Summary</h4>

                    <div className="space-y-4">
                      {/* Category & Items Summary */}
                      <div className="p-4 border border-zinc-200 rounded-xl bg-white space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-zinc-400">CATEGORY</span>
                          <span className="text-xs bg-zinc-100 px-2 py-0.5 rounded font-bold text-primary">{selectedCategory}</span>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-zinc-400">ITEMS TO TRANSPORT</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedItems.map(item => (
                              <span key={item} className="text-[11px] bg-zinc-900 text-white px-2.5 py-0.5 rounded-full font-semibold">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Vehicle Summary */}
                      <div className="p-4 border border-zinc-200 rounded-xl bg-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{VEHICLE_METADATA[selectedVehicle.name]?.emoji || '🚚'}</span>
                          <div>
                            <span className="text-xs font-bold text-zinc-400 block">VEHICLE TYPE</span>
                            <h4 className="font-bold text-sm text-primary">{selectedVehicle.name}</h4>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-zinc-400 block">EST. FARE</span>
                          <p className="font-black text-lg text-primary">₹{selectedVehicle.estimatedPrice}</p>
                        </div>
                      </div>

                      {/* Route Details */}
                      <div className="p-4 border border-zinc-200 rounded-xl bg-white space-y-3 text-xs">
                        <div>
                          <span className="text-zinc-400 font-bold block mb-1">PICKUP ADDRESS</span>
                          <p className="font-semibold text-primary">{pickupAddress}</p>
                          <div className="grid grid-cols-2 gap-2 mt-1.5 text-zinc-500">
                            <div><span className="font-bold">Contact:</span> {pickupContactName}</div>
                            <div><span className="font-bold">Phone:</span> {pickupContactPhone}</div>
                            {pickupLandmark && <div className="col-span-2"><span className="font-bold">Landmark:</span> {pickupLandmark}</div>}
                          </div>
                        </div>

                        <div className="border-t border-zinc-100 pt-3">
                          <span className="text-zinc-400 font-bold block mb-1">DELIVERY ADDRESS</span>
                          <p className="font-semibold text-primary">{dropoffAddress}</p>
                          <div className="grid grid-cols-2 gap-2 mt-1.5 text-zinc-500">
                            <div><span className="font-bold">Contact:</span> {dropoffContactName}</div>
                            <div><span className="font-bold">Phone:</span> {dropoffContactPhone}</div>
                            {dropoffLandmark && <div className="col-span-2"><span className="font-bold">Landmark:</span> {dropoffLandmark}</div>}
                          </div>
                        </div>
                      </div>

                      {/* Pricing Breakdown Ticket */}
                      {selectedVehicle.breakdown && (
                        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
                          <div className="p-3.5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-500 font-bold">Fare Breakdown</h4>
                            <span className="text-xs bg-zinc-200 font-bold text-zinc-700 px-2 py-0.5 rounded">
                              {tripDistance ? `${tripDistance.toFixed(1)} km` : '-'}
                            </span>
                          </div>
                          <div className="p-4 space-y-2.5 text-sm">
                            <div className="flex justify-between"><span className="text-zinc-400 font-medium">Base Fare</span><span className="font-bold text-primary">₹{selectedVehicle.breakdown.baseFare}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-400 font-medium">Distance Cost</span><span className="font-bold text-primary">₹{selectedVehicle.breakdown.distanceCost}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-400 font-medium">Load Surcharge</span><span className="font-bold text-primary">₹{selectedVehicle.breakdown.loadCost}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-400 font-medium">Vehicle Multiplier</span><span className="font-bold text-primary">×{selectedVehicle.breakdown.vehicleMultiplier}</span></div>
                            {selectedVehicle.breakdown.surgeMultiplier > 1 && (
                              <div className="flex justify-between text-red-500 font-semibold"><span>Surge Multiplier</span><span>×{selectedVehicle.breakdown.surgeMultiplier}</span></div>
                            )}
                            {selectedVehicle.breakdown.nightSurcharge > 0 && (
                              <div className="flex justify-between text-amber-600 font-semibold"><span>Night Surcharge</span><span>+₹{selectedVehicle.breakdown.nightSurcharge}</span></div>
                            )}
                            <div className="border-t border-zinc-200 pt-2.5 mt-2 flex justify-between text-base font-bold text-primary">
                              <span>Total Estimated Cost</span>
                              <span className="font-black text-lg">₹{selectedVehicle.breakdown.totalFare}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                {isHistoryLoading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-muted text-sm">Loading rides...</p>
                  </div>
                ) : historyBookings.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl bg-surface/30">
                    <span className="text-4xl block mb-3">🚚</span>
                    <h3 className="font-bold text-primary mb-1">No rides found</h3>
                    <p className="text-xs text-muted mb-4">You haven't requested any shipments yet.</p>
                    <button onClick={() => setActiveTab('booking')} className="btn-primary text-xs py-2 px-4 rounded-lg bg-black text-white hover:bg-[#222]">Book a Ride</button>
                  </div>
                ) : (
                  historyBookings.map((b) => (
                    <div
                      key={b._id}
                      onClick={() => {
                        if (b.pickupLocation && b.dropLocation) {
                          setPickupLocation({ lat: b.pickupLocation.latitude, lng: b.pickupLocation.longitude, address: b.pickupLocation.address });
                          setDropoffLocation({ lat: b.dropLocation.latitude, lng: b.dropLocation.longitude, address: b.dropLocation.address });
                          setPickupAddress(b.pickupLocation.address);
                          setDropoffAddress(b.dropLocation.address);
                        }
                      }}
                      className="border border-border rounded-2xl p-4 bg-white hover:border-black cursor-pointer transition-all shadow-sm group text-left"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-muted bg-surface px-2 py-0.5 rounded">
                            ID: {b._id.slice(-6).toUpperCase()}
                          </span>
                          <span className="text-[10px] text-muted ml-2">
                            {new Date(b.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          b.status === 'completed' ? 'bg-green-100 text-green-700' :
                          b.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          b.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          b.status === 'accepted' ? 'bg-indigo-100 text-indigo-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {b.status}
                        </span>
                      </div>

                      <div className="flex gap-3 mb-3">
                        <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center text-xl shrink-0">
                          {b.vehicleType.toLowerCase().includes('bike') ? '🛵' : '🚚'}
                        </div>
                        <div>
                          <h4 className="font-bold text-primary text-sm">{b.vehicleType}</h4>
                          <p className="text-xs text-muted">{b.category || 'Logistics'} • {b.subcategory || b.loadType || 'cargo'}</p>
                        </div>
                      </div>

                      <div className="relative pl-6 space-y-2 text-xs mb-3">
                        <div className="absolute left-[5px] top-1.5 bottom-1.5 w-0.5 bg-border"></div>
                        <div className="relative">
                          <div className="w-1.5 h-1.5 bg-black rounded-full absolute -left-[24px] top-1"></div>
                          <p className="text-primary truncate font-medium"><span className="text-muted">From:</span> {b.pickupLocation?.address}</p>
                        </div>
                        <div className="relative">
                          <div className="w-1.5 h-1.5 bg-accent absolute -left-[24px] top-1"></div>
                          <p className="text-primary truncate font-medium"><span className="text-muted">To:</span> {b.dropLocation?.address}</p>
                        </div>
                      </div>

                      <div className="border-t border-border/50 pt-3 flex justify-between items-center text-xs">
                        <div>
                          <span className="text-muted">Fare:</span>
                          <span className="font-black text-primary ml-1 text-sm">₹{b.pricing?.totalFare || b.price?.total || 0}</span>
                          <span className="text-[10px] text-muted ml-1 uppercase">({b.paymentMethod || 'Cash'})</span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {['requested', 'accepted'].includes(b.status) && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm("Are you sure you want to cancel this booking?")) {
                                  try {
                                    const headers: any = { 'Content-Type': 'application/json' };
                                    try {
                                      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                                      if (userData.token) {
                                        headers['Authorization'] = `Bearer ${userData.token}`;
                                      }
                                    } catch {}
                                    const cancelRes = await fetch(`${API_URL}/api/users/bookings/${b._id}/cancel`, {
                                      method: 'PUT',
                                      headers,
                                      credentials: 'include',
                                      body: JSON.stringify({ reason: 'Cancelled by user' })
                                    });
                                    if (cancelRes.ok) {
                                      fetchHistory();
                                    } else {
                                      alert("Failed to cancel booking.");
                                    }
                                  } catch {
                                    alert("Network error.");
                                  }
                                }
                              }}
                              className="text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded"
                            >
                              Cancel
                            </button>
                          )}
                          {['completed', 'cancelled'].includes(b.status) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPickupAddress(b.pickupLocation?.address || '');
                                setPickupLocation({ lat: b.pickupLocation?.latitude, lng: b.pickupLocation?.longitude, address: b.pickupLocation?.address });
                                setDropoffAddress(b.dropLocation?.address || '');
                                setDropoffLocation({ lat: b.dropLocation?.latitude, lng: b.dropLocation?.longitude, address: b.dropLocation?.address });
                                setSelectedCategory(b.category);
                                setSelectedItems(b.subcategory ? b.subcategory.split(', ') : []);
                                setStep(3); // Go to vehicle recommendations
                                setActiveTab('booking');
                              }}
                              className="text-[10px] font-bold text-primary bg-surface group-hover:bg-border px-2 py-1 rounded transition-colors"
                            >
                              Book Again
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Driver info if accepted */}
                      {b.driverId && (
                        <div className="mt-3 pt-3 border-t border-border/50 bg-surface/50 rounded-xl p-2 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center font-bold text-primary text-xs">
                            {b.driverId.fullName?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-primary">{b.driverId.fullName}</p>
                            <p className="text-[9px] text-muted">{b.driverId.vehicleDetails?.numberPlate || 'CARGEX'} • {b.driverId.phone}</p>
                          </div>
                        </div>
                      )}

                      {/* OTP display in History for active rides */}
                      {['accepted', 'in_progress'].includes(b.status) && (
                        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex justify-between gap-2 text-center">
                          <div className="flex-1 bg-white p-1 rounded-lg border border-amber-100">
                            <span className="text-[8px] font-bold text-zinc-400 block uppercase">Pickup OTP</span>
                            <span className="text-xs font-black text-amber-800 font-mono">{b.pickupOtp || '----'}</span>
                          </div>
                          <div className="flex-1 bg-white p-1 rounded-lg border border-amber-100">
                            <span className="text-[8px] font-bold text-zinc-400 block uppercase">Dropoff OTP</span>
                            <span className="text-xs font-black text-amber-800 font-mono">{b.dropOtp || '----'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {activeTab === 'booking' && step === 5 && selectedVehicle && (
            <div className="p-6 border-t border-border bg-white mt-auto z-20">
              <button className="flex justify-between items-center w-full py-4 px-5 bg-white hover:bg-surface rounded-xl transition-colors border-2 border-border mb-4 shadow-sm" onClick={() => setShowPaymentModal(true)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-6 bg-black text-white text-[10px] font-black flex items-center justify-center rounded uppercase tracking-wider">{paymentMethod === 'Cash' ? 'CASH' : paymentMethod === 'Wallet' ? 'WLLT' : 'UPI'}</div>
                  <span className="font-semibold text-sm">{paymentMethod}</span>
                </div>
                <span className="text-primary font-bold">Change &rarr;</span>
              </button>
              <button onClick={handleConfirmBooking} disabled={isBooking} className="w-full bg-black text-white py-4 text-center rounded-xl font-bold text-lg hover:bg-[#333] transition-transform active:scale-[0.98] shadow-lg disabled:opacity-50">
                {isBooking ? 'Processing...' : 'Confirm Booking'}
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 bg-surfaceHighlight relative h-[35vh] md:h-full flex flex-col items-center justify-center z-0">
          <LeafletMap
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            driverLocation={driverLocation ? { lat: driverLocation.lat, lng: driverLocation.lng } : null}
            darkMode={false}
          />
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-end md:items-center justify-center md:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center"><h3 className="text-2xl font-bold">Payment</h3><button onClick={() => setShowPaymentModal(false)} className="w-8 h-8 bg-surface rounded-full flex items-center justify-center hover:bg-border">✕</button></div>
            <div className="p-6 space-y-3">
              {['Cash', 'Wallet', 'UPI'].map(m => (
                <button key={m} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${paymentMethod === m ? 'border-primary bg-surfaceHighlight' : 'border-transparent border-b-border'}`} onClick={() => { setPaymentMethod(m); setShowPaymentModal(false); }}>
                  <span className="text-2xl">{m === 'Cash' ? '💵' : m === 'Wallet' ? '💳' : '📱'}</span>
                  <span className="font-semibold">{m === 'Cash' ? 'Pay at Location' : m === 'Wallet' ? 'Cargex Wallet' : 'UPI'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {bookingSuccess && (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-8 text-center">
            {!assignedDriver ? (
              <>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 relative"><div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20"></div><span className="text-2xl animate-spin">⏳</span></div>
                <h3 className="text-2xl font-bold mb-2">Locating Driver...</h3>
                <p className="text-muted text-sm mb-1">Your {selectedVehicle?.name} request is live.</p>
                <p className="text-xs text-muted mb-6">Booking ID: <span className="font-mono font-bold text-primary">{bookingId}</span></p>
                
                {/* OTP Display Card */}
                {booking && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 my-3 text-left">
                    <p className="text-[10px] uppercase font-bold text-amber-800 tracking-wider mb-2">🔐 Security Verification OTPs</p>
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex-1 bg-white p-2 rounded-lg border border-amber-200 text-center">
                        <span className="text-[9px] font-bold text-zinc-400 block uppercase">Pickup OTP</span>
                        <span className="text-sm font-black text-amber-900 tracking-wider font-mono">
                          {booking.pickupOtp || '----'}
                        </span>
                      </div>
                      <div className="flex-1 bg-white p-2 rounded-lg border border-amber-200 text-center">
                        <span className="text-[9px] font-bold text-zinc-400 block uppercase">Dropoff OTP</span>
                        <span className="text-sm font-black text-amber-900 tracking-wider font-mono">
                          {booking.dropOtp || '----'}
                        </span>
                      </div>
                    </div>
                    <p className="text-[9px] text-amber-700 text-center mt-2 font-semibold">Share these OTPs with the driver to start and end the delivery ride.</p>
                  </div>
                )}

                <button onClick={resetBooking} className="w-full bg-surface text-primary py-3 rounded-xl font-bold border border-border hover:bg-border transition-colors">Cancel Request</button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                {rideStatus === 'accepted' && <h3 className="text-xl font-bold mb-1 text-green-600">Driver En Route!</h3>}
                {rideStatus === 'in_progress' && <h3 className="text-xl font-bold mb-1 text-blue-600">Ride In Progress 🚚</h3>}
                {rideStatus === 'completed' && <h3 className="text-xl font-bold mb-1">Delivery Complete! 🎉</h3>}
                <div className="bg-surfaceHighlight border border-border rounded-xl p-4 my-4 text-left flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-full border border-border flex items-center justify-center shadow-sm shrink-0"><span className="text-xl font-bold text-primary">{assignedDriver.fullName?.charAt(0)}</span></div>
                  <div><h4 className="font-bold text-primary">{assignedDriver.fullName}</h4><p className="text-xs font-semibold text-muted">{assignedDriver.vehicleDetails?.numberPlate || 'CARGEX'}</p><p className="text-xs font-semibold text-accent">{assignedDriver.phone}</p></div>
                </div>
                {/* OTP Display Card */}
                {booking && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 my-3 text-left">
                    <p className="text-[10px] uppercase font-bold text-amber-800 tracking-wider mb-2">🔐 Security Verification OTPs</p>
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex-1 bg-white p-2 rounded-lg border border-amber-200 text-center">
                        <span className="text-[9px] font-bold text-zinc-400 block uppercase">Pickup OTP</span>
                        <span className="text-sm font-black text-amber-900 tracking-wider font-mono">
                          {booking.pickupOtp || '----'}
                        </span>
                      </div>
                      <div className="flex-1 bg-white p-2 rounded-lg border border-amber-200 text-center">
                        <span className="text-[9px] font-bold text-zinc-400 block uppercase">Dropoff OTP</span>
                        <span className="text-sm font-black text-amber-900 tracking-wider font-mono">
                          {booking.dropOtp || '----'}
                        </span>
                      </div>
                    </div>
                    <p className="text-[9px] text-amber-700 text-center mt-2 font-semibold">Share these OTPs with the driver to start and end the delivery ride.</p>
                  </div>
                )}
                {driverLocation && rideStatus === 'in_progress' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-left">
                    <p className="text-[10px] uppercase font-bold text-blue-600 tracking-wider mb-1">📡 Live GPS</p>
                    <p className="text-xs font-mono text-blue-800">Lat: {driverLocation.lat.toFixed(6)} • Lng: {driverLocation.lng.toFixed(6)}</p>
                  </div>
                )}
                {rideStatus === 'completed' ? (
                  <div className="space-y-3 mt-4">
                    <button onClick={resetBooking} className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-[#333] shadow-md">Book Another</button>
                    <button onClick={() => router.push('/')} className="w-full bg-surface text-primary py-3 rounded-xl font-semibold hover:bg-border">Back to Home</button>
                  </div>
                ) : (
                  <div className="mt-4"><div className="w-full bg-surface text-primary py-3 rounded-xl font-medium text-sm border border-border">{rideStatus === 'in_progress' ? 'Tracking live...' : 'Waiting for driver...'}</div></div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-border flex justify-around items-center z-[100] shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab('booking')} 
          className={`flex flex-col items-center justify-center w-1/2 h-full transition-colors ${activeTab === 'booking' ? 'text-black font-extrabold' : 'text-zinc-400'}`}
        >
          <span className="text-lg">📅</span>
          <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">Booking</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')} 
          className={`flex flex-col items-center justify-center w-1/2 h-full transition-colors ${activeTab === 'history' ? 'text-black font-extrabold' : 'text-zinc-400'}`}
        >
          <span className="text-lg">📋</span>
          <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">Ride History</span>
        </button>
      </div>
    </div>
  );
}
