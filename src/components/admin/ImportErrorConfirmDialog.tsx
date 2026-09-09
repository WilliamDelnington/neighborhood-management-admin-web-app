import React from "react";
import { Button } from "@components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@components/ui/dialog";

export interface ImportErrorConfirmDialogProps {
    open: boolean;
    createdCount: number;
    skippedCount: number;
    errorCount: number;
    confirming?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

/**
 * Xac nhan bat buoc khi nguoi dung bam "Xac nhan nhap" nhung file van con
 * dong loi (job.rowErrors.length > 0) - canh bao ro cac dong loi se KHONG
 * duoc nhap truoc khi thuc su commit, dung chung cho ca 5 man hinh Import
 * Excel (xem canCommit/handleCommit trong tung *ImportSheet.tsx).
 */
const ImportErrorConfirmDialog: React.FC<ImportErrorConfirmDialogProps> = ({
    open,
    createdCount,
    skippedCount,
    errorCount,
    confirming = false,
    onCancel,
    onConfirm,
}) => (
    <Dialog open={open} onOpenChange={next => !next && onCancel()}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>File có dòng dữ liệu lỗi</DialogTitle>
                <DialogDescription>
                    <strong>{createdCount}</strong> dòng sẽ được tạo
                    {skippedCount > 0 && (
                        <>
                            , <strong>{skippedCount}</strong> dòng đã tồn tại
                            (bỏ qua)
                        </>
                    )}
                    , và <strong>{errorCount}</strong> dòng lỗi sẽ KHÔNG được
                    nhập. Bạn có muốn tiếp tục nhập các dòng hợp lệ không?
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="outline" onClick={onCancel}>
                    Hủy
                </Button>
                <Button loading={confirming} onClick={onConfirm}>
                    Tiếp tục nhập
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);

export default ImportErrorConfirmDialog;
