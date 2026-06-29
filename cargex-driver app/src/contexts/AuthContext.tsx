import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';

interface Driver {
  _id: string;
  name: string;
  fullName?: string;
  email: string;
  phone: string;
  role: string;
  isApproved: boolean;
  status?: string;
  vehicleDetails?: {
    type?: string;
    name?: string;
    model?: string;
    numberPlate?: string;
    capacity?: number;
    fuelType?: string;
    image?: string;
  };
}

interface AuthContextType {
  driver: Driver | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string, vehicleType: string) => Promise<void>;
  logout: () => Promise<void>;
  reloadProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('driverToken');
        const storedDriver = await AsyncStorage.getItem('driverData');
        if (storedToken && storedDriver) {
          const parsed = JSON.parse(storedDriver);
          if (parsed && parsed.fullName && !parsed.name) {
            parsed.name = parsed.fullName;
          }
          setToken(storedToken);
          setDriver(parsed);
        }
      } catch (e) {
        console.error('Failed to load storage data', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadStorageData();
  }, []);

  const login = async (identifier: string, password: string) => {
    const payload = identifier.includes('@') 
      ? { email: identifier, password } 
      : { phone: identifier, password };
    
    const response = await apiClient.post('/api/auth/login/driver', payload);
    const { token: accessToken, ...driverData } = response.data;

    if (!accessToken) {
      throw new Error('Authentication token not returned by the server. Please ensure your backend server code is updated and redeployed.');
    }

    // Save driver metadata
    await AsyncStorage.setItem('driverToken', accessToken);
    await AsyncStorage.setItem('driverData', JSON.stringify(driverData));
    setToken(accessToken);
    setDriver(driverData);
  };

  const register = async (name: string, email: string, phone: string, password: string, vehicleType: string) => {
    const payload = { fullName: name, email, phone, password, vehicleType };
    await apiClient.post('/api/auth/register/driver', payload);
    // Note: driver registration is pending admin approval, so we don't automatically log them in
  };

  const reloadProfile = async () => {
    try {
      const res = await apiClient.get('/api/driver/profile');
      const data = res.data;
      if (data && data.fullName && !data.name) {
        data.name = data.fullName;
      }
      await AsyncStorage.setItem('driverData', JSON.stringify(data));
      setDriver(data);
    } catch (e) {
      console.warn('Reloading profile failed', e);
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (e) {
      console.warn('Logout api request failed', e);
    }
    await AsyncStorage.removeItem('driverToken');
    await AsyncStorage.removeItem('driverData');
    setToken(null);
    setDriver(null);
  };

  return (
    <AuthContext.Provider value={{ driver, token, isLoading, login, register, logout, reloadProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
