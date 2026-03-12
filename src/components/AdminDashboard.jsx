import React, { useState, useEffect } from 'react';
import axiosInstance from '../service';
import {
  Users, GraduationCap, BusFront, Briefcase,
  Activity, ArrowUpRight, ArrowDownRight, TrendingUp, AlertCircle, Clock, CheckCircle
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts';
import { motion } from 'framer-motion';
import './AdminDashboard.css';

function AdminDashboard() {
  const [stats, setStats] = useState({
    student: 0,
    teacher: 0,
    driver: 0,
    'non-faculty': 0
  });
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Attendance Viewer States
  const [attendanceRole, setAttendanceRole] = useState('student');
  const [presentUsers, setPresentUsers] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchAttendanceData();
  }, [attendanceRole]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const roles = ['student', 'teacher', 'driver', 'non-faculty'];
      const endpointMap = {
        student: '/view/students',
        teacher: '/view/teachers',
        driver: '/view/drivers',
        'non-faculty': '/view/non-faculty'
      };
      
      const statsPromises = roles.map(role => axiosInstance.get(endpointMap[role]));
      const responses = await Promise.all(statsPromises);

      const newStats = {};
      responses.forEach((res, index) => {
        newStats[roles[index]] = res.data.count;
      });
      setStats(newStats);

      const pendingRes = await axiosInstance.get('/admin/pending');
      setPendingCount(pendingRes.data.length || 0);

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      setAttendanceLoading(true);
      const res = await axiosInstance.get(`/attendance/today/${attendanceRole}`);
      setPresentUsers(res.data || []);
    } catch (err) {
      console.error("Error fetching attendance:", err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'];

  const barData = [
    { name: 'Students', value: stats.student, color: COLORS[0] },
    { name: 'Teachers', value: stats.teacher, color: COLORS[1] },
    { name: 'Drivers', value: stats.driver, color: COLORS[2] },
    { name: 'Staff', value: stats['non-faculty'], color: COLORS[3] },
  ];

  const statCards = [
    { title: 'Total Students', value: stats.student, icon: <GraduationCap size={24} />, color: 'primary', trend: '+12%' },
    { title: 'Faculty Members', value: stats.teacher, icon: <Users size={24} />, color: 'secondary', trend: '+4%' },
    { title: 'Fleet Drivers', value: stats.driver, icon: <BusFront size={24} />, color: 'accent', trend: '+2%' },
    { title: 'Support Staff', value: stats['non-faculty'], icon: <Briefcase size={24} />, color: 'warning', trend: '0%' },
  ];

  if (loading) {
    return (
      <div className="AdminDash-loading">
        <Activity className="AdminDash-spinner" size={40} />
        <p>Loading Campus Analytics...</p>
      </div>
    );
  }

  return (
    <div className="AdminDash-container">
      {/* Header */}
      <header className="AdminDash-header">
        <div className="AdminDash-title-box">
          <h1>Command Center</h1>
          <p>Real-time campus overview and analytics</p>
        </div>

        {pendingCount > 0 && (
          <div className="AdminDash-alert">
            <AlertCircle size={18} />
            <span>{pendingCount} Pending User Approvals</span>
          </div>
        )}
      </header>

      {/* Top Value Cards */}
      <div className="AdminDash-stats-grid">
        {statCards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`AdminDash-stat-card bg-${card.color}`}
          >
            <div className="AdminDash-card-top">
              <div className="AdminDash-icon-wrapper">{card.icon}</div>
              <span className="AdminDash-trend">
                <TrendingUp size={14} /> {card.trend}
              </span>
            </div>
            <div className="AdminDash-card-bottom">
              <h3>{card.value}</h3>
              <p>{card.title}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts & Live Attendance Section */}
      <div className="AdminDash-charts-grid">

        {/* Live Attendance Viewer (MODIFIED) */}
        <motion.div
          className="AdminDash-chart-box"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="AdminDash-chart-header">
            <div className="AdminDash-header-flex">
              <div>
                <h3>Today's Presence</h3>
                <p>Live verified check-ins</p>
              </div>
              <select 
                className="AdminDash-role-select"
                value={attendanceRole}
                onChange={(e) => setAttendanceRole(e.target.value)}
              >
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="driver">Drivers</option>
                <option value="non-faculty">Support Staff</option>
              </select>
            </div>
          </div>
          
          <div className="AdminDash-attendance-list scroll-shadow">
            {attendanceLoading ? (
              <div className="AdminDash-list-loading"><Activity className="spin" /></div>
            ) : presentUsers.length > 0 ? (
              presentUsers.map((user) => (
                <div key={user._id} className="AdminDash-user-item">
                  <div className={`AdminDash-mini-avatar avatar-${attendanceRole}`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="AdminDash-user-info">
                    <span className="name">{user.name}</span>
                    <span className="email">{user.email}</span>
                  </div>
                  <div className="AdminDash-checkin-time">
                    <Clock size={12} />
                    <span>{new Date(user.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="AdminDash-empty-list">
                <CheckCircle size={32} opacity={0.2} />
                <p>No {attendanceRole}s have checked in yet today.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          className="AdminDash-chart-box"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="AdminDash-chart-header">
            <h3>Role Breakdown Ratio</h3>
            <p>Percentage of total campus members</p>
          </div>
          <div className="AdminDash-chart-content AdminDash-pie-container">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={barData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Custom Legend */}
            <div className="AdminDash-custom-legend">
              {barData.map((item, i) => (
                <div key={i} className="AdminDash-legend-item">
                  <span className="AdminDash-legend-dot" style={{ backgroundColor: item.color }}></span>
                  <span className="AdminDash-legend-name">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

export default AdminDashboard;