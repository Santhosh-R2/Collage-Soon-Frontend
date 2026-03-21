import { Routes, Route } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import StudentsPage from './components/ViewAllUsers';
import ViewAllTeachers from './components/ViewAllTeachers';
import UsersRequest from './components/UsersRequest';
import Drivers from './components/Drivers';
import AdminBroadcast from './components/AdminBroadcast';
import TrackLiveMap from './components/TrackLiveMap';
import BroadcastArchive from './components/BroadcastArchive';
import BroadcastDetail from './components/BroadcastDetail';
import CampusSet from './components/CampusSet';

function App() {
  return (
    <Routes>
      <Route path="/" element={<AdminLogin />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="Users" element={<StudentsPage />} />
        <Route path="teachers" element={<ViewAllTeachers />} />
        <Route path="requests" element={<UsersRequest />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="map" element={<TrackLiveMap />} />
        <Route path="broadcast" element={<AdminBroadcast />} />
        <Route path="broadcast-archive" element={<BroadcastArchive />} />
        <Route path="broadcast-archive/:id/:type" element={<BroadcastDetail />} />
        <Route path="campus-setup" element={<CampusSet />} />

      </Route>
    </Routes>
  );
}

export default App;