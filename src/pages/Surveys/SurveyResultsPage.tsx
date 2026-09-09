import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
    ArrowLeft,
    BarChart3,
    CalendarClock,
    ChevronLeft,
    ChevronRight,
    Eye,
    MessageSquare,
    Phone,
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
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import SendRequestSheet from "@components/admin/SendRequestSheet";
import { usePermission } from "@store/authStore";
import { AppError, SurveyIndividualResponse, SurveyResults } from "@dts";
import {
    fetchSurveyDetail,
    fetchSurveyIndividualResponses,
    fetchSurveyResults,
    updateSurvey,
} from "@service/surveyApi";

const formatDateTime = (value?: string) =>
    value ? new Date(value).toLocaleString("vi-VN") : "";

const getInitials = (name: string) =>
    name
        .trim()
        .split(/\s+/)
        .slice(-2)
        .map(part => part[0])
        .join("")
        .toUpperCase();

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
    const [individualResponses, setIndividualResponses] = useState<
        SurveyIndividualResponse[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [summary, setSummary] = useState("");
    const [savingSummary, setSavingSummary] = useState(false);
    const [sendSheetOpen, setSendSheetOpen] = useState(false);
    const [selectedResponseIndex, setSelectedResponseIndex] = useState<
        number | null
    >(null);

    const load = () => {
        if (!id) return;
        setLoading(true);
        setError(false);
        Promise.all([
            fetchSurveyResults(id),
            fetchSurveyDetail(id),
            fetchSurveyIndividualResponses(id),
        ])
            .then(([res, survey, responses]) => {
                setResults(res);
                setSummary(survey.resultSummary || "");
                setIndividualResponses(responses);
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

                    <Tabs defaultValue="summary">
                        <TabsList>
                            <TabsTrigger value="summary">
                                Tổng hợp
                            </TabsTrigger>
                            <TabsTrigger value="individual">
                                Từng người trả lời
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent
                            value="summary"
                            className="flex flex-col gap-4"
                        >
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
                        </TabsContent>

                        <TabsContent value="individual">
                            {individualResponses.length === 0 ? (
                                <Card>
                                    <EmptyState label="Chưa có ai trả lời" />
                                </Card>
                            ) : (
                                <Card>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>
                                                    Người trả lời
                                                </TableHead>
                                                <TableHead>
                                                    Số điện thoại
                                                </TableHead>
                                                <TableHead>
                                                    Thời gian gửi
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    &nbsp;
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {individualResponses.map(
                                                (resp, idx) => (
                                                    <TableRow
                                                        key={resp.responseId}
                                                    >
                                                        <TableCell className="font-medium">
                                                            {resp.displayName}
                                                        </TableCell>
                                                        <TableCell>
                                                            {resp.phone || "—"}
                                                        </TableCell>
                                                        <TableCell>
                                                            {formatDateTime(
                                                                resp.submittedAt,
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    setSelectedResponseIndex(
                                                                        idx,
                                                                    )
                                                                }
                                                            >
                                                                <Eye className="mr-1.5 h-3.5 w-3.5" />
                                                                Xem chi tiết
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>
                                </Card>
                            )}
                        </TabsContent>
                    </Tabs>

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

            {results && (
                <SurveyResponseDetailDialog
                    questions={results.results}
                    responses={individualResponses}
                    index={selectedResponseIndex}
                    onIndexChange={setSelectedResponseIndex}
                />
            )}
        </div>
    );
};

const SurveyResponseDetailDialog: React.FC<{
    questions: SurveyResults["results"];
    responses: SurveyIndividualResponse[];
    index: number | null;
    onIndexChange: (index: number | null) => void;
}> = ({ questions, responses, index, onIndexChange }) => {
    const response = index !== null ? responses[index] : null;
    const currentIndex = index ?? 0;

    return (
        <Dialog
            open={index !== null}
            onOpenChange={open => !open && onIndexChange(null)}
        >
            <DialogContent className="max-w-lg gap-0 p-0">
                {response && (
                    <>
                        <DialogHeader className="flex-row items-center gap-3 space-y-0 border-b border-divider_01 px-6 py-4 text-left">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                {getInitials(response.displayName)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <DialogTitle className="truncate text-base">
                                    {response.displayName}
                                </DialogTitle>
                                <DialogDescription className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                    {response.phone && (
                                        <span className="inline-flex items-center gap-1">
                                            <Phone className="h-3 w-3" />
                                            {response.phone}
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1">
                                        <CalendarClock className="h-3 w-3" />
                                        {formatDateTime(
                                            response.submittedAt,
                                        )}
                                    </span>
                                </DialogDescription>
                            </div>
                        </DialogHeader>

                        <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto px-6 py-4">
                            {questions.map((q, qIndex) => {
                                const answer = response.answers.find(
                                    a => a.questionId === q.questionId,
                                );
                                const parts = [
                                    ...(answer?.selectedOptions || []),
                                    ...(answer?.otherText
                                        ? [`Khác: ${answer.otherText}`]
                                        : []),
                                ];
                                return (
                                    <div
                                        key={q.questionId}
                                        className="rounded-lg border border-divider_01 p-3"
                                    >
                                        <div className="flex items-start gap-2">
                                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ng_10 text-[10px] font-semibold text-text_2">
                                                {qIndex + 1}
                                            </span>
                                            <p className="text-sm font-medium leading-snug">
                                                {q.question}
                                            </p>
                                        </div>
                                        {parts.length > 0 ? (
                                            <div className="ml-7 mt-2 flex flex-col gap-1.5">
                                                {parts.map(part => (
                                                    <p
                                                        key={part}
                                                        className="rounded-md border-l-2 border-primary bg-ng_10 px-2.5 py-1.5 text-sm text-text_1"
                                                    >
                                                        {part}
                                                    </p>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="ml-7 mt-2 rounded-md border border-dashed border-divider_02 px-2.5 py-1.5 text-sm italic text-text_2">
                                                Không trả lời
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <DialogFooter className="items-center justify-between gap-3 border-t border-divider_01 px-6 py-3 sm:justify-between">
                            <span className="text-xs font-medium text-text_2">
                                Phản hồi {currentIndex + 1}/{responses.length}
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={currentIndex === 0}
                                    onClick={() =>
                                        onIndexChange(
                                            Math.max(0, currentIndex - 1),
                                        )
                                    }
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={
                                        currentIndex === responses.length - 1
                                    }
                                    onClick={() =>
                                        onIndexChange(
                                            Math.min(
                                                responses.length - 1,
                                                currentIndex + 1,
                                            ),
                                        )
                                    }
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default SurveyResultsPage;
