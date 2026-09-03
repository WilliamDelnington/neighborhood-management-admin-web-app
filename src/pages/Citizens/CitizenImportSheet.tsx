import React, { useState } from "react";
import { toast } from "sonner";
import { UploadCloud, RotateCcw } from "lucide-react";
import { Button } from "@components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@components/ui/sheet";
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
    CitizenImportPreviewRow,
    ImportJob,
    uploadCitizenImportFile,
    commitCitizenImport,
} from "@service/importApi";

interface CitizenImportSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImported: () => void;
}

// Import nhan khau dung bo nhan cot CO DINH o backend (xem CITIZEN_COLUMNS
// trong importService.ts) - khong co buoc "chon cot" nhu House/Street, nen
// chi can liet ke dung ten cot bat buoc de nguoi dung tu chuan bi file.
const REQUIRED_HEADERS = [
    "Họ tên",
    "Mã hộ",
    "Số điện thoại",
    "CCCD",
    "Ngày sinh",
    "Giới tính",
    "Quan hệ với chủ hộ",
    "Thường trú/Tạm trú",
    "Người cao tuổi",
    "Trẻ em",
    "Người khuyết tật",
    "Đảng viên",
    "Đoàn viên",
];

const CitizenImportSheet: React.FC<CitizenImportSheetProps> = ({
    open,
    onOpenChange,
    onImported,
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [job, setJob] = useState<ImportJob<CitizenImportPreviewRow> | null>(
        null,
    );
    const [uploading, setUploading] = useState(false);
    const [committing, setCommitting] = useState(false);

    const reset = () => {
        setFile(null);
        setJob(null);
        setUploading(false);
        setCommitting(false);
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) reset();
        onOpenChange(next);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setJob(null);
        setFile(e.target.files?.[0] || null);
    };

    const handleUpload = async () => {
        if (!file) return;
        try {
            setUploading(true);
            const result = await uploadCitizenImportFile(file);
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

    const canCommit =
        !!job && job.status !== "committed" && job.rowErrors.length === 0;

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
                                Tải lên file Excel có hàng tiêu đề đầu tiên
                                dùng đúng các tên cột sau (thứ tự tuỳ ý):{" "}
                                {REQUIRED_HEADERS.map(h => `"${h}"`).join(", ")}
                                . &quot;Họ tên&quot; và &quot;Mã hộ&quot; là bắt
                                buộc — &quot;Mã hộ&quot; phải khớp với mã một
                                hộ dân đã có trong hệ thống.
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

                    {job && (
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
                                    onClick={() => setJob(null)}
                                >
                                    <RotateCcw className="mr-1 h-3.5 w-3.5" />
                                    Chọn file khác
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
                    {job && (
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
