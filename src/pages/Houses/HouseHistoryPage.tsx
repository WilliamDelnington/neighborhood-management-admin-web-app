import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminGuard from "@components/auth/AdminGuard";
import RecordHistoryPage from "@components/admin/RecordHistoryPage";
import { HOUSE_AUDIT_ACTION_LABEL } from "@constants/domain";
import { House } from "@dts";
import { fetchHouseAuditLogs, fetchHouseById } from "@service/houseApi";

const HouseHistoryPage: React.FC = () => (
    <AdminGuard permissions={["houses.read"]}>
        <HouseHistoryContent />
    </AdminGuard>
);

const HouseHistoryContent: React.FC = () => {
    const { houseId } = useParams<{ houseId: string }>();
    const [house, setHouse] = useState<House | null>(null);

    useEffect(() => {
        if (!houseId) return;
        fetchHouseById(houseId)
            .then(setHouse)
            .catch(() => setHouse(null));
    }, [houseId]);

    if (!houseId) return null;

    return (
        <RecordHistoryPage
            title={`Lịch sử chỉnh sửa${house ? ` — Nhà số ${house.code}` : ""}`}
            backTo={`/houses/${houseId}`}
            fetchHistory={params => fetchHouseAuditLogs(houseId, params)}
            actionLabels={HOUSE_AUDIT_ACTION_LABEL}
        />
    );
};

export default HouseHistoryPage;
