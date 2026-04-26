import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import PartnerSignInPage from './pages/PartnerSignInPage';
import PartnerSignUpPage from './pages/PartnerSignUpPage';
import DocumentUploadPage from './pages/DocumentUploadPage';
import VerificationPendingPage from './pages/VerificationPendingPage';
import SubscriptionRequiredPage from './pages/SubscriptionRequiredPage';
import PartnerDashboard from './pages/PartnerDashboard';
import DashboardHome from './pages/DashboardHome';
import AssignedWasteRequestsPage from './pages/AssignedWasteRequestsPage';
import LocationRoutesPage from './pages/LocationRoutesPage';
import PickupHistoryPage from './pages/PickupHistoryPage';
import ImpactAnalyticsPage from './pages/ImpactAnalyticsPage';
import NotificationsPage from './pages/NotificationsPage';
import PartnerProfilePage from './pages/PartnerProfilePage';

import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminWasteRequestsPage from './pages/AdminWasteRequestsPage';
import AdminDashboardHome from './pages/AdminDashboardHome';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminPartnersPage from './pages/AdminPartnersPage';
import AdminDocumentVerificationPage from './pages/AdminDocumentVerificationPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import AdminSubscriptionsPage from './pages/AdminSubscriptionsPage';
import AdminRewardsPage from './pages/AdminRewardsPage';
import AdminVouchersPage from './pages/AdminVouchersPage';
import AdminSchedulingPage from './pages/AdminSchedulingPage';
import AdminNotificationsPage from './pages/AdminNotificationsPage';
import AdminCommunityPage from './pages/AdminCommunityPage';
import VerificationStatusPage from './pages/VerificationStatusPage';
import SubscriptionPlansPage from './pages/SubscriptionPlansPage';
import MakePaymentPage from './pages/MakePaymentPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ErrorBoundary><LandingPage /></ErrorBoundary>} />
          <Route path="/signin" element={<ErrorBoundary><PartnerSignInPage /></ErrorBoundary>} />
          <Route path="/signup" element={<ErrorBoundary><PartnerSignUpPage /></ErrorBoundary>} />
          <Route path="/document-upload" element={<ErrorBoundary><DocumentUploadPage /></ErrorBoundary>} />
          <Route path="/verification-pending" element={<ErrorBoundary><VerificationPendingPage /></ErrorBoundary>} />
          <Route path="/verification-status" element={<ErrorBoundary><VerificationStatusPage /></ErrorBoundary>} />
          <Route path="/subscription-plans" element={<ErrorBoundary><SubscriptionPlansPage /></ErrorBoundary>} />
          <Route path="/make-payment" element={<ErrorBoundary><MakePaymentPage /></ErrorBoundary>} />
          <Route path="/subscription-required" element={<ErrorBoundary><SubscriptionRequiredPage /></ErrorBoundary>} />
          <Route path="/admin/login" element={<ErrorBoundary><AdminLoginPage /></ErrorBoundary>} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin><ErrorBoundary><AdminDashboard /></ErrorBoundary></ProtectedRoute>}>
            <Route path="dashboard" element={<ErrorBoundary><AdminDashboardHome /></ErrorBoundary>} />
            <Route path="users" element={<ErrorBoundary><AdminUsersPage /></ErrorBoundary>} />
            <Route path="waste-requests" element={<ErrorBoundary><AdminWasteRequestsPage /></ErrorBoundary>} />
            <Route path="partners" element={<ErrorBoundary><AdminPartnersPage /></ErrorBoundary>} />
            <Route path="documents" element={<ErrorBoundary><AdminDocumentVerificationPage /></ErrorBoundary>} />
            <Route path="subscriptions" element={<ErrorBoundary><AdminSubscriptionsPage /></ErrorBoundary>} />
            <Route path="rewards" element={<ErrorBoundary><AdminRewardsPage /></ErrorBoundary>} />
            <Route path="vouchers" element={<ErrorBoundary><AdminVouchersPage /></ErrorBoundary>} />
            <Route path="scheduling" element={<ErrorBoundary><AdminSchedulingPage /></ErrorBoundary>} />
            <Route path="analytics" element={<ErrorBoundary><AdminAnalyticsPage /></ErrorBoundary>} />
            <Route path="notifications" element={<ErrorBoundary><AdminNotificationsPage /></ErrorBoundary>} />
            <Route path="community" element={<ErrorBoundary><AdminCommunityPage /></ErrorBoundary>} />
          </Route>
          <Route path="/dashboard" element={<ProtectedRoute requirePartner><ErrorBoundary><PartnerDashboard /></ErrorBoundary></ProtectedRoute>}>
            <Route index element={<ErrorBoundary><DashboardHome /></ErrorBoundary>} />
            <Route path="requests" element={<ErrorBoundary><AssignedWasteRequestsPage /></ErrorBoundary>} />
            <Route path="location-routes" element={<ErrorBoundary><LocationRoutesPage /></ErrorBoundary>} />
            <Route path="history" element={<ErrorBoundary><PickupHistoryPage /></ErrorBoundary>} />
            <Route path="analytics" element={<ErrorBoundary><ImpactAnalyticsPage /></ErrorBoundary>} />
            <Route path="notifications" element={<ErrorBoundary><NotificationsPage /></ErrorBoundary>} />
            <Route path="profile" element={<ErrorBoundary><PartnerProfilePage /></ErrorBoundary>} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;