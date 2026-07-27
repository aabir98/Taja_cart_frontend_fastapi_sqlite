import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form State
  const [text, setText] = useState('');
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('https://api.tajacart.in/api/admin/notifications');
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingId 
        ? `https://api.tajacart.in/api/admin/notifications/${editingId}`
        : 'https://api.tajacart.in/api/admin/notifications';
        
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, is_active: isActive }),
      });
      
      if (response.ok) {
        setIsModalOpen(false);
        resetForm();
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        const response = await fetch(`https://api.tajacart.in/api/admin/notifications/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchNotifications();
        }
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    }
  };

  const handleToggleActive = async (notification) => {
    try {
      const response = await fetch(`https://api.tajacart.in/api/admin/notifications/${notification.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: notification.text, is_active: !notification.is_active }),
      });
      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error toggling notification:', error);
    }
  };

  const openEditModal = (notification) => {
    setEditingId(notification.id);
    setText(notification.text);
    setIsActive(notification.is_active === 1);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setText('');
    setIsActive(false);
  };

  if (loading) {
    return <div className="admin-page-container"><div className="loading">Loading notifications...</div></div>;
  }

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Bell size={28} color="var(--primary)" />
          <h1 className="admin-page-title" style={{ margin: 0 }}>Notification Management</h1>
        </div>
        <button 
          className="admin-btn-primary" 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={20} /> Add Notification
        </button>
      </div>

      <div className="admin-card">
        {notifications.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <Bell size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p>No notifications created yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Notification Text</th>
                  <th>Status</th>
                  <th>Date Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notif) => (
                  <tr key={notif.id}>
                    <td>#{notif.id}</td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {notif.text}
                    </td>
                    <td>
                      <span 
                        className={`status-badge ${notif.is_active ? 'active' : 'inactive'}`}
                        style={{ 
                          cursor: 'pointer',
                          backgroundColor: notif.is_active ? '#dcfce7' : '#f1f5f9',
                          color: notif.is_active ? '#166534' : '#64748b',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        onClick={() => handleToggleActive(notif)}
                      >
                        {notif.is_active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {notif.is_active ? 'Active (Shown to Users)' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(notif.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn edit" onClick={() => openEditModal(notif)} title="Edit">
                          <Edit2 size={18} />
                        </button>
                        <button className="action-btn delete" onClick={() => handleDelete(notif.id)} title="Delete">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '500px' }}>
            <div className="admin-modal-header">
              <h2>{editingId ? 'Edit Notification' : 'Create Notification'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <div className="admin-modal-body">
              <form onSubmit={handleSave}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Notification Text</label>
                  <textarea 
                    value={text} 
                    onChange={(e) => setText(e.target.value)} 
                    required 
                    className="admin-input" 
                    placeholder="Enter the notification message..."
                    rows={4}
                    style={{ width: '100%', resize: 'vertical' }}
                  ></textarea>
                </div>
                
                <div className="form-group" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    id="isActive" 
                    checked={isActive} 
                    onChange={(e) => setIsActive(e.target.checked)} 
                    style={{ width: '18px', height: '18px' }}
                  />
                  <label htmlFor="isActive" style={{ fontWeight: 'bold', cursor: 'pointer' }}>Set as Active immediately</label>
                </div>
                
                <div className="admin-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" className="admin-btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="admin-btn-primary">Save Notification</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications;
