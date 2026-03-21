import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Clock, User, 
  MapPin, AlertTriangle, BookOpen, 
  FileText, GraduationCap, Map as MapIcon,
  Phone, Building, ChevronLeft, Megaphone, Users,
  ShieldCheck
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import axiosInstance from '../service';
import 'leaflet/dist/leaflet.css';
import './BroadcastDetail.css';

// Custom SOS Marker
const sosIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
    iconSize: [35, 35],
    iconAnchor: [17, 17],
});

const BroadcastDetail = () => {
    const { id, type } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDetail();
    }, [id, type]);

    const fetchDetail = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get(`/admin/broadcast/${id}/${type}`);
            setData(res.data);
        } catch (err) {
            console.error("Fetch detail error:", err);
            setError("Failed to load broadcast details.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="detail-loading">
            <div className="spinner-glow"></div>
            <p>Decrypting record...</p>
        </div>
    );

    if (error || !data) return (
        <div className="detail-error">
            <AlertTriangle size={48} color="#ef4444" />
            <h3>Record Not Found</h3>
            <p>{error}</p>
            <button onClick={() => navigate(-1)} className="back-btn-minimal">
                <ChevronLeft size={16} /> Return to Archive
            </button>
        </div>
    );

    const renderExamView = () => (
        <div className="exam-detail-frame">
            <div className="exam-header-banner">
                <GraduationCap size={40} />
                <div>
                    <h2>Examination Schedule</h2>
                    <p>Semester: {data.semester}</p>
                </div>
            </div>

            <div className="exam-table-container">
                <table className="exam-premium-table">
                    <thead>
                        <tr>
                            <th>Subject</th>
                            <th>Date</th>
                            <th>Time Slot</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.exams.map((exam, idx) => (
                            <tr key={idx}>
                                <td className="subject-cell">{exam.subject}</td>
                                <td>{exam.date}</td>
                                <td>{exam.startTime} - {exam.endTime}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderAssignmentView = () => (
        <div className="assignment-digital-card">
            <div className="card-glare"></div>
            <div className="assignment-top-row">
                <div className="assignment-badge">
                    <BookOpen size={16} />
                    <span>Academic Task</span>
                </div>
                <div className="assignment-status">
                    <div className="status-dot"></div>
                    Active Assignment
                </div>
            </div>

            <h1 className="assignment-main-title">{data.topic}</h1>
            
            <div className="assignment-stats-grid">
                <div className="stat-box">
                    <Calendar size={18} color="#6366f1" />
                    <div className="stat-content">
                        <label>Submission Deadline</label>
                        <span>{data.submissionDate}</span>
                    </div>
                </div>
                <div className="stat-box">
                    <Building size={18} color="#a855f7" />
                    <div className="stat-content">
                        <label>Academic Semester</label>
                        <span>Semester: {data.semester}</span>
                    </div>
                </div>
                <div className="stat-box">
                    <User size={18} color="#10b981" />
                    <div className="stat-content">
                        <label>Issuing Faculty</label>
                        <span>{data.teacherId?.name || 'Academic Dept.'}</span>
                    </div>
                </div>
            </div>

            <div className="assignment-desc-section">
                <div className="section-head">
                    <FileText size={16} />
                    <h3>Task Description & Objectives</h3>
                </div>
                <div className="desc-body">
                    {data.description}
                </div>
            </div>

            <div className="assignment-footer-signature">
                <div className="signature-line"></div>
                <div className="footer-flex">
                    <div className="auth-stamp">
                        <ShieldCheck size={20} />
                        <span>OFFICIALLY VERIFIED</span>
                    </div>
                    <p className="gen-date">Generated on {new Date(data.createdAt).toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );

    const renderSOSView = () => (
        <div className="sos-detail-dashboard">
            <div className="sos-alert-strip">
                <AlertTriangle size={24} className="sos-pulse" />
                <h2>EMERGENCY SOS ALERT</h2>
            </div>

            <div className="sos-split">
                <div className="sos-map-panel">
                    <MapContainer 
                        center={[data.location?.lat || 12.9716, data.location?.lng || 77.5946]} 
                        zoom={15} 
                        style={{ height: '400px', borderRadius: '20px' }}
                    >
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                        <Marker position={[data.location?.lat, data.location?.lng]} icon={sosIcon}>
                            <Popup>Last Known SOS Position</Popup>
                        </Marker>
                    </MapContainer>
                </div>

                <div className="sos-info-panel">
                    <div className="sos-card">
                        <h3>Driver Information</h3>
                        <div className="sos-field">
                            <User size={16} />
                            <span>Driver: {data.driverId?.name || 'Assigned Driver'}</span>
                        </div>
                    </div>

                    <div className="sos-card secondary">
                        <h3>Alert Details</h3>
                        <p className="sos-reason">Reason: <span>{data.reason}</span></p>
                        <p className="sos-time">Timestamp: {new Date(data.createdAt).toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderGeneralView = () => (
        <div className="general-detail-view">
            <div className="general-header">
                <div className="megaphone-glow">
                    <Megaphone size={32} color="#fff" />
                </div>
                <div className="header-text">
                    <h1>Institutional Broadcast</h1>
                    <p>Priority communication from administration</p>
                </div>
            </div>

            <div className="general-body-card">
                <div className="body-accent"></div>
                <h2 className="broadcast-msg-title">{data.title}</h2>
                <div className="broadcast-msg-content">
                    {data.message}
                </div>
                
                <div className="broadcast-meta-row">
                    <div className="meta-pill">
                        <User size={14} />
                        <span>Sender: {data.senderId?.name || 'Admin'}</span>
                    </div>
                    <div className="meta-pill target">
                        <Users size={14} />
                        <span>Audience: {data.targetAudience}</span>
                    </div>
                    <div className="meta-pill date">
                        <Clock size={14} />
                        <span>{new Date(data.createdAt).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="detail-viewport">
            <header className="detail-top-nav">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ArrowLeft size={20} />
                    <span>Back to Archives</span>
                </button>
                <div className="breadcrumb">
                    Archive / <span className="active">{type} Details</span>
                </div>
            </header>

            <main className="detail-content">
                {type === 'Exam' && renderExamView()}
                {type === 'Assignment' && renderAssignmentView()}
                {type === 'SOS' && renderSOSView()}
                {type === 'General' && renderGeneralView()}
            </main>
        </div>
    );
};

export default BroadcastDetail;
