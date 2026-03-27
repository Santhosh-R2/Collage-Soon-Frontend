import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, ShieldCheck, Database, Navigation } from 'lucide-react';
import axiosInstance from '../service';
import './AdminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axiosInstance.post('/admin/login', { email, password });
      if (response.status === 200) {
        localStorage.setItem('userId', response.data.userId);
        localStorage.setItem('userRole', response.data.role);
        localStorage.setItem('isLoggedIn', 'true');
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid system credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      
      {/* --- ANIMATED BACKGROUND OBJECTS --- */}
      <div className="animated-bg-container">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
        <div className="floating-icon icon-1"><ShieldCheck size={40} /></div>
        <div className="floating-icon icon-2"><Database size={30} /></div>
        <div className="floating-icon icon-3"><Navigation size={35} /></div>
      </div>

      <div className="admin-login-container">
        <motion.div 
          className="admin-login-card glass-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="admin-login-header">
            <div className="admin-logo-mark indigo-glow">
              <ShieldCheck size={28} color="#818cf8" />
            </div>
            <h1>Campus Zone Admin</h1>
            <p>Authenticate to access the command center</p>
          </div>

          <form onSubmit={handleLogin} className="admin-login-form">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                className="admin-login-error"
              >
                {error}
              </motion.div>
            )}

            <div className="admin-input-group">
              <label htmlFor="email">Administrative Email</label>
              <div className="admin-input-wrapper">
                <Mail className="admin-input-icon" size={18} />
                <input 
                  id="email"
                  type="email" 
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="admin-input-group">
              <label htmlFor="password">Security Password</label>
              <div className="admin-input-wrapper">
                <Lock className="admin-input-icon" size={18} />
                <input 
                  id="password"
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <motion.button 
              whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="admin-submit-btn indigo-gradient" 
              disabled={loading}
            >
              {loading ? <Loader2 className="admin-btn-spinner" size={18} /> : <span>Secure Sign In <ArrowRight size={18} /></span>}
            </motion.button>
          </form>

          <div className="admin-login-footer">
            <p>&copy; {new Date().getFullYear()} Campus Zone Secure Systems</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLogin;