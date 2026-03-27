import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axiosInstance from '../service';
import { MapPin, Save, Navigation, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './CampusSet.css';

// Custom Marker for Campus
const campusIcon = L.divIcon({
    className: 'config-campus-marker',
    html: `
        <div class="campus-ring-outer"></div>
        <div class="campus-ring-inner"></div>
        <div class="campus-core-wrapper">
            <div class="campus-hq-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c3.333 3 8.667 3 12 0v-5"/>
                </svg>
                <span>CAMPUS HQ</span>
            </div>
        </div>
    `,
    iconSize: [120, 120],
    iconAnchor: [60, 60]
});

function LocationPicker({ position, setPosition }) {
    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
        },
    });
    return position ? <Marker position={position} icon={campusIcon} /> : null;
}

const CampusSet = () => {
    const [position, setPosition] = useState([12.9716, 77.5946]);
    const [radius, setRadius] = useState(0.5);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState(null);
    const adminId = localStorage.getItem('userId') || "000000000000000000000000";

    useEffect(() => {
        fetchLocation();
    }, []);

    const fetchLocation = async () => {
        try {
            const res = await axiosInstance.get(`/admin/institute/active`);
            if (res.data?.location) {
                setPosition([res.data.location.lat, res.data.location.lng]);
                setRadius(res.data.geofenceRadius || 0.5);
            }
        } catch (err) {
            console.log("No previous location found or error fetching");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setStatus(null);
        try {
            await axiosInstance.post('/admin/set-location', {
                lat: position[0],
                lng: position[1],
                radius,
                adminId
            });
            setStatus({ type: 'success', message: 'Campus Location Updated Successfully' });
            setTimeout(() => setStatus(null), 3000);
        } catch (err) {
            setStatus({ type: 'error', message: 'Failed to update location' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="campus-config-loading">
            <Loader2 className="spin" size={40} />
            <p>Gathering Geographical Data...</p>
        </div>
    );

    return (
        <motion.div 
            className="campus-config-page"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="config-header">
                <div className="header-text-v2">
                    <div className="icon-wrapper-v2">
                        <MapPin size={24} color="#6366f1" />
                    </div>
                    <div>
                        <h1>Campus HQ Setup</h1>
                        <p>Define the central operational origin for your fleet.</p>
                    </div>
                </div>

                <AnimatePresence>
                    {status && (
                        <motion.div 
                            className={`status-pill-v2 ${status.type}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            {status.type === 'success' ? <CheckCircle2 size={18} /> : <ShieldCheck size={18} />}
                            {status.message}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="config-grid">
                <div className="map-config-stage">
                    <div className="map-overlay-instructions">
                        <Navigation size={16} />
                        <span>Click anywhere on the map to pin the new Campus HQ</span>
                    </div>
                    <MapContainer center={position} zoom={15} className="config-leaflet-frame">
                        <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" attribution="&copy; Google Maps" />
                        <LocationPicker position={position} setPosition={setPosition} />
                    </MapContainer>
                </div>

                <div className="config-sidebar-v2">
                    <div className="config-card-v2">
                        <h3>Geographical Coordinates</h3>
                        <div className="coord-box">
                            <div className="coord-item">
                                <label>Latitude</label>
                                <span>{position[0].toFixed(6)}</span>
                            </div>
                            <div className="coord-seg"></div>
                            <div className="coord-item">
                                <label>Longitude</label>
                                <span>{position[1].toFixed(6)}</span>
                            </div>
                        </div>

                        <div className="radius-selector">
                            <label>Geofence Radius (km)</label>
                            <input 
                                type="range" 
                                min="0.1" 
                                max="2.0" 
                                step="0.1" 
                                value={radius} 
                                onChange={(e) => setRadius(parseFloat(e.target.value))}
                            />
                            <div className="radius-val">
                                <span>{radius} km</span>
                                <p>Operational boundary around HQ</p>
                            </div>
                        </div>

                        <button 
                            className="save-campus-btn" 
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="spin" size={20} /> : <Save size={20} />}
                            {saving ? "Deploying Data..." : "Apply Campus Origin"}
                        </button>
                    </div>

                    <div className="config-info-hint">
                        <ShieldCheck size={16} />
                        <p>This location serves as the definitive origin for all driver route manifests and live tracking modules.</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default CampusSet;
