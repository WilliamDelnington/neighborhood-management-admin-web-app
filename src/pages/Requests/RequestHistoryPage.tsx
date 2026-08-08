import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminGuard from "@components/auth/AdminGuard";
import RecordHistoryPage from "@components/admin/RecordHistoryPage";
import { REQUEST_AUDIT_ACTION_LABEL } from "@constants/domain";
import { RequestItem } from "@dts";
import { fetchRequestAuditLogs, fetchRequestById } from "@service/requestApi";

const RequestHistoryPage: React.FC = () => (
    <AdminGuard permissions={["requests.read"]}>
        <RequestHistoryContent />
    </AdminGuard>
);

const RequestHistoryContent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [request, setRequest] = useState<RequestItem | null>(null);

    useEffect(() => {
        if (!id) return;
        fetchRequestById(id)
            .then(setRequest)
            .catch(() => setRequest(null));
    }, [id]);

    if (!id) return null;

    return (
        <RecordHistoryPage
            title={`Lịch sử chỉnh sửa${request ? ` — ${request.title}` : ""}`}
            backTo="/requests"
            fetchHistory={params => fetchRequestAuditLogs(id, params)}
            actionLabels={REQUEST_AUDIT_ACTION_LABEL}
        />
    );
};

export default RequestHistoryPage;
