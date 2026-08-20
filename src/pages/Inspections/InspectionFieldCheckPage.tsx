import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Camera, LocateFixed, Save, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import AdminGuard from "@components/auth/AdminGuard";
import { LoadingState, ErrorState } from "@components/admin/DataStates";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Checkbox } from "@components/ui/checkbox";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import { resolveAssetUrl } from "@constants/common";
import type {
    AppError,
    InspectionCampaign,
    InspectionOutcome,
    InspectionResult,
    InspectionTarget,
} from "@dts";
import { usePermission } from "@store/authStore";
import {
    createInspectionResult,
    fetchInspectionResult,
    fetchInspectionTarget,
    transitionInspectionResult,
    updateInspectionResult,
    uploadInspectionEvidence,
} from "@service/inspectionApi";

const OUTCOME_LABEL: Record<InspectionOutcome, string> = {
    PASS: "Đạt",
    FAIL: "Chưa đạt",
    NEEDS_SUPPLEMENT: "Cần bổ sung",
};

const booleanSelectValue = (value: unknown): string | undefined => {
    if (value === true) return "true";
    if (value === false) return "false";
    return undefined;
};

const InspectionFieldCheckPage: React.FC = () => (
    <AdminGuard permissions={["inspections.read"]}>
        <InspectionFieldCheckContent />
    </AdminGuard>
);

const InspectionFieldCheckContent: React.FC = () => {
    const { targetId = "" } = useParams();
    const navigate = useNavigate();
    const canExecute = usePermission("inspections.execute");
    const canVerify = usePermission("inspections.verify");
    const fileRef = useRef<HTMLInputElement>(null);
    const [target, setTarget] = useState<InspectionTarget | null>(null);
    const [campaign, setCampaign] = useState<InspectionCampaign | null>(null);
    const [result, setResult] = useState<InspectionResult | null>(null);
    const [answers, setAnswers] = useState<Record<string, unknown>>({});
    const [note, setNote] = useState("");
    const [reviewNote, setReviewNote] = useState("");
    const [outcome, setOutcome] = useState<InspectionOutcome | "">("");
    const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [working, setWorking] = useState(false);

    const hydrateResult = (data: InspectionResult) => {
        setResult(data);
        setAnswers(Object.fromEntries(data.answers.map(answer => [answer.checklistItemId, answer.value])));
        setNote(data.note || "");
        setOutcome(data.outcome || "");
        setReviewNote(data.reviewNote || "");
        setGps(data.gpsLat !== undefined && data.gpsLng !== undefined
            ? { lat: data.gpsLat, lng: data.gpsLng }
            : null);
    };

    const load = async () => {
        setLoading(true);
        setError(false);
        try {
            const targetData = await fetchInspectionTarget(targetId);
            setTarget(targetData);
            setCampaign(targetData.campaign || null);
            if (targetData.result?._id) {
                hydrateResult(await fetchInspectionResult(targetData.result._id));
            } else {
                setResult(null);
                setAnswers({});
                setNote("");
                setOutcome("");
                setGps(null);
            }
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetId]);

    const mutable = canExecute && campaign?.status === "ACTIVE" &&
        (!result || ["DRAFT", "FIELD_CHECK_REQUIRED"].includes(result.status));
    const canReview = canVerify && campaign?.status === "ACTIVE" &&
        !!result && ["SUBMITTED", "FIELD_CHECK_REQUIRED"].includes(result.status);
    const house = target && typeof target.houseId !== "string" ? target.houseId : null;

    const answerPayload = useMemo(() => Object.entries(answers)
        .filter(([, value]) => value !== undefined && value !== "")
        .map(([checklistItemId, value]) => ({ checklistItemId, value })), [answers]);

    const saveDraft = async (): Promise<InspectionResult> => {
        if (!target) throw new Error("Không tìm thấy Nhà số");
        const payload = {
            answers: answerPayload,
            gpsLat: gps?.lat,
            gpsLng: gps?.lng,
            note: note.trim() || undefined,
            outcome: outcome || undefined,
        };
        const saved = result
            ? await updateInspectionResult(result._id, payload)
            : await createInspectionResult({ targetId: target._id, ...payload });
        hydrateResult(saved);
        return saved;
    };

    const handleSave = async () => {
        try {
            setWorking(true);
            await saveDraft();
            toast.success("Đã lưu bản nháp");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setWorking(false);
        }
    };

    const handleSubmit = async () => {
        try {
            setWorking(true);
            const saved = await saveDraft();
            hydrateResult(await transitionInspectionResult(saved._id, "submit"));
            toast.success("Đã gửi kết quả để xác minh");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setWorking(false);
        }
    };

    const handleReview = async (
        action: "verify" | "request-revision" | "require-field-check",
    ) => {
        if (!result) return;
        if (action === "verify" && !outcome) {
            toast.error("Chọn kết luận Đạt, Chưa đạt hoặc Cần bổ sung trước khi xác minh");
            return;
        }
        if (action !== "verify" && !reviewNote.trim()) {
            toast.error("Nhập lý do hoặc nội dung cần bổ sung");
            return;
        }
        try {
            setWorking(true);
            hydrateResult(await transitionInspectionResult(result._id, action, {
                note: reviewNote.trim() || undefined,
                outcome: outcome || undefined,
            }));
            toast.success(action === "verify" ? "Đã xác minh kết quả" : "Đã cập nhật yêu cầu xử lý");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setWorking(false);
        }
    };

    const handleEvidence = async (file?: File) => {
        if (!file) return;
        try {
            setWorking(true);
            const saved = result || await saveDraft();
            await uploadInspectionEvidence(saved._id, file);
            hydrateResult(await fetchInspectionResult(saved._id));
            toast.success("Đã thêm minh chứng");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setWorking(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    const locate = () => {
        if (!navigator.geolocation) {
            toast.error("Thiết bị không hỗ trợ định vị");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            position => {
                setGps({ lat: position.coords.latitude, lng: position.coords.longitude });
                toast.success("Đã ghi nhận vị trí hiện tại");
            },
            () => toast.error("Không lấy được vị trí. Hãy kiểm tra quyền định vị."),
            { enableHighAccuracy: true, timeout: 12000 },
        );
    };

    if (loading) return <LoadingState label="Đang mở hồ sơ rà soát..." />;
    if (error || !target || !campaign) return <ErrorState onRetry={load} />;

    return (
        <div className="mx-auto max-w-3xl space-y-4 pb-24">
            <Button variant="ghost" className="px-0" onClick={() => navigate(`/inspections/${campaign._id}`)}>
                <ArrowLeft className="h-4 w-4" /> Quay lại chiến dịch
            </Button>

            <section className="rounded-lg border border-divider_01 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Nhà {house?.code || "—"}</h1>
                        <p className="mt-1 text-sm text-text_2">{house?.address || "—"}</p>
                        <p className="mt-2 text-sm font-medium">{campaign.name}</p>
                    </div>
                    <Badge>{result?.status || target.resultStatus}</Badge>
                </div>
                {result?.submittedBy === "HOUSE" && (
                    <p className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-primary">
                        Đây là kết quả Nhà số tự khai. Tổ có thể xác minh, yêu cầu bổ sung hoặc chuyển kiểm tra thực địa.
                    </p>
                )}
                {(campaign.status === "LOCKED" || campaign.status === "CLOSED") && (
                    <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                        Phường đã khóa chiến dịch. Kết quả chỉ còn chế độ xem.
                    </p>
                )}
            </section>

            <section className="rounded-lg border border-divider_01 bg-white p-5 shadow-sm">
                <h2 className="font-semibold">Checklist rà soát</h2>
                <div className="mt-4 space-y-5">
                    {campaign.checklistTemplate.map((item, index) => (
                        <div key={item.itemId}>
                            <Label className="mb-2 block">
                                {index + 1}. {item.label} {item.required && <span className="text-red-500">*</span>}
                            </Label>
                            {item.inputType === "BOOLEAN" && (
                                <Select
                                    disabled={!mutable}
                                    value={booleanSelectValue(answers[item.itemId])}
                                    onValueChange={value => setAnswers(current => ({ ...current, [item.itemId]: value === "true" }))}
                                >
                                    <SelectTrigger><SelectValue placeholder="Chọn Có / Không" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Có</SelectItem>
                                        <SelectItem value="false">Không</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                            {item.inputType === "TEXT" && (
                                <Textarea
                                    disabled={!mutable}
                                    value={String(answers[item.itemId] ?? "")}
                                    onChange={event => setAnswers(current => ({ ...current, [item.itemId]: event.target.value }))}
                                />
                            )}
                            {item.inputType === "NUMBER" && (
                                <Input
                                    type="number"
                                    disabled={!mutable}
                                    value={String(answers[item.itemId] ?? "")}
                                    onChange={event => setAnswers(current => ({
                                        ...current,
                                        [item.itemId]: event.target.value === "" ? "" : Number(event.target.value),
                                    }))}
                                />
                            )}
                            {item.inputType === "SINGLE_SELECT" && (
                                <Select
                                    disabled={!mutable}
                                    value={String(answers[item.itemId] ?? "") || undefined}
                                    onValueChange={value => setAnswers(current => ({ ...current, [item.itemId]: value }))}
                                >
                                    <SelectTrigger><SelectValue placeholder="Chọn câu trả lời" /></SelectTrigger>
                                    <SelectContent>
                                        {(item.options || []).map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                            {item.inputType === "MULTI_SELECT" && (
                                <div className="space-y-2 rounded-lg border border-divider_01 p-3">
                                    {(item.options || []).map(option => {
                                        const selected = Array.isArray(answers[item.itemId])
                                            ? (answers[item.itemId] as unknown[]).includes(option)
                                            : false;
                                        return (
                                            <label key={option} className="flex items-center gap-2 text-sm">
                                                <Checkbox
                                                    disabled={!mutable}
                                                    checked={selected}
                                                    onCheckedChange={checked => setAnswers(current => {
                                                        const values = Array.isArray(current[item.itemId])
                                                            ? [...(current[item.itemId] as string[])]
                                                            : [];
                                                        return {
                                                            ...current,
                                                            [item.itemId]: checked
                                                                ? [...values, option]
                                                                : values.filter(value => value !== option),
                                                        };
                                                    })}
                                                />
                                                {option}
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            <section className="rounded-lg border border-divider_01 bg-white p-5 shadow-sm">
                <h2 className="font-semibold">Ghi chú, kết luận và vị trí</h2>
                <div className="mt-4 space-y-4">
                    <div>
                        <Label htmlFor="inspection-note">Ghi chú hiện trường</Label>
                        <Textarea
                            id="inspection-note"
                            className="mt-2"
                            rows={4}
                            disabled={!mutable}
                            value={note}
                            onChange={event => setNote(event.target.value)}
                        />
                    </div>
                    <div>
                        <Label>Kết luận</Label>
                        <Select disabled={!mutable && !canReview} value={outcome || undefined} onValueChange={value => setOutcome(value as InspectionOutcome)}>
                            <SelectTrigger className="mt-2"><SelectValue placeholder="Chọn kết luận" /></SelectTrigger>
                            <SelectContent>
                                {Object.entries(OUTCOME_LABEL).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-2 rounded-lg bg-ng_10 p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-text_2">
                            {gps ? `${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)}` : "Chưa ghi nhận GPS"}
                        </div>
                        {mutable && <Button type="button" size="sm" variant="outline" onClick={locate}>
                            <LocateFixed className="h-4 w-4" /> Lấy vị trí
                        </Button>}
                    </div>
                </div>
            </section>

            <section className="rounded-lg border border-divider_01 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="font-semibold">Minh chứng</h2>
                        <p className="mt-1 text-xs text-text_2">JPG, PNG hoặc PDF; tối đa 10MB.</p>
                    </div>
                    {mutable && <>
                        <input
                            ref={fileRef}
                            className="hidden"
                            type="file"
                            accept="image/jpeg,image/png,application/pdf"
                            capture="environment"
                            onChange={event => handleEvidence(event.target.files?.[0])}
                        />
                        <Button variant="outline" loading={working} onClick={() => fileRef.current?.click()}>
                            <Camera className="h-4 w-4" /> Chụp / chọn tệp
                        </Button>
                    </>}
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {(result?.attachments || []).map(file => (
                        <a
                            key={file._id}
                            className="truncate rounded-lg border border-divider_01 p-3 text-sm text-primary hover:bg-blue-50"
                            href={resolveAssetUrl(file.url)}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {file.name}
                        </a>
                    ))}
                    {result && result.attachments.length === 0 && (
                        <p className="text-sm text-text_2">Chưa có minh chứng.</p>
                    )}
                </div>
            </section>

            {canReview && (
                <section className="rounded-lg border border-blue-100 bg-blue-50 p-5">
                    <h2 className="font-semibold text-primary">Xử lý kết quả tự khai / đã gửi</h2>
                    <Textarea
                        className="mt-3 bg-white"
                        rows={3}
                        placeholder="Ghi chú xác minh hoặc nội dung cần bổ sung"
                        value={reviewNote}
                        onChange={event => setReviewNote(event.target.value)}
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Button loading={working} onClick={() => handleReview("verify")}>
                            <ShieldCheck className="h-4 w-4" /> Xác minh
                        </Button>
                        {result?.status === "SUBMITTED" && <>
                            <Button variant="outline" loading={working} onClick={() => handleReview("request-revision")}>
                                Yêu cầu bổ sung
                            </Button>
                            <Button variant="outline" loading={working} onClick={() => handleReview("require-field-check")}>
                                Kiểm tra thực địa
                            </Button>
                        </>}
                    </div>
                </section>
            )}

            {mutable && (
                <div className="fixed inset-x-0 bottom-0 z-20 border-t border-divider_01 bg-white/95 p-3 backdrop-blur lg:left-64">
                    <div className="mx-auto flex max-w-3xl gap-2">
                        <Button className="flex-1" variant="outline" loading={working} onClick={handleSave}>
                            <Save className="h-4 w-4" /> Lưu nháp
                        </Button>
                        <Button className="flex-1" loading={working} onClick={handleSubmit}>
                            <Send className="h-4 w-4" /> Gửi kết quả
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InspectionFieldCheckPage;
