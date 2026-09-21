import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
    Calendar,
    CreditCard,
    Mail,
    MapPin,
    Phone,
    Shield,
    Upload,
    User as UserIcon,
    UserRound,
} from "lucide-react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Badge } from "@components/ui/badge";
import { LoadingState, ErrorState } from "@components/admin/DataStates";
import AttachmentsPanel from "@components/admin/AttachmentsPanel";
import { useAuthStore } from "@store/authStore";
import { resolveAssetUrl } from "@constants/common";
import {
    ROLE_LABEL,
    SCOPE_TYPE_LABEL,
    USER_STATUS_LABEL,
    USER_STATUS_TONE,
} from "@constants/domain";
import { AppError, FileAsset, User } from "@dts";
import {
    deleteMyAttachment,
    fetchMe,
    fetchMyAttachments,
    fetchMyManagementScope,
    updateMyProfile,
    uploadMyAttachment,
    uploadMyAvatar,
} from "@service/authApi";
import { UserManagementScopeEntry } from "@service/userApi";

/**
 * "Hồ sơ của tôi" - trang tu xem/sua thong tin cua CHINH nguoi dang dang
 * nhap (khac UserDetailPage.tsx: admin xem/sua nguoi KHAC, can permission
 * users.read/users.update). Khong bao boc AdminGuard permission nao - moi
 * tai khoan da dang nhap deu xem duoc ho so cua chinh minh.
 *
 * displayName KHONG the tu sua o day (chi sua duoc qua ChangeRequest sau khi
 * duyet - xem CHANGE_REQUEST_EDITABLE_FIELDS.User o backend), chi hien thi.
 */
const MyProfilePage: React.FC = () => {
    const setStoreUser = useAuthStore(state => state.setUser);

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [idNumber, setIdNumber] = useState("");
    const [address, setAddress] = useState("");
    const [saving, setSaving] = useState(false);

    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const [attachments, setAttachments] = useState<FileAsset[]>([]);
    const [attachmentsLoading, setAttachmentsLoading] = useState(true);
    const [uploadingAttachment, setUploadingAttachment] = useState(false);
    const [deletingAttachmentId, setDeletingAttachmentId] = useState<
        string | null
    >(null);

    const [scopeEntries, setScopeEntries] = useState<
        UserManagementScopeEntry[]
    >([]);
    const [scopeLoading, setScopeLoading] = useState(true);

    const applyUser = (u: User) => {
        setUser(u);
        setIdNumber(u.idNumber || "");
        setAddress(u.address || "");
        setStoreUser(u);
    };

    const load = () => {
        setLoading(true);
        setError(false);
        fetchMe()
            .then(applyUser)
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(load, []);

    useEffect(() => {
        setAttachmentsLoading(true);
        fetchMyAttachments()
            .then(setAttachments)
            .catch(() => setAttachments([]))
            .finally(() => setAttachmentsLoading(false));
    }, []);

    useEffect(() => {
        setScopeLoading(true);
        fetchMyManagementScope()
            .then(res => setScopeEntries(res.scopes))
            .catch(() => setScopeEntries([]))
            .finally(() => setScopeLoading(false));
    }, []);

    const roleLabel = (key: string) =>
        user?.roleLabels?.[key] || ROLE_LABEL[key] || key;

    const handleSave = async () => {
        if (!user) return;
        try {
            setSaving(true);
            const updated = await updateMyProfile({
                address: address.trim() || undefined,
                // idNumber tu server LUON o dang da che (vd "***1234" - xem
                // maskIdNumber o backend), nen chi gui len khi thuc su sua
                // truong nay (khac gia tri che ban dau) - gui vo dieu kien se
                // ghi de gia tri that bang chuoi da che (xem loi tuong tu da
                // sua o UserDetailPage.tsx).
                ...(idNumber.trim() !== (user.idNumber || "").trim()
                    ? { idNumber: idNumber.trim() || undefined }
                    : {}),
            });
            applyUser(updated);
            toast.success("Đã cập nhật hồ sơ");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setUploadingAvatar(true);
        uploadMyAvatar(file)
            .then(updated => {
                applyUser(updated);
                toast.success("Đã cập nhật ảnh đại diện");
            })
            .catch(err => toast.error((err as AppError).message))
            .finally(() => setUploadingAvatar(false));
    };

    const handleAttachmentUpload = (file: File) => {
        setUploadingAttachment(true);
        uploadMyAttachment(file)
            .then(asset => {
                setAttachments(prev => [asset, ...prev]);
                toast.success("Đã tải lên tài liệu");
            })
            .catch(err => toast.error((err as AppError).message))
            .finally(() => setUploadingAttachment(false));
    };

    const handleAttachmentDelete = (fileId: string) => {
        setDeletingAttachmentId(fileId);
        deleteMyAttachment(fileId)
            .then(() => {
                setAttachments(prev => prev.filter(a => a._id !== fileId));
                toast.success("Đã xóa tài liệu");
            })
            .catch(err => toast.error((err as AppError).message))
            .finally(() => setDeletingAttachmentId(null));
    };

    return (
        <div>
            <div className="mb-4">
                <h1 className="text-lg font-semibold">Hồ sơ của tôi</h1>
            </div>

            {loading && <LoadingState />}
            {!loading && error && <ErrorState onRetry={load} />}

            {!loading && !error && user && (
                <>
                    <div className="rounded-xl border border-divider_01 bg-ui_bg p-6 shadow-sm">
                        <div className="flex flex-wrap items-center gap-4">
                            <button
                                type="button"
                                onClick={() => avatarInputRef.current?.click()}
                                className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-main to-primary-dark ring-2 ring-blue_10"
                            >
                                {user.avatarUrl ? (
                                    <img
                                        src={resolveAssetUrl(user.avatarUrl)}
                                        alt={user.displayName}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <UserRound className="h-full w-full p-3 text-white" />
                                )}
                                <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                                    <Upload className="h-5 w-5 text-white" />
                                </span>
                            </button>
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept=".jpg,.jpeg,.png"
                                className="hidden"
                                onChange={handleAvatarSelected}
                            />
                            <div>
                                <h2 className="text-xl font-semibold text-text_1">
                                    {user.displayName}
                                </h2>
                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                    <Badge tone={USER_STATUS_TONE[user.status]}>
                                        {USER_STATUS_LABEL[user.status]}
                                    </Badge>
                                    {user.roles.map(r => (
                                        <Badge key={r} tone="gray">
                                            {roleLabel(r)}
                                        </Badge>
                                    ))}
                                </div>
                                {uploadingAvatar && (
                                    <p className="mt-1 text-xs text-text_2">
                                        Đang tải lên ảnh đại diện...
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-divider_01 bg-ui_bg p-5 shadow-sm">
                        <h3 className="mb-4 text-base font-semibold">
                            Thông tin cá nhân
                        </h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label className="flex items-center gap-1.5">
                                    <UserIcon className="h-3.5 w-3.5 text-text_2" />
                                    Họ tên
                                </Label>
                                <Input value={user.displayName} disabled />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="flex items-center gap-1.5">
                                    <Phone className="h-3.5 w-3.5 text-text_2" />
                                    Số điện thoại
                                </Label>
                                <Input value={user.phone || "Chưa có"} disabled />
                            </div>
                            {user.email && (
                                <div className="space-y-1.5">
                                    <Label className="flex items-center gap-1.5">
                                        <Mail className="h-3.5 w-3.5 text-text_2" />
                                        Email
                                    </Label>
                                    <Input value={user.email} disabled />
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <Label className="flex items-center gap-1.5">
                                    <CreditCard className="h-3.5 w-3.5 text-text_2" />
                                    Số CMND/CCCD
                                </Label>
                                <Input
                                    value={idNumber}
                                    placeholder="Chưa cập nhật"
                                    onChange={e => setIdNumber(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label className="flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 text-text_2" />
                                    Địa chỉ
                                </Label>
                                <Input
                                    value={address}
                                    placeholder="Chưa cập nhật"
                                    onChange={e => setAddress(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-divider_01 pt-4">
                            {user.createdAt ? (
                                <p className="flex items-center gap-1.5 text-xs text-text_2">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Ngày tạo tài khoản:{" "}
                                    {new Date(
                                        user.createdAt,
                                    ).toLocaleDateString("vi-VN")}
                                </p>
                            ) : (
                                <span />
                            )}
                            <Button loading={saving} onClick={handleSave}>
                                Lưu thông tin
                            </Button>
                        </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-divider_01 bg-ui_bg p-5 shadow-sm">
                        <h3 className="mb-3 flex items-center gap-1.5 text-base font-semibold">
                            <Shield className="h-4 w-4 text-text_2" />
                            Phạm vi quản lý
                        </h3>
                        {scopeLoading && <LoadingState />}
                        {!scopeLoading && scopeEntries.length === 0 && (
                            <div className="text-xs text-text_2">
                                Chưa quản lý phạm vi nào
                            </div>
                        )}
                        {!scopeLoading &&
                            scopeEntries.map(entry => (
                                <div
                                    key={`${entry.roleKey}-${entry.scopeType}`}
                                    className="border-b border-divider_01 py-2 last:border-0"
                                >
                                    <div className="text-sm font-medium">
                                        {roleLabel(entry.roleKey)} —{" "}
                                        {SCOPE_TYPE_LABEL[entry.scopeType] ||
                                            entry.scopeType}
                                    </div>
                                    {entry.unrestricted ? (
                                        <div className="text-xs text-text_2">
                                            Không giới hạn phạm vi
                                        </div>
                                    ) : (
                                        <div className="mt-1 flex flex-wrap gap-1.5">
                                            {entry.items.map(item => (
                                                <Badge key={item.id} tone="gray">
                                                    {item.label}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>

                    <AttachmentsPanel
                        title="Giấy tờ"
                        attachments={attachments}
                        loading={attachmentsLoading}
                        canManage
                        deletingId={deletingAttachmentId}
                        onDelete={handleAttachmentDelete}
                        onUpload={handleAttachmentUpload}
                        uploading={uploadingAttachment}
                    />
                </>
            )}
        </div>
    );
};

export default MyProfilePage;
