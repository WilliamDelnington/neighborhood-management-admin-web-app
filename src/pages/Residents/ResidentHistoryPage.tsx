import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminGuard from "@components/auth/AdminGuard";
import RecordHistoryPage from "@components/admin/RecordHistoryPage";
import { RESIDENT_AUDIT_ACTION_LABEL } from "@constants/domain";
import { ResidentRecord } from "@dts";
import {
    fetchResidentAuditLogs,
    fetchResidentRecordById,
} from "@service/residentApi";

const houseText = (h: ResidentRecord["houseId"]) => {
    if (!h) return "";
    if (typeof h === "string") return h;
    return `${h.code} — ${h.address}`;
};

const ResidentHistoryPage: React.FC = () => (
    <AdminGuard permissions={["residents.read"]}>
        <ResidentHistoryContent />
    </AdminGuard>
);

const ResidentHistoryContent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [record, setRecord] = useState<ResidentRecord | null>(null);

    useEffect(() => {
        if (!id) return;
        fetchResidentRecordById(id)
            .then(setRecord)
            .catch(() => setRecord(null));
    }, [id]);

    if (!id) return null;

    return (
        <RecordHistoryPage
            title={`Lịch sử chỉnh sửa${
                record ? ` — ${houseText(record.houseId)}` : ""
            }`}
            backTo="/residents"
            fetchHistory={params => fetchResidentAuditLogs(id, params)}
            actionLabels={RESIDENT_AUDIT_ACTION_LABEL}
        />
    );
};

export default ResidentHistoryPage;
