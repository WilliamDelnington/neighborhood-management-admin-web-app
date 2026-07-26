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
import HousePicker from "@components/admin/HousePicker";
import {
    LOAI_SO_HUU_LABEL,
    MUC_DO_AN_NINH_LABEL,
    TINH_TRANG_THEO_DOI_AN_NINH_LABEL,
} from "@constants/domain";
import { House, LoaiSoHuu, MucDoAnNinh, TinhTrangTheoDoiAnNinh } from "@dts";
import { SecurityRecordInput } from "@service/securityApi";

export interface SecurityFormValues {
    houseId: string;
    houseLabel: string;
    houseDeclarationNumber: string;
    ownershipType: LoaiSoHuu;
    renterCount: string;
    hasCamera: boolean;
    hasSecurityComplaint: boolean;
    level: MucDoAnNinh;
    reportedToPolice: boolean;
    monitoringStatus: TinhTrangTheoDoiAnNinh;
    note: string;
    inspectionDate: string;
}

export const EMPTY_SECURITY_FORM: SecurityFormValues = {
    houseId: "",
    houseLabel: "",
    houseDeclarationNumber: "",
    ownershipType: "chinh_chu",
    renterCount: "",
    hasCamera: false,
    hasSecurityComplaint: false,
    level: "binh_thuong",
    reportedToPolice: false,
    monitoringStatus: "binh_thuong",
    note: "",
    inspectionDate: "",
};

export function toSecurityInput(
    values: SecurityFormValues,
): SecurityRecordInput {
    return {
        houseId: values.houseId,
        ownershipType: values.ownershipType,
        renterCount: values.renterCount
            ? Number(values.renterCount)
            : undefined,
        hasCamera: values.hasCamera,
        hasSecurityComplaint: values.hasSecurityComplaint,
        level: values.level,
        reportedToPolice: values.reportedToPolice,
        monitoringStatus: values.monitoringStatus,
        note: values.note.trim() || undefined,
        inspectionDate: values.inspectionDate
            ? new Date(values.inspectionDate).toISOString()
            : "",
    };
}

export function isSecurityFormValid(values: SecurityFormValues): boolean {
    return !!(values.houseId && values.inspectionDate);
}

interface SecurityFormProps {
    values: SecurityFormValues;
    onChange: (values: SecurityFormValues) => void;
    /** Noi dung chen ngay sau truong "Ngay kiem tra" (vd. khu vuc phan cong theo doi). */
    afterInspectionDate?: React.ReactNode;
}

/**
 * Bo truong dung chung cho tao moi/chinh sua ho so an ninh, tam tru, nha cho thue.
 */
const SecurityForm: React.FC<SecurityFormProps> = ({
    values,
    onChange,
    afterInspectionDate,
}) => {
    const set = <K extends keyof SecurityFormValues>(
        key: K,
        value: SecurityFormValues[K],
    ) => onChange({ ...values, [key]: value });

    return (
        <div className="flex flex-col gap-4">
            <HousePicker
                value={values.houseId}
                valueLabel={values.houseLabel}
                onChange={(houseId, house: House) =>
                    onChange({
                        ...values,
                        houseId,
                        houseLabel: `${house.code} — ${house.address}`,
                        houseDeclarationNumber:
                            house.residenceDeclarationNumber || "",
                    })
                }
            />
            <div className="space-y-1.5">
                <Label>Số khai báo cư trú</Label>
                <Input
                    disabled
                    value={
                        values.houseDeclarationNumber ||
                        "Chưa có (khai báo tại hồ sơ Nhà số)"
                    }
                />
            </div>
            <div className="space-y-1.5">
                <Label>Ngày kiểm tra</Label>
                <Input
                    type="date"
                    value={values.inspectionDate}
                    onChange={e => set("inspectionDate", e.target.value)}
                />
            </div>
            {afterInspectionDate}
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
                <Label>Số người đang ở thực tế</Label>
                <Input
                    type="number"
                    value={values.renterCount}
                    onChange={e => set("renterCount", e.target.value)}
                />
            </div>
            <div className="flex flex-col gap-2">
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
                <Label>Tình trạng theo dõi</Label>
                <Select
                    value={values.monitoringStatus}
                    onValueChange={v =>
                        set("monitoringStatus", v as TinhTrangTheoDoiAnNinh)
                    }
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {(
                            Object.entries(
                                TINH_TRANG_THEO_DOI_AN_NINH_LABEL,
                            ) as [TinhTrangTheoDoiAnNinh, string][]
                        ).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
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
