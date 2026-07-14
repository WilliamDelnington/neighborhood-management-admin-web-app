import React, { Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@store/authStore";
import { fetchMe } from "@service/authApi";
import AdminGuard from "@components/auth/AdminGuard";
import AdminLayout from "@components/layout/AdminLayout";
import LoginPage from "@pages/Login/LoginPage";

const DashboardPage = React.lazy(
    () => import("@pages/Dashboard/DashboardPage"),
);
const HouseholdListPage = React.lazy(
    () => import("@pages/Households/HouseholdListPage"),
);
const HouseholdDetailPage = React.lazy(
    () => import("@pages/Households/HouseholdDetailPage"),
);
const CitizenListPage = React.lazy(
    () => import("@pages/Citizens/CitizenListPage"),
);
const ComplaintListPage = React.lazy(
    () => import("@pages/Complaints/ComplaintListPage"),
);
const ComplaintDetailPage = React.lazy(
    () => import("@pages/Complaints/ComplaintDetailPage"),
);
const PcccListPage = React.lazy(() => import("@pages/Pccc/PcccListPage"));
const SecurityListPage = React.lazy(
    () => import("@pages/Security/SecurityListPage"),
);
const MeetingListPage = React.lazy(
    () => import("@pages/Meetings/MeetingListPage"),
);
const MeetingFormPage = React.lazy(
    () => import("@pages/Meetings/MeetingFormPage"),
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
const FinanceListPage = React.lazy(
    () => import("@pages/Finance/FinanceListPage"),
);
const ReportsPage = React.lazy(() => import("@pages/Reports/ReportsPage"));
const SettingsPage = React.lazy(() => import("@pages/Settings/SettingsPage"));
const UserListPage = React.lazy(() => import("@pages/Users/UserListPage"));
const RoleListPage = React.lazy(() => import("@pages/Roles/RoleListPage"));

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
                                <AdminLayout />
                            </AdminGuard>
                        }
                    >
                        <Route path="/" element={<DashboardPage />} />
                        <Route
                            path="/households"
                            element={<HouseholdListPage />}
                        />
                        <Route
                            path="/households/:id"
                            element={<HouseholdDetailPage />}
                        />
                        <Route path="/citizens" element={<CitizenListPage />} />
                        <Route
                            path="/complaints"
                            element={<ComplaintListPage />}
                        />
                        <Route
                            path="/complaints/:id"
                            element={<ComplaintDetailPage />}
                        />
                        <Route path="/pccc" element={<PcccListPage />} />
                        <Route
                            path="/security"
                            element={<SecurityListPage />}
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
                        <Route path="/finance" element={<FinanceListPage />} />
                        <Route path="/reports" element={<ReportsPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/users" element={<UserListPage />} />
                        <Route path="/roles" element={<RoleListPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
};

export default App;
