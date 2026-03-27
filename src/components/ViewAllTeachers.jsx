import React, { useState, useEffect } from 'react';
import axiosInstance from '../service';
import { Search, MapPin, X, CheckCircle, Clock, Users, BookOpen, Mail, UserCheck } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './ViewAllTeachers.css';

// --- Leaflet Icon Fix ---
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function ViewAllTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Map Modal States
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showMap, setShowMap] = useState(false);

  // Student List Modal States
  const [studentList, setStudentList] = useState([]);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [currentTeacherName, setCurrentTeacherName] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await axiosInstance.get('/teachers');
      setTeachers(response.data || []);
    } catch (err) {
      console.error("Error fetching teachers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMap = (teacher) => {
    setSelectedTeacher(teacher);
    setShowMap(true);
  };

  const handleOpenStudents = (teacher) => {
    setStudentList(teacher.assignedStudents || []);
    setCurrentTeacherName(teacher.name);
    setShowStudentModal(true);
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="teachers-page">
      <div className="page-header">
        <div className="header-info">
          <div className="icon-badge">
            <BookOpen size={22} color="#8b5cf6" />
          </div>
          <div>
            <h1>Faculty Directory</h1>
            <p>Manage all teaching staff and assigned student loads</p>
          </div>
        </div>

        <div className="search-box">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            placeholder="Search faculty..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-card">
        {loading ? (
          <div className="loading-ui" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '50px 0' }}>
            <div className="pulse-loader"></div>
            <p style={{ marginTop: '10px', color: '#64748b' }}>Loading Faculty Data...</p>
          </div>
        ) : (
          <table className="faculty-table">
            <thead>
              <tr>
                <th>Teacher Details</th>
                <th>Account Status</th>
                <th>Assigned Students</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher._id}>
                    <td>
                      <div className="teacher-profile">
                        <div className="t-avatar">{teacher.name.charAt(0)}</div>
                        <div className="t-info">
                          <span className="t-name">{teacher.name}</span>
                          <span className="t-email">{teacher.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      {teacher.isApproved ? (
                        <span className="status-tag approved"><CheckCircle size={12} /> Approved</span>
                      ) : (
                        <span className="status-tag pending"><Clock size={12} /> Pending</span>
                      )}
                    </td>

                    <td>
                      <button 
                          className="student-count-badge" 
                          onClick={() => handleOpenStudents(teacher)}
                          title="Click to view students"
                      >
                        <Users size={14} />
                        <span>{teacher.assignedStudents?.length || 0} Students</span>
                      </button>
                    </td>

                    <td>
                      {teacher.homeLocation?.lat !== 0 ? (
                        <button className="loc-btn" onClick={() => handleOpenMap(teacher)}>
                          <MapPin size={14} /> View Map
                        </button>
                      ) : (
                        <span className="no-loc">No GPS Data</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">
                    <div className="faculty-premium-empty">
                      <div className="faculty-empty-icon-capsule">
                        <BookOpen size={60} color="#8b5cf6" className="faculty-empty-pulse-icon" />
                        <div className="faculty-empty-ring"></div>
                      </div>
                      <h3>No Faculty Records Found</h3>
                      <p>The central directory currently has no verified teaching staff matching your search parameters.</p>
                      <div className="faculty-empty-hint">Try clearing your filters or refreshing the database.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* --- MODAL 1: PREMIUM MAP --- */}
      {showMap && selectedTeacher && (
        <div className="map-overlay" onClick={() => setShowMap(false)}>
          <div className="map-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-combined">
                 <div className="t-avatar" style={{width: '34px', height: '34px', fontSize: '14px', borderRadius: '10px'}}>
                   {selectedTeacher.name.charAt(0)}
                 </div>
                 <h3 style={{margin: 0, fontSize: '1.1rem', fontWeight: 700}}>Residence Audit: {selectedTeacher.name}</h3>
              </div>
              <button className="close-modal" onClick={() => setShowMap(false)}><X size={20} /></button>
            </div>
            <div style={{height: '480px', width: '100%', background: '#0f172a'}}>
              <MapContainer center={[selectedTeacher.homeLocation.lat, selectedTeacher.homeLocation.lng]} zoom={14} style={{height: '100%', width: '100%'}}>
                <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" attribution="&copy; Google Maps" />
                <Marker position={[selectedTeacher.homeLocation.lat, selectedTeacher.homeLocation.lng]}>
                  <Popup>{selectedTeacher.name}'s Verified Address</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ASSIGNED STUDENTS LIST --- */}
      {showStudentModal && (
        <div className="modal-overlay">
          <div className="modal-card student-modal">
            <div className="modal-header">
              <div className="modal-title-combined">
                <Users size={20} color="#8b5cf6" />
                <h3>Students assigned to {currentTeacherName}</h3>
              </div>
              <button className="close-modal" onClick={() => setShowStudentModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body scrollable-body">
              {studentList.length > 0 ? (
                <table className="inner-student-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Email</th>
                            <th>Campus Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {studentList.map(student => (
                            <tr key={student._id}>
                                <td>
                                    <div className="student-info-cell">
                                        <div className="s-mini-avatar">{student.name.charAt(0)}</div>
                                        <span>{student.name}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="email-link">
                                        <Mail size={12} /> {student.email}
                                    </div>
                                </td>
                                <td>
                                    <span className={`mini-status ${student.campusAttendance?.status}`}>
                                        {student.campusAttendance?.status || 'absent'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              ) : (
                <div className="empty-students">
                    <UserCheck size={48} color="#334155" />
                    <p>No students have been accepted by this teacher yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewAllTeachers;