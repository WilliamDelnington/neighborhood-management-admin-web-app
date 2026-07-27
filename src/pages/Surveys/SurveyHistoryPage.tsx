import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminGuard from "@components/auth/AdminGuard";
import RecordHistoryPage from "@components/admin/RecordHistoryPage";
import { SURVEY_AUDIT_ACTION_LABEL } from "@constants/domain";
import { Survey } from "@dts";
import { fetchSurveyAuditLogs, fetchSurveyDetail } from "@service/surveyApi";

const SurveyHistoryPage: React.FC = () => (
    <AdminGuard permissions={["surveys.update"]}>
        <SurveyHistoryContent />
    </AdminGuard>
);

const SurveyHistoryContent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [survey, setSurvey] = useState<Survey | null>(null);

    useEffect(() => {
        if (!id) return;
        fetchSurveyDetail(id)
            .then(setSurvey)
            .catch(() => setSurvey(null));
    }, [id]);

    if (!id) return null;

    return (
        <RecordHistoryPage
            title={`Lịch sử chỉnh sửa${survey ? ` — ${survey.title}` : ""}`}
            backTo={`/surveys/${id}/edit`}
            fetchHistory={params => fetchSurveyAuditLogs(id, params)}
            actionLabels={SURVEY_AUDIT_ACTION_LABEL}
        />
    );
};

export default SurveyHistoryPage;
