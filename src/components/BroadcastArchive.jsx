import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../service';
import { 
  Search, Clock, Calendar, Target, 
  User, ChevronRight, History, Megaphone, Loader2,
  ShieldCheck, GraduationCap, BusFront, LayoutList, Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';
import './BroadcastArchive.css';

function BroadcastArchive() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'admin', 'teacher', 'driver'
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, type: null });
  const navigate = useNavigate();

  useEffect(() => {
    fetchLogs();
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await axiosInstance.get('/view/teachers');
      // Ensure we set an array even if the structure is different
      const teacherData = Array.isArray(res.data) ? res.data : (res.data?.teachers || []);
      setTeachers(teacherData);
    } catch (err) {
      console.error("Teacher fetch error", err);
      setTeachers([]); // Fallback to empty array
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('admin/broadcasts');
      setLogs(res.data || []);
    } catch (err) {
      console.error("Archive fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLog = async () => {
    const { id, type } = deleteModal;
    try {
      await axiosInstance.delete(`/admin/broadcast/${id}/${type}`);
      fetchLogs();
      setDeleteModal({ show: false, id: null, type: null });
    } catch (err) {
      console.error("Delete error", err);
      alert("Failed to delete log entry");
    }
  };

  const openDeleteModal = (e, id, type) => {
    e.stopPropagation();
    setDeleteModal({ show: true, id, type });
  };

  // --- FILTER LOGIC ---
  const filteredLogs = logs.filter(log => {
    // 1. Filter by Search Term
    const matchesSearch = log.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (log.senderName && log.senderName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // 2. Filter by Tab (Sender Role)
    let matchesTab = activeTab === 'all' || log.senderRole === activeTab;

    // 3. Special Faculty Filter
    if (activeTab === 'teacher' && selectedTeacherId !== 'all') {
      matchesTab = log.senderId === selectedTeacherId;
    }

    return matchesSearch && matchesTab;
  });

  return (
    <div className="Broadcast-arch-viewport">
      {/* --- HEADER & COMMAND BAR --- */}
      <header className="Broadcast-arch-header">
        <div className="Broadcast-arch-title-box">
          <div className="Broadcast-arch-icon-container">
            <History size={24} color="#6366f1" />
          </div>
          <div className="Broadcast-arch-text-group">
            <h1 className="Broadcast-arch-main-title">Communication Logs</h1>
            <p className="Broadcast-arch-sub-title">Reviewing historical data for <span className="Broadcast-arch-active-label">{activeTab}</span> department</p>
          </div>
        </div>

        <div className="Broadcast-arch-search-wrapper">
          <Search size={18} className="Broadcast-arch-s-icon" />
          <input 
            type="text" 
            placeholder="Search within archives..." 
            className="Broadcast-arch-search-input"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {/* --- FILTER TABS --- */}
      <div className="Broadcast-arch-tabs-container">
        {[
          { id: 'all', label: 'All Records', icon: <LayoutList size={16}/> },
          { id: 'admin', label: 'System Admin', icon: <ShieldCheck size={16}/> },
          { id: 'teacher', label: 'Faculty', icon: <GraduationCap size={16}/> },
          { id: 'driver', label: 'Driver SOS', icon: <BusFront size={16}/> },
        ].map((tab) => (
          <button 
            key={tab.id}
            className={`Broadcast-arch-tab-btn ${activeTab === tab.id ? 'Broadcast-arch-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      
      {/* --- FACULTY SELECTOR (Only shown for teacher tab) --- */}
      {/* {activeTab === 'teacher' && (
        <div className="Broadcast-arch-faculty-filter">
          <User size={18} color="#94a3b8" />
          <span className="Broadcast-arch-filter-label">Filter by Faculty:</span>
          <select 
            className="Broadcast-arch-faculty-select"
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
          >
            <option value="all">All Faculty Members</option>
            {Array.isArray(teachers) && teachers.map(teacher => (
              <option key={teacher._id} value={teacher._id}>{teacher.name}</option>
            ))}
          </select>
        </div>
      )} */}

      {/* --- CONTENT LIST --- */}
      <div className="Broadcast-arch-content-scroller">
        {loading ? (
          <div className="Broadcast-arch-loading-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '50px 0' }}>
            <Loader2 size={40} className="Broadcast-arch-spinner" />
            <p style={{ marginTop: '10px', color: '#64748b' }}>Scanning encrypted institutional logs...</p>
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="Broadcast-arch-list">
            {filteredLogs.map((log) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={log._id} 
                className={`Broadcast-arch-log-card Broadcast-arch-border-${log.senderRole}`}
              >
                <div className="Broadcast-arch-card-head">
                  <div className="Broadcast-arch-meta-info">
                    <span className={`Broadcast-arch-audience-pill Broadcast-arch-tag-${log.senderRole}`}>
                      {log.senderRole === 'admin' ? <ShieldCheck size={12}/> : 
                       log.senderRole === 'teacher' ? <GraduationCap size={12}/> : <BusFront size={12}/>}
                      {log.senderRole}
                    </span>
                    <span className="Broadcast-arch-timestamp">
                      <Clock size={12} /> {new Date(log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <span className="Broadcast-arch-datestamp">
                      <Calendar size={12} /> {new Date(log.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <button 
                    className="Broadcast-arch-delete-btn"
                    onClick={(e) => openDeleteModal(e, log._id, log.type || 'General')}
                    title="Delete permanently"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="Broadcast-arch-card-body">
                  <div className="Broadcast-arch-type-row">
                    <span className={`Broadcast-arch-type-tag type-${log.type?.toLowerCase()}`}>
                       {log.type || 'General'}
                    </span>
                  </div>
                  <h3 
                    className="Broadcast-arch-log-title clickable"
                    onClick={() => navigate(`/admin/broadcast-archive/${log._id}/${log.type || 'General'}`)}
                  >
                    {log.title}
                  </h3>
                </div>

                <div className="Broadcast-arch-card-footer">
                  <div className="Broadcast-arch-timestamp">
                    <Clock size={12} /> {new Date(log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <div className="Broadcast-arch-datestamp">
                    <Calendar size={12} /> {new Date(log.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="Broadcast-arch-premium-empty">
            <div className="arch-empty-icon-capsule">
              <Megaphone size={60} color="#6366f1" className="arch-empty-pulse-icon" />
              <div className="arch-empty-ring"></div>
            </div>
            <h3>No Records Captured</h3>
            <p>The institutional logs for the {activeTab} department are currently clear. Zero broadcast entries match your current search.</p>
            <div className="arch-empty-hint">Try switching departments or broadening your search parameters.</div>
          </div>
        )}
      </div>

      {/* --- CUSTOM DELETE MODAL --- */}
      {deleteModal.show && (
        <div className="arch-modal-overlay">
          <div className="arch-modal-card">
            <div className="arch-modal-icon">
              <Trash2 size={32} color="#ef4444" />
            </div>
            <h2>Confirm Deletion</h2>
            <p>This action is irreversible. Are you sure you want to permanently erase this record from the institutional archives?</p>
            <div className="arch-modal-actions">
              <button 
                className="arch-modal-btn cancel" 
                onClick={() => setDeleteModal({ show: false, id: null, type: null })}
              >
                Keep Record
              </button>
              <button 
                className="arch-modal-btn confirm" 
                onClick={handleDeleteLog}
              >
                Confirm Erase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BroadcastArchive;