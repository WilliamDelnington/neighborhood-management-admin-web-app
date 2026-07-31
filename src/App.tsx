import React, { Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@store/authStore";
import { fetchMe } from "@service/authApi";
import AdminGuard from "@components/auth/AdminGuard";
import RequireNeighborhoodAssignment from "@components/auth/RequireNeighborhoodAssignment";
import AdminLayout from "@components/layout/AdminLayout";
import LoginPage from "@pages/Login/LoginPage";

const DashboardPage = React.lazy(
    () => import("@pages/Dashboard/DashboardPage"),
);
const NeighborhoodListPage = React.lazy(
    () => import("@pages/Neighborhoods/NeighborhoodListPage"),
);
const NeighborhoodDetailPage = React.lazy(
    () => import("@pages/Neighborhoods/NeighborhoodDetailPage"),
);
const StreetListPage = React.lazy(
    () => import("@pages/Streets/StreetListPage"),
);
const StreetDetailPage = React.lazy(
    () => import("@pages/Streets/StreetDetailPage"),
);
const HouseListPage = React.lazy(
    () => import("@pages/Houses/HouseListPage"),
);
const HouseDetailPage = React.lazy(
    () => import("@pages/Houses/HouseDetailPage"),
);
const HouseHistoryPage = React.lazy(
    () => import("@pages/Houses/HouseHistoryPage"),
);
const HouseholdDetailPage = React.lazy(
    () => import("@pages/Households/HouseholdDetailPage"),
);
const BusinessDetailPage = React.lazy(
    () => import("@pages/Houses/BusinessDetailPage"),
);
const ComplaintListPage = React.lazy(
    () => import("@pages/Complaints/ComplaintListPage"),
);
const ComplaintDetailPage = React.lazy(
    () => import("@pages/Complaints/ComplaintDetailPage"),
);
const SupportTicketListPage = React.lazy(
    () => import("@pages/SupportTickets/SupportTicketListPage"),
);
const SupportTicketDetailPage = React.lazy(
    () => import("@pages/SupportTickets/SupportTicketDetailPage"),
);
const PcccListPage = React.lazy(() => import("@pages/Pccc/PcccListPage"));
const PcccHistoryPage = React.lazy(
    () => import("@pages/Pccc/PcccHistoryPage"),
);
const SecurityListPage = React.lazy(
    () => import("@pages/Security/SecurityListPage"),
);
const SecurityHistoryPage = React.lazy(
    () => import("@pages/Security/SecurityHistoryPage"),
);
const MeetingListPage = React.lazy(
    () => import("@pages/Meetings/MeetingListPage"),
);
const MeetingFormPage = React.lazy(
    () => import("@pages/Meetings/MeetingFormPage"),
);
const MeetingHistoryPage = React.lazy(
    () => import("@pages/Meetings/MeetingHistoryPage"),
);
const AnnouncementListPage = React.lazy(
    () => import("@pages/Announcements/AnnouncementListPage"),
);
const AnnouncementFormPage = React.lazy(
    () => import("@pages/Announcements/AnnouncementFormPage"),
);
const SurveyListPage = React.lazy(
    () => import("@pages/Surveys/SurveyListPage"),
);
const SurveyFormPage = React.lazy(
    () => import("@pages/Surveys/SurveyFormPage"),
);
const SurveyResultsPage = React.lazy(
    () => import("@pages/Surveys/SurveyResultsPage"),
);
const SurveyHistoryPage = React.lazy(
    () => import("@pages/Surveys/SurveyHistoryPage"),
);
const FinanceListPage = React.lazy(
    () => import("@pages/Finance/FinanceListPage"),
);
const ReportsPage = React.lazy(() => import("@pages/Reports/ReportsPage"));
const SettingsPage = React.lazy(() => import("@pages/Settings/SettingsPage"));
const UserListPage = React.lazy(() => import("@pages/Users/UserListPage"));
const RoleListPage = React.lazy(() => import("@pages/Roles/RoleListPage"));
const BusinessTypeListPage = React.lazy(
    () => import("@pages/BusinessTypes/BusinessTypeListPage"),
);
const BusinessListPage = React.lazy(
    () => import("@pages/Businesses/BusinessListPage"),
);
const DocumentTypeListPage = React.lazy(
    () => import("@pages/DocumentTypes/DocumentTypeListPage"),
);
const FileListPage = React.lazy(() => import("@pages/Files/FileListPage"));
const AuditLogListPage = React.lazy(
    () => import("@pages/AuditLogs/AuditLogListPage"),
);

const PageFallback = () => (
    <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-main" />
    </div>
);

const App: React.FC = () => {
    const token = useAuthStore(state => state.token);
    const setUser = useAuthStore(state => state.setUser);
    const setBootstrapping = useAuthStore(state => state.setBootstrapping);
    const logout = useAuthStore(state => state.logout);

    useEffect(() => {
        if (!token) {
            setBootstrapping(false);
            return;
        }
        fetchMe()
            .then(setUser)
            .catch(() => logout())
            .finally(() => setBootstrapping(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <BrowserRouter>
            <Toaster richColors position="top-right" />
            <Suspense fallback={<PageFallback />}>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                        element={
                            <AdminGuard permissions={["dashboard.read"]}>
                                <RequireNeighborhoodAssignment>
                                    <AdminLayout />
                                </RequireNeighborhoodAssignment>
                            </AdminGuard>
                        }
                    >
                        <Route path="/" element={<DashboardPage />} />
                        <Route
                            path="/neighborhoods"
                            element={<NeighborhoodListPage />}
                        />
                        <Route
                            path="/neighborhoods/:id"
                            element={<NeighborhoodDetailPage />}
                        />
                        <Route path="/streets" element={<StreetListPage />} />
                        <Route
                            path="/streets/:id"
                            element={<StreetDetailPage />}
                        />
                        <Route path="/houses" element={<HouseListPage />} />
                        <Route
                            path="/houses/:houseId"
                            element={<HouseDetailPage />}
                        />
                        <Route
                            path="/houses/:houseId/history"
                            element={<HouseHistoryPage />}
                        />
                        <Route
                            path="/houses/:houseId/households/:id"
                            element={<HouseholdDetailPage />}
                        />
                        <Route
                            path="/houses/:houseId/businesses/:businessId"
                            element={<BusinessDetailPage />}
                        />
                        <Route
                            path="/complaints"
                            element={<ComplaintListPage />}
                        />
                        <Route
                            path="/complaints/:id"
                            element={<ComplaintDetailPage />}
                        />
                        <Route
                            path="/support-tickets"
                            element={<SupportTicketListPage />}
                        />
                        <Route
                            path="/support-tickets/:id"
                            element={<SupportTicketDetailPage />}
                        />
                        <Route path="/pccc" element={<PcccListPage />} />
                        <Route
                            path="/pccc/:id/history"
                            element={<PcccHistoryPage />}
                        />
                        <Route
                            path="/security"
                            element={<SecurityListPage />}
                        />
                        <Route
                            path="/security/:id/history"
                            element={<SecurityHistoryPage />}
                        />
                        <Route path="/meetings" element={<MeetingListPage />} />
                        <Route
                            path="/meetings/create"
                            element={<MeetingFormPage />}
                        />
                        <Route
                            path="/meetings/:id/edit"
                            element={<MeetingFormPage />}
                        />
                        <Route
                            path="/meetings/:id/history"
                            element={<MeetingHistoryPage />}
                        />
                        <Route
                            path="/announcements"
                            element={<AnnouncementListPage />}
                        />
                        <Route
                            path="/announcements/create"
                            element={<AnnouncementFormPage />}
                        />
                        <Route
                            path="/announcements/:id/edit"
                            element={<AnnouncementFormPage />}
                        />
                        <Route path="/surveys" element={<SurveyListPage />} />
                        <Route
                            path="/surveys/create"
                            element={<SurveyFormPage />}
                        />
                        <Route
                            path="/surveys/:id/edit"
                            element={<SurveyFormPage />}
                        />
                        <Route
                            path="/surveys/:id/results"
                            element={<SurveyResultsPage />}
                        />
                        <Route
                            path="/surveys/:id/history"
                            element={<SurveyHistoryPage />}
                        />
                        <Route path="/files" element={<FileListPage />} />
                        <Route path="/finance" element={<FinanceListPage />} />
                        <Route path="/reports" element={<ReportsPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/users" element={<UserListPage />} />
                        <Route path="/roles" element={<RoleListPage />} />
                        <Route
                            path="/businesses"
                            element={<BusinessListPage />}
                        />
                        <Route
                            path="/business-types"
                            element={<BusinessTypeListPage />}
                        />
                        <Route
                            path="/document-types"
                            element={<DocumentTypeListPage />}
                        />
                        <Route
                            path="/audit-logs"
                            element={<AuditLogListPage />}
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
};

export default App;
