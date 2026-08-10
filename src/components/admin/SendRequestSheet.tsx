import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
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
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@components/ui/sheet";
import HousePicker from "@components/admin/HousePicker";
import RequestRecipientPicker from "@components/admin/RequestRecipientPicker";
import { REQUEST_PRIORITY_LABEL, REQUEST_TYPE_LABEL } from "@constants/domain";
import {
    AppError,
    House,
    RequestHouseRole,
    RequestItem,
    RequestMeta,
    RequestPriority,
    RequestType,
} from "@dts";
import { createRequest, fetchRequestMeta } from "@service/requestApi";

export interface SendRequestSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated?: (request: RequestItem) => void;
    /** Neu duoc truyen, loai yeu cau bi khoa cung (mo tu man PCCC/An ninh). */
    lockedType?: RequestType;
    relatedModel?: string;
    relatedId?: string;
    defaultTitle?: string;
    defaultHouseId?: string;
    defaultHouseLabel?: string;
}

const EMPTY_STATE = {
    type: "" as RequestType | "",
    title: "",
    description: "",
    priority: "normal" as RequestPriority,
    dueDate: "",
    houseId: "",
    houseLabel: "",
    targetUserIds: [] as string[],
    targetRoles: [] as string[],
    houseRole: "" as RequestHouseRole | "",
    targetHouseNeighborhoodLeader: false,
};

/**
 * Sheet gui yeu cau dung chung - mo tu man "Yeu cau cong viec" (khong khoa
 * loai) hoac tu man PCCC/An ninh (khoa loai + gan san relatedModel/relatedId/
 * houseId de nguoi nhan biet yeu cau gan voi ho so nao).
 */
const SendRequestSheet: React.FC<SendRequestSheetProps> = ({
    open,
    onOpenChange,
    onCreated,
    lockedType,
    relatedModel,
    relatedId,
    defaultTitle,
    defaultHouseId,
    defaultHouseLabel,
}) => {
    const [meta, setMeta] = useState<RequestMeta | null>(null);
    const [form, setForm] = useState(EMPTY_STATE);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) return;
        fetchRequestMeta()
            .then(setMeta)
            .catch(() => setMeta(null));
        setForm({
            ...EMPTY_STATE,
            type: lockedType || "",
            title: defaultTitle || "",
            houseId: defaultHouseId || "",
            houseLabel: defaultHouseLabel || "",
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleHouseChange = (houseId: string, house: House) => {
        setForm(prev => ({
            ...prev,
            houseId,
            houseLabel: `${house.code} — ${house.address}`,
        }));
    };

    const hasHouseRecipient =
        !!form.houseId &&
        (!!form.houseRole || form.targetHouseNeighborhoodLeader);
    const isValid =
        !!form.type &&
        form.title.trim().length > 0 &&
        (form.targetUserIds.length > 0 ||
            form.targetRoles.length > 0 ||
            hasHouseRecipient);

    const handleSubmit = async () => {
        if (!isValid || !form.type) {
            toast.error(
                "Vui lòng chọn loại yêu cầu, nhập tiêu đề và chọn ít nhất một người nhận",
            );
            return;
        }
        try {
            setSubmitting(true);
            const created = await createRequest({
                type: form.type,
                title: form.title,
                description: form.description || undefined,
                priority: form.priority,
                relatedModel,
                relatedId,
                houseId: form.houseId || undefined,
                dueDate: form.dueDate
                    ? new Date(form.dueDate).toISOString()
                    : undefined,
                targetUserIds: form.targetUserIds,
                targetRoles: form.targetRoles,
                houseRole: form.houseRole || undefined,
                targetHouseNeighborhoodLeader:
                    form.targetHouseNeighborhoodLeader || undefined,
            });
            toast.success("Đã gửi yêu cầu");
            onCreated?.(created);
            onOpenChange(false);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Gửi yêu cầu</SheetTitle>
                </SheetHeader>
                <div className="flex-1 space-y-4 overflow-y-auto py-4">
                    <div>
                        <Label>Loại yêu cầu</Label>
                        <Select
                            value={form.type}
                            onValueChange={v =>
                                setForm(prev => ({
                                    ...prev,
                                    type: v as RequestType,
                                    targetUserIds: [],
                                    targetRoles: [],
                                }))
                            }
                            disabled={!!lockedType}
                        >
                            <SelectTrigger className="mt-1.5">
                                <SelectValue placeholder="Chọn loại yêu cầu" />
                            </SelectTrigger>
                            <SelectContent>
                                {(meta?.allowedTypes || []).map(t => (
                                    <SelectItem key={t} value={t}>
                                        {REQUEST_TYPE_LABEL[t]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Tiêu đề</Label>
                        <Input
                            className="mt-1.5"
                            value={form.title}
                            onChange={e =>
                                setForm(prev => ({
                                    ...prev,
                                    title: e.target.value,
                                }))
                            }
                        />
                    </div>

                    <div>
                        <Label>Mô tả (tùy chọn)</Label>
                        <Textarea
                            className="mt-1.5"
                            value={form.description}
                            onChange={e =>
                                setForm(prev => ({
                                    ...prev,
                                    description: e.target.value,
                                }))
                            }
                        />
                    </div>

                    <div>
                        <Label>Mức độ ưu tiên</Label>
                        <Select
                            value={form.priority}
                            onValueChange={v =>
                                setForm(prev => ({
                                    ...prev,
                                    priority: v as RequestPriority,
                                }))
                            }
                        >
                            <SelectTrigger className="mt-1.5">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {(
                                    Object.entries(REQUEST_PRIORITY_LABEL) as [
                                        RequestPriority,
                                        string,
                                    ][]
                                ).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Hạn xử lý (tùy chọn)</Label>
                        <Input
                            className="mt-1.5"
                            type="date"
                            value={form.dueDate}
                            onChange={e =>
                                setForm(prev => ({
                                    ...prev,
                                    dueDate: e.target.value,
                                }))
                            }
                        />
                    </div>

                    {!relatedId && (
                        <HousePicker
                            label="Nhà liên quan (tùy chọn)"
                            value={form.houseId}
                            valueLabel={form.houseLabel}
                            onChange={handleHouseChange}
                        />
                    )}

                    {form.type && meta && (
                        <RequestRecipientPicker
                            type={form.type}
                            eligibleRoleKeys={
                                meta.eligibleRolesByType[form.type] || []
                            }
                            targetUserIds={form.targetUserIds}
                            targetRoles={form.targetRoles}
                            onChangeUserIds={ids =>
                                setForm(prev => ({
                                    ...prev,
                                    targetUserIds: ids,
                                }))
                            }
                            onChangeRoles={roles =>
                                setForm(prev => ({
                                    ...prev,
                                    targetRoles: roles,
                                }))
                            }
                            houseId={form.houseId}
                            houseRole={form.houseRole}
                            onChangeHouseRole={role =>
                                setForm(prev => ({ ...prev, houseRole: role }))
                            }
                            targetHouseNeighborhoodLeader={
                                form.targetHouseNeighborhoodLeader
                            }
                            onChangeTargetHouseNeighborhoodLeader={value =>
                                setForm(prev => ({
                                    ...prev,
                                    targetHouseNeighborhoodLeader: value,
                                }))
                            }
                        />
                    )}
                </div>
                <SheetFooter>
                    <Button
                        className="w-full"
                        loading={submitting}
                        onClick={handleSubmit}
                    >
                        Gửi yêu cầu
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default SendRequestSheet;
