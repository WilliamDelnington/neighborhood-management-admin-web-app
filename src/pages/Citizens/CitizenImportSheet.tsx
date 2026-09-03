import React, { useState } from "react";
import { toast } from "sonner";
import { UploadCloud, ArrowLeftRight } from "lucide-react";
import { Button } from "@components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@components/ui/table";
import { GIOI_TINH_LABEL, LOAI_CU_TRU_LABEL } from "@constants/domain";
import { AppError } from "@dts";
import {
    CitizenColumnMapping,
    CitizenImportPreviewRow,
    ImportJob,
    uploadCitizenImportFile,
    applyCitizenImportMapping,
    commitCitizenImport,
} from "@service/importApi";

interface CitizenImportSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImported: () => void;
}

const NONE_VALUE = "__none__";

// Nhan hien thi cho tung truong co the mapping - "required" chi ap dung cho
// "fullName" ("Họ tên"). "householdCode"/"houseCode" khong danh dau required
// rieng le (khong cot nao BAT BUOC phai co) nhung PHAI chon it nhat MOT
// trong hai - kiem tra rieng o canApplyMapping/backend
// (citizenImportMappingSchema), vi day la dieu kien "mot trong hai", khong
// phai "ca hai deu bat buoc".
const CITIZEN_MAPPING_FIELDS: {
    key: keyof CitizenColumnMapping;
    label: string;
    required?: boolean;
}[] = [
    { key: "fullName", label: "Họ tên", required: true },
    { key: "householdCode", label: "Mã hộ" },
    { key: "houseCode", label: "Mã căn/hộ" },
    { key: "phone", label: "Số điện thoại" },
    { key: "cccd", label: "CCCD" },
    { key: "birthDate", label: "Ngày sinh" },
    { key: "gender", label: "Giới tính" },
    { key: "relationToHead", label: "Quan hệ với chủ hộ" },
    { key: "residenceType", label: "Thường trú/Tạm trú" },
    { key: "isElderly", label: "Người cao tuổi" },
    { key: "isChild", label: "Trẻ em" },
    { key: "isDisabledOrSupportNeeded", label: "Người khuyết tật" },
    { key: "isPartyMember", label: "Đảng viên" },
    { key: "isUnionMember", label: "Đoàn viên" },
];

type MappingForm = Record<keyof CitizenColumnMapping, string>;

const EMPTY_MAPPING: MappingForm = CITIZEN_MAPPING_FIELDS.reduce(
    (acc, f) => ({ ...acc, [f.key]: "" }),
    {} as MappingForm,
);

const CitizenImportSheet: React.FC<CitizenImportSheetProps> = ({
    open,
    onOpenChange,
    onImported,
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [job, setJob] = useState<ImportJob<CitizenImportPreviewRow> | null>(
        null,
    );
    const [mapping, setMapping] = useState<MappingForm>(EMPTY_MAPPING);
    const [showMapping, setShowMapping] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [applying, setApplying] = useState(false);
    const [committing, setCommitting] = useState(false);

    const reset = () => {
        setFile(null);
        setJob(null);
        setMapping(EMPTY_MAPPING);
        setShowMapping(false);
        setUploading(false);
        setApplying(false);
        setCommitting(false);
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) reset();
        onOpenChange(next);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setJob(null);
        setMapping(EMPTY_MAPPING);
        setShowMapping(false);
        setFile(e.target.files?.[0] || null);
    };

    const handleUpload = async () => {
        if (!file) return;
        try {
            setUploading(true);
            const result = await uploadCitizenImportFile(file);
            setJob(result);
            const suggested = { ...EMPTY_MAPPING };
            CITIZEN_MAPPING_FIELDS.forEach(f => {
                suggested[f.key] = result.suggestedMapping[f.key] || "";
            });
            setMapping(suggested);
            setShowMapping(true);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setUploading(false);
        }
    };

    const handleApplyMapping = async () => {
        if (!job || !mapping.fullName) return;
        if (!mapping.householdCode && !mapping.houseCode) return;
        try {
            setApplying(true);
            const payload: Partial<CitizenColumnMapping> = {
                fullName: mapping.fullName,
            };
            CITIZEN_MAPPING_FIELDS.forEach(f => {
                if (f.required) return;
                if (mapping[f.key]) payload[f.key] = mapping[f.key];
            });

            const result = await applyCitizenImportMapping(
                job._id,
                payload as CitizenColumnMapping,
            );
            setJob(result);
            setShowMapping(false);
            if (result.rowErrors.length > 0) {
                toast.error(
                    `Có ${result.rowErrors.length} dòng không hợp lệ, vui lòng kiểm tra lại`,
                );
            } else {
                toast.success(
                    `Đã kiểm tra ${result.validRows} dòng, sẵn sàng để nhập`,
                );
            }
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setApplying(false);
        }
    };

    const handleCommit = async () => {
        if (!job) return;
        try {
            setCommitting(true);
            const result = await commitCitizenImport(job._id);
            toast.success(`Đã nhập thành công ${result.committedCount} nhân khẩu`);
            reset();
            onOpenChange(false);
            onImported();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setCommitting(false);
        }
    };

    const canApplyMapping =
        !!mapping.fullName && (!!mapping.householdCode || !!mapping.houseCode);
    const canCommit =
        !!job &&
        !showMapping &&
        job.status !== "committed" &&
        job.status !== "awaiting_mapping" &&
        job.rowErrors.length === 0;

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Nhập nhân khẩu từ Excel</SheetTitle>
                </SheetHeader>
                <div className="flex-1 space-y-4 overflow-y-auto py-4">
                    {!job && (
                        <>
                            <div className="rounded-lg border border-divider_01 bg-surface_2 p-3 text-xs text-text_2">
                                Tải lên file Excel bất kỳ có dòng tiêu đề ở
                                hàng đầu tiên. Sau khi tải lên, bạn sẽ chọn cột
                                nào tương ứng với &quot;Họ tên&quot;,
                                &quot;Mã hộ&quot;... — không cần tên cột phải
                                khớp chính xác. Để liên kết nhân khẩu với hộ
                                dân, dùng &quot;Mã hộ&quot; (nếu file có sẵn mã
                                hộ) hoặc &quot;Mã căn/hộ&quot; (mã nhà số — hệ
                                thống sẽ tự tìm hộ dân đang gắn với nhà đó).
                            </div>
                            <div>
                                <input
                                    type="file"
                                    accept=".xlsx"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-text_1 file:mr-3 file:rounded-lg file:border-0 file:bg-main file:px-3 file:py-2 file:text-sm file:text-white"
                                />
                            </div>
                        </>
                    )}

                    {job && showMapping && (
                        <div className="space-y-4">
                            <div className="rounded-lg border border-divider_01 bg-surface_2 p-3 text-xs text-text_2">
                                Đã đọc {job.totalRows} dòng dữ liệu với các cột:{" "}
                                {job.headers.join(", ")}. &quot;Họ tên&quot; là
                                bắt buộc, và cần chọn ít nhất một trong
                                &quot;Mã hộ&quot; / &quot;Mã căn/hộ&quot; —
                                các trường khác có thể để &quot;Không dùng&quot;
                                nếu file không có cột tương ứng.
                            </div>

                            {CITIZEN_MAPPING_FIELDS.map(f => (
                                <div key={f.key} className="space-y-1">
                                    <label
                                        htmlFor={`mapping-${f.key}`}
                                        className="text-sm font-medium"
                                    >
                                        Cột &quot;{f.label}&quot;
                                        {f.required && (
                                            <span className="text-red-500">
                                                {" "}
                                                *
                                            </span>
                                        )}
                                    </label>
                                    <Select
                                        value={mapping[f.key] || NONE_VALUE}
                                        onValueChange={v =>
                                            setMapping(prev => ({
                                                ...prev,
                                                [f.key]:
                                                    v === NONE_VALUE ? "" : v,
                                            }))
                                        }
                                    >
                                        <SelectTrigger id={`mapping-${f.key}`}>
                                            <SelectValue placeholder="Chọn cột..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {!f.required && (
                                                <SelectItem value={NONE_VALUE}>
                                                    Không dùng
                                                </SelectItem>
                                            )}
                                            {job.headers.map(h => (
                                                <SelectItem key={h} value={h}>
                                                    {h}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                    )}

                    {job && !showMapping && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span>
                                    Tổng {job.totalRows} dòng — hợp lệ{" "}
                                    {job.validRows} — lỗi{" "}
                                    {job.rowErrors.length}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowMapping(true)}
                                >
                                    <ArrowLeftRight className="mr-1 h-3.5 w-3.5" />
                                    Chọn lại cột
                                </Button>
                            </div>

                            {job.rowErrors.length > 0 && (
                                <div className="space-y-1 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                                    {job.rowErrors.map(e => (
                                        <div key={e.row}>
                                            Dòng {e.row}: {e.message}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {job.previewData.length > 0 && (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12 text-center">STT</TableHead>
                                            <TableHead>Họ tên</TableHead>
                                            <TableHead>SĐT</TableHead>
                                            <TableHead>Giới tính</TableHead>
                                            <TableHead>Loại cư trú</TableHead>
                                            <TableHead>Quan hệ với chủ hộ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {job.previewData.map((row, idx) => (
                                            // eslint-disable-next-line react/no-array-index-key
                                            <TableRow key={`${row.fullName}-${idx}`}>
                                                <TableCell className="text-center text-text_2">
                                                    {idx + 1}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {row.fullName}
                                                </TableCell>
                                                <TableCell>
                                                    {row.phone || "—"}
                                                </TableCell>
                                                <TableCell>
                                                    {GIOI_TINH_LABEL[
                                                        row.gender as keyof typeof GIOI_TINH_LABEL
                                                    ] || row.gender}
                                                </TableCell>
                                                <TableCell>
                                                    {LOAI_CU_TRU_LABEL[
                                                        row.residenceType as keyof typeof LOAI_CU_TRU_LABEL
                                                    ] || row.residenceType}
                                                </TableCell>
                                                <TableCell>
                                                    {row.relationToHead || "—"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    )}
                </div>
                <SheetFooter className="flex-col gap-2">
                    {!job && (
                        <Button
                            className="w-full"
                            disabled={!file}
                            loading={uploading}
                            onClick={handleUpload}
                        >
                            <UploadCloud className="mr-1 h-4 w-4" />
                            Tải lên
                        </Button>
                    )}
                    {job && showMapping && (
                        <Button
                            className="w-full"
                            disabled={!canApplyMapping}
                            loading={applying}
                            onClick={handleApplyMapping}
                        >
                            Xem trước
                        </Button>
                    )}
                    {job && !showMapping && (
                        <Button
                            className="w-full"
                            disabled={!canCommit}
                            loading={committing}
                            onClick={handleCommit}
                        >
                            Xác nhận nhập {job.validRows} nhân khẩu
                        </Button>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default CitizenImportSheet;
