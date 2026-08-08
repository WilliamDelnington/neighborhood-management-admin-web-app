import React, { useEffect, useState } from "react";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Checkbox } from "@components/ui/checkbox";
import RequestRecipientPicker from "@components/admin/RequestRecipientPicker";
import { usePermission } from "@store/authStore";
import { RequestMeta, RequestType } from "@dts";
import { fetchRequestMeta } from "@service/requestApi";

export interface RequestSubSectionValue {
    enabled: boolean;
    title: string;
    dueDate: string;
    targetUserIds: string[];
    targetRoles: string[];
}

export const emptyRequestSubSection = (
    title = "",
): RequestSubSectionValue => ({
    enabled: false,
    title,
    dueDate: "",
    targetUserIds: [],
    targetRoles: [],
});

export function isRequestSubSectionValid(
    value: RequestSubSectionValue,
): boolean {
    if (!value.enabled) return true;
    return (
        value.title.trim().length > 0 &&
        (value.targetUserIds.length > 0 || value.targetRoles.length > 0)
    );
}

interface RequestSubSectionProps {
    type: RequestType;
    value: RequestSubSectionValue;
    onChange: (value: RequestSubSectionValue) => void;
    checkboxLabel?: string;
}

/**
 * Muc con dung chung trong form PCCC/An ninh: khi nguy co/muc do o dinh danh
 * dang can chu y, cho phep tao va gan luon mot Request cho can bo phu trach
 * ngay khi luu bien ban, thay vi phai mo rieng man "Gui yeu cau" sau do.
 */
const RequestSubSection: React.FC<RequestSubSectionProps> = ({
    type,
    value,
    onChange,
    checkboxLabel = "Tạo yêu cầu xử lý cho cán bộ phụ trách",
}) => {
    const canCreateRequest = usePermission("requests.create");
    const [meta, setMeta] = useState<RequestMeta | null>(null);

    useEffect(() => {
        if (!canCreateRequest) return;
        fetchRequestMeta()
            .then(setMeta)
            .catch(() => setMeta(null));
    }, [canCreateRequest]);

    if (!canCreateRequest) return null;

    const set = (patch: Partial<RequestSubSectionValue>) =>
        onChange({ ...value, ...patch });

    return (
        <div className="rounded-lg border border-divider_01 p-3">
            <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox
                    checked={value.enabled}
                    onCheckedChange={checked =>
                        set({ enabled: checked === true })
                    }
                />
                {checkboxLabel}
            </label>
            {value.enabled && (
                <div className="mt-3 space-y-3">
                    <div className="space-y-1.5">
                        <Label>Tiêu đề yêu cầu</Label>
                        <Input
                            value={value.title}
                            onChange={e => set({ title: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Hạn xử lý (tùy chọn)</Label>
                        <Input
                            type="date"
                            value={value.dueDate}
                            onChange={e => set({ dueDate: e.target.value })}
                        />
                    </div>
                    {meta && (
                        <RequestRecipientPicker
                            type={type}
                            eligibleRoleKeys={
                                meta.eligibleRolesByType[type] || []
                            }
                            targetUserIds={value.targetUserIds}
                            targetRoles={value.targetRoles}
                            onChangeUserIds={ids =>
                                set({ targetUserIds: ids })
                            }
                            onChangeRoles={roles =>
                                set({ targetRoles: roles })
                            }
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default RequestSubSection;
