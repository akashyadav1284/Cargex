import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';

interface Agency {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
}

interface AuthContextType {
  agency: Agency | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('agencyToken');
        const storedAgency = await AsyncStorage.getItem('agencyUser');
        if (storedToken && storedAgency) {
          setToken(storedToken);
          setAgency(JSON.parse(storedAgency));
        }
      } catch (e) {
        console.error('Failed to load storage data', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadStorageData();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiClient.post('/api/agency/auth/login', { email, password });
    const { token: accessToken, ...agencyData } = response.data;

    await AsyncStorage.setItem('agencyToken', accessToken);
    await AsyncStorage.setItem('agencyUser', JSON.stringify(agencyData));
    setToken(accessToken);
    setAgency(agencyData);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('agencyToken');
    await AsyncStorage.removeItem('agencyUser');
    setToken(null);
    setAgency(null);
  };

  return (
    <AuthContext.Provider value={{ agency, token, isLoading, login, logout }}>
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
