import React, { useState, useEffect } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'admin', 'teacher', 'driver'

  useEffect(() => {
    fetchLogs();
  }, []);

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

  const handleDeleteLog = async (id, type) => {
    if (!window.confirm("Are you sure you want to delete this log entry permanently?")) return;
    
    try {
      await axiosInstance.delete(`/admin/broadcast/${id}/${type}`);
      // Refresh list
      fetchLogs();
    } catch (err) {
      console.error("Delete error", err);
      alert("Failed to delete log entry");
    }
  };

  // --- FILTER LOGIC ---
  const filteredLogs = logs.filter(log => {
    // 1. Filter by Search Term
    const matchesSearch = log.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Filter by Tab (Sender Role)
    const matchesTab = activeTab === 'all' || log.senderRole === activeTab;

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

      {/* --- CONTENT LIST --- */}
      <div className="Broadcast-arch-content-scroller">
        {loading ? (
          <div className="Broadcast-arch-loading-state">
            <Loader2 size={40} className="Broadcast-arch-spinner" />
            <p>Scanning encrypted institutional logs...</p>
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
                    onClick={() => handleDeleteLog(log._id, log.type)}
                    title="Delete permanently"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="Broadcast-arch-card-body">
                  <h3 className="Broadcast-arch-log-title">{log.title}</h3>
                  <p className="Broadcast-arch-log-message">{log.message}</p>
                </div>

                <div className="Broadcast-arch-card-footer">
                  <div className="Broadcast-arch-sender-profile">
                    <div className={`Broadcast-arch-avatar-mini Broadcast-arch-av-${log.senderRole}`}>
                        {log.senderName ? log.senderName.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <span className="Broadcast-arch-sender-name">Origin: {log.senderName || 'Authorized User'}</span>
                  </div>
                  <div className="Broadcast-arch-status-indicator">
                    <Target size={14} color="#6366f1" />
                    <span className="Broadcast-arch-status-text">Target: {log.targetAudience}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="Broadcast-arch-empty-state">
            <Megaphone size={50} color="#1e293b" />
            <h2>No filtered logs found</h2>
            <p>Zero broadcast records match the current criteria for {activeTab}.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BroadcastArchive;