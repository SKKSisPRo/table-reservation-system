import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PublicBooking from './components/PublicBooking';
import AdminLayout from './components/admin/AdminLayout';
import ReservationsView from './components/admin/ReservationsView';
import TableMap from './components/admin/TableMap';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicBooking />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<ReservationsView />} />
          <Route path="map" element={<TableMap />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
