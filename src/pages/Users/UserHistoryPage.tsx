import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminGuard from "@components/auth/AdminGuard";
import RecordHistoryPage from "@components/admin/RecordHistoryPage";
import { USER_AUDIT_ACTION_LABEL } from "@constants/domain";
import { User } from "@dts";
import { fetchUserAuditLogs, fetchUserById } from "@service/userApi";

const UserHistoryPage: React.FC = () => (
    <AdminGuard permissions={["users.read"]}>
        <UserHistoryContent />
    </AdminGuard>
);

const UserHistoryContent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        if (!id) return;
        fetchUserById(id)
            .then(setUser)
            .catch(() => setUser(null));
    }, [id]);

    if (!id) return null;

    return (
        <RecordHistoryPage
            title={`Lịch sử chỉnh sửa${user ? ` — ${user.displayName}` : ""}`}
            backTo={`/users/${id}`}
            fetchHistory={params => fetchUserAuditLogs(id, params)}
            actionLabels={USER_AUDIT_ACTION_LABEL}
        />
    );
};

export default UserHistoryPage;
