import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { io } from 'socket.io-client';
import { Navigation2, Activity, BusFront, AlertCircle, RefreshCcw, Radio } from 'lucide-react';
import L from 'leaflet';
import axiosInstance from '../service';
import 'leaflet/dist/leaflet.css';
import './TrackLiveMap.css';

// Custom Marker using your theme colors
const createBusIcon = (heading) => new L.DivIcon({
    className: 'live-custom-bus-icon',
    html: `<div style="transform: rotate(${heading || 0}deg); transition: all 0.5s ease;">
            <img src="https://cdn-icons-png.flaticon.com/512/3448/3448339.png" style="width:35px; height:35px;" />
           </div>`,
    iconSize: [35, 35],
    iconAnchor: [17, 17],
});

// Professional Campus Marker
const collegeIcon = L.divIcon({
    className: 'custom-campus-marker',
    html: `
        <div class="campus-badge">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3.333 3 8.667 3 12 0v-5"/>
            </svg>
            <span>CAMPUS HQ</span>
        </div>
        <div class="marker-pin"></div>
    `,
    iconSize: [100, 40],
    iconAnchor: [50, 40]
});

// Helper component to control map viewport
const MapController = ({ focusedBusId, buses, institute }) => {
    const map = useMap();
    const initialCentered = useRef(false);

    useEffect(() => {
        // 1. Focus on a specific bus if requested
        if (focusedBusId && buses[focusedBusId]) {
            const { lat, lng } = buses[focusedBusId].location;
            map.flyTo([lat, lng], 16, { duration: 1.5, easeLinearity: 0.25 });
        } 
        // 2. Initial center on Campus HQ once institute data arrives
        else if (institute?.location && !initialCentered.current) {
            map.flyTo([institute.location.lat, institute.location.lng], 14, { duration: 1.2 });
            initialCentered.current = true;
        }
    }, [focusedBusId, buses, institute, map]);

    return null;
};

const TrackLiveMap = () => {
    const [buses, setBuses] = useState({}); // Using object for O(1) updates
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, lastUpdate: new Date() });
    const [currentTime, setCurrentTime] = useState(new Date());
    const [focusedBusId, setFocusedBusId] = useState(null);
    const [institute, setInstitute] = useState(null);
    const socket = useRef(null);

    // Initial load of active buses from DB
    const fetchActiveBuses = async () => {
        try {
            const res = await axiosInstance.get('/bus/live-location');
            if (res.data.status === 'ONLINE') {
                const initialBuses = {};
                const data = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
                data.forEach(b => {
                    const safeDriverId = typeof b.driverId === 'object' && b.driverId !== null ? b.driverId._id : b.driverId;
                    const driverName = b.driverId?.name || '';
                    const bus = { ...b, driverId: String(safeDriverId), driverName };
                    initialBuses[bus.driverId] = bus;
                });
                setBuses(initialBuses);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchInstitute = async () => {
        try {
            const res = await axiosInstance.get('/admin/institute/active');
            setInstitute(res.data);
        } catch (err) {
            console.error("Institute location error", err);
        }
    };

    useEffect(() => {
        fetchActiveBuses();
        fetchInstitute();

        // Initialize Real-time Socket
        socket.current = io("https://collage-soon-backend.onrender.com"); // Use your render URL

        socket.current.on('connect', () => {
            console.log("📡 Connected to Tracking Satellite");
            socket.current.emit('join-app', { role: 'admin' });
        });

        // Listen for real-time movement
        socket.current.on('live-bus-update', (data) => {
            setBuses(prev => ({
                ...prev,
                [data.driverId]: {
                    ...prev[data.driverId],
                    driverId: data.driverId,
                    location: { lat: data.lat, lng: data.lng, heading: data.heading, speed: data.speed },
                    lastUpdated: new Date()
                }
            }));
            setStats(prev => ({ ...prev, lastUpdate: new Date() }));
        });

        // Listen for trip endings
        socket.current.on('trip-status', (data) => {
            if (data.status === 'ENDED') {
                setBuses(prev => {
                    const newBuses = { ...prev };
                    delete newBuses[data.driverId];
                    return newBuses;
                });
            }
        });

        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => {
            socket.current.disconnect();
            clearInterval(timer);
        };
    }, []);

    const busList = Object.values(buses);

    return (
        <div className="live-viewport">
            <div className="live-bg-decoration"></div>

            {/* --- COMMAND HEADER --- */}
            <header className="live-command-header">
                <div className="live-title-box">
                    <div className="live-icon-glow">
                        <Navigation2 size={24} color="#6366f1" />
                    </div>
                    <div>
                        <h1>Fleet Command Center</h1>
                        <p>Global Positioning & Real-time Telemetry</p>
                    </div>
                </div>

                <div className="live-metrics">
                    <div className="live-metric-card">
                        <Activity size={18} color="#10b981" />
                        <div className="live-metric-info">
                            <span className="live-val">{busList.length}</span>
                            <span className="live-lab">Active Units</span>
                        </div>
                    </div>
                    <div className="live-metric-card">
                        <Radio size={18} color="#6366f1" className="live-pulse-svg" />
                        <div className="live-metric-info">
                            <span className="live-time">{currentTime.toLocaleTimeString()}</span>
                            <span className="live-lab">Live Stream</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- MAP & SIDEBAR CONTENT --- */}
            <main className="live-main-frame">
                <div className="live-map-stage">
                    {loading ? (
                        <div className="live-loading-overlay">
                            <RefreshCcw className="live-spin" size={40} />
                            <p>Establishing Satellite Uplink...</p>
                        </div>
                    ) : (
                        <MapContainer
                            center={institute?.location ? [institute.location.lat, institute.location.lng] : [12.9716, 77.5946]}
                            zoom={13}
                            className="live-leaflet-map"
                        >
                            {/* Dark Mode Map Layer */}
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                attribution='&copy; OpenStreetMap &copy; CARTO'
                            />

                            <MapController focusedBusId={focusedBusId} buses={buses} institute={institute} />

                            {institute?.location && (
                                <Marker 
                                    position={[institute.location.lat, institute.location.lng]} 
                                    icon={collegeIcon}
                                >
                                    <Popup><strong>Campus HQ:</strong> Official Institute Location</Popup>
                                </Marker>
                            )}

                            {busList.map((bus) => (
                                <Marker
                                    key={bus.driverId}
                                    position={[bus.location.lat, bus.location.lng]}
                                    icon={createBusIcon(bus.location.heading)}
                                >
                                    <Popup className="live-map-popup">
                                        <div className="live-pop-header">
                                            <BusFront size={16} />
                                            <strong>{bus.driverName ? `Driver: ${bus.driverName}` : 'Bus Unit'}</strong>
                                            <span className="live-pop-status">Active</span>
                                        </div>
                                        <div className="live-pop-body">
                                            <p><span>Speed:</span> {bus.location.speed || 0} km/h</p>
                                            <p><span>Lat:</span> {bus.location.lat.toFixed(4)}</p>
                                            <p><span>Lng:</span> {bus.location.lng.toFixed(4)}</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    )}

                    {/* SIDEBAR OVERLAY */}
                    <div className="live-sidebar">
                        <div className="live-sidebar-head">
                            <h3>Active Fleet</h3>
                            <span className="live-count-chip">{busList.length}</span>
                        </div>

                        <div className="live-fleet-list">
                            {busList.length === 0 ? (
                                <div className="live-no-data">
                                    <div className="live-empty-icon-box">
                                        <AlertCircle size={48} color="#6366f1" />
                                        <div className="live-empty-pulse"></div>
                                    </div>
                                    <h4>No Active Units</h4>
                                    <p>The fleet is currently stationary or offline. Updates will appear as soon as a unit comes online.</p>
                                    <button className="live-refresh-btn" onClick={fetchActiveBuses}>
                                        <RefreshCcw size={14} /> Check for updates
                                    </button>
                                </div>
                            ) : (
                                busList.map(bus => (
                                    <div 
                                        className={`live-bus-item ${focusedBusId === bus.driverId ? 'focused' : ''}`} 
                                        key={bus.driverId}
                                        onClick={() => setFocusedBusId(bus.driverId)}
                                    >
                                        <div className="live-bus-icon-v">
                                            <BusFront size={20} color="#f59e0b" />
                                        </div>
                                        <div className="live-bus-details">
                                            <h4>{bus.driverName ? `Driver: ${bus.driverName}` : `Unit #${String(bus.driverId).substring(18)}`}</h4>
                                            <p>{bus.location.speed} km/h • Signal Strong</p>
                                        </div>
                                        <div className="live-status-ping"></div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TrackLiveMap;