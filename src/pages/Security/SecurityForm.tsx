import React from "react";
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
import HouseholdPicker from "@components/admin/HouseholdPicker";
import { LOAI_SO_HUU_LABEL, MUC_DO_AN_NINH_LABEL } from "@constants/domain";
import { Household, LoaiSoHuu, MucDoAnNinh } from "@dts";
import { SecurityRecordInput } from "@service/securityApi";

export interface SecurityFormValues {
    householdId: string;
    householdLabel: string;
    ownershipType: LoaiSoHuu;
    renterCount: string;
    temporaryResidenceDeclared: boolean;
    hasCamera: boolean;
    hasSecurityComplaint: boolean;
    level: MucDoAnNinh;
    reportedToPolice: boolean;
    handlingStatus: string;
    note: string;
}

export const EMPTY_SECURITY_FORM: SecurityFormValues = {
    householdId: "",
    householdLabel: "",
    ownershipType: "chinh_chu",
    renterCount: "",
    temporaryResidenceDeclared: false,
    hasCamera: false,
    hasSecurityComplaint: false,
    level: "binh_thuong",
    reportedToPolice: false,
    handlingStatus: "",
    note: "",
};

export function toSecurityInput(
    values: SecurityFormValues,
): SecurityRecordInput {
    return {
        householdId: values.householdId,
        ownershipType: values.ownershipType,
        renterCount: values.renterCount
            ? Number(values.renterCount)
            : undefined,
        temporaryResidenceDeclared: values.temporaryResidenceDeclared,
        hasCamera: values.hasCamera,
        hasSecurityComplaint: values.hasSecurityComplaint,
        level: values.level,
        reportedToPolice: values.reportedToPolice,
        handlingStatus: values.handlingStatus.trim() || undefined,
        note: values.note.trim() || undefined,
    };
}

export function isSecurityFormValid(values: SecurityFormValues): boolean {
    return !!values.householdId;
}

interface SecurityFormProps {
    values: SecurityFormValues;
    onChange: (values: SecurityFormValues) => void;
}

/**
 * Bo truong dung chung cho tao moi/chinh sua ho so an ninh, tam tru, nha cho thue.
 */
const SecurityForm: React.FC<SecurityFormProps> = ({ values, onChange }) => {
    const set = <K extends keyof SecurityFormValues>(
        key: K,
        value: SecurityFormValues[K],
    ) => onChange({ ...values, [key]: value });

    return (
        <div className="flex flex-col gap-4">
            <HouseholdPicker
                value={values.householdId}
                valueLabel={values.householdLabel}
                onChange={(householdId, household: Household) =>
                    onChange({
                        ...values,
                        householdId,
                        householdLabel: `${household.code} — ${household.address}`,
                    })
                }
            />
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
                            <RadioGroupItem
                                id={`ownershipType-${key}`}
                                value={key}
                            />
                            {label}
                        </label>
                    ))}
                </RadioGroup>
            </div>
            <div className="space-y-1.5">
                <Label>Số người thuê</Label>
                <Input
                    type="number"
                    value={values.renterCount}
                    onChange={e => set("renterCount", e.target.value)}
                />
            </div>
            <div className="flex flex-col gap-2">
                <label
                    htmlFor="temporaryResidenceDeclared"
                    className="flex items-center gap-2 text-sm"
                >
                    <Checkbox
                        id="temporaryResidenceDeclared"
                        checked={values.temporaryResidenceDeclared}
                        onCheckedChange={checked =>
                            set(
                                "temporaryResidenceDeclared",
                                checked === true,
                            )
                        }
                    />
                    Đã khai báo tạm trú
                </label>
                <label
                    htmlFor="hasCamera"
                    className="flex items-center gap-2 text-sm"
                >
                    <Checkbox
                        id="hasCamera"
                        checked={values.hasCamera}
                        onCheckedChange={checked =>
                            set("hasCamera", checked === true)
                        }
                    />
                    Có camera
                </label>
                <label
                    htmlFor="hasSecurityComplaint"
                    className="flex items-center gap-2 text-sm"
                >
                    <Checkbox
                        id="hasSecurityComplaint"
                        checked={values.hasSecurityComplaint}
                        onCheckedChange={checked =>
                            set("hasSecurityComplaint", checked === true)
                        }
                    />
                    Có phản ánh an ninh
                </label>
                <label
                    htmlFor="reportedToPolice"
                    className="flex items-center gap-2 text-sm"
                >
                    <Checkbox
                        id="reportedToPolice"
                        checked={values.reportedToPolice}
                        onCheckedChange={checked =>
                            set("reportedToPolice", checked === true)
                        }
                    />
                    Đã báo công an khu vực
                </label>
            </div>
            <div className="space-y-1.5">
                <Label>Mức độ</Label>
                <Select
                    value={values.level}
                    onValueChange={v => set("level", v as MucDoAnNinh)}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {(
                            Object.entries(MUC_DO_AN_NINH_LABEL) as [
                                MucDoAnNinh,
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
            <div className="space-y-1.5">
                <Label>Tình trạng xử lý</Label>
                <Input
                    placeholder="VD: Đã xử lý, đang theo dõi..."
                    value={values.handlingStatus}
                    onChange={e => set("handlingStatus", e.target.value)}
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

export default SecurityForm;
