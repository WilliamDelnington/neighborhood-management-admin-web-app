import React, { useState } from "react";
import { toast } from "sonner";
import { UploadCloud, ArrowLeftRight, FileDown } from "lucide-react";
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
import ImportProgressBar from "@components/admin/ImportProgressBar";
import ImportErrorConfirmDialog from "@components/admin/ImportErrorConfirmDialog";
import { GIOI_TINH_LABEL, LOAI_CU_TRU_LABEL } from "@constants/domain";
import { AppError } from "@dts";
import {
    CitizenColumnMapping,
    CitizenImportPreviewRow,
    ImportJob,
    uploadCitizenImportFile,
    applyCitizenImportMapping,
    commitCitizenImport,
    downloadCitizenImportTemplate,
    downloadImportJobErrors,
    pollImportJobUntilSettled,
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
    { key: "occupation", label: "Nghề nghiệp/nơi làm việc" },
    { key: "residenceType", label: "Thường trú/Tạm trú" },
    { key: "isElderly", label: "Người cao tuổi" },
    { key: "isChild", label: "Trẻ em" },
    { key: "isDisabledOrSupportNeeded", label: "Người khuyết tật" },
    { key: "isDisabledChild", label: "Trẻ em khuyết tật" },
    { key: "isPartyMember", label: "Đảng viên" },
    { key: "isUnionMember", label: "Đoàn viên" },
    { key: "isMartyr", label: "Liệt sĩ" },
    { key: "isMartyrFamily", label: "Gia đình liệt sĩ" },
    { key: "isVeteran", label: "Cựu chiến binh" },
    { key: "isOtherSpecial", label: "Diện ưu tiên khác" },
    { key: "otherSpecialLabel", label: "Tên diện ưu tiên khác" },
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
    // Sheet nguon da chon de doc (chi co y nghia khi file co nhieu hon 1
    // sheet - xem job.availableSheetNames/job.sourceSheetName). Rong = de
    // backend tu chon sheet dau tien (mac dinh) - QUAN TRONG voi file gop
    // nhieu sheet (vd "Nhà số" + "Chi tiết nhân khẩu"): neu khong chon dung,
    // se doc nham sheet dau tien thay vi sheet nhan khau.
    const [sheetName, setSheetName] = useState("");
    const [uploading, setUploading] = useState(false);
    const [applying, setApplying] = useState(false);
    const [committing, setCommitting] = useState(false);
    const [downloadingTemplate, setDownloadingTemplate] = useState(false);
    // Xac nhan bat buoc khi con dong loi truoc khi thuc su commit - xem
    // ImportErrorConfirmDialog/handleCommit.
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [exportingErrors, setExportingErrors] = useState(false);

    const reset = () => {
        setFile(null);
        setJob(null);
        setMapping(EMPTY_MAPPING);
        setShowMapping(false);
        setSheetName("");
        setUploading(false);
        setApplying(false);
        setCommitting(false);
        setDownloadingTemplate(false);
        setConfirmOpen(false);
    };

    const handleDownloadTemplate = async () => {
        try {
            setDownloadingTemplate(true);
            await downloadCitizenImportTemplate();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDownloadingTemplate(false);
        }
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) reset();
        onOpenChange(next);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setJob(null);
        setMapping(EMPTY_MAPPING);
        setShowMapping(false);
        setSheetName("");
        setFile(e.target.files?.[0] || null);
    };

    const handleUpload = async (overrideSheetName?: string) => {
        if (!file) return;
        try {
            setUploading(true);
            const result = await uploadCitizenImportFile(
                file,
                overrideSheetName || sheetName || undefined,
            );
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

    // Doc lai file DA CHON voi mot sheet khac - dung khi sheet mac dinh (dau
    // tien) khong phai sheet nguoi dung can.
    const handleRereadWithSheet = (nextSheetName: string) => {
        setSheetName(nextSheetName);
        handleUpload(nextSheetName);
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

    const doCommit = async () => {
        if (!job) return;
        try {
            setCommitting(true);
            setConfirmOpen(false);
            await commitCitizenImport(job._id);
            // Backend chuyen job sang "committing" va xu ly tung dong o
            // background (xem processCitizenImportRows) - poll de cap nhat
            // thanh tien do (progress bar) thay vi cho 1 request duy nhat,
            // tranh timeout khi import nhieu du lieu.
            const result = await pollImportJobUntilSettled<CitizenImportPreviewRow>(
                job._id,
                setJob,
            );
            if (result.status === "failed") {
                toast.error("Nhập dữ liệu thất bại, vui lòng thử lại");
                return;
            }
            toast.success(`Đã nhập thành công ${result.createdCount} nhân khẩu`);
            reset();
            onOpenChange(false);
            onImported();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setCommitting(false);
        }
    };

    // Con dong loi -> xac nhan lai truoc (cac dong do se KHONG duoc nhap),
    // khong con chan hoan toan nhu truoc - xem ImportErrorConfirmDialog.
    const handleCommit = () => {
        if (!job) return;
        if (job.rowErrors.length > 0) {
            setConfirmOpen(true);
            return;
        }
        doCommit();
    };

    const handleExportErrors = async () => {
        if (!job) return;
        try {
            setExportingErrors(true);
            await downloadImportJobErrors(job._id, "import-loi-nhan-khau.xlsx");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setExportingErrors(false);
        }
    };

    const canApplyMapping =
        !!mapping.fullName && (!!mapping.householdCode || !!mapping.houseCode);
    const canCommit =
        !!job &&
        !showMapping &&
        job.status !== "committed" &&
        job.status !== "committing" &&
        job.status !== "awaiting_mapping" &&
        (job.previewData.length > 0 || job.skippedRows.length > 0);

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent className="flex w-full flex-col sm:max-w-3xl lg:max-w-[calc(100vw-320px)]">
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
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                loading={downloadingTemplate}
                                onClick={handleDownloadTemplate}
                            >
                                <FileDown className="mr-1 h-4 w-4" />
                                Tải mẫu Excel
                            </Button>
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

                    {job && job.availableSheetNames.length > 1 && (
                        <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                            <p>
                                File này có {job.availableSheetNames.length}{" "}
                                sheet: {job.availableSheetNames.join(", ")}.
                                Đang đọc dữ liệu từ sheet{" "}
                                <strong>&quot;{job.sourceSheetName}&quot;</strong>.
                                Nếu đây không phải sheet chứa dữ liệu nhân
                                khẩu, chọn đúng sheet bên dưới rồi tải lên lại.
                            </p>
                            <div className="flex items-center gap-2">
                                <Select
                                    value={job.sourceSheetName}
                                    onValueChange={handleRereadWithSheet}
                                >
                                    <SelectTrigger className="h-8 bg-white text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {job.availableSheetNames.map(name => (
                                            <SelectItem key={name} value={name}>
                                                {name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
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

                    {job && !showMapping && job.status === "committing" && (
                        <ImportProgressBar
                            createdCount={job.createdCount}
                            skippedCount={job.skippedCount}
                            errorCount={job.rowErrors.length}
                            totalRows={job.totalRows}
                            label="Đang nhập nhân khẩu..."
                        />
                    )}

                    {job && !showMapping && job.status !== "committing" && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span>
                                    Tổng {job.totalRows} dòng — hợp lệ{" "}
                                    {job.validRows} — đã tồn tại{" "}
                                    {job.skippedRows.length} — lỗi{" "}
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
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-medium">
                                            Dòng lỗi (sẽ không được nhập)
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            loading={exportingErrors}
                                            onClick={handleExportErrors}
                                        >
                                            <FileDown className="mr-1 h-3.5 w-3.5" />
                                            Xuất lỗi ra Excel
                                        </Button>
                                    </div>
                                    {job.rowErrors.map(e => (
                                        <div key={e.row}>
                                            Dòng {e.row}: {e.message}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {job.skippedRows.length > 0 && (
                                <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                                    <div className="font-medium">
                                        Dòng đã tồn tại (sẽ bỏ qua)
                                    </div>
                                    {job.skippedRows.map(e => (
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
                                            <TableHead>Nghề nghiệp</TableHead>
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
                                                <TableCell>
                                                    {row.occupation || "—"}
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
                            onClick={() => handleUpload()}
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
            {job && (
                <ImportErrorConfirmDialog
                    open={confirmOpen}
                    createdCount={job.previewData.length}
                    skippedCount={job.skippedRows.length}
                    errorCount={job.rowErrors.length}
                    confirming={committing}
                    onCancel={() => setConfirmOpen(false)}
                    onConfirm={doCommit}
                />
            )}
        </Sheet>
    );
};

export default CitizenImportSheet;
