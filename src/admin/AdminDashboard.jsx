import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function AdminDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [timeframe, setTimeframe] = useState('Daily');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, customersRes] = await Promise.all([
        fetch('http://13.207.203.76:3000/api/orders'),
        fetch('http://13.207.203.76:3000/api/customers')
      ]);
      const ordersData = await ordersRes.json();
      const customersData = await customersRes.json();
      setOrders(ordersData);
      setCustomers(customersData);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  const totalOrders = orders.length;
  const totalCustomers = customers.length;
  const totalSales = orders.reduce((sum, order) => sum + (order.grandTotal || 0), 0);

  // Parse date string like "24 Jul 2026, 04:44 am" to Date object
  const parseDate = (dateStr) => {
    return new Date(dateStr);
  };

  const processChartData = useMemo(() => {
    if (!orders.length) return [];
    
    // Sort orders by date
    const sorted = [...orders].sort((a, b) => parseDate(a.date) - parseDate(b.date));
    
    // Grouping map
    const grouped = {};

    sorted.forEach(order => {
      const dateObj = parseDate(order.date);
      if (isNaN(dateObj)) return; // skip invalid

      let groupKey = '';
      if (timeframe === 'Daily') {
        groupKey = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      } else if (timeframe === 'Weekly') {
        // Find week start (Sunday)
        const d = new Date(dateObj);
        d.setDate(d.getDate() - d.getDay());
        groupKey = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      } else if (timeframe === 'Monthly') {
        groupKey = dateObj.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      } else if (timeframe === 'Quarterly') {
        const q = Math.floor((dateObj.getMonth() / 3));
        groupKey = `Q${q + 1} ${dateObj.getFullYear()}`;
      } else if (timeframe === 'Yearly') {
        groupKey = dateObj.getFullYear().toString();
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = { name: groupKey, orders: 0, sales: 0 };
      }
      grouped[groupKey].orders += 1;
      grouped[groupKey].sales += (order.grandTotal || 0);
    });

    return Object.values(grouped);
  }, [orders, timeframe]);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Dashboard</h1>
      </div>
      <div className="admin-page-content" style={{ padding: '20px' }}>
        <p style={{ color: '#475569', marginBottom: '24px' }}>Welcome to the Tajakart Admin Panel.</p>
        
        <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div 
            className="admin-stat-card" 
            style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s' }}
            onClick={() => navigate('/admin/orders')}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#64748b' }}>Total Orders</h3>
            <p className="admin-stat-number" style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: 'var(--primary-green)' }}>{totalOrders}</p>
          </div>
          
          <div 
            className="admin-stat-card" 
            style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s' }}
            onClick={() => navigate('/admin/customers')}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#64748b' }}>Total Customers</h3>
            <p className="admin-stat-number" style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: 'var(--primary-green)' }}>{totalCustomers}</p>
          </div>
          
          <div 
            className="admin-stat-card" 
            style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#64748b' }}>Total Sales</h3>
            <p className="admin-stat-number" style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: 'var(--primary-green)' }}>₹{totalSales}</p>
          </div>

          <div 
            className="admin-stat-card" 
            style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s' }}
            onClick={() => navigate('/admin/store')}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#64748b' }}>Store Inventory</h3>
            <p className="admin-stat-number" style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: 'var(--primary-green)' }}>Manage</p>
          </div>
        </div>

        {/* Analytics Section */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>Analytics Overview</h2>
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value)}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: 'bold', fontSize: '14px', color: '#334155', cursor: 'pointer' }}
            >
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '40px' }}>
            {/* Orders Graph */}
            <div>
              <h3 style={{ fontSize: '16px', color: '#475569', marginBottom: '16px', textAlign: 'center' }}>Orders Trend</h3>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer>
                  <LineChart data={processChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6', strokeWidth: 0}} activeDot={{r: 6}} name="Orders" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sales Graph */}
            <div>
              <h3 style={{ fontSize: '16px', color: '#475569', marginBottom: '16px', textAlign: 'center' }}>Sales Trend (₹)</h3>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer>
                  <LineChart data={processChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} formatter={(value) => `₹${value}`} />
                    <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 0}} activeDot={{r: 6}} name="Sales" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
