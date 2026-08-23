import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Checkbox } from "@components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import { LoadingState, EmptyState } from "@components/admin/DataStates";
import { REQUEST_HOUSE_ROLE_LABEL } from "@constants/domain";
import {
    AssignableStaff,
    REQUEST_HOUSE_ROLES,
    RequestHouseRole,
    RequestType,
    RoleRecord,
} from "@dts";
import { fetchAssignableStaffByRoles } from "@service/userApi";
import { fetchRoles } from "@service/roleApi";

export interface RequestRecipientPickerProps {
    type: RequestType;
    eligibleRoleKeys: string[];
    targetUserIds: string[];
    targetRoles: string[];
    onChangeUserIds: (ids: string[]) => void;
    onChangeRoles: (keys: string[]) => void;
    /** Chi co hieu luc khi type === "task" - xem tab "Theo nhà". */
    houseId?: string;
    houseRole?: RequestHouseRole | "";
    onChangeHouseRole?: (role: RequestHouseRole | "") => void;
    targetHouseNeighborhoodLeader?: boolean;
    onChangeTargetHouseNeighborhoodLeader?: (value: boolean) => void;
}

/**
 * Chon nguoi nhan yeu cau - hai che do bo sung cho nhau (khong loai tru):
 * chon tung nguoi cu the, va/hoac chon theo loai nguoi dung (vai tro). Ca hai
 * deu gioi han theo CUNG mot danh sach eligibleRoleKeys (prop, lay tu
 * meta.eligibleRolesByType[type] - xem requestService.getRequestMeta): voi
 * loai xay dung san (pccc/security/other), day la cac vai tro co quyen
 * "{type}.assign"; voi loai tuy chinh (RequestTypeDefinition, vd "mining"), day
 * la allowedReceiverRoles khai bao tren chinh loai do. Truoc day tab "Nguoi
 * dung cu the" tu goi rieng fetchAssignableStaff(`${type}.assign`) - permission
 * nay CHI ton tai voi loai xay dung san, nen voi loai tuy chinh no goi mot
 * permission khong ton tai (vd "mining.assign") va luon tra ve rong, khien tab
 * nay luon trong dù tab "Loai nguoi dung" (dung eligibleRoleKeys) van hien thi
 * dung. Sua bang cach dung chung eligibleRoleKeys (qua fetchAssignableStaffByRoles)
 * cho ca hai tab.
 */
const RequestRecipientPicker: React.FC<RequestRecipientPickerProps> = ({
    type,
    eligibleRoleKeys,
    targetUserIds,
    targetRoles,
    onChangeUserIds,
    onChangeRoles,
    houseId,
    houseRole,
    onChangeHouseRole,
    targetHouseNeighborhoodLeader,
    onChangeTargetHouseNeighborhoodLeader,
}) => {
    const [search, setSearch] = useState("");
    const [staff, setStaff] = useState<AssignableStaff[]>([]);
    const [loadingStaff, setLoadingStaff] = useState(false);
    const [roles, setRoles] = useState<RoleRecord[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(false);

    useEffect(() => {
        setLoadingStaff(true);
        fetchAssignableStaffByRoles(eligibleRoleKeys)
            .then(setStaff)
            .catch(() => setStaff([]))
            .finally(() => setLoadingStaff(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eligibleRoleKeys.join(",")]);

    useEffect(() => {
        setLoadingRoles(true);
        fetchRoles({ active: true, limit: 100 })
            .then(res => setRoles(res.items))
            .catch(() => setRoles([]))
            .finally(() => setLoadingRoles(false));
    }, []);

    const results = staff.filter(s =>
        s.displayName.toLowerCase().includes(search.toLowerCase()),
    );
    const eligibleRoles = roles.filter(r => eligibleRoleKeys.includes(r.key));

    const toggleUser = (id: string) => {
        onChangeUserIds(
            targetUserIds.includes(id)
                ? targetUserIds.filter(u => u !== id)
                : [...targetUserIds, id],
        );
    };

    const toggleRole = (key: string) => {
        onChangeRoles(
            targetRoles.includes(key)
                ? targetRoles.filter(r => r !== key)
                : [...targetRoles, key],
        );
    };

    return (
        <div>
            <Label>Người nhận</Label>
            <Tabs defaultValue="users" className="mt-1.5">
                <TabsList>
                    <TabsTrigger value="users">Người dùng cụ thể</TabsTrigger>
                    <TabsTrigger value="roles">Loại người dùng</TabsTrigger>
                    {type === "task" && (
                        <TabsTrigger value="house">Theo nhà</TabsTrigger>
                    )}
                </TabsList>
                <TabsContent value="users">
                    <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text_3" />
                        <Input
                            className="pl-9"
                            placeholder="Tìm theo tên cán bộ..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="max-h-56 overflow-y-auto rounded-md border border-divider_01">
                        {loadingStaff && <LoadingState />}
                        {!loadingStaff && results.length === 0 && (
                            <EmptyState label="Không tìm thấy cán bộ phù hợp" />
                        )}
                        {!loadingStaff &&
                            results.map(u => (
                                <label
                                    key={u.id}
                                    className="flex cursor-pointer items-center gap-2 border-b border-divider_01 px-3 py-2 text-sm last:border-0 hover:bg-ng_10"
                                >
                                    <Checkbox
                                        checked={targetUserIds.includes(u.id)}
                                        onCheckedChange={() => toggleUser(u.id)}
                                    />
                                    {u.displayName}
                                </label>
                            ))}
                    </div>
                </TabsContent>
                <TabsContent value="roles">
                    <div className="max-h-56 overflow-y-auto rounded-md border border-divider_01">
                        {loadingRoles && <LoadingState />}
                        {!loadingRoles && eligibleRoles.length === 0 && (
                            <EmptyState label="Không có vai trò nào đủ điều kiện nhận loại yêu cầu này" />
                        )}
                        {!loadingRoles &&
                            eligibleRoles.map(r => (
                                <label
                                    key={r.key}
                                    className="flex cursor-pointer items-center gap-2 border-b border-divider_01 px-3 py-2 text-sm last:border-0 hover:bg-ng_10"
                                >
                                    <Checkbox
                                        checked={targetRoles.includes(r.key)}
                                        onCheckedChange={() => toggleRole(r.key)}
                                    />
                                    {r.name}
                                </label>
                            ))}
                    </div>
                </TabsContent>
                {type === "task" && (
                    <TabsContent value="house">
                        {!houseId ? (
                            <p className="py-2 text-sm text-text_2">
                                Chọn nhà liên quan ở trên trước khi gửi theo
                                vai trò trong nhà.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                <div>
                                    <Label>Gửi cho vai trò trong nhà</Label>
                                    <Select
                                        value={houseRole || "__none__"}
                                        onValueChange={v =>
                                            onChangeHouseRole?.(
                                                v === "__none__"
                                                    ? ""
                                                    : (v as RequestHouseRole),
                                            )
                                        }
                                    >
                                        <SelectTrigger className="mt-1.5">
                                            <SelectValue placeholder="Chọn vai trò" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__">
                                                Không chọn
                                            </SelectItem>
                                            {REQUEST_HOUSE_ROLES.map(r => (
                                                <SelectItem key={r} value={r}>
                                                    {REQUEST_HOUSE_ROLE_LABEL[r]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="mt-1 text-xs text-text_2">
                                        Chỉ gửi được đến người ĐÃ có tài khoản
                                        liên kết với vai trò này tại nhà đã
                                        chọn.
                                    </p>
                                </div>
                                <label className="flex cursor-pointer items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={!!targetHouseNeighborhoodLeader}
                                        onCheckedChange={checked =>
                                            onChangeTargetHouseNeighborhoodLeader?.(
                                                checked === true,
                                            )
                                        }
                                    />
                                    Gửi đến Tổ trưởng/Tổ phó của nhà này
                                </label>
                            </div>
                        )}
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
};

export default RequestRecipientPicker;
