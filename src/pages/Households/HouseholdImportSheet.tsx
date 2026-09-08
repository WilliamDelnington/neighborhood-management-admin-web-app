import React, { useState } from "react";
import { toast } from "sonner";
import { UploadCloud, FileDown } from "lucide-react";
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
import { Badge } from "@components/ui/badge";
import ImportProgressBar from "@components/admin/ImportProgressBar";
import ImportErrorConfirmDialog from "@components/admin/ImportErrorConfirmDialog";
import { LOAI_SO_HUU_LABEL } from "@constants/domain";
import { AppError, LoaiSoHuu } from "@dts";
import {
    HouseholdImportPreviewRow,
    ImportJob,
    uploadHouseholdImportFile,
    commitHouseholdImport,
    downloadHouseholdImportTemplate,
    downloadImportJobErrors,
    pollImportJobUntilSettled,
} from "@service/importApi";

interface HouseholdImportSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImported: () => void;
}

const HouseholdImportSheet: React.FC<HouseholdImportSheetProps> = ({
    open,
    onOpenChange,
    onImported,
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [job, setJob] = useState<ImportJob<HouseholdImportPreviewRow> | null>(
        null,
    );
    // Sheet nguon da chon de doc (chi co y nghia khi file co nhieu hon 1
    // sheet - xem job.availableSheetNames/job.sourceSheetName). Rong = de
    // backend tu chon sheet dau tien (mac dinh).
    const [sheetName, setSheetName] = useState("");
    const [uploading, setUploading] = useState(false);
    const [committing, setCommitting] = useState(false);
    const [downloadingTemplate, setDownloadingTemplate] = useState(false);
    // Xac nhan bat buoc khi con dong loi truoc khi thuc su commit - xem
    // ImportErrorConfirmDialog/handleCommit.
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [exportingErrors, setExportingErrors] = useState(false);

    const reset = () => {
        setFile(null);
        setJob(null);
        setSheetName("");
        setUploading(false);
        setCommitting(false);
        setDownloadingTemplate(false);
        setConfirmOpen(false);
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) reset();
        onOpenChange(next);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setJob(null);
        setSheetName("");
        setFile(e.target.files?.[0] || null);
    };

    const handleDownloadTemplate = async () => {
        try {
            setDownloadingTemplate(true);
            await downloadHouseholdImportTemplate();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDownloadingTemplate(false);
        }
    };

    const handleUpload = async (overrideSheetName?: string) => {
        if (!file) return;
        try {
            setUploading(true);
            const result = await uploadHouseholdImportFile(
                file,
                overrideSheetName || sheetName || undefined,
            );
            setJob(result);
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
            setUploading(false);
        }
    };

    // Doc lai file DA CHON voi mot sheet khac - dung khi sheet mac dinh (dau
    // tien) khong phai sheet nguoi dung can.
    const handleRereadWithSheet = (nextSheetName: string) => {
        setSheetName(nextSheetName);
        handleUpload(nextSheetName);
    };

    const doCommit = async () => {
        if (!job) return;
        try {
            setCommitting(true);
            setConfirmOpen(false);
            await commitHouseholdImport(job._id);
            // Backend chuyen job sang "committing" va xu ly tung dong o
            // background (xem processHouseholdImportRows) - poll de cap nhat
            // thanh tien do (progress bar) thay vi cho 1 request duy nhat,
            // tranh timeout khi import nhieu du lieu.
            const result = await pollImportJobUntilSettled<HouseholdImportPreviewRow>(
                job._id,
                setJob,
            );
            if (result.status === "failed") {
                toast.error("Nhập dữ liệu thất bại, vui lòng thử lại");
                return;
            }
            toast.success(`Đã nhập thành công ${result.createdCount} hộ dân`);
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
            await downloadImportJobErrors(job._id, "import-loi-ho-dan.xlsx");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setExportingErrors(false);
        }
    };

    const canCommit =
        !!job &&
        job.status !== "committed" &&
        job.status !== "committing" &&
        (job.previewData.length > 0 || job.skippedRows.length > 0);

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent className="flex w-full flex-col sm:max-w-3xl lg:max-w-[calc(100vw-320px)]">
                <SheetHeader>
                    <SheetTitle>Nhập hộ dân từ Excel</SheetTitle>
                </SheetHeader>
                <div className="flex-1 space-y-4 overflow-y-auto py-4">
                    {!job && (
                        <>
                            <div className="rounded-lg border border-divider_01 bg-surface_2 p-3 text-xs text-text_2">
                                Tải lên file Excel có dòng tiêu đề ở hàng đầu
                                tiên, với các cột khớp đúng tên: &quot;Cụm dân
                                cư&quot;, &quot;Địa chỉ&quot;, &quot;Chủ
                                hộ&quot;, &quot;Số điện thoại&quot;, &quot;Loại
                                sở hữu&quot;, &quot;Cần hỗ trợ&quot;, &quot;Ghi
                                chú&quot; — tải mẫu bên dưới để đảm bảo đúng
                                định dạng. Mỗi hộ dân được tạo sẽ tự động có
                                sẵn 1 nhân khẩu &quot;Chủ hộ&quot;.
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
                                Nếu đây không phải sheet chứa dữ liệu hộ dân,
                                chọn đúng sheet bên dưới rồi tải lên lại.
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

                    {job && job.status === "committing" && (
                        <ImportProgressBar
                            createdCount={job.createdCount}
                            skippedCount={job.skippedCount}
                            errorCount={job.rowErrors.length}
                            totalRows={job.totalRows}
                            label="Đang nhập hộ dân..."
                        />
                    )}

                    {job && job.status !== "committing" && (
                        <div className="space-y-3">
                            <div className="text-sm">
                                Tổng {job.totalRows} dòng — hợp lệ{" "}
                                {job.validRows} — đã tồn tại{" "}
                                {job.skippedRows.length} — lỗi{" "}
                                {job.rowErrors.length}
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
                                            <TableHead>Cụm dân cư</TableHead>
                                            <TableHead>Địa chỉ</TableHead>
                                            <TableHead>Chủ hộ</TableHead>
                                            <TableHead>SĐT</TableHead>
                                            <TableHead>Loại sở hữu</TableHead>
                                            <TableHead>Cần hỗ trợ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {job.previewData.map((row, idx) => (
                                            // eslint-disable-next-line react/no-array-index-key
                                            <TableRow key={`${row.headOfHousehold}-${idx}`}>
                                                <TableCell className="text-center text-text_2">
                                                    {idx + 1}
                                                </TableCell>
                                                <TableCell>
                                                    {row.cluster}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {row.address}
                                                </TableCell>
                                                <TableCell>
                                                    {row.headOfHousehold}
                                                </TableCell>
                                                <TableCell>
                                                    {row.phone || "—"}
                                                </TableCell>
                                                <TableCell>
                                                    {LOAI_SO_HUU_LABEL[
                                                        row.ownershipType as LoaiSoHuu
                                                    ] || row.ownershipType}
                                                </TableCell>
                                                <TableCell>
                                                    {row.needsSupport ? (
                                                        <Badge tone="yellow">
                                                            Có
                                                        </Badge>
                                                    ) : (
                                                        "Không"
                                                    )}
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
                    {job && (
                        <Button
                            className="w-full"
                            disabled={!canCommit}
                            loading={committing}
                            onClick={handleCommit}
                        >
                            Xác nhận nhập {job.validRows} hộ dân
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

export default HouseholdImportSheet;
