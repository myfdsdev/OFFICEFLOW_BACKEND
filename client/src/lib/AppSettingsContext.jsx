import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { base44 } from '@/api/base44Client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DEFAULT_SETTINGS = {
<<<<<<< HEAD
  app_name: 'AttendEase',
  app_logo: '',
  html_title: 'AttendEase',
  favicon: '',
  primary_color: '#6366f1',
};

const AppSettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  loading: true,
  refresh: () => {},
  updateSettings: () => {},
});

export const AppSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Apply settings to <head> (title, favicon)
  const applyToHead = (s) => {
    if (s.html_title) {
      document.title = s.html_title;
    }
    if (s.favicon) {
      // Remove existing favicons
      document.querySelectorAll("link[rel*='icon']").forEach((el) => el.remove());
      // Add new
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = s.favicon;
      document.head.appendChild(link);
    }
  };

  const fetchSettings = async () => {
    try {
      // Public endpoint — no auth header needed
      const res = await axios.get(`${API_URL}/app-settings`);
      const loaded = { ...DEFAULT_SETTINGS, ...res.data };
      setSettings(loaded);
      applyToHead(loaded);
    } catch (error) {
      console.error('[AppSettings] Failed to load:', error);
      // Fall back to defaults
      applyToHead(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Listen for live updates via socket
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      // Use the existing User entity subscribe channel — we need to subscribe to a custom event
      // We'll use the socket directly via the apiClient's underlying socket
      const setupSocketListener = async () => {
        const { getSocket } = await import('@/api/socketClient');
        const socket = getSocket();
        if (socket) {
          const handler = (newSettings) => {
            const updated = { ...DEFAULT_SETTINGS, ...newSettings };
            setSettings(updated);
            applyToHead(updated);
          };
          socket.on('app_settings_updated', handler);
          unsubscribe = () => socket.off('app_settings_updated', handler);
        }
      };
      setupSocketListener();
    } catch (err) {
      // Socket not ready — that's fine, manual refresh will work
    }
    return () => unsubscribe();
  }, []);

  // Update settings (admin only — backend enforces this)
  const updateSettings = async (newData) => {
    const updated = await base44.api?.put?.('/app-settings', newData);
    // Use direct axios fallback if base44.api isn't set up that way
    if (!updated) {
      const token = localStorage.getItem('workflow_token');
      const res = await axios.put(`${API_URL}/app-settings`, newData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const newSettings = { ...DEFAULT_SETTINGS, ...res.data };
      setSettings(newSettings);
      applyToHead(newSettings);
      return newSettings;
    }
    return updated;
  };

  const refresh = fetchSettings;

  return (
    <AppSettingsContext.Provider value={{ settings, loading, refresh, updateSettings }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }
  return context;
=======
  app_name: 'AttendEase',
  app_logo: '',
  html_title: 'AttendEase',
  favicon: '',
  primary_color: '#6366F1',
};

const AppSettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  loading: true,
  refresh: () => {},
  updateSettings: () => {},
});

export const AppSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Apply settings to <head> (title, favicon)
  const applyToHead = (s) => {
    if (s.html_title) {
      document.title = s.html_title;
    }
    if (s.favicon) {
      // Remove existing favicons
      document.querySelectorAll("link[rel*='icon']").forEach((el) => el.remove());
      // Add new
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = s.favicon;
      document.head.appendChild(link);
    }
  };

  const fetchSettings = async () => {
    try {
      // Public endpoint — no auth header needed
      const res = await axios.get(`${API_URL}/app-settings`);
      const loaded = { ...DEFAULT_SETTINGS, ...res.data };
      setSettings(loaded);
      applyToHead(loaded);
    } catch (error) {
      console.error('[AppSettings] Failed to load:', error);
      // Fall back to defaults
      applyToHead(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Listen for live updates via socket
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      // Use the existing User entity subscribe channel — we need to subscribe to a custom event
      // We'll use the socket directly via the apiClient's underlying socket
      const setupSocketListener = async () => {
        const { getSocket } = await import('@/api/socketClient');
        const socket = getSocket();
        if (socket) {
          const handler = (newSettings) => {
            const updated = { ...DEFAULT_SETTINGS, ...newSettings };
            setSettings(updated);
            applyToHead(updated);
          };
          socket.on('app_settings_updated', handler);
          unsubscribe = () => socket.off('app_settings_updated', handler);
        }
      };
      setupSocketListener();
    } catch (err) {
      // Socket not ready — that's fine, manual refresh will work
    }
    return () => unsubscribe();
  }, []);

  // Update settings (admin only — backend enforces this)
  const updateSettings = async (newData) => {
    const updated = await base44.api?.put?.('/app-settings', newData);
    // Use direct axios fallback if base44.api isn't set up that way
    if (!updated) {
      const token = localStorage.getItem('workflow_token');
      const res = await axios.put(`${API_URL}/app-settings`, newData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const newSettings = { ...DEFAULT_SETTINGS, ...res.data };
      setSettings(newSettings);
      applyToHead(newSettings);
      return newSettings;
    }
    return updated;
  };

  const refresh = fetchSettings;

  return (
    <AppSettingsContext.Provider value={{ settings, loading, refresh, updateSettings }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }
  return context;
>>>>>>> 686fead (feat: implement app settings management with admin controls)
};