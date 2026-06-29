import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedUser = await AsyncStorage.getItem('userData');
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
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
    
    const response = await apiClient.post('/api/auth/login/user', payload);
    const { token: accessToken, ...userData } = response.data;
    
    await AsyncStorage.setItem('userToken', accessToken);
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  };

  const register = async (name: string, email: string, phone: string, password: string) => {
    const payload = { name, email, phone, password };
    const response = await apiClient.post('/api/auth/register/user', payload);
    const { token: accessToken, ...userData } = response.data;

    await AsyncStorage.setItem('userToken', accessToken);
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (e) {
      console.warn('Logout api request failed', e);
    }
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
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
