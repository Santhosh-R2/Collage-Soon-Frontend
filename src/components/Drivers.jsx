import React, { useState, useEffect } from 'react';
import axiosInstance from '../service';
import { 
  Bus, Users, Search, Settings, X, CheckCircle, 
  Map as MapIcon, Navigation, Mail, Home, Loader2, Save
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './Drivers.css';

// Professional Custom Icons
const collegeIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/8074/8074788.png',
    iconSize: [38, 38], iconAnchor: [19, 38]
});

const passengerIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2776/2776067.png',
    iconSize: [30, 30], iconAnchor: [15, 30]
});

const COLLEGE_LOC = [12.9716, 77.5946];

function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [showInitModal, setShowInitModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  
  // Data States
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [busNumber, setBusNumber] = useState('');
  const [passengers, setPassengers] = useState([]);
  const [fetchingData, setFetchingData] = useState(false);

  useEffect(() => { fetchDrivers(); }, []);

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
    if (!busNumber) return alert("Please enter a bus number");
    try {
      const response = await axiosInstance.post('/bus/init', {
        driverId: selectedDriver._id,
        busNumber: busNumber
      });
      alert(response.data.message);
      setShowInitModal(false);
      fetchDrivers();
    } catch (err) {
      alert("Failed to update bus information");
    }
  };

  // --- 2. ROUTE GENERATION (FROM PASSENGERS) ---
  const handleViewRoute = async (driver) => {
    setSelectedDriver(driver);
    setFetchingData(true);
    setShowRouteModal(true);

    try {
      const res = await axiosInstance.get(`/bus/my-passengers?driverId=${driver._id}`);
      // Filter passengers with valid GPS
      const list = (res.data || []).filter(p => p.homeLocation?.lat);
      setPassengers(list);
    } catch (err) {
      alert("Error loading route data");
    } finally {
      setFetchingData(false);
    }
  };

  const getPolylinePath = () => {
    const path = [COLLEGE_LOC];
    passengers.forEach(p => path.push([p.homeLocation.lat, p.homeLocation.lng]));
    path.push(COLLEGE_LOC); // Return trip
    return path;
  };

  const filtered = drivers.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="drivers-page">
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
        {loading ? <div className="status-msg">Accessing Secure Database...</div> : 
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
        ))}
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
                <Navigation size={20} color="#6366f1" />
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

              <div className="map-display">
                {fetchingData ? <div className="map-load">Mapping Path...</div> : (
                  <MapContainer center={COLLEGE_LOC} zoom={13} className="leaflet-frame">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={COLLEGE_LOC} icon={collegeIcon}><Popup>College Hub</Popup></Marker>
                    {passengers.map(p => (
                      <Marker key={p._id} position={[p.homeLocation.lat, p.homeLocation.lng]} icon={passengerIcon}>
                        <Popup>{p.name}</Popup>
                      </Marker>
                    ))}
                    <Polyline positions={getPolylinePath()} color="#6366f1" weight={4} dashArray="10, 15" opacity={0.8} />
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