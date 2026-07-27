import React, { useEffect } from "react";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Label } from "@components/ui/label";
import { Checkbox } from "@components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import { LOAI_SO_HUU_LABEL } from "@constants/domain";
import { LoaiSoHuu } from "@dts";
import { HouseholdInput } from "@service/householdApi";
import { useAuthStore } from "@store/authStore";

export interface HouseholdFormValues {
    cluster: string;
    address: string;
    headOfHousehold: string;
    phone: string;
    memberCount: string;
    ownershipType: LoaiSoHuu;
    needsSupport: boolean;
    note: string;
}

export const EMPTY_HOUSEHOLD_FORM: HouseholdFormValues = {
    cluster: "",
    address: "",
    headOfHousehold: "",
    phone: "",
    memberCount: "",
    ownershipType: "chinh_chu",
    needsSupport: false,
    note: "",
};

export function toHouseholdInput(
    values: HouseholdFormValues,
    houseId?: string | null,
): HouseholdInput {
    return {
        cluster: values.cluster.trim(),
        address: values.address.trim(),
        headOfHousehold: values.headOfHousehold.trim(),
        phone: values.phone.trim() || undefined,
        memberCount: values.memberCount
            ? Number(values.memberCount)
            : undefined,
        ownershipType: values.ownershipType,
        needsSupport: values.needsSupport,
        houseId: houseId !== undefined ? houseId : undefined,
        note: values.note.trim() || undefined,
    };
}

export function isHouseholdFormValid(values: HouseholdFormValues): boolean {
    return !!(
        values.cluster.trim() &&
        values.address.trim() &&
        values.headOfHousehold.trim()
    );
}

interface HouseholdFormProps {
    values: HouseholdFormValues;
    onChange: (values: HouseholdFormValues) => void;
    // Khi tao ho dan tu man chi tiet nha so, cum dan cu duoc ke thua tu nha
    // so va khong cho sua tay de tranh lech voi cum cua nha so cha.
    lockedCluster?: string;
}

/**
 * Bo truong dung chung cho tao moi/chinh sua ho dan.
 */
const HouseholdForm: React.FC<HouseholdFormProps> = ({
    values,
    onChange,
    lockedCluster,
}) => {
    // Nguoi dung duoc phan cong cum (vd to truong) chi duoc chon trong cac cum
    // cua minh, tranh tao/sua ho dan sang cum ma ho khong con thay duoc sau do
    // (backend cung chan tuong tu, day la lop UX tren truoc).
    const assignedClusters = useAuthStore(state => state.user?.assignedClusters) || [];

    const set = <K extends keyof HouseholdFormValues>(
        key: K,
        value: HouseholdFormValues[K],
    ) => onChange({ ...values, [key]: value });

    useEffect(() => {
        if (lockedCluster) {
            if (values.cluster !== lockedCluster) set("cluster", lockedCluster);
            return;
        }
        if (!values.cluster && assignedClusters.length === 1) {
            set("cluster", assignedClusters[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assignedClusters.length, lockedCluster]);

    const renderClusterField = () => {
        if (lockedCluster) {
            return <Input value={lockedCluster} disabled />;
        }
        if (assignedClusters.length > 0) {
            return (
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
            );
        }
        return (
            <Input
                placeholder="VD: Cụm 3"
                value={values.cluster}
                onChange={e => set("cluster", e.target.value)}
            />
        );
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
                <Label>Cụm dân cư</Label>
                {renderClusterField()}
            </div>
            <div className="space-y-1.5">
                <Label>Địa chỉ</Label>
                <Input
                    placeholder="Số nhà, ngõ, đường..."
                    value={values.address}
                    onChange={e => set("address", e.target.value)}
                />
            </div>
            <div className="space-y-1.5">
                <Label>Chủ hộ</Label>
                <Input
                    placeholder="Họ tên chủ hộ"
                    value={values.headOfHousehold}
                    onChange={e => set("headOfHousehold", e.target.value)}
                />
            </div>
            <div className="space-y-1.5">
                <Label>Số điện thoại</Label>
                <Input
                    value={values.phone}
                    onChange={e => set("phone", e.target.value)}
                />
            </div>
            <div className="space-y-1.5">
                <Label>Số nhân khẩu</Label>
                <Input
                    type="number"
                    value={values.memberCount}
                    onChange={e => set("memberCount", e.target.value)}
                />
            </div>
            <div className="space-y-1.5">
                <Label>Hình thức sở hữu</Label>
                <RadioGroup
                    className="flex flex-row gap-5"
                    value={values.ownershipType}
                    onValueChange={v => set("ownershipType", v as LoaiSoHuu)}
                >
                    {(
                        Object.entries(LOAI_SO_HUU_LABEL) as [
                            LoaiSoHuu,
                            string,
                        ][]
                    ).map(([key, label]) => (
                        <label
                            key={key}
                            htmlFor={`ownershipType-${key}`}
                            className="flex items-center gap-2 text-sm"
                        >
                            <RadioGroupItem id={`ownershipType-${key}`} value={key} />
                            {label}
                        </label>
                    ))}
                </RadioGroup>
            </div>
            <label
                htmlFor="needsSupport"
                className="flex items-center gap-2 text-sm"
            >
                <Checkbox
                    id="needsSupport"
                    checked={values.needsSupport}
                    onCheckedChange={checked =>
                        set("needsSupport", checked === true)
                    }
                />
                Hộ cần hỗ trợ
            </label>
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

export default HouseholdForm;
