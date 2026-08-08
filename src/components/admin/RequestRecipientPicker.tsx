import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Checkbox } from "@components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import { LoadingState, EmptyState } from "@components/admin/DataStates";
import { AssignableStaff, RequestType, RoleRecord } from "@dts";
import { fetchAssignableStaff } from "@service/userApi";
import { fetchRoles } from "@service/roleApi";

export interface RequestRecipientPickerProps {
    type: RequestType;
    eligibleRoleKeys: string[];
    targetUserIds: string[];
    targetRoles: string[];
    onChangeUserIds: (ids: string[]) => void;
    onChangeRoles: (keys: string[]) => void;
}

/**
 * Chon nguoi nhan yeu cau - hai che do bo sung cho nhau (khong loai tru):
 * chon tung nguoi cu the, va/hoac chon theo loai nguoi dung (vai tro). Danh
 * sach nguoi/vai tro deu gioi han theo permission "{type}.assign" - chi nhung
 * ai du dieu kien nhan yeu cau loai nay moi hien ra (xem requestService.ts).
 */
const RequestRecipientPicker: React.FC<RequestRecipientPickerProps> = ({
    type,
    eligibleRoleKeys,
    targetUserIds,
    targetRoles,
    onChangeUserIds,
    onChangeRoles,
}) => {
    const [search, setSearch] = useState("");
    const [staff, setStaff] = useState<AssignableStaff[]>([]);
    const [loadingStaff, setLoadingStaff] = useState(false);
    const [roles, setRoles] = useState<RoleRecord[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(false);

    useEffect(() => {
        setLoadingStaff(true);
        fetchAssignableStaff(`${type}.assign`)
            .then(setStaff)
            .catch(() => setStaff([]))
            .finally(() => setLoadingStaff(false));
    }, [type]);

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
            </Tabs>
        </div>
    );
};

export default RequestRecipientPicker;
