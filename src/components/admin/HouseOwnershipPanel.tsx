import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@components/ui/dialog";
import { LoadingState, EmptyState, ErrorState } from "@components/admin/DataStates";
import HeadOfHouseholdUserPicker from "@components/admin/HeadOfHouseholdUserPicker";
import OrganizationPicker from "@components/admin/OrganizationPicker";
import {
    HOUSE_OWNERSHIP_RELATIONSHIP_TYPE_LABEL,
    HOUSE_OWNERSHIP_VERIFICATION_STATUS_LABEL,
    HOUSE_OWNERSHIP_VERIFICATION_STATUS_TONE,
} from "@constants/domain";
import {
    AppError,
    HouseOwnership,
    HouseOwnershipRelationshipType,
    OwnerType,
    User,
    Organization,
} from "@dts";
import {
    addHouseOwnership,
    endHouseOwnership,
    fetchHouseOwnerships,
    verifyHouseOwnership,
} from "@service/houseOwnershipApi";
import { lockUserAccount } from "@service/userApi";
import { usePermission } from "@store/authStore";

const RELATIONSHIP_TYPES = Object.keys(
    HOUSE_OWNERSHIP_RELATIONSHIP_TYPE_LABEL,
) as HouseOwnershipRelationshipType[];

export interface HouseOwnershipPanelProps {
    houseId: string;
    canManage: boolean;
}

/**
 * Danh sach quan he so huu/quan ly cua mot nha so (nhieu-nhieu qua
 * HouseOwnership o backend, khac voi cache House.ownerId/ownerType chi phan
 * anh chu so huu chinh hien tai) - cho phep them dong so huu/nguoi quan ly,
 * chuyen chu so huu chinh (relationshipType="primary_owner"), va ket thuc mot
 * quan he (giu lai lich su, khong xoa - xem houseOwnershipService o backend).
 */
const HouseOwnershipPanel: React.FC<HouseOwnershipPanelProps> = ({
    houseId,
    canManage,
}) => {
    const [ownerships, setOwnerships] = useState<HouseOwnership[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [addOpen, setAddOpen] = useState(false);
    const [relationshipType, setRelationshipType] =
        useState<HouseOwnershipRelationshipType>("co_owner");
    const [ownerType, setOwnerType] = useState<OwnerType>("user");
    const [ownerId, setOwnerId] = useState<string | undefined>();
    const [ownerLabel, setOwnerLabel] = useState<string | undefined>();
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [endTarget, setEndTarget] = useState<HouseOwnership | null>(null);
    const [endReason, setEndReason] = useState("");
    const [ending, setEnding] = useState(false);

    const canLockOwnerAccount = usePermission("users.lock") || usePermission("users.update");
    const [lockTarget, setLockTarget] = useState<HouseOwnership | null>(null);
    const [lockStatus, setLockStatus] = useState<"active" | "locked">("locked");
    const [lockReason, setLockReason] = useState("");
    const [locking, setLocking] = useState(false);

    const canVerifyOwnership = usePermission("houses.verify");
    const [verifyTarget, setVerifyTarget] = useState<HouseOwnership | null>(
        null,
    );
    const [verifyDecision, setVerifyDecision] = useState<
        "verified" | "rejected"
    >("verified");
    const [verifyNote, setVerifyNote] = useState("");
    const [verifying, setVerifying] = useState(false);

    const load = () => {
        setLoading(true);
        setError(false);
        fetchHouseOwnerships(houseId)
            .then(setOwnerships)
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(load, [houseId]);

    const openAdd = () => {
        setRelationshipType("co_owner");
        setOwnerType("user");
        setOwnerId(undefined);
        setOwnerLabel(undefined);
        setReason("");
        setAddOpen(true);
    };

    const handleAdd = async () => {
        if (!ownerId) {
            toast.error("Vui lòng chọn tài khoản hoặc tổ chức");
            return;
        }
        try {
            setSubmitting(true);
            await addHouseOwnership(houseId, {
                ownerType,
                ownerId,
                relationshipType,
                reason: reason.trim() || undefined,
            });
            toast.success(
                relationshipType === "primary_owner"
                    ? "Đã chuyển chủ sở hữu chính"
                    : "Đã thêm quan hệ sở hữu",
            );
            setAddOpen(false);
            load();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSubmitting(false);
        }
    };

    const openLock = (o: HouseOwnership, status: "active" | "locked") => {
        setLockTarget(o);
        setLockStatus(status);
        setLockReason("");
    };

    const openVerify = (o: HouseOwnership, decision: "verified" | "rejected") => {
        setVerifyTarget(o);
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
            await verifyHouseOwnership(
                houseId,
                verifyTarget._id,
                verifyDecision,
                verifyNote.trim() || undefined,
            );
            toast.success(
                verifyDecision === "verified"
                    ? "Đã xác thực quan hệ sở hữu"
                    : "Đã từ chối quan hệ sở hữu",
            );
            setVerifyTarget(null);
            load();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setVerifying(false);
        }
    };

    const handleLock = async () => {
        if (!lockTarget) return;
        if (!lockReason.trim()) {
            toast.error("Vui lòng nhập lý do");
            return;
        }
        try {
            setLocking(true);
            await lockUserAccount(lockTarget.ownerId, lockStatus, lockReason.trim());
            toast.success(
                lockStatus === "locked"
                    ? "Đã khóa tài khoản chủ nhà"
                    : "Đã mở khóa tài khoản chủ nhà",
            );
            setLockTarget(null);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setLocking(false);
        }
    };

    const handleEnd = async () => {
        if (!endTarget) return;
        try {
            setEnding(true);
            await endHouseOwnership(
                houseId,
                endTarget._id,
                endReason.trim() || undefined,
            );
            toast.success("Đã kết thúc quan hệ sở hữu");
            setEndTarget(null);
            load();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setEnding(false);
        }
    };

    return (
        <div className="mt-4 rounded-lg border border-divider_01 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
                <h2 className="text-base font-semibold">
                    Chủ sở hữu &amp; người quản lý
                </h2>
                {canManage && (
                    <Button size="sm" onClick={openAdd}>
                        <Plus className="mr-1 h-4 w-4" />
                        Thêm / chuyển chủ
                    </Button>
                )}
            </div>

            {loading && <LoadingState />}
            {!loading && error && (
                <ErrorState
                    label="Không thể tải danh sách chủ sở hữu, vui lòng thử lại"
                    onRetry={load}
                />
            )}
            {!loading && !error && ownerships.length === 0 && (
                <EmptyState label="Chưa có quan hệ sở hữu nào" />
            )}
            {!loading &&
                !error &&
                ownerships.map(o => (
                    <div
                        key={o._id}
                        className="border-b border-divider_01 py-2 last:border-0"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                                <div className="text-sm font-medium">
                                    {HOUSE_OWNERSHIP_RELATIONSHIP_TYPE_LABEL[
                                        o.relationshipType
                                    ] }{" "}
                                    — {o.ownerDisplayName || "Không rõ"}
                                </div>
                                <div className="text-xs text-text_2">
                                    {o.ownerPhone && `${o.ownerPhone} · `}
                                    {o.active
                                        ? `Từ ${new Date(
                                              o.startDate,
                                          ).toLocaleDateString("vi-VN")}`
                                        : `${new Date(
                                              o.startDate,
                                          ).toLocaleDateString(
                                              "vi-VN",
                                          )} — ${new Date(
                                              o.endDate || o.updatedAt,
                                          ).toLocaleDateString("vi-VN")}`}
                                    {o.reason && ` (${o.reason})`}
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <Badge
                                    tone={
                                        o.active
                                            ? HOUSE_OWNERSHIP_VERIFICATION_STATUS_TONE[
                                                  o.verificationStatus
                                              ]
                                            : "gray"
                                    }
                                >
                                    {o.active
                                        ? HOUSE_OWNERSHIP_VERIFICATION_STATUS_LABEL[
                                              o.verificationStatus
                                          ]
                                        : "Đã kết thúc"}
                                </Badge>
                                {canVerifyOwnership &&
                                    o.active &&
                                    o.relationshipType !== "primary_owner" &&
                                    o.verificationStatus ===
                                        "waiting_verification" && (
                                        <>
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    openVerify(o, "verified")
                                                }
                                            >
                                                Xác thực
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    openVerify(o, "rejected")
                                                }
                                            >
                                                Từ chối
                                            </Button>
                                        </>
                                    )}
                                {canLockOwnerAccount &&
                                    o.active &&
                                    o.ownerType === "user" && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                openLock(o, "locked")
                                            }
                                        >
                                            Khóa/mở tài khoản
                                        </Button>
                                    )}
                                {canManage && o.active && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setEndReason("");
                                            setEndTarget(o);
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
                        <DialogTitle>Thêm quan hệ sở hữu</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label>Vai trò</Label>
                            <RadioGroup
                                className="flex flex-col gap-2"
                                value={relationshipType}
                                onValueChange={v => {
                                    setRelationshipType(
                                        v as HouseOwnershipRelationshipType,
                                    );
                                    setOwnerId(undefined);
                                    setOwnerLabel(undefined);
                                }}
                            >
                                {RELATIONSHIP_TYPES.map(key => (
                                    <label
                                        key={key}
                                        htmlFor={`ownership-type-${key}`}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        <RadioGroupItem
                                            id={`ownership-type-${key}`}
                                            value={key}
                                        />
                                        {HOUSE_OWNERSHIP_RELATIONSHIP_TYPE_LABEL[
                                            key
                                        ]}
                                        {key === "primary_owner" &&
                                            " (thay thế chủ hiện tại)"}
                                    </label>
                                ))}
                            </RadioGroup>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Loại chủ thể</Label>
                            <RadioGroup
                                className="flex flex-row gap-5"
                                value={ownerType}
                                onValueChange={v => {
                                    setOwnerType(v as OwnerType);
                                    setOwnerId(undefined);
                                    setOwnerLabel(undefined);
                                }}
                            >
                                <label className="flex items-center gap-2 text-sm">
                                    <RadioGroupItem
                                        id="owner-type-user"
                                        value="user"
                                    />
                                    Cá nhân
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <RadioGroupItem
                                        id="owner-type-organization"
                                        value="organization"
                                    />
                                    Tổ chức
                                </label>
                            </RadioGroup>
                        </div>

                        {ownerType === "user" ? (
                            <HeadOfHouseholdUserPicker
                                value={ownerId}
                                valueLabel={ownerLabel}
                                onChange={(id, u?: User) => {
                                    setOwnerId(id || undefined);
                                    setOwnerLabel(u?.displayName);
                                }}
                            />
                        ) : (
                            <OrganizationPicker
                                value={ownerId}
                                valueLabel={ownerLabel}
                                onChange={(id, o?: Organization) => {
                                    setOwnerId(id || undefined);
                                    setOwnerLabel(o?.name);
                                }}
                            />
                        )}

                        <div className="space-y-1.5">
                            <Label>Ghi chú (không bắt buộc)</Label>
                            <Textarea
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="VD: Vợ/chồng đồng sở hữu, ủy quyền quản lý khi vắng nhà..."
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
                        <DialogTitle>Kết thúc quan hệ sở hữu?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-text_2">
                        {endTarget &&
                            `${
                                HOUSE_OWNERSHIP_RELATIONSHIP_TYPE_LABEL[
                                    endTarget.relationshipType
                                ]
                            } — ${endTarget.ownerDisplayName || "Không rõ"}`}
                    </p>
                    <div className="space-y-1.5">
                        <Label>Lý do (không bắt buộc)</Label>
                        <Textarea
                            value={endReason}
                            onChange={e => setEndReason(e.target.value)}
                            placeholder="VD: Chuyển nhượng nhà, hết thời hạn ủy quyền..."
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
                open={!!lockTarget}
                onOpenChange={open => !open && setLockTarget(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Khóa/mở tài khoản chủ nhà</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-text_2">
                        {lockTarget?.ownerDisplayName || "Không rõ"}
                        {lockTarget?.ownerPhone && ` · ${lockTarget.ownerPhone}`}
                    </p>
                    <div className="space-y-1.5">
                        <Label>Trạng thái tài khoản</Label>
                        <RadioGroup
                            className="flex flex-row gap-5"
                            value={lockStatus}
                            onValueChange={v =>
                                setLockStatus(v as "active" | "locked")
                            }
                        >
                            <label className="flex items-center gap-2 text-sm">
                                <RadioGroupItem
                                    id="lock-status-locked"
                                    value="locked"
                                />
                                Khóa
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <RadioGroupItem
                                    id="lock-status-active"
                                    value="active"
                                />
                                Mở khóa (Hoạt động)
                            </label>
                        </RadioGroup>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Lý do (bắt buộc)</Label>
                        <Textarea
                            value={lockReason}
                            onChange={e => setLockReason(e.target.value)}
                            placeholder="VD: Vi phạm quy định, yêu cầu xác minh lại, mở lại sau khi đã xử lý..."
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setLockTarget(null)}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant={
                                lockStatus === "locked"
                                    ? "destructive"
                                    : "default"
                            }
                            loading={locking}
                            onClick={handleLock}
                        >
                            {lockStatus === "locked" ? "Khóa" : "Mở khóa"}
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
                                ? "Xác thực quan hệ sở hữu?"
                                : "Từ chối quan hệ sở hữu?"}
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-text_2">
                        {verifyTarget &&
                            `${
                                HOUSE_OWNERSHIP_RELATIONSHIP_TYPE_LABEL[
                                    verifyTarget.relationshipType
                                ]
                            } — ${verifyTarget.ownerDisplayName || "Không rõ"}`}
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
                                    ? "VD: Đã xác minh trực tiếp với chủ nhà"
                                    : "VD: Không xác minh được quan hệ với chủ nhà"
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

export default HouseOwnershipPanel;
