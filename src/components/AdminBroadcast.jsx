import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Radio, Users, Send, Mail, AlertCircle, CheckCircle2, Loader2, Tractor, GraduationCap, UserCheck, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './AdminBroadcast.css';

function AdminBroadcast() {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetAudience: 'all'
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });

  // Safety check for Admin ID
  const [adminId, setAdminId] = useState(null);

  useEffect(() => {
    const storedId = localStorage.getItem('userId');
    // If no ID found (not logged in), use the Super Admin ID for this session
    setAdminId(storedId || "000000000000000000000000");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', msg: '' });

    // Construct exactly what worked in Postman
    const payload = {
      senderId: adminId,
      title: formData.title,
      message: formData.message,
      targetAudience: formData.targetAudience
    };

    try {
      const response = await axios.post('https://collage-backend-123.vercel.app/api/admin/broadcast', payload);

      setStatus({ 
        type: 'success', 
        msg: response.data.message || "Transmitted successfully!" 
      });
      
      // Clear form
      setFormData({ title: '', message: '', targetAudience: 'all' });
    } catch (err) {
      console.error("Broadcast failed:", err);
      setStatus({ 
        type: 'error', 
        msg: err.response?.data?.message || "Transmission failed. Check backend console." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="broadcast-page">
      <header className="broadcast-header">
        <div className="header-icon">
          <Radio size={28} color="#6366f1" className="pulse-animation" />
        </div>
        <div>
          <h1>Global Broadcast Center</h1>
          <p>Send instant Push Notifications and Emails to the Campus Ecosystem</p>
        </div>
      </header>

      <div className="broadcast-layout">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="form-card">
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label><Users size={16} /> Select Recipients</label>
              <div className="audience-grid">
                {[
                  { id: 'all', label: 'Everyone', icon: <Users size={14} /> },
                  { id: 'student', label: 'Students', icon: <GraduationCap size={14} /> },
                  { id: 'teacher', label: 'Teachers', icon: <UserCheck size={14} /> },
                  { id: 'driver', label: 'Drivers', icon: <Tractor size={14} /> },
                   { id: 'non-faculty', label: 'Staff Members', icon: <Briefcase size={14} /> }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`audience-btn ${formData.targetAudience === item.id ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, targetAudience: item.id })}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label>Broadcast Title</label>
              <input 
                type="text" 
                placeholder="e.g. Campus Holiday Notice"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label>Content Message</label>
              <textarea 
                rows="6"
                placeholder="Type your message here..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
              ></textarea>
            </div>

            <button className="send-btn" disabled={loading}>
              {loading ? (
                <><Loader2 className="spin" size={18} /> Sending...</>
              ) : (
                <><Send size={18} /> Transmit Now</>
              )}
            </button>
          </form>
        </motion.div>

        <div className="preview-panel">
          <AnimatePresence>
            {status.msg && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`status-alert ${status.type}`}>
                {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                <span>{status.msg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="preview-card">
            <h3><Mail size={16} /> Live Email Preview</h3>
            <div className="email-mockup">
              <div className="email-head">Campus Soon</div>
              <div className="email-body">
                <h4>{formData.title || "Subject Line"}</h4>
                <p>{formData.message || "Message content..."}</p>
                <div className="email-footer">Campus Soon Administration</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminBroadcast;