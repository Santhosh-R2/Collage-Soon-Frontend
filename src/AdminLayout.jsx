import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutGrid,      // Better for Dashboard
  UserPlus2,       // Better for User Requests/Verification
  Users2,          // Better for viewing all Users
  GraduationCap,   // Standard for Teachers/Faculty
  BusFront,        // Modern front-facing Bus icon
  Navigation2,     // Implies movement/live tracking
  Megaphone,       // Standard for Broadcasts/Announcements
  LogOut, 
  ShieldCheck, 
  AlertTriangle,
  ListFilter,
  MapPin
} from 'lucide-react';
import './AdminLayout.css';

const AdminLayout = () => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const navLinks = [
    { 
      name: 'Dashboard', 
      path: '/admin/dashboard', 
      icon: <LayoutGrid size={20} strokeWidth={2.2} /> 
    },
    { 
      name: 'Users Requests', 
      path: '/admin/Requests', 
      icon: <UserPlus2 size={20} strokeWidth={2.2} /> 
    },
    { 
      name: 'View Users', 
      path: '/admin/Users', 
      icon: <Users2 size={20} strokeWidth={2.2} /> 
    },
    { 
      name: 'Teachers', 
      path: '/admin/teachers', 
      icon: <GraduationCap size={20} strokeWidth={2.2} /> 
    },
    { 
      name: 'Drivers & Fleet', 
      path: '/admin/drivers', 
      icon: <BusFront size={20} strokeWidth={2.2} /> 
    },
    { 
      name: 'Track Live Map', 
      path: '/admin/map', 
      icon: <Navigation2 size={20} strokeWidth={2.2} /> 
    },
    { 
      name: 'Broadcast', 
      path: '/admin/broadcast', 
      icon: <Megaphone size={20} strokeWidth={2.2} /> 
    },
     { name: 'Broadcast Logs', 
      path: '/admin/broadcast-archive',
       icon: <ListFilter size={20} /> },
     { name: 'Campus Config', 
      path: '/admin/campus-setup',
       icon: <MapPin size={20} /> },
  ];

  return (
    <div className="admin-layout">
      
      {/* --- SIDEBAR --- */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-logo-bg">
            <ShieldCheck className="brand-icon" size={24} />
          </div>
          <span className="brand-text">Campus Zone</span>
        </div>

        <nav className="nav-menu">
          {navLinks.map((item) => (
            <NavLink 
              key={item.name} 
              to={item.path} 
              className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-trigger" onClick={() => setShowLogoutModal(true)}>
            <LogOut size={20} />
            <span>Logout Account</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* --- LOGOUT CONFIRMATION MODAL --- */}
      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              <AlertTriangle size={32} />
            </div>
            <h3 className="modal-title">Confirm Logout</h3>
            <p className="modal-desc">Are you sure you want to end your session? You will need to login again to access the dashboard.</p>
            
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowHistory(false)}>
                Cancel
              </button>
              <button className="btn-confirm" onClick={handleLogout}>
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminLayout;