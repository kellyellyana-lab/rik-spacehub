import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { AppLayout } from './AppLayout';

// Faculty Pages
import { FacultyDashboard } from './FacultyDashboard';
import { FacilityDirectory } from './FacilityDirectory';
import { FacilityDetail } from './FacilityDetail';
import { NewReservationWizard } from './NewReservationWizard';
import { MyReservations } from './MyReservations';
import { BookingHistory } from './BookingHistory';
import { SharedCalendar } from './SharedCalendar';

// Admin Pages
import { AdminDashboard } from './AdminDashboard';
import { RequestInbox } from './RequestInbox';
import { FacilityManager } from './FacilityManager';
import { EquipmentManager } from './EquipmentManager';
import { ReportsAnalytics } from './ReportsAnalytics';

// Dynamic Home Router: Shows Admin Dashboard for TU Admin, or Faculty Dashboard for Faculty User
const DynamicHome: React.FC = () => {
  const { isTUAdmin } = useAuth();
  return isTUAdmin ? <AdminDashboard /> : <FacultyDashboard />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            {/* 1. Dashboard (Dynamic for role) */}
            <Route index element={<DynamicHome />} />

            {/* 3. Explore Facilities */}
            <Route path="facilities" element={<FacilityDirectory />} />

            {/* 4. Room Details */}
            <Route path="facilities/:id" element={<FacilityDetail />} />

            {/* 5. Reservation Form */}
            <Route path="reservations/new" element={<NewReservationWizard />} />

            {/* 6. My Requests */}
            <Route path="my-reservations" element={<MyReservations />} />

            {/* 7. Booking History */}
            <Route path="booking-history" element={<BookingHistory />} />

            {/* 2. Room Calendar */}
            <Route path="calendar" element={<SharedCalendar />} />

            {/* 8. Admin Dashboard */}
            <Route path="admin" element={<AdminDashboard />} />

            {/* 9. Reservation Management */}
            <Route path="admin/requests" element={<RequestInbox />} />

            {/* 10. Room Management */}
            <Route path="admin/facilities" element={<FacilityManager />} />

            {/* 11. Equipment Inventory */}
            <Route path="admin/equipment" element={<EquipmentManager />} />

            {/* 12. Reports & Analytics */}
            <Route path="admin/reports" element={<ReportsAnalytics />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
