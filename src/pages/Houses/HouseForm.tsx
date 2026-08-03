import React, { useEffect, useState } from "react";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Label } from "@components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import { HouseInput } from "@service/houseApi";
import { fetchStreets } from "@service/streetApi";
import { fetchNeighborhoods } from "@service/neighborhoodApi";
import OrganizationPicker from "@components/admin/OrganizationPicker";
import { Neighborhood, Organization, Street } from "@dts";
import { useAuthStore, usePermission } from "@store/authStore";

export interface HouseFormValues {
    cluster: string;
    streetId: string;
    neighborhoodId: string;
    address: string;
    note: string;
    residenceDeclarationNumber: string;
    // "" = dang ky bang ca nhan (mac dinh). Chi co y nghia luc tao moi - backend
    // khong ho tro doi chu nha sau khi da tao (xem houseRecordService.createHouseRecord).
    organizationId: string;
    organizationLabel: string;
}

export const EMPTY_HOUSE_FORM: HouseFormValues = {
    cluster: "",
    streetId: "",
    neighborhoodId: "",
    address: "",
    note: "",
    residenceDeclarationNumber: "",
    organizationId: "",
    organizationLabel: "",
};

export function toHouseInput(values: HouseFormValues): HouseInput {
    return {
        cluster: values.streetId ? undefined : values.cluster.trim(),
        streetId: values.streetId || undefined,
        neighborhoodId: values.neighborhoodId || null,
        address: values.address.trim(),
        note: values.note.trim() || undefined,
        residenceDeclarationNumber:
            values.residenceDeclarationNumber.trim() || undefined,
        organizationId: values.organizationId || undefined,
    };
}

export function isHouseFormValid(values: HouseFormValues): boolean {
    return !!(
        (values.cluster.trim() || values.streetId) &&
        values.address.trim()
    );
}

interface HouseFormProps {
    values: HouseFormValues;
    onChange: (values: HouseFormValues) => void;
    mode?: "create" | "edit";
}

/**
 * Bo truong dung chung cho tao moi/chinh sua nha so.
 */
const HouseForm: React.FC<HouseFormProps> = ({
    values,
    onChange,
    mode = "create",
}) => {
    // Nguoi dung duoc phan cong cum (vd to truong) chi duoc chon trong cac cum
    // cua minh, tuong tu HouseholdForm.
    const assignedClusters = useAuthStore(state => state.user?.assignedClusters) || [];
    // Chi nguoi dung co quyen "streets.read" (vd admin) moi thay Street picker -
    // house_owner tu khai bao cum dan cu tu do nhu truoc (xem streetSync.ts o backend).
    const canPickStreet = usePermission("streets.read");
    const [streets, setStreets] = useState<Street[]>([]);
    // To dan pho la thuoc tinh rieng cua nha so, KHONG suy ra tu Street (mot
    // duong/pho co the chay qua nhieu to dan pho) - xem models/HouseRecord.ts.
    const canPickNeighborhood = usePermission("neighborhoods.read");
    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    // Chi house_owner/admin (nguoi co the la nguoi dai dien to chuc) moi thay
    // lua chon nay, va chi luc tao moi - xem ghi chu o HouseFormValues.organizationId.
    const hasOrganizationPermission = usePermission("organizations.create");
    const canPickOrganization = mode === "create" && hasOrganizationPermission;

    const set = <K extends keyof HouseFormValues>(
        key: K,
        value: HouseFormValues[K],
    ) => onChange({ ...values, [key]: value });

    useEffect(() => {
        if (!values.cluster && assignedClusters.length === 1) {
            set("cluster", assignedClusters[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assignedClusters.length]);

    useEffect(() => {
        if (!canPickStreet) return;
        fetchStreets({ active: true, limit: 200 })
            .then(res => setStreets(res.items))
            .catch(() => setStreets([]));
    }, [canPickStreet]);

    useEffect(() => {
        if (!canPickNeighborhood) return;
        fetchNeighborhoods({ active: true, limit: 200 })
            .then(res => setNeighborhoods(res.items))
            .catch(() => setNeighborhoods([]));
    }, [canPickNeighborhood]);

    return (
        <div className="flex flex-col gap-4">
            {canPickStreet ? (
                <div className="space-y-1.5">
                    <Label>Đường/phố</Label>
                    <Select
                        value={values.streetId}
                        onValueChange={v => set("streetId", v)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Chọn đường/phố" />
                        </SelectTrigger>
                        <SelectContent>
                            {streets.map(s => (
                                <SelectItem key={s._id} value={s._id}>
                                    {s.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            ) : (
                <div className="space-y-1.5">
                    <Label>Cụm dân cư</Label>
                    {assignedClusters.length > 0 ? (
                        <Select
                            value={values.cluster}
                            onValueChange={v => set("cluster", v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn cụm dân cư" />
                            </SelectTrigger>
                            <SelectContent>
                                {assignedClusters.map(c => (
                                    <SelectItem key={c} value={c}>
                                        {c}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Input
                            placeholder="VD: Cụm 3"
                            value={values.cluster}
                            onChange={e => set("cluster", e.target.value)}
                        />
                    )}
                </div>
            )}
            {canPickNeighborhood && (
                <div className="space-y-1.5">
                    <Label>Tổ dân phố</Label>
                    <Select
                        value={values.neighborhoodId || "__none__"}
                        onValueChange={v =>
                            set("neighborhoodId", v === "__none__" ? "" : v)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Chưa gán tổ dân phố" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__none__">
                                Chưa gán tổ dân phố
                            </SelectItem>
                            {neighborhoods.map(n => (
                                <SelectItem key={n._id} value={n._id}>
                                    {n.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
            <div className="space-y-1.5">
                <Label>Địa chỉ</Label>
                <Input
                    placeholder="Số nhà, ngõ, đường..."
                    value={values.address}
                    onChange={e => set("address", e.target.value)}
                />
            </div>
            {canPickOrganization && (
                <OrganizationPicker
                    value={values.organizationId}
                    valueLabel={values.organizationLabel}
                    onChange={(organizationId, organization: Organization | undefined) => {
                        onChange({
                            ...values,
                            organizationId: organizationId || "",
                            organizationLabel: organization?.name || "",
                        });
                    }}
                />
            )}
            <div className="space-y-1.5">
                <Label>Số khai báo cư trú</Label>
                <Input
                    placeholder="Số khai báo tạm trú/thường trú do công an cấp (nếu có)"
                    value={values.residenceDeclarationNumber}
                    onChange={e =>
                        set("residenceDeclarationNumber", e.target.value)
                    }
                />
            </div>
            <div className="space-y-1.5">
                <Label>Ghi chú</Label>
                <Textarea
                    placeholder="Ghi chú thêm (nếu có)"
                    value={values.note}
                    onChange={e => set("note", e.target.value)}
                />
            </div>
        </div>
    );
};

export default HouseForm;
