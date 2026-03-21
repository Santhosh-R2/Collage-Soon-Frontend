import React, { useState, useEffect } from 'react';
import axiosInstance from '../service';
import { 
  Bus, Users, Search, Settings, X, CheckCircle, 
  Map as MapIcon, Navigation, Mail, Home, Loader2, Save,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './Drivers.css';

// Professional Custom Icons
const collegeIcon = L.divIcon({
    className: 'custom-campus-marker',
    html: `
        <div class="campus-badge">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3.333 3 8.667 3 12 0v-5"/>
            </svg>
            <span>CAMPUS</span>
        </div>
        <div class="marker-pin"></div>
    `,
    iconSize: [80, 40],
    iconAnchor: [40, 40]
});

const passengerIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2776/2776067.png',
    iconSize: [30, 30], iconAnchor: [15, 30]
});

// DEFAULT FALLBACK (Will be replaced by dynamic data)
const COLLEGE_LOC = [12.9716, 77.5946];

function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // Modal States
  const [showInitModal, setShowInitModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  
  // Data States
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [busNumber, setBusNumber] = useState('');
  const [passengers, setPassengers] = useState([]);
  const [fetchingData, setFetchingData] = useState(false);
  const [institute, setInstitute] = useState(null);
  const [roadPoints, setRoadPoints] = useState([]);

  useEffect(() => { 
    fetchDrivers(); 
    fetchInstitute();
  }, []);

  const fetchInstitute = async () => {
    try {
      const res = await axiosInstance.get('/admin/institute/active');
      setInstitute(res.data);
    } catch (err) {
      console.error("Institute location error", err);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await axiosInstance.get('/view/drivers');
      setDrivers(response.data.users || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  // --- 1. BUS INITIALIZATION (PRE-FILL LOGIC) ---
  const handleOpenInit = async (driver) => {
    setSelectedDriver(driver);
    setBusNumber('');
    setFetchingData(true);
    setShowInitModal(true);

    try {
      // Fetch existing bus number from backend
      const res = await axiosInstance.get(`/bus/details?driverId=${driver._id}`);
      if (res.data && res.data.busNumber) {
        setBusNumber(res.data.busNumber);
      }
    } catch (err) {
      console.log("No existing bus profile found.");
    } finally {
      setFetchingData(false);
    }
  };

  const submitBusInit = async () => {
    if (!busNumber) return showToast("Please enter a bus number", "error");
    try {
      const response = await axiosInstance.post('/bus/init', {
        driverId: selectedDriver._id,
        busNumber: busNumber
      });
      showToast(response.data.message || "Bus configured successfully!", "success");
      setShowInitModal(false);
      fetchDrivers();
    } catch (err) {
      showToast("Failed to update bus information", "error");
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // --- 2. ROUTE GENERATION (FROM PASSENGERS) ---
  const handleViewRoute = async (driver) => {
    setSelectedDriver(driver);
    setFetchingData(true);
    setShowRouteModal(true);
    setRoadPoints([]); // Reset previous road path

    try {
      const res = await axiosInstance.get(`/bus/my-passengers?driverId=${driver._id}`);
      const list = (res.data || []).filter(p => p.homeLocation?.lat);
      setPassengers(list);
      
      // Generate Road Route
      if (list.length > 0) {
        generateRoadRoute(list);
      }
    } catch (err) {
      showToast("Error loading route data", "error");
    } finally {
      setFetchingData(false);
    }
  };

  const generateRoadRoute = async (stops) => {
    try {
      const origin = institute?.location || { lat: COLLEGE_LOC[0], lng: COLLEGE_LOC[1] };
      
      // Construct coordinates string for OSRM: lng,lat;lng,lat;...
      const coords = [
        `${origin.lng},${origin.lat}`,
        ...stops.map(s => `${s.homeLocation.lng},${s.homeLocation.lat}`),
        `${origin.lng},${origin.lat}`
      ].join(';');

      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
      const response = await fetch(osrmUrl);
      const data = await response.json();

      if (data.routes && data.routes[0]) {
        // OSRM returns [lng, lat], Leaflet wants [lat, lng]
        const flipped = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        setRoadPoints(flipped);
      }
    } catch (err) {
      console.error("OSRM Routing Error:", err);
      // Fallback to straight lines if OSRM fails
      setRoadPoints([]);
    }
  };

  const getPolylinePath = () => {
    if (roadPoints.length > 0) return roadPoints;
    
    // Straight line fallback
    const origin = institute?.location || { lat: COLLEGE_LOC[0], lng: COLLEGE_LOC[1] };
    const path = [[origin.lat, origin.lng]];
    passengers.forEach(p => path.push([p.homeLocation.lat, p.homeLocation.lng]));
    path.push([origin.lat, origin.lng]);
    return path;
  };

  const getMapCenter = () => {
    if (institute?.location) return [institute.location.lat, institute.location.lng];
    return COLLEGE_LOC;
  };

  const filtered = drivers.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="drivers-page">
      {/* --- PREMIUM TOAST --- */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.95, x: '-50%' }}
            className={`premium-fleet-toast ${toast.type}`}
          >
            <div className="toast-icon-box">
              {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            </div>
            <span className="toast-message">{toast.message}</span>
            <div className="toast-progress"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="fleet-header">
        <div className="header-left">
          <div className="fleet-icon-box"><Bus size={24} color="#f59e0b" /></div>
          <div>
            <h1>Fleet Operations</h1>
            <p>Assign vehicles and visualize daily trip routes</p>
          </div>
        </div>
        <div className="search-box">
          <Search size={18} className="s-icon" />
          <input type="text" placeholder="Search driver..." onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* Grid */}
      <div className="driver-grid">
        {loading ? (
          <div className="status-msg">
            <Loader2 className="spin" size={32} />
            <span>Accessing Secure Database...</span>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map(driver => (
            <div className="driver-card" key={driver._id}>
              <div className="card-top">
                <div className="driver-avatar-sq">{driver.name.charAt(0)}</div>
                <div className="driver-meta">
                  <h3>{driver.name}</h3>
                  <span className="verify-badge"><CheckCircle size={12} /> Authorized Personnel</span>
                </div>
              </div>
              <div className="card-body">
                <div className="data-row"><Mail size={14} /> {driver.email}</div>
                <div className="data-row"><Navigation size={14} /> Campus Main Gate</div>
              </div>
              <div className="card-actions">
                <button className="btn-setup" onClick={() => handleOpenInit(driver)}>
                  <Settings size={14} /> Config Bus
                </button>
                <button className="btn-route" onClick={() => handleViewRoute(driver)}>
                  <MapIcon size={14} /> View Route
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="fleet-premium-empty">
            <div className="fleet-empty-icon-capsule">
              <Bus size={60} color="#f59e0b" className="fleet-empty-pulse-icon" />
              <div className="fleet-empty-ring"></div>
            </div>
            <h3>No Active Drivers Found</h3>
            <p>The operational registry currently has no verified transport personnel matching your search.</p>
            <div className="fleet-empty-hint">Verify driver accounts in the Verification Center or check your database connectivity.</div>
          </div>
        )}
      </div>

      {/* --- MODAL: INITIALIZE / UPDATE BUS --- */}
      {showInitModal && (
        <div className="modal-overlay">
          <div className="modal-box setup-modal">
            <div className="modal-head">
              <h3>Vehicle Management</h3>
              <button onClick={() => setShowInitModal(false)}><X /></button>
            </div>
            <div className="modal-body">
              {fetchingData ? <div className="loader-inline"><Loader2 className="spin" /> Checking profile...</div> : (
                <>
                  <p>Assign or Update vehicle for <strong>{selectedDriver?.name}</strong></p>
                  <div className="input-field-group">
                    <label>Registration Number</label>
                    <input 
                      type="text" 
                      value={busNumber} 
                      onChange={(e) => setBusNumber(e.target.value)} 
                      placeholder="e.g. MH-12-PX-1234"
                    />
                  </div>
                  <button className="btn-save-fleet" onClick={submitBusInit}>
                    <Save size={16} /> {busNumber ? 'Update Profile' : 'Initialize Bus'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: ROUTE VIEWER --- */}
      {showRouteModal && (
        <div className="modal-overlay">
          <div className="route-modal-card">
            <div className="modal-head">
              <div className="head-title-combined">
                <div className="nav-icon-box">
                  <Navigation size={20} color="#6366f1" />
                </div>
                <h3>Route Manifest: {selectedDriver?.name}</h3>
              </div>
              <button onClick={() => setShowRouteModal(false)}><X /></button>
            </div>

            <div className="route-split">
              <div className="sidebar-stops">
                <h4>Stop Sequence</h4>
                <div className="custom-timeline">
                  <div className="t-stop start">
                    <div className="t-icon"><Home size={12} /></div>
                    <div className="t-text"><span>START</span><p>Campus Institute</p></div>
                  </div>

                  {passengers.map((p, idx) => (
                    <div className="t-stop" key={p._id}>
                      <div className="t-icon">{idx + 1}</div>
                      <div className="t-text"><span>{p.name}</span><p>{p.role}</p></div>
                    </div>
                  ))}

                  <div className="t-stop end">
                    <div className="t-icon"><Home size={12} /></div>
                    <div className="t-text"><span>RETURN</span><p>Campus Institute</p></div>
                  </div>
                </div>
              </div>

              <div className="map-display-v2">
                {fetchingData ? (
                  <div className="map-loading-state">
                    <Loader2 className="spin" size={40} />
                    <p>Optimizing Road Route...</p>
                  </div>
                ) : (
                  <MapContainer center={getMapCenter()} zoom={13} className="leaflet-frame-premium">
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    <Marker position={getMapCenter()} icon={collegeIcon}>
                      <Popup>Campus HQ: Correct Database Location</Popup>
                    </Marker>
                    {passengers.map(p => (
                      <Marker key={p._id} position={[p.homeLocation.lat, p.homeLocation.lng]} icon={passengerIcon}>
                        <Popup>
                          <strong>{p.name}</strong><br/>
                          {p.role} - Pickup Point
                        </Popup>
                      </Marker>
                    ))}
                    <Polyline 
                      positions={getPolylinePath()} 
                      color="#6366f1" 
                      weight={5} 
                      opacity={0.9} 
                      lineJoin="round"
                    />
                    {/* Glowing effect line */}
                    <Polyline 
                      positions={getPolylinePath()} 
                      color="#818cf8" 
                      weight={12} 
                      opacity={0.2} 
                    />
                  </MapContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Drivers;