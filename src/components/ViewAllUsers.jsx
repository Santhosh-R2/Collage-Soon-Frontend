import React, { useState, useEffect } from 'react';
import axiosInstance from '../service';
import { 
  Search, MapPin, X, Users, User, Bus, 
  Briefcase, GraduationCap, ChevronDown, Filter,
  History, Calendar, TrendingUp, UserCheck, Mail, ShieldCheck, Trash2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './ViewAllUsers.css';

// --- Leaflet Icon Fix ---
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon, shadowUrl: iconShadow,
    iconSize: [25, 41], iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function ViewAllUsers() {
  const [role, setRole] = useState('student');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState({ totalPresent: 0, history: [] });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchUsersByRole();
  }, [role]);

  const fetchUsersByRole = async () => {
    setLoading(true);
    try {
      const endpointMap = {
        student: '/view/students',
        teacher: '/view/teachers',
        driver: '/view/drivers',
        'non-faculty': '/view/non-faculty'
      };
      const response = await axiosInstance.get(endpointMap[role]);
      console.log(response);
      setUsers(response.data.users || []);
    } catch (err) {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const openAttendance = async (user) => {
    setSelectedUser(user);
    setShowHistory(true);
    setHistoryLoading(true);
    try {
      const response = await axiosInstance.get(`/attendance/history?userId=${user._id}`);
      console.log(response);
      setHistoryData(response.data);
    } catch (err) {
      setHistoryData({ totalPresent: 0, history: [] });
    } finally {
      setHistoryLoading(false);
    }
  };

  const openMap = (user) => {
    setSelectedUser(user);
    setShowMap(true);
  };

  const initDelete = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const response = await axiosInstance.delete(`/admin/user/${userToDelete._id}`);
      if (response.status === 200) {
        setUsers(users.filter(u => u._id !== userToDelete._id));
        setShowDeleteModal(false);
        setUserToDelete(null);
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user. Make sure you have the correct permissions.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (currentRole) => {
    switch(currentRole) {
      case 'student': return <GraduationCap size={18} />;
      case 'teacher': return <User size={18} />;
      case 'driver': return <Bus size={18} />;
      default: return <Briefcase size={18} />;
    }
  };

  return (
    <div className="viewuser-container">
      
      {/* --- COMMAND BAR --- */}
      <div className="viewuser-command-bar">
        <div className="viewuser-title-section">
          <div className="viewuser-icon-bg"><Users color="#6366f1" size={24} /></div>
          <div>
            <h1 className="viewuser-main-title">Ecosystem Directory</h1>
            <p className="viewuser-sub-title">Audit and manage verified <span className="viewuser-highlight">{role}s</span></p>
          </div>
        </div>

        <div className="viewuser-filter-section">
          <div className="viewuser-select-box">
            <Filter className="viewuser-select-icon-l" size={16} />
            <select value={role} onChange={(e) => setRole(e.target.value)} className="viewuser-role-dropdown">
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="driver">Drivers</option>
              <option value="non-faculty">Non-Faculty</option>
            </select>
            <ChevronDown className="viewuser-select-icon-r" size={16} />
          </div>

          <div className="viewuser-search-wrapper">
            <Search size={18} className="viewuser-search-icon" />
            <input 
                type="text" 
                placeholder={`Filter ${role} list...`} 
                className="viewuser-search-input"
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>
      </div>

      {/* --- DIRECTORY TABLE --- */}
      <div className="viewuser-table-wrapper">
        {loading ? (
          <div className="viewuser-loader">
            <div className="viewuser-spinner"></div>
            <p>Synchronizing secure database...</p>
          </div>
        ) : (
          <table className="viewuser-data-table">
            <thead>
              <tr>
                <th>Identity Profile</th>
                <th>Communication</th>
                <th>Platform Status</th>
                <th>Administrative Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="viewuser-table-row">
                    <td>
                      <div className="viewuser-user-cell">
                        <div className={`viewuser-avatar viewuser-avatar-${role}`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="viewuser-name-stack">
                           <span className="viewuser-user-name">{user.name}</span>
                           <span className="viewuser-id-tag">ID: {user._id.substring(0,8)}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                        <div className="viewuser-email-box">
                            <Mail size={14} color="#94a3b8" />
                            <span className="viewuser-email-text">{user.email}</span>
                        </div>
                    </td>
                    <td>
                        <span className={`viewuser-status-badge viewuser-badge-${role}`}>
                            <ShieldCheck size={12} /> Verified {role}
                        </span>
                    </td>
                    <td>
                      <div className="viewuser-btn-group">
                        <button className="viewuser-btn viewuser-btn-loc" onClick={() => openMap(user)}>
                          <MapPin size={14} /> Location
                        </button>
                        <button className="viewuser-btn viewuser-btn-hist" onClick={() => openAttendance(user)}>
                          <History size={14} /> Attendance
                        </button>
                        <button className="viewuser-btn viewuser-btn-del" onClick={() => initDelete(user)}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">
                    <div className="viewuser-premium-empty">
                      <div className="viewuser-empty-icon-capsule">
                        <Users size={60} color="#6366f1" className="viewuser-empty-pulse-icon" />
                        <div className="viewuser-empty-ring"></div>
                      </div>
                      <h3>No Verified {role.charAt(0).toUpperCase() + role.slice(1)}s Found</h3>
                      <p>Currently, there are no active records matching your filter criteria in the central {role} directory.</p>
                      <div className="viewuser-empty-hint">Try adjusting your search or switching to a different department.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* --- MAP MODAL --- */}
      {showMap && selectedUser && (
        <div className="viewuser-modal-overlay" onClick={() => setShowMap(false)}>
          <div className="viewuser-modal-card viewuser-map-modal" onClick={e => e.stopPropagation()}>
            <div className="viewuser-modal-header">
              <div className="viewuser-modal-title">
                  <div className={`viewuser-mini-av viewuser-avatar-${role}`}>{selectedUser.name.charAt(0)}</div>
                  <h3>Residence Audit: {selectedUser.name}</h3>
              </div>
              <button className="viewuser-modal-close" onClick={() => setShowMap(false)}><X size={20} /></button>
            </div>
            <div className="viewuser-map-container">
              <MapContainer center={[selectedUser.homeLocation.lat, selectedUser.homeLocation.lng]} zoom={14} className="viewuser-leaflet">
                <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" attribution="&copy; Google Maps" />
                <Marker position={[selectedUser.homeLocation.lat, selectedUser.homeLocation.lng]}>
                    <Popup>{selectedUser.name}'s Verified Address</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        </div>
      )}

      {/* --- ATTENDANCE HISTORY MODAL --- */}
      {showHistory && selectedUser && (
        <div className="viewuser-modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="viewuser-modal-card viewuser-history-modal" onClick={e => e.stopPropagation()}>
             <div className="viewuser-modal-header">
                <div className="viewuser-modal-title">
                   <TrendingUp size={18} color="#6366f1" />
                   <h3>Attendance Analytics: {selectedUser.name}</h3>
                </div>
                <button className="viewuser-modal-close" onClick={() => setShowHistory(false)}><X size={20} /></button>
             </div>
             
             <div className="viewuser-history-body">
                {historyLoading ? (
                   <div className="viewuser-modal-loader"><div className="viewuser-spinner"></div></div>
                ) : (
                   <>
                      <div className="viewuser-history-summary">
                         <div className="viewuser-stat-card">
                            <span className="viewuser-stat-label">Total Attendance</span>
                            <span className="viewuser-stat-value">{historyData.totalPresent} <span className="viewuser-days-text">Days</span></span>
                         </div>
                         <div className="viewuser-stat-card">
                            <span className="viewuser-stat-label">Status Level</span>
                            <span className="viewuser-stat-value" style={{color:'#10b981'}}>Active</span>
                         </div>
                      </div>

                      <div className="viewuser-history-table-box">
                         {historyData.history.length > 0 ? (
                            <table className="viewuser-inner-table">
                               <thead>
                                  <tr>
                                     <th><Calendar size={12}/> Date Recorded</th>
                                     <th>Status</th>
                                     <th>Entry Method</th>
                                  </tr>
                               </thead>
                               <tbody>
                                  {historyData.history.map((record, i) => (
                                     <tr key={i}>
                                        <td className="viewuser-date-cell">{record.date}</td>
                                        <td>
                                           <span className={`viewuser-pill viewuser-pill-${record.status}`}>
                                              {record.status}
                                           </span>
                                        </td>
                                        <td className="viewuser-method-cell">{record.location?.lat !== 0 ? 'GPS Verified' : 'Manual Entry'}</td>
                                     </tr>
                                  ))}
                               </tbody>
                            </table>
                         ) : (
                            <div className="viewuser-no-history">
                               <UserCheck size={44} color="#334155" />
                               <p>No verified entry records exist for this profile.</p>
                            </div>
                         )}
                      </div>
                   </>
                )}
             </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {showDeleteModal && userToDelete && (
        <div className="viewuser-modal-overlay" onClick={() => !isDeleting && setShowDeleteModal(false)}>
          <div className="viewuser-modal-card viewuser-delete-modal" onClick={e => e.stopPropagation()}>
            <div className="viewuser-delete-header">
              <div className="viewuser-delete-icon-capsule">
                <Trash2 size={32} color="#ef4444" />
              </div>
              <h3>Confirm Deletion</h3>
              <p>Are you sure you want to permanently delete <strong>{userToDelete.name}</strong>? This action cannot be undone.</p>
            </div>
            <div className="viewuser-delete-actions">
              <button 
                className="viewuser-cancel-btn" 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="viewuser-confirm-del-btn" 
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewAllUsers;