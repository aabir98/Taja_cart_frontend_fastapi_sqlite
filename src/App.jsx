import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { jwtDecode } from "jwt-decode";
import AddressMap from './components/AddressMap';
import { generateInvoice } from './utils/generateInvoice';

// Custom hook to sync state with localStorage
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn('Error reading localStorage for ' + key, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn('Error setting localStorage for ' + key, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
import { Search, ChevronDown, User, Heart, ShoppingBag, MapPin, Grid, PlayCircle, Tag, Zap, ChevronUp, ShoppingCart, Leaf, Timer, Shield, Home, ArrowLeft, X, Bell } from 'lucide-react';

// categoryData has been moved to the backend database

const OrderRatingWidget = ({ order, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (order.rating) {
    return (
      <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#334155' }}>Your Review</h4>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
          {[1, 2, 3, 4, 5].map(star => (
            <span key={star} style={{ color: star <= order.rating ? '#eab308' : '#cbd5e1', fontSize: '16px' }}>★</span>
          ))}
        </div>
        {order.review && <p style={{ margin: '0', fontSize: '13px', color: '#475569', fontStyle: 'italic' }}>"{order.review}"</p>}
      </div>
    );
  }

  const submitReview = async () => {
    if (!rating) {
      alert("Please select a rating.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`https://api.tajacart.in/api/orders/${order.id}/rate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, review })
      });
      if (response.ok) {
        onReviewSubmitted(order.id, rating, review);
      } else {
        alert("Failed to submit review.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    }
    setSubmitting(false);
  };

  return (
    <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#166534' }}>Rate this Order</h4>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <span 
            key={star} 
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            style={{ 
              cursor: 'pointer', 
              color: star <= (hoverRating || rating) ? '#eab308' : '#cbd5e1', 
              fontSize: '24px',
              transition: 'color 0.2s'
            }}
          >
            ★
          </span>
        ))}
      </div>
      <textarea 
        placeholder="Write a review (optional)..."
        value={review}
        onChange={(e) => setReview(e.target.value)}
        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', minHeight: '60px', marginBottom: '8px', resize: 'vertical', boxSizing: 'border-box' }}
      />
      <button 
        onClick={submitReview}
        disabled={submitting || !rating}
        style={{ width: '100%', backgroundColor: rating ? '#16a34a' : '#94a3b8', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: rating ? 'pointer' : 'not-allowed', fontSize: '13px', boxSizing: 'border-box' }}
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  );
};

const TajaCartLoader = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100%',
      backgroundColor: '#f0fdf4',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999
    }}>
      <div style={{
        animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <img 
          src="/logo.png" 
          alt="Taja Cart" 
          style={{ width: '100px', height: '100px', objectFit: 'contain', marginBottom: '16px' }} 
        />
        <div style={{ color: '#16a34a', fontSize: '22px', fontWeight: 'bold' }}>
          Taja Cart
        </div>
        <div style={{ color: '#15803d', fontSize: '14px', marginTop: '4px' }}>
          Preparing your fresh store...
        </div>
      </div>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(0.95); }
          }
        `}
      </style>
    </div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useLocalStorage('activeTab', 'home');
  const [activeCategory, setActiveCategory] = useLocalStorage('activeCategory', 'All');
  const [cart, setCart] = useLocalStorage('cart', {});
  const [couponCode, setCouponCode] = useLocalStorage('couponCode', '');
  const [appliedCoupon, setAppliedCoupon] = useLocalStorage('appliedCoupon', null);
  const [couponError, setCouponError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Delivery Details State
  const [deliveryDetails, setDeliveryDetails] = useLocalStorage('deliveryDetails', {
    name: '',
    phone: '',
    street: '',
    building: '',
    locality: '',
    landmark: '',
    city: '',
    state: '',
    lat: null,
    lng: null
  });

  // Orders State
  const [placedOrders, setPlacedOrders] = useState([]);

  // User Authentication State
  const [user, setUser] = useLocalStorage('user', null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryData, setCategoryData] = useState({});
  const [categoryList, setCategoryList] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useLocalStorage('dismissed_notifs_v2', []);
  const [dealsOfTheDay, setDealsOfTheDay] = useState([]);
  const [activeOffers, setActiveOffers] = useState([]);
  const [isFirst20Active, setIsFirst20Active] = useState(true);
  const [minOrderValue, setMinOrderValue] = useState(99);
  const [deliveryChargeAmount, setDeliveryChargeAmount] = useState(10);
  const [activeAnnouncements, setActiveAnnouncements] = useState([]);
  const [featuredReviews, setFeaturedReviews] = useState([]);
  const [banners, setBanners] = useState([]);
  const bannerScrollRef = useRef(null);
  
  const [hubs, setHubs] = useState([]);
  
  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addingNewAddress, setAddingNewAddress] = useState(false);
  const [saveAddressLabel, setSaveAddressLabel] = useState('');

  // Haversine distance formula
  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c; 
  };

  // Initialize Google Auth for native platform
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize();
    }
  }, []);

  // Fetch Inventory from Backend
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch('https://api.tajacart.in/api/home-feed');
        const data = await res.json();
        
        const {
          categories,
          products,
          deals,
          offers,
          settings,
          announcements,
          reviews,
          banners: activeBanners,
          hubs: hubData,
          notifications: notificationsData
        } = data;

        // Native Browser Notifications Logic (Mobile Support via Service Worker)
        if ('Notification' in window && 'serviceWorker' in navigator) {
          navigator.serviceWorker.register('/sw.js').then(registration => {
            if (Notification.permission === 'default') {
              Notification.requestPermission();
            }
            if (Notification.permission === 'granted') {
              const shownNotifs = JSON.parse(localStorage.getItem('shown_browser_notifs') || '[]');
              let newShown = [...shownNotifs];
              notificationsData.forEach(notif => {
                if (!shownNotifs.includes(notif.id)) {
                  registration.showNotification('New Update from Taja Cart', {
                    body: notif.text,
                    icon: '/logo.png',
                    data: {
                      url: window.location.origin
                    }
                  });
                  newShown.push(notif.id);
                }
              });
              localStorage.setItem('shown_browser_notifs', JSON.stringify(newShown));
            }
          });
        }
        
        setDealsOfTheDay(deals);
        setActiveOffers(offers);
        setActiveAnnouncements(announcements);
        setFeaturedReviews(reviews);
        setBanners(activeBanners);
        setHubs(hubData);
        setNotifications(notificationsData);

        const f20Setting = settings.find(s => s.key === 'FIRST20_ACTIVE');
        if (f20Setting) setIsFirst20Active(f20Setting.value === 'true');
        
        const minOrderSetting = settings.find(s => s.key === 'MIN_ORDER_FOR_FREE_DELIVERY');
        if (minOrderSetting) setMinOrderValue(Number(minOrderSetting.value));
        
        const deliveryChargeSetting = settings.find(s => s.key === 'DELIVERY_CHARGE');
        if (deliveryChargeSetting) setDeliveryChargeAmount(Number(deliveryChargeSetting.value));
        
        const newCategoryData = {};
        categories.forEach(c => {
          newCategoryData[c.name] = products.filter(p => p.category_id === c.id);
        });
        
        setCategoryData(newCategoryData);
        setCategoryList(categories);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching inventory:', err);
        setIsLoading(false);
      }
    };
    fetchInventory();
  }, []);

  // Auto-slide Banners Every 4 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      if (bannerScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = bannerScrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          bannerScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          bannerScrollRef.current.scrollBy({ left: clientWidth, behavior: 'smooth' });
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [banners]);

  // Handle Search InputOrders and Addresses from Backend
  useEffect(() => {
    if (user && user.email) {
      fetch(`https://api.tajacart.in/api/addresses/${user.email}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setSavedAddresses(data);
        })
        .catch(err => console.error("Error fetching addresses:", err));
    } else {
      setSavedAddresses([]);
    }

    if (user && user.phone) {
      fetch(`https://api.tajacart.in/api/orders/user/${user.phone}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setPlacedOrders(data);
        })
        .catch(err => console.error("Error fetching orders:", err));
    } else {
      setPlacedOrders([]);
    }
  }, [user, activeTab]); // Re-fetch on tab switch or user change

  // Collect all unique products for search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    
    // Flatten categoryData into a single list and remove duplicates by name
    const allUniqueProducts = [];
    const seenNames = new Set();
    [...Object.values(categoryData).flat(), ...dealsOfTheDay].forEach(product => {
      if (!seenNames.has(product.name)) {
        seenNames.add(product.name);
        allUniqueProducts.push(product);
      }
    });

    return allUniqueProducts.filter(item => item.name.toLowerCase().includes(query));
  }, [searchQuery, categoryData, dealsOfTheDay]);
  
  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCollectingPhone, setIsCollectingPhone] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [pendingRatingOrder, setPendingRatingOrder] = useState(null);
  
  // Profile State
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editPhoneInput, setEditPhoneInput] = useState('');

  const handleDeleteAddress = async (id) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      try {
        const response = await fetch(`https://api.tajacart.in/api/addresses/${id}`, { method: 'DELETE' });
        if (response.ok) {
          setSavedAddresses(savedAddresses.filter(addr => addr.id !== id));
          if (selectedAddressId === id) setSelectedAddressId(null);
        }
      } catch (err) {
        console.error("Error deleting address:", err);
      }
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!deliveryDetails.building) {
      alert("Please fill in your Building Name / House No.");
      return;
    }

    const newOrder = {
      id: 'TC-' + Math.floor(10000 + Math.random() * 90000),
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      items: cartDetails.items,
      grandTotal: cartDetails.grandTotal,
      deliveryDetails: { ...deliveryDetails, email: user.email, deliveryFee: cartDetails.deliveryFee }
    };

    try {
      if (saveAddressLabel.trim() && user.email) {
        const addressStr = `${deliveryDetails.building ? deliveryDetails.building + ', ' : ''}${deliveryDetails.street}, ${deliveryDetails.locality}, ${deliveryDetails.city}, ${deliveryDetails.state}`;
        fetch('https://api.tajacart.in/api/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: user.email,
            label: saveAddressLabel.trim(),
            address: addressStr,
            landmark: deliveryDetails.landmark,
            lat: deliveryDetails.lat,
            lng: deliveryDetails.lng
          })
        }).then(res => res.json()).then(data => {
          if (data.id) {
            setSavedAddresses([{
              id: data.id, 
              userEmail: user.email, 
              label: saveAddressLabel.trim(), 
              address: addressStr, 
              landmark: deliveryDetails.landmark, 
              lat: deliveryDetails.lat, 
              lng: deliveryDetails.lng
            }, ...savedAddresses]);
          }
        }).catch(err => console.error("Error saving address:", err));
      }

      const response = await fetch('https://api.tajacart.in/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
      if (response.ok) {
        const freshOrder = {...newOrder, status: 'Placed'};
        setPlacedOrders([freshOrder, ...placedOrders]);
        setCart({});
        setAppliedCoupon(null);
        setCouponCode('');
        setSaveAddressLabel('');
        setAddingNewAddress(false);
        setActiveTab('home');
        setPendingRatingOrder(freshOrder);
      } else {
        alert("Failed to place order.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Please try again.");
    }
  };

  const handleReviewSubmitted = (orderId, rating, review) => {
    setPlacedOrders(placedOrders.map(o => 
      o.id === orderId ? { ...o, rating, review } : o
    ));
  };

  const cancelOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      try {
        const response = await fetch(`https://api.tajacart.in/api/orders/${orderId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setPlacedOrders(placedOrders.filter(o => o.id !== orderId));
        } else {
          alert("Failed to cancel order.");
        }
      } catch (err) {
        console.error(err);
        alert("Network error. Please try again.");
      }
    }
  };

  const downloadInvoice = (order) => {
    generateInvoice(order);
  };

  const handleApplyCoupon = () => {
    if (couponCode === 'FIRST20') {
      if (!isFirst20Active) {
        setCouponError('This coupon is currently inactive');
        setAppliedCoupon(null);
        return;
      }
      if (!user) {
        setCouponError('Please login to apply this coupon');
        setAppliedCoupon(null);
        return;
      }
      const userOrderCount = placedOrders.filter(o => o.deliveryDetails && o.deliveryDetails.phone === user.phone).length;
      if (userOrderCount >= 2) {
        setCouponError('FIRST20 is only valid for your first 2 orders');
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon(couponCode);
      setCouponError('');
      return;
    } 
    
    if (couponCode === 'FLAT20') {
      setAppliedCoupon(couponCode);
      setCouponError('');
      return;
    }

    const dynamicOffer = activeOffers.find(o => o.code === couponCode);
    if (dynamicOffer) {
      const today = new Date();
      today.setHours(0,0,0,0);
      const validUntil = new Date(dynamicOffer.valid_until);
      
      if (today > validUntil) {
        setCouponError('This coupon has expired');
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon(couponCode);
        setCouponError('');
      }
    } else {
      setCouponError('Invalid coupon code');
      setAppliedCoupon(null);
    }
  };

  const updateCart = (productName, delta) => {
    setCart(prev => {
      const currentQty = prev[productName] || 0;
      const newQty = Math.max(0, currentQty + delta);
      const newCart = { ...prev };
      if (newQty === 0) {
        delete newCart[productName];
      } else {
        newCart[productName] = newQty;
      }
      return newCart;
    });
  };

  const totalCartItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const cartDetails = React.useMemo(() => {
    const allProducts = [...Object.values(categoryData).flat(), ...dealsOfTheDay];
    const items = [];
    let itemTotal = 0;

    Object.entries(cart).forEach(([name, qty]) => {
      const product = allProducts.find(p => p.name === name);
      if (product) {
        items.push({ ...product, qty });
        itemTotal += product.currentPrice * qty;
      }
    });

    let discountAmount = 0;
    if (appliedCoupon === 'FIRST20' || appliedCoupon === 'FLAT20') {
      discountAmount = Math.floor(itemTotal * 0.2); // 20% off
    } else if (appliedCoupon) {
      const dynamicOffer = activeOffers.find(o => o.code === appliedCoupon);
      if (dynamicOffer) {
        discountAmount = Math.floor(itemTotal * (dynamicOffer.discount_percent / 100));
      }
    }

    const discountedTotal = itemTotal - discountAmount;
    const deliveryFee = discountedTotal >= minOrderValue ? 0 : deliveryChargeAmount;
    const grandTotal = discountedTotal + (items.length > 0 ? deliveryFee : 0);

    return { items, itemTotal, discountAmount, deliveryFee, grandTotal };
  }, [cart, appliedCoupon, categoryData, dealsOfTheDay, activeOffers, minOrderValue, deliveryChargeAmount]);

  const allList = React.useMemo(() => {
    const allProducts = [...Object.values(categoryData).flat(), ...dealsOfTheDay];
    // Remove duplicates by name
    const unique = [];
    const seen = new Set();
    allProducts.forEach(p => {
      if(!seen.has(p.name)) {
        seen.add(p.name);
        unique.push(p);
      }
    });
    return unique.sort(() => 0.5 - Math.random());
  }, [categoryData, dealsOfTheDay]);


  const categories = [
    { name: 'All', iconUrl: '/category-icons/all.png' },
    ...categoryList.map(c => ({
      name: c.name,
      iconUrl: c.image ? (c.image.startsWith('/uploads') ? `https://api.tajacart.in${c.image}` : c.image) : '/category-icons/all.png'
    }))
  ];

  const currentProductList = activeCategory === 'All' ? allList : (categoryData[activeCategory] || []);

  const handleNativeGoogleLogin = async () => {
    try {
      const user = await GoogleAuth.signIn();
      const response = await fetch(`https://api.tajacart.in/api/customers/${user.email}`);
      if (response.ok) {
        const customer = await response.json();
        setUser({ name: user.name, email: user.email, picture: user.imageUrl, phone: customer.phone });
        setDeliveryDetails(prev => ({ ...prev, name: user.name, phone: customer.phone }));
        setIsAuthModalOpen(false);
      } else {
        setTempUser({ name: user.name, email: user.email, picture: user.imageUrl });
        setIsCollectingPhone(true);
      }
    } catch (err) {
      console.error(err);
      alert("Google Login Failed on App");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    try {
      const response = await fetch(`https://api.tajacart.in/api/customers/${decoded.email}`);
      if (response.ok) {
        const customer = await response.json();
        setUser({ name: decoded.name, email: decoded.email, picture: decoded.picture, phone: customer.phone });
        setDeliveryDetails(prev => ({ ...prev, name: decoded.name, phone: customer.phone }));
        setIsAuthModalOpen(false);
      } else {
        setTempUser({ name: decoded.name, email: decoded.email, picture: decoded.picture });
        setIsCollectingPhone(true);
      }
    } catch (err) {
      console.error(err);
      alert("Error checking customer details.");
    }
  };

  const handleSavePhone = async () => {
    if (!phoneInput || phoneInput.length < 10) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }
    const finalUser = { ...tempUser, phone: phoneInput };
    
    try {
      const response = await fetch('https://api.tajacart.in/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalUser)
      });
      if (response.ok) {
        setUser(finalUser);
        setIsCollectingPhone(false);
        setIsAuthModalOpen(false);
        setDeliveryDetails(prev => ({ ...prev, name: finalUser.name, phone: finalUser.phone }));
        setPhoneInput('');
        setTempUser(null);
      } else {
        alert("Failed to save phone number.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    }
  };
  
  const handleUpdatePhone = () => {
    if (!editPhoneInput || editPhoneInput.length < 10) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }
    setUser({ ...user, phone: editPhoneInput });
    setDeliveryDetails({ ...deliveryDetails, phone: editPhoneInput });
    setIsEditingPhone(false);
  };

  const handleGoogleError = () => {
    console.log('Login Failed');
    alert("Google Login Failed");
  };

  const userOrders = user ? placedOrders.filter(o => o.deliveryDetails && o.deliveryDetails.phone === user.phone) : [];

  const activeHubs = hubs ? hubs.filter(h => h.is_active) : [];
  const isOutOfRange = activeHubs.length > 0 && deliveryDetails.lat && deliveryDetails.lng 
    ? !activeHubs.some(hub => getDistanceFromLatLonInKm(deliveryDetails.lat, deliveryDetails.lng, hub.lat, hub.lng) <= hub.radius_km)
    : false;

  if (isLoading) {
    return <TajaCartLoader />;
  }

  return (
    <div className="app-container">
      
      {/* Header */}
      <div className="header-bg">
        <div className="flex justify-between items-center" style={{ position: 'relative', zIndex: 10 }}>
          <div 
            className="flex items-center gap-1"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setActiveTab('home');
              setSearchQuery('');
            }}
          >
            <div className="flex items-center justify-center relative">
              <svg width="50" height="45" viewBox="0 0 50 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Leaves inside cart */}
                <path d="M15 15 C10 5, 22 2, 28 12 C34 5, 42 8, 35 18 Z" fill="#228B22"/>
                <path d="M10 18 C5 10, 15 5, 20 15 Z" fill="#32CD32"/>
                {/* Orange/Yellow Fruits */}
                <circle cx="28" cy="24" r="4.5" fill="#FF8C00"/>
                <circle cx="22" cy="20" r="3.5" fill="#FFD700"/>
                {/* Cart Body */}
                <path d="M5 16 H42 L36 32 H14 L5 16 Z" fill="#1b6e23"/>
                {/* Cart Grid Lines (Horizontal & Vertical) */}
                <line x1="10" y1="21" x2="39" y2="21" stroke="#FFFFFF" strokeWidth="1.5"/>
                <line x1="12" y1="27" x2="37" y2="27" stroke="#FFFFFF" strokeWidth="1.5"/>
                <line x1="16" y1="16" x2="19" y2="32" stroke="#FFFFFF" strokeWidth="1.5"/>
                <line x1="24" y1="16" x2="24" y2="32" stroke="#FFFFFF" strokeWidth="1.5"/>
                <line x1="32" y1="16" x2="29" y2="32" stroke="#FFFFFF" strokeWidth="1.5"/>
                {/* Cart Handle */}
                <path d="M5 16 L3 8 H0" stroke="#1b6e23" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                {/* Cart Wheels */}
                <circle cx="16" cy="38" r="2.5" fill="#1b6e23" stroke="#8bc34a" strokeWidth="1"/>
                <circle cx="31" cy="38" r="2.5" fill="#1b6e23" stroke="#8bc34a" strokeWidth="1"/>
              </svg>
            </div>
            
            <div className="flex flex-col justify-center -ml-1">
              <div className="flex items-start" style={{ position: 'relative' }}>
                {/* Small icon before T */}
                <span style={{ position: 'absolute', top: '-3px', left: '-8px', fontSize: '12px', transform: 'rotate(-15deg)' }}>🍋</span>
                <span style={{ 
                  color: '#084c20', 
                  fontWeight: 800, 
                  fontSize: '32px', 
                  fontFamily: '"Georgia", serif', 
                  fontStyle: 'italic',
                  lineHeight: '1',
                  letterSpacing: '-0.5px',
                  paddingLeft: '4px'
                }}>
                  Taja Cart
                </span>
                {/* Green Leaves on Cart */}
                <svg width="16" height="16" viewBox="0 0 24 24" style={{ position: 'absolute', top: '-4px', right: '-12px' }}>
                  <path d="M12 2 C8 2 2 8 2 12 C2 12 8 6 12 6 C16 6 22 12 22 12 C22 8 16 2 12 2 Z" fill="#4caf50" transform="rotate(-20 12 12)" />
                  <path d="M12 6 C8 6 2 12 2 16 C2 16 8 10 12 10 C16 10 22 16 22 16 C22 12 16 6 12 6 Z" fill="#2e7d32" transform="rotate(20 12 12)" />
                </svg>
              </div>
              <div className="flex items-center justify-end pr-1 mt-1">
                <span style={{ fontSize: '11px' }}>🍋</span>
                <span style={{ color: '#1a1a1a', fontWeight: 700, fontSize: '11px', margin: '0 3px' }}>Freshness Delivered Daily</span>
                <span style={{ fontSize: '11px' }}>🥭 </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="profile-icon" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setIsNotificationOpen(!isNotificationOpen)}>
              <Bell size={24} color="#084c20" />
              {notifications.filter(n => !dismissedNotifications.includes(n.id)).length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  backgroundColor: '#e53935',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 'bold',
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  {notifications.filter(n => !dismissedNotifications.includes(n.id)).length}
                </span>
              )}
              {isNotificationOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: -10,
                  marginTop: '16px',
                  width: '320px',
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                  zIndex: 2000,
                  maxHeight: '400px',
                  overflowY: 'auto',
                  border: '1px solid #eee'
                }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid #eee', fontWeight: 'bold', color: '#084c20', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Notifications</span>
                    <button onClick={(e) => { e.stopPropagation(); setIsNotificationOpen(false); }} style={{ color: '#999' }}>
                      <X size={16} />
                    </button>
                  </div>
                  {notifications.filter(n => !dismissedNotifications.includes(n.id)).length === 0 ? (
                    <div style={{ padding: '32px 16px', textAlign: 'center', color: '#666' }}>
                      <Bell size={32} color="#ddd" style={{ margin: '0 auto 12px' }} />
                      <p>You have no new notifications.</p>
                    </div>
                  ) : (
                    notifications.filter(n => !dismissedNotifications.includes(n.id)).map(notif => (
                      <div key={notif.id} style={{ 
                        padding: '16px', 
                        borderBottom: '1px solid #f5f5f5', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start', 
                        gap: '12px',
                        backgroundColor: '#fafafa'
                      }}>
                        <p style={{ margin: 0, fontSize: '14px', color: '#333', lineHeight: '1.4' }}>{notif.text}</p>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDismissedNotifications([...dismissedNotifications, notif.id]);
                          }}
                          style={{ 
                            cursor: 'pointer', 
                            flexShrink: 0,
                            padding: '4px',
                            background: '#eee',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#666'
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="profile-icon" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setActiveTab('cart')}>
              <ShoppingCart size={24} color="#084c20" />
            {totalCartItems > 0 && (
              <span style={{
                position: 'absolute',
                top: -4,
                right: -4,
                backgroundColor: 'var(--primary-green)',
                color: 'white',
                fontSize: 10,
                fontWeight: 'bold',
                width: 16,
                height: 16,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {totalCartItems}
              </span>
            )}
          </div>
          </div>
        </div>



        {/* Search */}
        <div className="search-bar-container">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            className="search-bar" 
            placeholder='Search for "Fresh Vegetables"' 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 8 }}>
             {searchQuery.length > 0 ? (
               <div style={{ backgroundColor: '#f1f5f9', borderRadius: '50%', padding: '4px', display: 'flex', cursor: 'pointer' }} onClick={() => setSearchQuery('')}>
                 <X size={16} className="text-gray" />
               </div>
             ) : (
               <>
                 <Heart size={18} className="text-gray" />
                 <ShoppingBag size={18} className="text-gray" />
               </>
             )}
          </div>
        </div>
      </div>

      {searchQuery.trim().length > 0 ? (
        <div className="search-results-container" style={{ padding: '16px', paddingBottom: '90px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)', marginBottom: '16px' }}>
            Search Results for "{searchQuery}"
          </h2>
          
          {searchResults.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', textAlign: 'center' }}>
              <Search size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary)' }}>No products found</h3>
              <p style={{ fontSize: '14px', color: 'var(--gray-text)', marginTop: '8px' }}>Try searching for a different keyword like "Apple" or "Potato".</p>
            </div>
          ) : (
            <div className="product-grid">
              {searchResults.map((item, idx) => {
                const qty = cart[item.name] || 0;
                return (
                  <div key={idx} className={`product-card ${item.in_stock === 0 ? 'out-of-stock' : ''}`}>
                    <div className="product-image-container">
                      {item.image ? (
                        <img src={item.image?.startsWith('/uploads') ? `https://api.tajacart.in${item.image}` : item.image} alt={item.name} className={`product-image ${item.in_stock === 0 ? 'greyed-out' : ''}`} />
                      ) : (
                        <span style={{ fontSize: '48px' }} className={item.in_stock === 0 ? 'greyed-out' : ''}>{item.emoji}</span>
                      )}
                      {item.in_stock !== 0 && (
                        cart[item.name] ? (
                          <div className="quantity-control">
                            <button className="qty-btn" onClick={() => updateCart(item.name, -1)}>-</button>
                            <span className="qty-text">{cart[item.name]}</span>
                            <button className="qty-btn" onClick={() => updateCart(item.name, 1)}>+</button>
                          </div>
                        ) : (
                          <button className="add-btn" onClick={() => updateCart(item.name, 1)}>
                            <span className="plus-sign">+</span>
                          </button>
                        )
                      )}
                    </div>
                    <div className="product-details">
                      {item.in_stock === 0 && (
                        <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Out of Stock. Coming Soon</div>
                      )}
                      <div className={`price-row ${item.in_stock === 0 ? 'greyed-out' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="current-price">₹{item.currentPrice}</span>
                          <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '12px' }}>₹{item.cutPrice}</span>
                          {item.cutPrice > item.currentPrice && (
                            <span style={{ color: '#16a34a', fontSize: '11px', fontWeight: 'bold', marginLeft: '4px' }}>
                              {Math.round(Math.abs(item.cutPrice - item.currentPrice) / item.cutPrice * 100)}% off
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', backgroundColor: '#f0fdf4', padding: '2px 6px', borderRadius: '4px' }}>
                          <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 'bold' }}>{item.rating}</span>
                          <span style={{ fontSize: '10px' }}>⭐</span>
                        </div>
                      </div>
                      <h3 className="product-name">{item.name}</h3>
                      <p className="product-quantity">{item.quantity}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {activeTab === 'home' && (
        <>
          {/* Announcement Bar */}
      {activeAnnouncements.length > 0 && (
        <div className="announcement-bar">
          <div className="marquee-content">
            {[...activeAnnouncements, ...activeAnnouncements].map((ann, idx) => (
              <span key={idx} className="marquee-item">{ann.text}</span>
            ))}
          </div>
        </div>
      )}

      {/* Nav Categories */}
      <div className="nav-categories">
        {categories.map((cat, idx) => (
          <div 
            key={idx} 
            className={`nav-item ${activeCategory === cat.name ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.name)}
          >
            <div className="nav-icon-wrapper" style={{ background: 'transparent', boxShadow: 'none' }}>
              <img src={cat.iconUrl} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply', filter: 'contrast(1.1) brightness(1.05)' }} />
            </div>
            <span style={{ fontWeight: 700, color: '#334155', fontSize: '15px' }}>{cat.name}</span>
          </div>
        ))}
      </div>

      {/* Category Dropdown */}
      {currentProductList.length > 0 && (
        <div className="veggies-dropdown-section">
          <div className="product-scroll-container">
            {currentProductList.map((product, idx) => (
              <div key={idx} className={`product-card ${product.in_stock === 0 ? 'out-of-stock' : ''}`}>
                <div className="product-image-container">
                  {product.image ? (
                    <img src={product.image?.startsWith('/uploads') ? `https://api.tajacart.in${product.image}` : product.image} alt={product.name} className={`product-image ${product.in_stock === 0 ? 'greyed-out' : ''}`} />
                  ) : (
                    <span style={{ fontSize: '48px' }} className={product.in_stock === 0 ? 'greyed-out' : ''}>{product.emoji}</span>
                  )}
                  {product.in_stock !== 0 && (
                    cart[product.name] ? (
                      <div className="quantity-control">
                        <button className="qty-btn" onClick={() => updateCart(product.name, -1)}>-</button>
                        <span className="qty-text">{cart[product.name]}</span>
                        <button className="qty-btn" onClick={() => updateCart(product.name, 1)}>+</button>
                      </div>
                    ) : (
                      <button className="add-btn" onClick={() => updateCart(product.name, 1)}>
                        <span className="plus-sign">+</span>
                      </button>
                    )
                  )}
                </div>
                <div className="product-details">
                  {product.in_stock === 0 && (
                    <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Out of Stock. Coming Soon</div>
                  )}
                  <div className={`price-row ${product.in_stock === 0 ? 'greyed-out' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="current-price">₹{product.currentPrice}</span>
                      <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '12px' }}>₹{product.cutPrice}</span>
                      {product.cutPrice > product.currentPrice && (
                        <span style={{ color: '#16a34a', fontSize: '11px', fontWeight: 'bold', marginLeft: '4px' }}>
                          {Math.round(Math.abs(product.cutPrice - product.currentPrice) / product.cutPrice * 100)}% off
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', backgroundColor: '#f0fdf4', padding: '2px 6px', borderRadius: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 'bold' }}>{product.rating}</span>
                      <span style={{ fontSize: '10px' }}>⭐</span>
                    </div>
                  </div>
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-quantity">{product.quantity}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="see-all-container">
            <button className="see-all-btn" onClick={() => setActiveTab('category')}>See all ▸</button>
          </div>
        </div>
      )}

      {/* Promotional Banners */}
      <div className="hide-scrollbar" style={{
        display: 'flex',
        overflowX: 'auto',
        gap: '16px',
        padding: '0 16px',
        margin: '8px 0',
        scrollSnapType: 'x mandatory'
      }}>
        {/* Banner 1 */}
        <div 
          onClick={() => setActiveTab('category')}
          style={{
            flex: '0 0 100%',
            scrollSnapAlign: 'center',
            height: '135px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            cursor: 'pointer'
          }}
        >
          <img 
            src="/banner1.png" 
            alt="Free and Fast Delivery" 
            style={{
              width: '115%',
              height: 'auto',
              flexShrink: 0,
              mixBlendMode: 'darken'
            }} 
          />
        </div>
        {/* Banner 2 */}
        <div 
          onClick={() => setActiveTab('category')}
          style={{
            flex: '0 0 100%',
            scrollSnapAlign: 'center',
            height: '135px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            cursor: 'pointer'
          }}
        >
          <img 
            src="/banner2.png" 
            alt="Farm Fresh" 
            style={{
              width: '115%',
              height: 'auto',
              flexShrink: 0,
              mixBlendMode: 'darken'
            }} 
          />
        </div>
        {/* Banner 3 */}
        <div 
          onClick={() => setActiveTab('category')}
          style={{
            flex: '0 0 100%',
            scrollSnapAlign: 'center',
            height: '135px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            cursor: 'pointer'
          }}
        >
          <img 
            src="/banner3.png" 
            alt="100% Trusted" 
            style={{
              width: '115%',
              height: 'auto',
              flexShrink: 0,
              mixBlendMode: 'darken'
            }} 
          />
        </div>
      </div>

      {/* Deals of the Day */}
      <div className="section mt-2" style={{ padding: '16px 0', backgroundColor: 'var(--white)' }}>
        <div style={{ padding: '0 16px', marginBottom: '12px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '700', 
            color: 'var(--primary)', 
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ⚡ Deals of the Day
          </h3>
        </div>
        
        {dealsOfTheDay.length === 0 ? (
          <p style={{ padding: '0 16px', color: 'var(--gray-text)', fontSize: '14px' }}>No deals available today.</p>
        ) : (
          <div className="product-scroll-container">
            {dealsOfTheDay.map((product, idx) => (
              <div key={idx} className={`product-card ${product.in_stock === 0 ? 'out-of-stock' : ''}`}>
                <div className="product-image-container">
                  {product.image ? (
                    <img src={product.image?.startsWith('/uploads') ? `https://api.tajacart.in${product.image}` : product.image} alt={product.name} className={`product-image ${product.in_stock === 0 ? 'greyed-out' : ''}`} />
                  ) : (
                    <span style={{ fontSize: '48px' }} className={product.in_stock === 0 ? 'greyed-out' : ''}>{product.emoji}</span>
                  )}
                  {product.in_stock !== 0 && (
                    cart[product.name] ? (
                      <div className="quantity-control">
                        <button className="qty-btn" onClick={() => updateCart(product.name, -1)}>-</button>
                        <span className="qty-text">{cart[product.name]}</span>
                        <button className="qty-btn" onClick={() => updateCart(product.name, 1)}>+</button>
                      </div>
                    ) : (
                      <button className="add-btn" onClick={() => updateCart(product.name, 1)}>
                        <span className="plus-sign">+</span>
                      </button>
                    )
                  )}
                </div>
                <div className="product-details">
                  {product.in_stock === 0 && (
                    <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Out of Stock. Coming Soon</div>
                  )}
                  <div className={`price-row ${product.in_stock === 0 ? 'greyed-out' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="current-price">₹{product.currentPrice}</span>
                      <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '12px' }}>₹{product.cutPrice}</span>
                      {product.cutPrice > product.currentPrice && (
                        <span style={{ color: '#16a34a', fontSize: '11px', fontWeight: 'bold', marginLeft: '4px' }}>
                          {Math.round(Math.abs(product.cutPrice - product.currentPrice) / product.cutPrice * 100)}% off
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', backgroundColor: '#f0fdf4', padding: '2px 6px', borderRadius: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 'bold' }}>{product.rating}</span>
                      <span style={{ fontSize: '10px' }}>⭐</span>
                    </div>
                  </div>
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-quantity">{product.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dynamic Banners */}
      {banners.length > 0 && (
        <div className="banner-section mb-4" style={{ marginTop: '16px', marginLeft: '16px', marginRight: '16px', overflow: 'hidden', borderRadius: '16px' }}>
          <div className="banner-scroll-container" ref={bannerScrollRef} style={{ display: 'flex', overflowX: 'auto', scrollBehavior: 'smooth', snapType: 'x mandatory', gap: '16px', padding: 0, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {banners.map((banner, idx) => (
              <img 
                key={idx} 
                src={`https://api.tajacart.in${banner.image}`} 
                alt="Promo Banner" 
                style={{ 
                  flex: '0 0 100%',
                  width: '100%',
                  height: '160px',
                  objectFit: 'fill',
                  borderRadius: '16px',
                  scrollSnapAlign: 'start',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }} 
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Featured Reviews */}
      {featuredReviews.length > 0 && (
        <div className="section mt-2" style={{ padding: '16px 0', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ padding: '0 16px', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⭐ Happy Customers
            </h3>
          </div>
          <div style={{ display: 'flex', overflowX: 'auto', gap: '16px', padding: '4px 16px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {featuredReviews.map((rev, idx) => (
              <div key={idx} style={{ 
                flex: '0 0 280px', 
                backgroundColor: 'var(--white)', 
                borderRadius: '12px', 
                padding: '16px', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#1e293b' }}>{rev.customer_name}</h4>
                  <div style={{ display: 'flex', color: '#eab308', fontSize: '14px' }}>
                    {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: '#475569', fontStyle: 'italic', lineHeight: '1.4' }}>
                  "{rev.text}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ height: '20px' }}></div>
      </>
      )}

      {/* Category Page Split-Screen */}
      {activeTab === 'category' && (
        <div className="category-page-container">
          {/* Left Sidebar */}
          <div className="category-sidebar">
            {categories.filter(c => c.name !== 'All').map((cat, idx) => (
              <div 
                key={idx} 
                className={`category-sidebar-item ${activeCategory === cat.name || (activeCategory === 'All' && cat.name === 'Veggies') ? 'active' : ''}`}
                onClick={() => {
                  // If clicking a category on the left, set it as active
                  // "All" is excluded, so this will always be a specific category
                  setActiveCategory(cat.name);
                }}
              >
                <div className="icon-wrapper">
                  <img src={cat.iconUrl} alt={cat.name} />
                </div>
                <span>{cat.name}</span>
              </div>
            ))}
          </div>
          
          {/* Right Content */}
          <div className="category-content">
            <div className="product-grid">
              {(categoryData[activeCategory === 'All' ? 'Veggies' : activeCategory] || []).map((product, idx) => (
                <div key={idx} className={`product-card ${product.in_stock === 0 ? 'out-of-stock' : ''}`} style={{ minWidth: 'auto', width: '100%', maxWidth: '100%', margin: 0 }}>
                  <div className="product-image-container">
                    {product.image ? (
                      <img src={product.image?.startsWith('/uploads') ? `https://api.tajacart.in${product.image}` : product.image} alt={product.name} className={`product-image ${product.in_stock === 0 ? 'greyed-out' : ''}`} />
                    ) : (
                      <span style={{ fontSize: '48px' }} className={product.in_stock === 0 ? 'greyed-out' : ''}>{product.emoji}</span>
                    )}
                    {product.in_stock !== 0 && (
                      cart[product.name] ? (
                        <div className="quantity-control">
                          <button className="qty-btn" onClick={() => updateCart(product.name, -1)}>-</button>
                          <span className="qty-text">{cart[product.name]}</span>
                          <button className="qty-btn" onClick={() => updateCart(product.name, 1)}>+</button>
                        </div>
                      ) : (
                        <button className="add-btn" onClick={() => updateCart(product.name, 1)}>
                          <span className="plus-sign">+</span>
                        </button>
                      )
                    )}
                  </div>
                  <div className="product-details">
                    {product.in_stock === 0 && (
                      <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Out of Stock. Coming Soon</div>
                    )}
                    <div className={`price-row ${product.in_stock === 0 ? 'greyed-out' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="current-price">₹{product.currentPrice}</span>
                        <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '12px' }}>₹{product.cutPrice}</span>
                        {product.cutPrice > product.currentPrice && (
                          <span style={{ color: '#16a34a', fontSize: '11px', fontWeight: 'bold', marginLeft: '4px' }}>
                            {Math.round(Math.abs(product.cutPrice - product.currentPrice) / product.cutPrice * 100)}% off
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', backgroundColor: '#f0fdf4', padding: '2px 6px', borderRadius: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 'bold' }}>{product.rating}</span>
                        <span style={{ fontSize: '10px' }}>⭐</span>
                      </div>
                    </div>
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-quantity">{product.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
            {!(categoryData[activeCategory === 'All' ? 'Vegetables' : activeCategory] || []).length && (
              <p style={{ textAlign: 'center', marginTop: '40px', color: '#64748b', fontSize: '14px' }}>No products found.</p>
            )}
          </div>
        </div>
      )}

      {/* Cart Page */}
      {activeTab === 'cart' && (
        <div className="cart-page-container" style={{ paddingBottom: '90px' }}>
          <div className="cart-header">
            <ArrowLeft size={24} style={{ marginRight: '16px', cursor: 'pointer', color: 'var(--primary)' }} onClick={() => setActiveTab('home')} />
            <h1>Cart ({totalCartItems} items)</h1>
          </div>

          {cartDetails.items.length === 0 ? (
            <div className="empty-cart">
              <ShoppingCart size={64} color="#cbd5e1" style={{ marginBottom: '16px' }} />
              <h3>Your cart is empty</h3>
              <p>Looks like you haven't added anything yet.</p>
              <button 
                onClick={() => setActiveTab('home')}
                style={{ backgroundColor: 'var(--primary-green)', color: 'white', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div style={{ padding: '16px' }}>
              {/* Cart Items List */}
              <div className="cart-items-section" style={{ padding: '0', backgroundColor: 'transparent', marginBottom: '24px' }}>
                {cartDetails.items.map((item, idx) => (
                  <div key={idx} className="cart-item-row-new">
                    <img src={item.image?.startsWith('/uploads') ? `https://api.tajacart.in${item.image}` : item.image} alt={item.name} className="cart-item-image" />
                    <div className="cart-item-info">
                      <h4 className="cart-item-name">{item.name}</h4>
                      <p className="cart-item-qty">{item.quantity}</p>
                      <span className="cart-item-price-unit">₹{item.currentPrice}</span>
                    </div>
                    <div className="cart-item-actions">
                      <span className="cart-item-total">₹{item.currentPrice * item.qty}</span>
                      <div className="quantity-control-new">
                        <button className="qty-btn" onClick={() => updateCart(item.name, -1)}>-</button>
                        <span className="qty-text">{item.qty}</span>
                        <button className="qty-btn" onClick={() => updateCart(item.name, 1)}>+</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Section */}
              <div className="coupon-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                  <input 
                    type="text" 
                    className="coupon-input" 
                    placeholder="Enter Coupon Code (e.g. FIRST20)" 
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                  />
                  <button 
                    className="coupon-apply-btn" 
                    onClick={handleApplyCoupon}
                  >
                    Apply
                  </button>
                </div>
                {couponError && <span style={{ color: '#ef4444', fontSize: '13px', marginLeft: '4px' }}>{couponError}</span>}
                {appliedCoupon && !couponError && <span style={{ color: 'var(--primary-green)', fontSize: '13px', fontWeight: 'bold', marginLeft: '4px' }}>'{appliedCoupon}' applied successfully!</span>}
              </div>

              {/* Delivery Details */}
              <div className="delivery-details-section" style={{ backgroundColor: 'var(--white)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary)', margin: 0 }}>Delivery Details</h3>
                  {(savedAddresses.length > 0 && addingNewAddress) && (
                    <button onClick={() => setAddingNewAddress(false)} style={{ fontSize: '13px', color: 'var(--primary-green)', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  )}
                </div>

                {savedAddresses.length > 0 && !addingNewAddress ? (
                  <div>
                    {savedAddresses.map(addr => (
                      <div 
                        key={addr.id}
                        onClick={() => {
                          setSelectedAddressId(addr.id);
                          setDeliveryDetails({
                            ...deliveryDetails,
                            street: addr.address.split(',')[0] ? addr.address.split(',')[0].trim() : '',
                            locality: addr.address.split(',')[1] ? addr.address.split(',')[1].trim() : '',
                            city: addr.address.split(',')[2] ? addr.address.split(',')[2].trim() : '',
                            state: addr.address.split(',')[3] ? addr.address.split(',')[3].trim() : '',
                            landmark: addr.landmark || '',
                            lat: addr.lat,
                            lng: addr.lng
                          });
                        }}
                        style={{
                          padding: '12px',
                          border: selectedAddressId === addr.id ? '2px solid var(--primary-green)' : '1px solid #e2e8f0',
                          borderRadius: '8px',
                          marginBottom: '12px',
                          cursor: 'pointer',
                          backgroundColor: selectedAddressId === addr.id ? '#f0fdf4' : 'white',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', color: '#475569' }}>
                            {addr.label}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#334155', fontWeight: '500' }}>{addr.address}</p>
                        {addr.landmark && <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Landmark: {addr.landmark}</p>}
                        
                        {selectedAddressId === addr.id && (
                          <div style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--primary-green)' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <button 
                      onClick={() => {
                        setSelectedAddressId(null);
                        setAddingNewAddress(true);
                        setDeliveryDetails({ ...deliveryDetails, street: '', building: '', locality: '', landmark: '', city: '', state: '', lat: null, lng: null });
                      }} 
                      style={{ width: '100%', padding: '12px', border: '1px dashed var(--primary-green)', borderRadius: '8px', backgroundColor: 'transparent', color: 'var(--primary-green)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                    >
                      <span style={{ fontSize: '18px' }}>+</span> Add New Address
                    </button>
                  </div>
                ) : (
                  <div>
                    <AddressMap lat={deliveryDetails.lat} lng={deliveryDetails.lng} onChange={(lat, lng) => setDeliveryDetails({...deliveryDetails, lat, lng})} />
                    {isOutOfRange && (
                      <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '12px', borderRadius: '8px', marginTop: '12px', fontSize: '14px', fontWeight: '600', textAlign: 'center' }}>
                        We are not currently available in this location.
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                      <input 
                        type="text" 
                        placeholder="Receiver's Name" 
                        className="delivery-input"
                        value={deliveryDetails.name}
                        onChange={(e) => setDeliveryDetails({...deliveryDetails, name: e.target.value})}
                      />
                      <input 
                        type="tel" 
                        placeholder="10 digit mobile number" 
                        className="delivery-input"
                        value={deliveryDetails.phone}
                        maxLength={10}
                        onChange={(e) => setDeliveryDetails({...deliveryDetails, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                      />
                      <input 
                        type="text" 
                        placeholder="Street Name" 
                        className="delivery-input"
                        value={deliveryDetails.street || ''}
                        onChange={(e) => setDeliveryDetails({...deliveryDetails, street: e.target.value})}
                      />
                      <input 
                        type="text" 
                        placeholder="Building Name / House No" 
                        className="delivery-input"
                        value={deliveryDetails.building || ''}
                        onChange={(e) => setDeliveryDetails({...deliveryDetails, building: e.target.value})}
                      />
                      <input 
                        type="text" 
                        placeholder="Locality / Area" 
                        className="delivery-input"
                        value={deliveryDetails.locality || ''}
                        onChange={(e) => setDeliveryDetails({...deliveryDetails, locality: e.target.value})}
                      />
                      <input 
                        type="text" 
                        placeholder="Landmark (Optional)" 
                        className="delivery-input"
                        value={deliveryDetails.landmark || ''}
                        onChange={(e) => setDeliveryDetails({...deliveryDetails, landmark: e.target.value})}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="text" 
                          placeholder="City" 
                          className="delivery-input"
                          style={{ flex: 1 }}
                          value={deliveryDetails.city || ''}
                          onChange={(e) => setDeliveryDetails({...deliveryDetails, city: e.target.value})}
                        />
                        <input 
                          type="text" 
                          placeholder="State" 
                          className="delivery-input"
                          style={{ flex: 1 }}
                          value={deliveryDetails.state || ''}
                          onChange={(e) => setDeliveryDetails({...deliveryDetails, state: e.target.value})}
                        />
                      </div>
                      
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold', color: '#334155' }}>Save this address as (Optional)</p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {['Home', 'Work', 'Other'].map(label => (
                            <button
                              key={label}
                              type="button"
                              onClick={() => setSaveAddressLabel(label)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '13px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                border: saveAddressLabel === label ? '1px solid var(--primary-green)' : '1px solid #cbd5e1',
                                backgroundColor: saveAddressLabel === label ? '#dcfce7' : 'white',
                                color: saveAddressLabel === label ? 'var(--primary-green)' : '#64748b'
                              }}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bill Details */}
              <div className="bill-details-section" style={{ borderRadius: '12px' }}>
                <h3 className="bill-details-title">Bill Details</h3>
                <div className="bill-row">
                  <span>Item Total</span>
                  <span>₹{cartDetails.itemTotal}</span>
                </div>
                {cartDetails.discountAmount > 0 && (
                  <div className="bill-row" style={{ color: 'var(--primary-green)' }}>
                    <span>Coupon Discount</span>
                    <span>-₹{cartDetails.discountAmount}</span>
                  </div>
                )}
                <div className="bill-row">
                  <span>Delivery Fee</span>
                  <span>{cartDetails.deliveryFee === 0 ? <span style={{ color: 'var(--primary-green)' }}>FREE</span> : `₹${cartDetails.deliveryFee}`}</span>
                </div>
                <div className="bill-row grand-total">
                  <span>Grand Total</span>
                  <span>₹{cartDetails.grandTotal}</span>
                </div>
              </div>

              {/* Place Order CTA */}
              <button 
                className="place-order-btn" 
                onClick={handlePlaceOrder}
                disabled={isOutOfRange}
                style={isOutOfRange ? { backgroundColor: '#94a3b8', cursor: 'not-allowed' } : {}}
              >
                <span>Place Order</span>
                <span>₹{cartDetails.grandTotal}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Orders Page */}
      {activeTab === 'orders' && (
        <div className="orders-page-container" style={{ paddingBottom: '90px' }}>
          <div className="orders-header" style={{ padding: '24px 16px 8px 16px' }}>
            <h2 style={{ margin: 0, color: 'var(--primary)', fontSize: '24px', fontWeight: '800' }}>My Orders</h2>
          </div>

          <div style={{ padding: '16px' }}>
            {(!user || userOrders.length === 0) ? (
              <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
                <ShoppingBag size={64} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)', margin: '16px 0 8px 0' }}>{!user ? 'Log in to view orders' : 'No orders yet'}</h3>
                <p style={{ fontSize: '14px', color: 'var(--gray-text)', marginBottom: '24px' }}>{!user ? 'You need to be logged in to track your order history.' : 'Looks like you haven\'t placed any orders yet.'}</p>
                <button 
                  onClick={() => !user ? setIsAuthModalOpen(true) : setActiveTab('home')}
                  style={{ backgroundColor: 'var(--primary-green)', color: 'white', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                >
                  {!user ? 'Log In' : 'Start Shopping'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {userOrders.map((order) => (
                  <div key={order.id} className="order-card" style={{ backgroundColor: 'var(--white)', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: '12px', marginBottom: '12px' }}>
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)' }}>{order.id}</span>
                        <p style={{ fontSize: '12px', color: 'var(--gray-text)', margin: '4px 0 0 0' }}>{order.date}</p>
                      </div>
                      <span style={{ 
                        backgroundColor: order.status === 'Delivered' ? '#dcfce7' : order.status === 'Picked Up' ? '#fef9c3' : '#f0fdf4', 
                        color: order.status === 'Delivered' ? '#16a34a' : order.status === 'Picked Up' ? '#ca8a04' : 'var(--primary-green)', 
                        padding: '4px 12px', 
                        borderRadius: '16px', 
                        fontSize: '12px', 
                        fontWeight: '700' 
                      }}>
                        {order.status || 'Placed'}
                      </span>
                    </div>

                    {order.status === 'Picked Up' && order.eta && (
                      <div style={{ backgroundColor: '#fef9c3', color: '#854d0e', padding: '10px 12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                        <Timer size={16} /> ETA: {order.eta} minutes
                      </div>
                    )}
                    {order.status === 'Delivered' && order.eta && (
                      <div style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '10px 12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                        <Zap size={16} color="#eab308" /> Whoosh!! the order is delivered in {order.eta} minutes
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--primary)' }}>
                          <span>{item.qty}x {item.name}</span>
                          <span style={{ fontWeight: '600' }}>₹{item.currentPrice * item.qty}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--gray-text)' }}>
                        <span>Delivery Charge</span>
                        <span style={{ fontWeight: '600', color: 'var(--primary)' }}>₹{order.deliveryDetails?.deliveryFee || 0}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: 'var(--gray-text)' }}>{order.items.reduce((sum, item) => sum + item.qty, 0)} Items</span>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary)' }}>Total: ₹{order.grandTotal}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {order.status === 'Delivered' && (
                          <button 
                            onClick={() => downloadInvoice(order)}
                            style={{ flex: 1, backgroundColor: 'var(--white)', border: '1px solid var(--primary-green)', color: 'var(--primary-green)', padding: '10px', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', textAlign: 'center' }}
                          >
                            Download Invoice
                          </button>
                        )}
                        {(!order.status || order.status === 'Placed') && (
                          <button 
                            onClick={() => cancelOrder(order.id)}
                            style={{ flex: 1, backgroundColor: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', padding: '10px', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', textAlign: 'center' }}
                          >
                            Cancel Order
                          </button>
                        )}
                      </div>
                      <div style={{ textAlign: 'center', marginTop: '8px' }}>
                        <a 
                          href={`https://wa.me/+919239606687?text=${encodeURIComponent(`Hi, my name is ${user?.name || 'Customer'}. My Order id is ${order.id} containing ${order.items.map(item => `${item.name} x ${item.qty}`).join(', ')}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '13px', color: 'var(--primary-green)', textDecoration: 'underline', fontWeight: '600' }}
                        >
                          Need help with this order?
                        </a>
                      </div>
                      <OrderRatingWidget order={order} onReviewSubmitted={handleReviewSubmitted} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Page */}
      {activeTab === 'profile' && (
        <div className="profile-page-container" style={{ paddingBottom: '90px' }}>
          <div className="orders-header" style={{ padding: '24px 16px 8px 16px' }}>
            <h2 style={{ margin: 0, color: 'var(--primary)', fontSize: '24px', fontWeight: '800' }}>Profile</h2>
          </div>
          <div style={{ padding: '16px' }}>
            {user ? (
              <>
                <div style={{ backgroundColor: 'var(--white)', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--light-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-green)', overflow: 'hidden' }}>
                      {user.picture ? <img src={user.picture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={32} />}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--primary)' }}>{user.name}</h3>
                      <p style={{ margin: '4px 0 0 0', color: 'var(--gray-text)', fontSize: '14px' }}>{user.email}</p>
                      
                      {isEditingPhone ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                          <span style={{ fontSize: '14px', color: 'var(--gray-text)' }}>+91</span>
                          <input 
                            type="tel" 
                            value={editPhoneInput}
                            onChange={(e) => setEditPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            maxLength={10}
                            style={{ border: '1px solid #e2e8f0', borderRadius: '4px', padding: '4px 8px', fontSize: '14px', width: '120px' }}
                            autoFocus
                          />
                          <button onClick={handleUpdatePhone} style={{ background: 'var(--primary-green)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}>Save</button>
                          <button onClick={() => setIsEditingPhone(false)} style={{ background: '#f1f5f9', color: 'var(--gray-text)', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <p style={{ margin: 0, color: 'var(--gray-text)', fontSize: '14px' }}>+91 {user.phone}</p>
                          <button 
                            onClick={() => {
                              setEditPhoneInput(user.phone || '');
                              setIsEditingPhone(true);
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--primary-green)', fontSize: '12px', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                    <button 
                      onClick={() => {
                        setUser(null);
                        setActiveTab('home');
                      }}
                      style={{ width: '100%', padding: '12px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}
                    >
                      Log Out
                    </button>
                  </div>
                </div>
                
                {/* Address Book Section */}
                <div style={{ marginTop: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)', marginBottom: '16px' }}>Address Book</h3>
                  {savedAddresses.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {savedAddresses.map(addr => (
                        <div key={addr.id} style={{ backgroundColor: 'var(--white)', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#e2e8f0', padding: '4px 8px', borderRadius: '12px', color: '#475569' }}>
                                {addr.label}
                              </span>
                            </div>
                            <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#334155', fontWeight: '500' }}>{addr.address}</p>
                            {addr.landmark && <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Landmark: {addr.landmark}</p>}
                          </div>
                          <button 
                            onClick={() => handleDeleteAddress(addr.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ backgroundColor: 'var(--white)', padding: '24px', borderRadius: '12px', textAlign: 'center', color: '#64748b' }}>
                      <MapPin size={32} style={{ opacity: 0.5, marginBottom: '12px' }} />
                      <p style={{ margin: 0, fontSize: '14px' }}>No saved addresses yet.</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
                <User size={64} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)', margin: '16px 0 8px 0' }}>Not logged in</h3>
                <p style={{ fontSize: '14px', color: 'var(--gray-text)', marginBottom: '24px' }}>Log in to view your profile and manage your details.</p>
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  style={{ backgroundColor: 'var(--primary-green)', color: 'white', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                >
                  Log In / Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}

      {/* Floating WhatsApp Button */}
      <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '480px',
          pointerEvents: 'none',
          zIndex: 999,
      }}>
        <a
          href="https://wa.me/+919239606687"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'absolute',
            bottom: '0',
            right: '20px',
            width: '56px',
            height: '56px',
            backgroundColor: '#25D366',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 4px 12px rgba(37, 211, 102, 0.4)',
            cursor: 'pointer',
            pointerEvents: 'auto',
            transition: 'transform 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
            alt="WhatsApp Support" 
            style={{ width: '32px', height: '32px' }} 
          />
        </a>
      </div>

      {/* Bottom Nav */}
      <div className="bottom-nav">
        <div className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <Home size={24} />
          <span>Home</span>
        </div>
        <div className={`nav-tab ${activeTab === 'category' ? 'active' : ''}`} onClick={() => setActiveTab('category')}>
          <Grid size={24} />
          <span>Category</span>
        </div>
        <div className={`nav-tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
          <ShoppingBag size={24} />
          <span>My Orders</span>
        </div>
        <div className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <User size={24} />
          <span>Profile</span>
        </div>
      </div>

      {/* Auth Modal (Bottom Sheet) */}
      {isAuthModalOpen && (
        <>
          <div className="auth-backdrop" onClick={() => setIsAuthModalOpen(false)} />
          <div className="auth-bottom-sheet">
            <div className="auth-header">
              <h3>Sign in with Google</h3>
              <button className="close-auth-btn" onClick={() => setIsAuthModalOpen(false)}>×</button>
            </div>
            
            <div className="auth-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
              {!isCollectingPhone ? (
                <>
                  {Capacitor.isNativePlatform() ? (
                    <button 
                      onClick={handleNativeGoogleLogin}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'white', color: '#334155', border: '1px solid #cbd5e1', padding: '12px 24px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                      <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google Logo" style={{ width: '20px', height: '20px' }} />
                      Sign in with Google
                    </button>
                  ) : (
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                    />
                  )}
                  <p className="auth-terms" style={{ marginTop: '20px' }}>
                    By continuing, you agree to our Terms of Service & Privacy Policy
                  </p>
                </>
              ) : (
                <div style={{ width: '100%', padding: '0 20px' }}>
                  <p style={{ marginBottom: '16px', textAlign: 'center', color: '#64748b' }}>
                    Please enter your phone number to continue
                  </p>
                  <div className="input-group">
                    <label>Phone Number</label>
                    <div className="phone-input-wrapper">
                      <span className="country-code">+91</span>
                      <input 
                        type="tel" 
                        placeholder="10 digit mobile number" 
                        value={phoneInput} 
                        onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        maxLength={10}
                      />
                    </div>
                  </div>
                  <button className="primary-btn mt-4" onClick={handleSavePhone} style={{ width: '100%' }}>Save & Continue</button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      {/* Rating Modal */}
      {pendingRatingOrder && (
        <>
          <div className="auth-overlay" onClick={() => setPendingRatingOrder(null)} />
          <div className="auth-modal" style={{ padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '400px', backgroundColor: 'white', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1001 }}>
            <button className="close-btn" onClick={() => setPendingRatingOrder(null)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
            <h2 style={{ marginBottom: '8px', fontSize: '20px', color: '#0f172a' }}>Order Placed! 🎉</h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>Would you like to rate your experience?</p>
            <OrderRatingWidget 
              order={pendingRatingOrder} 
              onReviewSubmitted={(orderId, rating, review) => {
                handleReviewSubmitted(orderId, rating, review);
                setPendingRatingOrder(null);
              }} 
            />
            <button 
              onClick={() => setPendingRatingOrder(null)}
              style={{ width: '100%', marginTop: '12px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
            >
              Skip for now
            </button>
          </div>
        </>
      )}

    </div>
  );
}

export default App;
