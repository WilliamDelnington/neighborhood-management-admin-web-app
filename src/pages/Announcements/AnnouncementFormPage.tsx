import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { usePermission } from "@store/authStore";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Label } from "@components/ui/label";
import { Checkbox } from "@components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import { LoadingState, ErrorState } from "@components/admin/DataStates";
import { LOAI_THONG_BAO_LABEL } from "@constants/domain";
import { AppError, LoaiThongBao, TrangThaiThongBao } from "@dts";
import {
    AnnouncementInput,
    createAnnouncement,
    fetchAnnouncementDetail,
    publishAnnouncement,
    updateAnnouncement,
} from "@service/announcementApi";

const AnnouncementFormPage: React.FC = () => (
    <AdminGuard permissions={["announcements.read"]}>
        <AnnouncementFormContent />
    </AdminGuard>
);

const AnnouncementFormContent: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const canManage = usePermission(
        isEdit ? "announcements.update" : "announcements.create",
    );
    const canPublish = usePermission("announcements.publish");

    const [loading, setLoading] = useState(isEdit);
    const [loadError, setLoadError] = useState(false);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState<LoaiThongBao>("chung");
    const [priority, setPriority] = useState(false);
    const [pinned, setPinned] = useState(false);
    const [audienceAll, setAudienceAll] = useState(true);
    const [status, setStatus] = useState<TrangThaiThongBao>("nhap");

    const loadDetail = () => {
        if (!id) return;
        setLoading(true);
        setLoadError(false);
        fetchAnnouncementDetail(id)
            .then(a => {
                setTitle(a.title);
                setContent(a.content);
                setCategory(a.category);
                setPriority(a.priority);
                setPinned(a.pinned);
                setStatus(a.status);
            })
            .catch(() => setLoadError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            toast.error("Vui lòng nhập tiêu đề và nội dung");
            return;
        }
        const input: AnnouncementInput = {
            title: title.trim(),
            content: content.trim(),
            category,
            priority,
            pinned,
            audienceAll,
        };
        try {
            setSaving(true);
            if (isEdit && id) {
                await updateAnnouncement(id, input);
                toast.success("Đã cập nhật thông báo");
            } else {
                await createAnnouncement(input);
                toast.success("Đã tạo thông báo (bản nháp)");
            }
            navigate("/announcements");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        if (!id) return;
        try {
            setPublishing(true);
            await publishAnnouncement(id);
            toast.success("Đã đăng thông báo tới người dân");
            navigate("/announcements");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setPublishing(false);
        }
    };

    return (
        <div>
            <div className="mb-4 flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate("/announcements")}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-semibold">
                    {isEdit ? "Sửa thông báo" : "Thêm thông báo"}
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
                            <Label>Tiêu đề</Label>
                            <Input
                                placeholder="Nhập tiêu đề thông báo"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Nội dung</Label>
                            <Textarea
                                placeholder="Nội dung thông báo"
                                rows={6}
                                value={content}
                                onChange={e => setContent(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Phân loại</Label>
                            <Select
                                value={category}
                                onValueChange={v =>
                                    setCategory(v as LoaiThongBao)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(
                                        Object.entries(
                                            LOAI_THONG_BAO_LABEL,
                                        ) as [LoaiThongBao, string][]
                                    ).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="priority"
                                className="flex items-center gap-2 text-sm"
                            >
                                <Checkbox
                                    id="priority"
                                    checked={priority}
                                    onCheckedChange={checked =>
                                        setPriority(checked === true)
                                    }
                                />
                                Thông báo ưu tiên
                            </label>
                            <label
                                htmlFor="pinned"
                                className="flex items-center gap-2 text-sm"
                            >
                                <Checkbox
                                    id="pinned"
                                    checked={pinned}
                                    onCheckedChange={checked =>
                                        setPinned(checked === true)
                                    }
                                />
                                Ghim lên đầu danh sách
                            </label>
                            <label
                                htmlFor="audienceAll"
                                className="flex items-center gap-2 text-sm"
                            >
                                <Checkbox
                                    id="audienceAll"
                                    checked={audienceAll}
                                    onCheckedChange={checked =>
                                        setAudienceAll(checked === true)
                                    }
                                />
                                Gửi tới toàn bộ người dân
                            </label>
                        </div>

                        {canManage && (
                            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                <Button loading={saving} onClick={handleSubmit}>
                                    {isEdit ? "Lưu thay đổi" : "Lưu bản nháp"}
                                </Button>
                                {isEdit && status === "nhap" && canPublish && (
                                    <Button
                                        variant="outline"
                                        loading={publishing}
                                        onClick={handlePublish}
                                    >
                                        Đăng thông báo
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnnouncementFormPage;
