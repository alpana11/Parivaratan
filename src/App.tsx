import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import PartnerSignUpPage from './pages/PartnerSignUpPage';
import DocumentUploadPage from './pages/DocumentUploadPage';
import VerificationPendingPage from './pages/VerificationPendingPage';
import PartnerDashboard from './pages/PartnerDashboard';
import DashboardHome from './pages/DashboardHome';
import AssignedWasteRequestsPage from './pages/AssignedWasteRequestsPage';
import LocationRoutesPage from './pages/LocationRoutesPage';
import PickupHistoryPage from './pages/PickupHistoryPage';
import ImpactAnalyticsPage from './pages/ImpactAnalyticsPage';
import NotificationsPage from './pages/NotificationsPage';
import PartnerProfilePage from './pages/PartnerProfilePage';
import RewardsPage from './pages/RewardsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<PartnerSignUpPage />} />
        <Route path="/document-upload" element={<DocumentUploadPage />} />
        <Route path="/verification-pending" element={<VerificationPendingPage />} />
        <Route path="/dashboard" element={<PartnerDashboard />}>
          <Route index element={<DashboardHome />} />
          <Route path="requests" element={<AssignedWasteRequestsPage />} />
          <Route path="location-routes" element={<LocationRoutesPage />} />
          <Route path="history" element={<PickupHistoryPage />} />
          <Route path="analytics" element={<ImpactAnalyticsPage />} />
          <Route path="rewards" element={<RewardsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<PartnerProfilePage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;