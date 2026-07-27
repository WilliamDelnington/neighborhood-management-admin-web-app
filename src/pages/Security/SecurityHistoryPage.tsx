import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminGuard from "@components/auth/AdminGuard";
import RecordHistoryPage from "@components/admin/RecordHistoryPage";
import { SECURITY_AUDIT_ACTION_LABEL } from "@constants/domain";
import { SecurityRecord } from "@dts";
import { fetchSecurityAuditLogs, fetchSecurityRecordById } from "@service/securityApi";

const houseText = (h: SecurityRecord["houseId"]) => {
    if (!h) return "";
    if (typeof h === "string") return h;
    return `${h.code} — ${h.address}`;
};

const SecurityHistoryPage: React.FC = () => (
    <AdminGuard permissions={["security.read"]}>
        <SecurityHistoryContent />
    </AdminGuard>
);

const SecurityHistoryContent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [record, setRecord] = useState<SecurityRecord | null>(null);

    useEffect(() => {
        if (!id) return;
        fetchSecurityRecordById(id)
            .then(setRecord)
            .catch(() => setRecord(null));
    }, [id]);

    if (!id) return null;

    return (
        <RecordHistoryPage
            title={`Lịch sử chỉnh sửa${
                record ? ` — ${houseText(record.houseId)}` : ""
            }`}
            backTo="/security"
            fetchHistory={params => fetchSecurityAuditLogs(id, params)}
            actionLabels={SECURITY_AUDIT_ACTION_LABEL}
        />
    );
};

export default SecurityHistoryPage;
