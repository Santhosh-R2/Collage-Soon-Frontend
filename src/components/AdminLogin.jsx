import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, AlertCircle, ShieldCheck, Sparkles, Eye, EyeOff } from 'lucide-react';
import axiosInstance from '../service';
import Logo from '../assets/campus.png'; // Using your Logo asset
import './AdminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Toggle state
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
      setError(err.response?.data?.message || 'Verification failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const fadeInUp = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="login-viewport">
      <div className="bg-grid-overlay"></div>
      <div className="radial-glow-1"></div>

      <div className="split-layout">
        
        {/* --- LEFT SIDE: BRANDING --- */}
        <section className="brand-visual-section">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="brand-content-wrapper"
          >
             <div className="premium-tag">
               <Sparkles size={14} />
               <span>Enterprise Management v2.0</span>
             </div>
             
             {/* Integrated Logo and Name */}
             <div className="main-logo-area">
                {/* <img src={Logo} alt="Campus Zone Logo" className="desktop-logo" /> */}
                <h1 className="brand-display-name">
                    Campus <span className="text-gradient">Zone</span>
                </h1>
             </div>

             <h2 className="hero-heading">
               The Intelligence <br />Behind Modern Campus.
             </h2>
             <p className="hero-description">
               A unified institutional command center for real-time logistics, 
               academic oversight, and campus-wide safety.
             </p>

             <div className="abstract-visual-node">
                <div className="node-ring ring-1"></div>
                <ShieldCheck size={80} className="shield-icon-central" />
             </div>
          </motion.div>
        </section>

        {/* --- RIGHT SIDE: FORM --- */}
        <section className="login-form-section">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="form-container-card"
          >
            {/* Mobile Header with Logo */}
            <motion.div variants={fadeInUp} className="form-brand-header">
               {/* <img src={Logo} alt="Logo" className="mobile-logo" /> */}
               <h3>Campus Zone</h3>
            </motion.div>

            <motion.div variants={fadeInUp} className="form-text-group">
              <h2>Administrator Login</h2>
              <p>Please enter your secure access credentials.</p>
            </motion.div>

            {error && (
              <motion.div variants={fadeInUp} className="status-error-box">
                <AlertCircle size={18} />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="login-submission-form">
              <motion.div variants={fadeInUp} className="custom-input-group">
                <label>System Email</label>
                <div className="input-inner-wrapper">
                  <Mail className="input-icon-left" size={18} />
                  <input 
                    type="email" 
                    placeholder="admin@campuszone.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </motion.div>

              <motion.div variants={fadeInUp} className="custom-input-group">
                <label>Master Security Key</label>
                <div className="input-inner-wrapper">
                  <Lock className="input-icon-left" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {/* Password Toggle Icon */}
                  <button 
                    type="button" 
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </motion.div>

              <motion.button 
                variants={fadeInUp}
                whileHover={{ y: -2, backgroundColor: "#4f46e5" }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                className="auth-primary-btn" 
                disabled={loading}
              >
                {loading ? <div className="auth-spinner"></div> : <>Continue to Command Center <ArrowRight size={18} /></>}
              </motion.button>
            </form>

            <motion.div variants={fadeInUp} className="auth-footer-note">
               <p>© {new Date().getFullYear()} Campus Zone. Secure Encrypted Session.</p>
            </motion.div>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default AdminLogin;