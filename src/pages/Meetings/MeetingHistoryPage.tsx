import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminGuard from "@components/auth/AdminGuard";
import RecordHistoryPage from "@components/admin/RecordHistoryPage";
import { MEETING_AUDIT_ACTION_LABEL } from "@constants/domain";
import { Meeting } from "@dts";
import { fetchMeetingAuditLogs, fetchMeetingDetail } from "@service/meetingApi";

const MeetingHistoryPage: React.FC = () => (
    <AdminGuard permissions={["meetings.read"]}>
        <MeetingHistoryContent />
    </AdminGuard>
);

const MeetingHistoryContent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [meeting, setMeeting] = useState<Meeting | null>(null);

    useEffect(() => {
        if (!id) return;
        fetchMeetingDetail(id)
            .then(setMeeting)
            .catch(() => setMeeting(null));
    }, [id]);

    if (!id) return null;

    return (
        <RecordHistoryPage
            title={`Lịch sử chỉnh sửa${meeting ? ` — ${meeting.title}` : ""}`}
            backTo={`/meetings/${id}/edit`}
            fetchHistory={params => fetchMeetingAuditLogs(id, params)}
            actionLabels={MEETING_AUDIT_ACTION_LABEL}
        />
    );
};

export default MeetingHistoryPage;
