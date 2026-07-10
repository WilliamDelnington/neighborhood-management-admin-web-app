import React from "react";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Label } from "@components/ui/label";
import { Checkbox } from "@components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import { LOAI_SO_HUU_LABEL } from "@constants/domain";
import { LoaiSoHuu } from "@dts";
import { HouseholdInput } from "@service/householdApi";

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

export function toHouseholdInput(values: HouseholdFormValues): HouseholdInput {
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
}

/**
 * Bo truong dung chung cho tao moi/chinh sua ho dan.
 */
const HouseholdForm: React.FC<HouseholdFormProps> = ({ values, onChange }) => {
    const set = <K extends keyof HouseholdFormValues>(
        key: K,
        value: HouseholdFormValues[K],
    ) => onChange({ ...values, [key]: value });

    return (
        <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
                <Label>Cụm dân cư</Label>
                <Input
                    placeholder="VD: Cụm 3"
                    value={values.cluster}
                    onChange={e => set("cluster", e.target.value)}
                />
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
