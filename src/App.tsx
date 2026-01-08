import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
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
import RewardsPage from './pages/RewardsPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminWasteRequestsPage from './pages/AdminWasteRequestsPage';
import AdminDashboardHome from './pages/AdminDashboardHome';
import AdminPartnersPage from './pages/AdminPartnersPage';
import AdminDocumentVerificationPage from './pages/AdminDocumentVerificationPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import AdminSubscriptionsPage from './pages/AdminSubscriptionsPage';
import AdminRewardsPage from './pages/AdminRewardsPage';
import AdminVouchersPage from './pages/AdminVouchersPage';
import AdminSchedulingPage from './pages/AdminSchedulingPage';
import AdminNotificationsPage from './pages/AdminNotificationsPage';
import AdminSetupPage from './pages/AdminSetupPage';

import VerificationStatusPage from './pages/VerificationStatusPage';
import SubscriptionPlansPage from './pages/SubscriptionPlansPage';
import MakePaymentPage from './pages/MakePaymentPage';
import AdminAuditPage from './pages/AdminAuditPage';
import AzureAIDemoPage from './pages/AzureAIDemoPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<PartnerSignInPage />} />
          <Route path="/signup" element={<PartnerSignUpPage />} />
          <Route path="/document-upload" element={<DocumentUploadPage />} />
          <Route path="/verification-pending" element={<VerificationPendingPage />} />
          <Route path="/verification-status" element={<VerificationStatusPage />} />
          <Route path="/subscription-plans" element={<SubscriptionPlansPage />} />
          <Route path="/make-payment" element={<MakePaymentPage />} />
          <Route path="/subscription-required" element={<SubscriptionRequiredPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/setup" element={<AdminSetupPage />} />
          <Route path="/admin" element={<AdminDashboard />}>
            <Route path="dashboard" element={<AdminDashboardHome />} />
            <Route path="waste-requests" element={<AdminWasteRequestsPage />} />
            <Route path="partners" element={<AdminPartnersPage />} />
            <Route path="documents" element={<AdminDocumentVerificationPage />} />
            <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
            <Route path="rewards" element={<AdminRewardsPage />} />
            <Route path="vouchers" element={<AdminVouchersPage />} />
            <Route path="scheduling" element={<AdminSchedulingPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
            <Route path="audit" element={<AdminAuditPage />} />
          </Route>
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
    </AuthProvider>
  );
}

export default App;