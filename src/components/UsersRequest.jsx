import React, { useState, useEffect } from 'react';
import axiosInstance from '../service'; // Adjust path to your axios instance
import { 
  UserCheck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  User, 
  Bus, 
  Briefcase,
  Loader2
} from 'lucide-react';
import './UsersRequest.css';

function UsersRequest() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const response = await axiosInstance.get('/admin/pending');
      console.log(response);
      // Response is usually an array of users
      setPendingUsers(response.data || []);
    } catch (err) {
      console.error("Error fetching pending users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    setProcessingId(userId);
    try {
      const response = await axiosInstance.post('/admin/approve', { userId });
      if (response.status === 200) {
        // Remove approved user from UI list
        setPendingUsers(prev => prev.filter(user => user._id !== userId));
      }
    } catch (err) {
      console.error("Approval failed:", err);
      alert("Failed to approve user. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId) => {
  if (window.confirm("Are you sure you want to permanently delete this request?")) {
    try {
      const response = await axiosInstance.post('/admin/reject', { userId });
      if (response.status === 200) {
        setPendingUsers(prev => prev.filter(user => user._id !== userId));
      }
    } catch (err) {
      alert("Failed to reject user.");
    }
  }
};

  // Filter logic
  const filteredUsers = pendingUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Icon Helper based on Role
  const getRoleIcon = (role) => {
    switch (role) {
      case 'teacher': return <User size={18} />;
      case 'driver': return <Bus size={18} />;
      default: return <Briefcase size={18} />;
    }
  };

  return (
    <div className="requests-page">
      {/* --- HEADER --- */}
      <div className="requests-header">
        <div className="header-text">
          <div className="icon-wrapper">
            <ShieldAlert size={24} color="#6366f1" />
          </div>
          <div>
            <h1>Verification Center</h1>
            <p>Review and authorize access requests for faculty and staff</p>
          </div>
        </div>

        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by name, role or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* --- CONTENT --- */}
      <div className="requests-content">
        {loading ? (
          <div className="center-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '50px 0' }}>
            <Loader2 className="spinner" size={40} />
            <p style={{ marginTop: '10px', color: '#64748b' }}>Scanning for pending requests...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="request-grid">
            {filteredUsers.map((user) => (
              <div className="request-card" key={user._id}>
                <div className="card-top">
                  <div className={`role-badge ${user.role}`}>
                    {getRoleIcon(user.role)}
                    <span>{user.role}</span>
                  </div>
                  <span className="date-stamp">
                    {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>

                <div className="card-user">
                  <div className="user-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-meta">
                    <h3>{user.name}</h3>
                    <p>{user.email}</p>
                  </div>
                </div>

                <div className="card-footer">
                  <button 
                    className="approve-btn" 
                    onClick={() => handleApprove(user._id)}
                    disabled={processingId === user._id}
                  >
                    {processingId === user._id ? (
                      <Loader2 size={16} className="spinner" />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    {processingId === user._id ? "Processing..." : "Authorize Access"}
                  </button>
                  <button className="reject-btn" onClick={() => handleReject(user._id)}>
  <XCircle size={16} /> Reject & Delete
</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="requests-premium-empty">
            <div className="requests-empty-icon-capsule">
              <UserCheck size={60} color="#6366f1" className="requests-empty-pulse-icon" />
              <div className="requests-empty-ring"></div>
            </div>
            <h2>Zero Pending Requests</h2>
            <p>All staff and faculty accounts are currently verified. You're all caught up with the institutional registry.</p>
            <div className="requests-empty-hint">New arrival requests will appear here for your formal authorization.</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UsersRequest;