import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminGuard from "@components/auth/AdminGuard";
import RecordHistoryPage from "@components/admin/RecordHistoryPage";
import { PCCC_AUDIT_ACTION_LABEL } from "@constants/domain";
import { PcccCheck } from "@dts";
import { fetchPcccAuditLogs, fetchPcccCheckById } from "@service/pcccApi";

const houseText = (h: PcccCheck["houseId"]) => {
    if (!h) return "";
    if (typeof h === "string") return h;
    return `${h.code} — ${h.address}`;
};

const PcccHistoryPage: React.FC = () => (
    <AdminGuard permissions={["pccc.read"]}>
        <PcccHistoryContent />
    </AdminGuard>
);

const PcccHistoryContent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [check, setCheck] = useState<PcccCheck | null>(null);

    useEffect(() => {
        if (!id) return;
        fetchPcccCheckById(id)
            .then(setCheck)
            .catch(() => setCheck(null));
    }, [id]);

    if (!id) return null;

    return (
        <RecordHistoryPage
            title={`Lịch sử chỉnh sửa${
                check ? ` — ${houseText(check.houseId)}` : ""
            }`}
            backTo="/pccc"
            fetchHistory={params => fetchPcccAuditLogs(id, params)}
            actionLabels={PCCC_AUDIT_ACTION_LABEL}
        />
    );
};

export default PcccHistoryPage;
