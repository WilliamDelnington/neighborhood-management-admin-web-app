import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import { Input } from "@components/ui/input";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@components/ui/dialog";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import RepresentativeUserPicker from "@components/admin/RepresentativeUserPicker";
import {
    ORGANIZATION_REPRESENTATIVE_ROLE_LABEL,
    HOUSE_OWNERSHIP_VERIFICATION_STATUS_LABEL,
    HOUSE_OWNERSHIP_VERIFICATION_STATUS_TONE,
} from "@constants/domain";
import {
    AppError,
    OrganizationRepresentative,
    OrganizationRepresentativeRole,
    User,
} from "@dts";
import {
    addOrganizationRepresentative,
    endOrganizationRepresentative,
    fetchOrganizationRepresentatives,
    verifyOrganizationRepresentative,
} from "@service/organizationRepresentativeApi";
import { usePermission } from "@store/authStore";

const ROLES = Object.keys(
    ORGANIZATION_REPRESENTATIVE_ROLE_LABEL,
) as OrganizationRepresentativeRole[];

const displayNameOf = (
    ref: string | { displayName: string; phone?: string } | undefined,
): string => (ref && typeof ref !== "string" ? ref.displayName : ref || "—");

const phoneOf = (
    ref: string | { displayName: string; phone?: string } | undefined,
): string | undefined => (ref && typeof ref !== "string" ? ref.phone : undefined);

export interface OrganizationRepresentativePanelProps {
    organizationId: string;
    canManage: boolean;
}

/**
 * Danh sach nguoi dai dien cua mot to chuc (nhieu-nhieu qua
 * OrganizationRepresentative o backend, khac voi cache
 * Organization.representativeUserId/representativeRole chi phan anh
 * legal_representative dang active) - cho phep them/chuyen nguoi dai dien
 * phap luat, them nguoi duoc uy quyen/lien he, xac thuc/tu choi, va ket thuc
 * mot quan he (giu lai lich su, khong xoa) - mirror HouseOwnershipPanel.
 */
const OrganizationRepresentativePanel: React.FC<
    OrganizationRepresentativePanelProps
> = ({ organizationId, canManage }) => {
    const [representatives, setRepresentatives] = useState<
        OrganizationRepresentative[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [addOpen, setAddOpen] = useState(false);
    const [role, setRole] = useState<OrganizationRepresentativeRole>(
        "legal_representative",
    );
    const [userId, setUserId] = useState<string | undefined>();
    const [userLabel, setUserLabel] = useState<string | undefined>();
    const [title, setTitle] = useState("");
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [endTarget, setEndTarget] = useState<OrganizationRepresentative | null>(
        null,
    );
    const [endReason, setEndReason] = useState("");
    const [ending, setEnding] = useState(false);

    const canVerify = usePermission("organizations.verify");
    const [verifyTarget, setVerifyTarget] =
        useState<OrganizationRepresentative | null>(null);
    const [verifyDecision, setVerifyDecision] = useState<
        "verified" | "rejected"
    >("verified");
    const [verifyNote, setVerifyNote] = useState("");
    const [verifying, setVerifying] = useState(false);

    const load = () => {
        setLoading(true);
        setError(false);
        fetchOrganizationRepresentatives(organizationId)
            .then(setRepresentatives)
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(load, [organizationId]);

    const openAdd = () => {
        setRole("legal_representative");
        setUserId(undefined);
        setUserLabel(undefined);
        setTitle("");
        setReason("");
        setAddOpen(true);
    };

    const handleAdd = async () => {
        if (!userId) {
            toast.error("Vui lòng chọn tài khoản");
            return;
        }
        try {
            setSubmitting(true);
            await addOrganizationRepresentative(organizationId, {
                userId,
                role,
                title: title.trim() || undefined,
                reason: reason.trim() || undefined,
            });
            toast.success(
                role === "legal_representative"
                    ? "Đã chuyển người đại diện pháp luật"
                    : "Đã thêm người đại diện",
            );
            setAddOpen(false);
            load();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEnd = async () => {
        if (!endTarget) return;
        try {
            setEnding(true);
            await endOrganizationRepresentative(
                organizationId,
                endTarget._id,
                endReason.trim() || undefined,
            );
            toast.success("Đã kết thúc quan hệ đại diện");
            setEndTarget(null);
            load();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setEnding(false);
        }
    };

    const openVerify = (
        r: OrganizationRepresentative,
        decision: "verified" | "rejected",
    ) => {
        setVerifyTarget(r);
        setVerifyDecision(decision);
        setVerifyNote("");
    };

    const handleVerify = async () => {
        if (!verifyTarget) return;
        if (verifyDecision === "rejected" && !verifyNote.trim()) {
            toast.error("Vui lòng nhập lý do từ chối");
            return;
        }
        try {
            setVerifying(true);
            await verifyOrganizationRepresentative(
                organizationId,
                verifyTarget._id,
                verifyDecision,
                verifyNote.trim() || undefined,
            );
            toast.success(
                verifyDecision === "verified"
                    ? "Đã xác thực người đại diện"
                    : "Đã từ chối người đại diện",
            );
            setVerifyTarget(null);
            load();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="mt-4 rounded-2xl border border-divider_01 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
                <h2 className="text-base font-semibold">Người đại diện</h2>
                {canManage && (
                    <Button size="sm" onClick={openAdd}>
                        <Plus className="mr-1 h-4 w-4" />
                        Thêm / chuyển người đại diện
                    </Button>
                )}
            </div>

            {loading && <LoadingState />}
            {!loading && error && (
                <ErrorState
                    label="Không thể tải danh sách người đại diện, vui lòng thử lại"
                    onRetry={load}
                />
            )}
            {!loading && !error && representatives.length === 0 && (
                <EmptyState label="Chưa có người đại diện nào" />
            )}
            {!loading &&
                !error &&
                representatives.map(r => (
                    <div
                        key={r._id}
                        className="border-b border-divider_01 py-2 last:border-0"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                                <div className="text-sm font-medium">
                                    {ORGANIZATION_REPRESENTATIVE_ROLE_LABEL[r.role]}
                                    {" — "}
                                    {displayNameOf(r.userId)}
                                </div>
                                <div className="text-xs text-text_2">
                                    {phoneOf(r.userId) && `${phoneOf(r.userId)} · `}
                                    {r.title && `${r.title} · `}
                                    {r.active
                                        ? `Từ ${new Date(
                                              r.startDate,
                                          ).toLocaleDateString("vi-VN")}`
                                        : `${new Date(
                                              r.startDate,
                                          ).toLocaleDateString(
                                              "vi-VN",
                                          )} — ${new Date(
                                              r.endDate || r.updatedAt,
                                          ).toLocaleDateString("vi-VN")}`}
                                    {r.reason && ` (${r.reason})`}
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <Badge
                                    tone={
                                        r.active
                                            ? HOUSE_OWNERSHIP_VERIFICATION_STATUS_TONE[
                                                  r.verificationStatus
                                              ]
                                            : "gray"
                                    }
                                >
                                    {r.active
                                        ? HOUSE_OWNERSHIP_VERIFICATION_STATUS_LABEL[
                                              r.verificationStatus
                                          ]
                                        : "Đã kết thúc"}
                                </Badge>
                                {canVerify &&
                                    r.active &&
                                    r.verificationStatus ===
                                        "waiting_verification" && (
                                        <>
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    openVerify(r, "verified")
                                                }
                                            >
                                                Xác thực
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    openVerify(r, "rejected")
                                                }
                                            >
                                                Từ chối
                                            </Button>
                                        </>
                                    )}
                                {canManage && r.active && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setEndReason("");
                                            setEndTarget(r);
                                        }}
                                    >
                                        Kết thúc
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Thêm người đại diện</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label>Vai trò</Label>
                            <RadioGroup
                                className="flex flex-col gap-2"
                                value={role}
                                onValueChange={v => {
                                    setRole(v as OrganizationRepresentativeRole);
                                    setUserId(undefined);
                                    setUserLabel(undefined);
                                }}
                            >
                                {ROLES.map(key => (
                                    <label
                                        key={key}
                                        htmlFor={`representative-role-${key}`}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        <RadioGroupItem
                                            id={`representative-role-${key}`}
                                            value={key}
                                        />
                                        {ORGANIZATION_REPRESENTATIVE_ROLE_LABEL[key]}
                                        {key === "legal_representative" &&
                                            " (thay thế người hiện tại)"}
                                    </label>
                                ))}
                            </RadioGroup>
                        </div>

                        <RepresentativeUserPicker
                            label="Tài khoản người đại diện"
                            value={userId}
                            valueLabel={userLabel}
                            onChange={(id, u?: User) => {
                                setUserId(id || undefined);
                                setUserLabel(u?.displayName);
                            }}
                        />

                        <div className="space-y-1.5">
                            <Label>Chức danh (không bắt buộc)</Label>
                            <Input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="VD: Giám đốc, Kế toán trưởng..."
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Ghi chú (không bắt buộc)</Label>
                            <Textarea
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="VD: Ủy quyền quản lý khi giám đốc vắng mặt..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddOpen(false)}>
                            Hủy
                        </Button>
                        <Button loading={submitting} onClick={handleAdd}>
                            Lưu
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!endTarget}
                onOpenChange={open => !open && setEndTarget(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Kết thúc quan hệ đại diện?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-text_2">
                        {endTarget &&
                            `${
                                ORGANIZATION_REPRESENTATIVE_ROLE_LABEL[
                                    endTarget.role
                                ]
                            } — ${displayNameOf(endTarget.userId)}`}
                    </p>
                    <div className="space-y-1.5">
                        <Label>Lý do (không bắt buộc)</Label>
                        <Textarea
                            value={endReason}
                            onChange={e => setEndReason(e.target.value)}
                            placeholder="VD: Thay đổi nhân sự, hết thời hạn ủy quyền..."
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEndTarget(null)}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="destructive"
                            loading={ending}
                            onClick={handleEnd}
                        >
                            Kết thúc
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!verifyTarget}
                onOpenChange={open => !open && setVerifyTarget(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {verifyDecision === "verified"
                                ? "Xác thực người đại diện?"
                                : "Từ chối người đại diện?"}
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-text_2">
                        {verifyTarget &&
                            `${
                                ORGANIZATION_REPRESENTATIVE_ROLE_LABEL[
                                    verifyTarget.role
                                ]
                            } — ${displayNameOf(verifyTarget.userId)}`}
                    </p>
                    <div className="space-y-1.5">
                        <Label>
                            {verifyDecision === "verified"
                                ? "Ghi chú (không bắt buộc)"
                                : "Lý do từ chối (bắt buộc)"}
                        </Label>
                        <Textarea
                            value={verifyNote}
                            onChange={e => setVerifyNote(e.target.value)}
                            placeholder={
                                verifyDecision === "verified"
                                    ? "VD: Đã xác minh trực tiếp"
                                    : "VD: Không xác minh được quan hệ đại diện"
                            }
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setVerifyTarget(null)}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant={
                                verifyDecision === "rejected"
                                    ? "destructive"
                                    : "default"
                            }
                            loading={verifying}
                            onClick={handleVerify}
                        >
                            {verifyDecision === "verified"
                                ? "Xác thực"
                                : "Từ chối"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default OrganizationRepresentativePanel;
