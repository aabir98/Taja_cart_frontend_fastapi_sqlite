import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Users, Store as StoreIcon, LogOut, Menu, X, Gift, Bell, Settings as SettingsIcon } from 'lucide-react';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import Orders from './Orders';
import Customers from './Customers';
import Store from './Store';
import OffersEvents from './OffersEvents';
import Notifications from './Notifications';
import Settings from './Settings';
import './admin.css';

function AdminLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const auth = sessionStorage.getItem('adminAuth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      setupPushNotifications();
    }
  }, [isAuthenticated]);

  const setupPushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
      
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      const response = await fetch('https://api.tajacart.in/api/admin/vapid_public_key');
      if (!response.ok) return;
      const { public_key } = await response.json();
      
      function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      }
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(public_key)
      });
      
      await fetch('https://api.tajacart.in/api/admin/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON())
      });
    } catch (e) {
      console.error('Push notification setup failed', e);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('adminAuth', 'true');
    navigate('/admin');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuth');
    navigate('/admin/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  const navLinks = [
    { path: '/admin', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/admin/orders', name: 'Orders', icon: <ShoppingCart size={20} /> },
    { path: '/admin/customers', name: 'Customers', icon: <Users size={20} /> },
    { path: '/admin/store', name: 'Store', icon: <StoreIcon size={20} /> },
    { path: '/admin/offers-events', name: 'Offers & Events', icon: <Gift size={20} /> },
    { path: '/admin/notifications', name: 'Notifications', icon: <Bell size={20} /> },
    { path: '/admin/settings', name: 'Settings', icon: <SettingsIcon size={20} /> },
  ];

  return (
    <div className="admin-container">
      {/* Mobile Header */}
      <div className="admin-mobile-header">
        <div className="admin-logo">Tajakart Admin</div>
        <button className="admin-menu-btn" onClick={toggleSidebar}>
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <h2>Tajakart Admin</h2>
        </div>
        <nav className="admin-nav">
          {navLinks.map((link) => (
            <Link 
              key={link.path} 
              to={link.path} 
              className={`admin-nav-link ${location.pathname === link.path ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              {link.icon}
              <span>{link.name}</span>
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <button className="admin-logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div className="admin-backdrop" onClick={closeSidebar}></div>
      )}

      {/* Main Content */}
      <div className="admin-main-content">
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/store" element={<Store />} />
          <Route path="/offers-events" element={<OffersEvents />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </div>
  );
}

export default AdminLayout;
