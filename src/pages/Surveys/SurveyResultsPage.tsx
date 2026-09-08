import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
    ArrowLeft,
    BarChart3,
    MessageSquare,
    Send,
    Users,
} from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import { Badge } from "@components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@components/ui/card";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import SendRequestSheet from "@components/admin/SendRequestSheet";
import { usePermission } from "@store/authStore";
import { AppError, SurveyResults } from "@dts";
import {
    fetchSurveyDetail,
    fetchSurveyResults,
    updateSurvey,
} from "@service/surveyApi";

// Hang mau accent dung tuan tu cho tung lua chon trong 1 cau hoi, giup phan
// biet cac cot ma khong can nho theo thu tu - lap lai neu nhieu hon 6 lua chon.
const BAR_COLORS = [
    "bg-primary",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-violet-500",
    "bg-rose-500",
    "bg-cyan-500",
];

const BarRow: React.FC<{
    label: string;
    count: number;
    total: number;
    color: string;
    isTop: boolean;
}> = ({ label, count, total, color, isTop }) => {
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className="mb-3 last:mb-0">
            <div className="mb-1 flex items-center justify-between gap-2">
                <span
                    className={`flex-1 truncate text-sm ${isTop ? "font-medium" : ""}`}
                >
                    {label}
                </span>
                <span className="shrink-0 text-xs text-text_2">
                    <span
                        className={`font-semibold ${isTop ? "text-primary" : "text-text_1"}`}
                    >
                        {count}
                    </span>{" "}
                    ({percent}%)
                </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-ng_10">
                <div
                    className={`h-2.5 rounded-full ${color} transition-all`}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
};

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
        <div className="mx-auto max-w-4xl">
            <div className="mb-5 flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate("/surveys")}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-lg font-semibold">Kết quả khảo sát</h1>
                    <p className="text-sm text-text_2">
                        Thống kê câu trả lời theo từng câu hỏi.
                    </p>
                </div>
            </div>

            {loading && (
                <Card className="p-6">
                    <LoadingState />
                </Card>
            )}
            {!loading && error && (
                <Card className="p-6">
                    <ErrorState onRetry={load} />
                </Card>
            )}

            {!loading && !error && results && (
                <div className="flex flex-col gap-4">
                    <Card>
                        <CardContent className="flex items-center justify-between gap-3 p-4">
                            <div className="min-w-0">
                                <h2 className="truncate text-base font-semibold">
                                    {results.title}
                                </h2>
                                <p className="mt-0.5 text-xs text-text_2">
                                    {results.results.length} câu hỏi
                                </p>
                            </div>
                            <Badge
                                tone="blue"
                                className="flex shrink-0 items-center gap-1.5 px-3"
                            >
                                <Users className="h-3.5 w-3.5" />
                                {results.totalResponses} lượt trả lời
                            </Badge>
                        </CardContent>
                    </Card>

                    {results.results.length === 0 && (
                        <Card>
                            <EmptyState label="Chưa có câu hỏi nào" />
                        </Card>
                    )}

                    {results.results.map((r, index) => {
                        const optionEntries = Object.entries(
                            r.optionCounts || {},
                        );
                        const maxCount = optionEntries.reduce(
                            (max, [, count]) => Math.max(max, count),
                            0,
                        );
                        const isEmpty =
                            optionEntries.length === 0 &&
                            r.otherTexts.length === 0;

                        return (
                            <Card key={r.questionId}>
                                <CardHeader className="flex-row items-start gap-3 space-y-0">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ng_10 text-xs font-semibold text-text_2">
                                        {index + 1}
                                    </span>
                                    <div className="flex-1">
                                        <CardTitle className="text-sm">
                                            {r.question}
                                        </CardTitle>
                                        {!isEmpty && (
                                            <CardDescription className="mt-0.5 flex items-center gap-1">
                                                <BarChart3 className="h-3.5 w-3.5" />
                                                {optionEntries.length > 0
                                                    ? `${optionEntries.reduce((s, [, c]) => s + c, 0)} lượt chọn`
                                                    : `${r.otherTexts.length} ý kiến`}
                                            </CardDescription>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {isEmpty && (
                                        <p className="text-sm text-text_2">
                                            Chưa có câu trả lời
                                        </p>
                                    )}

                                    {optionEntries.map(
                                        ([option, count], optIndex) => (
                                            <BarRow
                                                key={option}
                                                label={option}
                                                count={count}
                                                total={results.totalResponses}
                                                color={
                                                    BAR_COLORS[
                                                        optIndex %
                                                            BAR_COLORS.length
                                                    ]
                                                }
                                                isTop={
                                                    count === maxCount &&
                                                    maxCount > 0
                                                }
                                            />
                                        ),
                                    )}

                                    {r.otherTexts.length > 0 && (
                                        <div
                                            className={
                                                optionEntries.length > 0
                                                    ? "mt-4 border-t border-divider_01 pt-3"
                                                    : ""
                                            }
                                        >
                                            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-text_2">
                                                <MessageSquare className="h-3.5 w-3.5" />
                                                Ý kiến khác (
                                                {r.otherTexts.length})
                                            </p>
                                            <div className="flex flex-col gap-2">
                                                {r.otherTexts.map(
                                                    (text, idx) => (
                                                        <p
                                                            key={idx}
                                                            className="rounded-lg bg-ng_10 p-2.5 text-sm italic text-text_1"
                                                        >
                                                            “{text}”
                                                        </p>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}

                    {(canUpdate || summary) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">
                                    Nhận xét / tổng hợp ý kiến
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {canUpdate ? (
                                    <>
                                        <Label className="sr-only">
                                            Nhận xét / tổng hợp ý kiến
                                        </Label>
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
                            </CardContent>
                        </Card>
                    )}

                    {canSendRequest && (
                        <div className="flex justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setSendSheetOpen(true)}
                            >
                                <Send className="mr-1.5 h-4 w-4" />
                                Gửi báo cáo
                            </Button>
                        </div>
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
