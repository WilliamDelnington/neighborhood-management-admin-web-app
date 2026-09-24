import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BarChart3, Pencil } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { LoadingState, ErrorState } from "@components/admin/DataStates";
import { usePermission } from "@store/authStore";
import {
    LOAI_CAU_HOI_KHAO_SAT_LABEL,
    TRANG_THAI_KHAO_SAT_LABEL,
    TRANG_THAI_KHAO_SAT_TONE,
} from "@constants/domain";
import { SurveyOverview } from "@dts";
import { fetchSurveyOverview } from "@service/surveyApi";
import SurveyRespondDialog from "./SurveyRespondDialog";
import {
    SurveyStatusToggleButton,
    surveyCoEditorNames,
    surveyCreatorName,
    surveyTargetGroups,
} from "./surveyShared";

const formatDateTime = (value?: string): string =>
    value ? new Date(value).toLocaleString("vi-VN") : "—";

const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({
    label,
    children,
}) => (
    <div className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[180px_1fr] sm:gap-4">
        <div className="text-sm text-text_2">{label}</div>
        <div className="text-sm">{children}</div>
    </div>
);

const SurveyDetailPage: React.FC = () => (
    <AdminGuard permissions={["surveys.read"]}>
        <SurveyDetailContent />
    </AdminGuard>
);

/**
 * Trang chi tiet (chi xem) khao sat - moi nguoi vao duoc man khao sat va thay
 * khao sat nay deu mo duoc (nguoi tao/dong chu bien, doi tuong tra loi, hoac
 * nguoi quan ly khong gioi han pham vi). Sua noi dung van o /surveys/:id/edit,
 * chi danh cho nguoi tao/dong chu bien.
 */
const SurveyDetailContent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const hasUpdatePermission = usePermission("surveys.update");
    const canPublish = usePermission("surveys.publish");
    const canRespond = usePermission("surveys.respond");

    const [survey, setSurvey] = useState<SurveyOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [responding, setResponding] = useState(false);

    const load = () => {
        if (!id) return;
        setLoading(true);
        setError(false);
        fetchSurveyOverview(id)
            .then(setSurvey)
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(load, [id]);

    const header = (
        <div className="mb-4 flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/surveys")}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold">Chi tiết khảo sát</h1>
        </div>
    );

    if (loading) {
        return (
            <div>
                {header}
                <LoadingState />
            </div>
        );
    }
    if (error || !survey) {
        return (
            <div>
                {header}
                <ErrorState onRetry={load} />
            </div>
        );
    }

    const targetGroups = surveyTargetGroups(survey);
    const coEditors = surveyCoEditorNames(survey);
    const canAnswer =
        canRespond &&
        survey.status === "dang_mo" &&
        survey.isEligible &&
        !survey.hasResponded;

    return (
        <div>
            {header}

            <Card className="mb-4">
                <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0">
                    <div className="min-w-0">
                        <CardTitle className="text-base">{survey.title}</CardTitle>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge tone={TRANG_THAI_KHAO_SAT_TONE[survey.status]}>
                                {TRANG_THAI_KHAO_SAT_LABEL[survey.status]}
                            </Badge>
                            {survey.isEligible &&
                                (survey.hasResponded ? (
                                    <Badge tone="green">Bạn đã trả lời</Badge>
                                ) : (
                                    <Badge tone="gray">Bạn thuộc đối tượng khảo sát</Badge>
                                ))}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {survey.canEdit && hasUpdatePermission && (
                            <Button
                                variant="outline"
                                onClick={() => navigate(`/surveys/${survey._id}/edit`)}
                            >
                                <Pencil className="mr-1 h-4 w-4" />
                                Chỉnh sửa
                            </Button>
                        )}
                        {survey.canEdit && (
                            <Button
                                variant="outline"
                                onClick={() => navigate(`/surveys/${survey._id}/results`)}
                            >
                                <BarChart3 className="mr-1 h-4 w-4" />
                                Kết quả
                            </Button>
                        )}
                        {canAnswer && (
                            <Button variant="outline" onClick={() => setResponding(true)}>
                                Trả lời
                            </Button>
                        )}
                        {canPublish && survey.canManageStatus && (
                            <SurveyStatusToggleButton
                                survey={survey}
                                isCreatorOrCoEditor={survey.isCreatorOrCoEditor}
                                onChanged={load}
                                size="default"
                            />
                        )}
                    </div>
                </CardHeader>
                <CardContent className="divide-y divide-divider_01">
                    {survey.description && (
                        <InfoRow label="Mô tả">
                            <span className="whitespace-pre-line">{survey.description}</span>
                        </InfoRow>
                    )}
                    <InfoRow label="Người tạo">{surveyCreatorName(survey)}</InfoRow>
                    <InfoRow label="Đồng chủ biên">
                        {coEditors.length > 0 ? coEditors.join(", ") : "—"}
                    </InfoRow>
                    <InfoRow label="Đối tượng khảo sát">
                        {survey.eligibleAll && "Tất cả người dùng"}
                        {!survey.eligibleAll && targetGroups.length === 0 && "—"}
                        {!survey.eligibleAll && targetGroups.length > 0 && (
                            <div className="space-y-1">
                                {targetGroups.map(g => (
                                    <div key={g.label}>
                                        <span className="text-text_2">{g.label}: </span>
                                        {g.values.join(", ")}
                                    </div>
                                ))}
                            </div>
                        )}
                    </InfoRow>
                    <InfoRow label="Ngày mở">{formatDateTime(survey.openDate)}</InfoRow>
                    <InfoRow label="Ngày đóng">{formatDateTime(survey.closeDate)}</InfoRow>
                    <InfoRow label="Số lượt trả lời">{survey.responseCount}</InfoRow>
                    <InfoRow label="Ngày tạo">{formatDateTime(survey.createdAt)}</InfoRow>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">
                        Câu hỏi ({survey.questions.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {survey.questions.map((q, index) => (
                        <div
                            key={q._id || index}
                            className="rounded-lg border border-divider_01 p-3"
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium">
                                    {index + 1}. {q.question}
                                </span>
                                <Badge tone="gray">
                                    {LOAI_CAU_HOI_KHAO_SAT_LABEL[q.type]}
                                </Badge>
                                {q.required && <Badge tone="red">Bắt buộc</Badge>}
                            </div>
                            {q.options.length > 0 && (
                                <ul className="mt-2 list-disc space-y-0.5 pl-6 text-sm text-text_2">
                                    {q.options.map(option => (
                                        <li key={option}>{option}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>

            <SurveyRespondDialog
                survey={responding ? survey : null}
                onOpenChange={open => {
                    if (!open) {
                        setResponding(false);
                        load();
                    }
                }}
            />
        </div>
    );
};

export default SurveyDetailPage;
