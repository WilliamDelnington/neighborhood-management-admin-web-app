import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import SendRequestSheet from "@components/admin/SendRequestSheet";
import { usePermission } from "@store/authStore";
import { AppError, SurveyResults } from "@dts";
import {
    fetchSurveyDetail,
    fetchSurveyResults,
    updateSurvey,
} from "@service/surveyApi";

const BarRow: React.FC<{ label: string; count: number; max: number }> = ({
    label,
    count,
    max,
}) => (
    <div className="mb-3">
        <div className="mb-1 flex justify-between">
            <span className="flex-1 pr-2 text-xs">{label}</span>
            <span className="text-xs font-medium text-primary">{count}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-ng_10">
            <div
                className="h-2 rounded-full bg-primary"
                style={{
                    width: `${max > 0 ? Math.min(100, (count / max) * 100) : 0}%`,
                }}
            />
        </div>
    </div>
);

const SurveyResultsPage: React.FC = () => (
    <AdminGuard permissions={["surveys.read"]}>
        <SurveyResultsContent />
    </AdminGuard>
);

const SurveyResultsContent: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const canUpdate = usePermission("surveys.update");
    const canSendRequest = usePermission("requests.create");
    const [results, setResults] = useState<SurveyResults | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [summary, setSummary] = useState("");
    const [savingSummary, setSavingSummary] = useState(false);
    const [sendSheetOpen, setSendSheetOpen] = useState(false);

    const load = () => {
        if (!id) return;
        setLoading(true);
        setError(false);
        Promise.all([fetchSurveyResults(id), fetchSurveyDetail(id)])
            .then(([res, survey]) => {
                setResults(res);
                setSummary(survey.resultSummary || "");
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(load, [id]);

    const handleSaveSummary = async () => {
        if (!id) return;
        try {
            setSavingSummary(true);
            await updateSurvey(id, { resultSummary: summary.trim() || undefined });
            toast.success("Đã lưu nhận xét");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSavingSummary(false);
        }
    };

    return (
        <div>
            <div className="mb-4 flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate("/surveys")}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-semibold">Kết quả khảo sát</h1>
            </div>

            {loading && (
                <div className="rounded-lg border border-divider_01 bg-white p-6 shadow-sm">
                    <LoadingState />
                </div>
            )}
            {!loading && error && (
                <div className="rounded-lg border border-divider_01 bg-white p-6 shadow-sm">
                    <ErrorState onRetry={load} />
                </div>
            )}

            {!loading && !error && results && (
                <div className="flex flex-col gap-3">
                    <div className="rounded-lg border border-divider_01 bg-white p-4 shadow-sm">
                        <h2 className="text-base font-semibold">
                            {results.title}
                        </h2>
                        <p className="mt-1 text-xs text-text_2">
                            Tổng số lượt trả lời: {results.totalResponses}
                        </p>
                    </div>

                    {results.results.length === 0 && (
                        <div className="rounded-lg border border-divider_01 bg-white shadow-sm">
                            <EmptyState label="Chưa có câu hỏi nào" />
                        </div>
                    )}

                    {results.results.map(r => (
                        <div
                            key={r.questionId}
                            className="rounded-lg border border-divider_01 bg-white p-4 shadow-sm"
                        >
                            <h3 className="mb-3 text-sm font-semibold">
                                {r.question}
                            </h3>

                            {Object.keys(r.optionCounts || {}).length === 0 &&
                                r.otherTexts.length === 0 && (
                                    <p className="text-xs text-text_2">
                                        Chưa có câu trả lời
                                    </p>
                                )}

                            {Object.entries(r.optionCounts || {}).map(
                                ([option, count]) => (
                                    <BarRow
                                        key={option}
                                        label={option}
                                        count={count}
                                        max={Math.max(
                                            results.totalResponses,
                                            1,
                                        )}
                                    />
                                ),
                            )}

                            {r.otherTexts.length > 0 && (
                                <div className="mt-2">
                                    <p className="mb-2 text-xs font-medium text-text_2">
                                        Ý kiến khác
                                    </p>
                                    {r.otherTexts.map((text, idx) => (
                                        <p
                                            key={idx}
                                            className="mb-2 text-xs italic text-text_1"
                                        >
                                            “{text}”
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {(canUpdate || summary) && (
                        <div className="rounded-lg border border-divider_01 bg-white p-4 shadow-sm">
                            <Label className="mb-1.5 block">
                                Nhận xét / tổng hợp ý kiến
                            </Label>
                            {canUpdate ? (
                                <>
                                    <Textarea
                                        value={summary}
                                        onChange={e =>
                                            setSummary(e.target.value)
                                        }
                                        placeholder="Nhận xét thêm của Tổ về kết quả khảo sát này..."
                                    />
                                    <Button
                                        className="mt-2"
                                        size="sm"
                                        loading={savingSummary}
                                        onClick={handleSaveSummary}
                                    >
                                        Lưu nhận xét
                                    </Button>
                                </>
                            ) : (
                                <p className="text-sm">{summary}</p>
                            )}
                        </div>
                    )}

                    {canSendRequest && (
                        <Button
                            variant="outline"
                            onClick={() => setSendSheetOpen(true)}
                        >
                            Gửi báo cáo
                        </Button>
                    )}
                </div>
            )}

            {id && results && (
                <SendRequestSheet
                    open={sendSheetOpen}
                    onOpenChange={setSendSheetOpen}
                    lockedType="task"
                    relatedModel="Survey"
                    relatedId={id}
                    defaultTitle={`Báo cáo khảo sát: ${results.title}`}
                />
            )}
        </div>
    );
};

export default SurveyResultsPage;
