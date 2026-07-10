import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Label } from "@components/ui/label";
import { Checkbox } from "@components/ui/checkbox";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import StatCard from "@components/admin/StatCard";
import { DANG_KY_HOP_LABEL } from "@constants/domain";
import { AppError, DangKyHop, MeetingRegistration } from "@dts";
import {
    MeetingInput,
    createMeeting,
    fetchMeetingDetail,
    fetchMeetingRegistrations,
    updateMeeting,
} from "@service/meetingApi";

/** Chuyen ISO string sang dinh dang gia tri cho input[type=datetime-local]. */
const toDateTimeLocalValue = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
        d.getDate(),
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const registrantName = (r: MeetingRegistration) => {
    if (typeof r.userId === "string") return r.delegateName || r.userId;
    return r.userId?.displayName || r.delegateName || "Người dùng";
};

const MeetingFormPage: React.FC = () => (
    <AdminGuard roles={["admin", "secretary", "neighborhood_leader"]}>
        <MeetingFormContent />
    </AdminGuard>
);

const MeetingFormContent: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;

    const [loading, setLoading] = useState(isEdit);
    const [loadError, setLoadError] = useState(false);
    const [saving, setSaving] = useState(false);

    const [title, setTitle] = useState("");
    const [startTime, setStartTime] = useState("");
    const [location, setLocation] = useState("");
    const [content, setContent] = useState("");
    const [minutes, setMinutes] = useState("");
    const [published, setPublished] = useState(false);

    const [registrations, setRegistrations] = useState<MeetingRegistration[]>(
        [],
    );
    const [regLoading, setRegLoading] = useState(false);

    const loadDetail = () => {
        if (!id) return;
        setLoading(true);
        setLoadError(false);
        fetchMeetingDetail(id)
            .then(m => {
                setTitle(m.title);
                setStartTime(toDateTimeLocalValue(m.startTime));
                setLocation(m.location);
                setContent(m.content);
                setMinutes(m.minutes || "");
                setPublished(m.published);
            })
            .catch(() => setLoadError(true))
            .finally(() => setLoading(false));
    };

    const loadRegistrations = () => {
        if (!id) return;
        setRegLoading(true);
        fetchMeetingRegistrations(id)
            .then(res => setRegistrations(res.items))
            .catch(() => setRegistrations([]))
            .finally(() => setRegLoading(false));
    };

    useEffect(() => {
        loadDetail();
        loadRegistrations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const countByAnswer = (answer: DangKyHop) =>
        registrations.filter(r => r.answer === answer).length;

    const handleSubmit = async () => {
        if (
            !title.trim() ||
            !startTime ||
            !location.trim() ||
            !content.trim()
        ) {
            toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc");
            return;
        }
        const input: MeetingInput = {
            title: title.trim(),
            startTime: new Date(startTime).toISOString(),
            location: location.trim(),
            content: content.trim(),
            minutes: minutes.trim() || undefined,
            published,
        };
        try {
            setSaving(true);
            if (isEdit && id) {
                await updateMeeting(id, input);
                toast.success("Đã cập nhật cuộc họp");
            } else {
                await createMeeting(input);
                toast.success("Đã tạo cuộc họp");
            }
            navigate("/meetings");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="mb-4 flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate("/meetings")}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-semibold">
                    {isEdit ? "Sửa cuộc họp" : "Thêm cuộc họp"}
                </h1>
            </div>

            <div className="max-w-2xl rounded-2xl border border-divider_01 bg-white p-6 shadow-sm">
                {isEdit && loading && <LoadingState />}
                {isEdit && !loading && loadError && (
                    <ErrorState onRetry={loadDetail} />
                )}
                {(!isEdit || (!loading && !loadError)) && (
                    <div className="flex flex-col gap-4">
                        <div className="space-y-1.5">
                            <Label>Tên cuộc họp</Label>
                            <Input
                                placeholder="Nhập tên cuộc họp"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Thời gian</Label>
                            <Input
                                type="datetime-local"
                                value={startTime}
                                onChange={e => setStartTime(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Địa điểm</Label>
                            <Input
                                placeholder="Nhập địa điểm tổ chức"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Nội dung</Label>
                            <Textarea
                                placeholder="Nội dung cuộc họp"
                                rows={4}
                                value={content}
                                onChange={e => setContent(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Biên bản (nếu có)</Label>
                            <Textarea
                                placeholder="Biên bản cuộc họp"
                                rows={3}
                                value={minutes}
                                onChange={e => setMinutes(e.target.value)}
                            />
                        </div>

                        <label
                            htmlFor="published"
                            className="flex items-center gap-2 text-sm"
                        >
                            <Checkbox
                                id="published"
                                checked={published}
                                onCheckedChange={checked =>
                                    setPublished(checked === true)
                                }
                            />
                            Đăng công khai lên web app cho người dân
                        </label>

                        <div className="mt-2">
                            <Button loading={saving} onClick={handleSubmit}>
                                {isEdit ? "Lưu thay đổi" : "Tạo cuộc họp"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {isEdit && (
                <div className="mt-4 max-w-2xl rounded-2xl border border-divider_01 bg-white p-6 shadow-sm">
                    <h2 className="mb-3 text-sm font-semibold">
                        Tình hình đăng ký tham dự
                    </h2>

                    {regLoading && <LoadingState />}

                    {!regLoading && (
                        <>
                            <div className="mb-4 grid grid-cols-3 gap-3">
                                <StatCard
                                    label={DANG_KY_HOP_LABEL.co}
                                    value={countByAnswer("co")}
                                    tone="success"
                                />
                                <StatCard
                                    label={DANG_KY_HOP_LABEL.khong}
                                    value={countByAnswer("khong")}
                                    tone="danger"
                                />
                                <StatCard
                                    label={DANG_KY_HOP_LABEL.uy_quyen}
                                    value={countByAnswer("uy_quyen")}
                                    tone="warning"
                                />
                            </div>

                            {registrations.length === 0 ? (
                                <EmptyState label="Chưa có ai đăng ký tham dự" />
                            ) : (
                                <div className="divide-y divide-divider_01">
                                    {registrations.map(r => (
                                        <div key={r._id} className="py-2.5">
                                            <div className="text-sm font-medium">
                                                {registrantName(r)}
                                            </div>
                                            <div className="text-xs text-text_2">
                                                {DANG_KY_HOP_LABEL[r.answer]}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default MeetingFormPage;
