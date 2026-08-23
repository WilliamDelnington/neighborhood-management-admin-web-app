import React, { useState } from "react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { setPassword } from "@service/authApi";
import { AppError } from "@dts";

export interface ChangePasswordDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const EMPTY_FORM = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
};

const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
    open,
    onOpenChange,
}) => {
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const handleOpenChange = (next: boolean) => {
        if (!next) setForm(EMPTY_FORM);
        onOpenChange(next);
    };

    const handleSubmit = async () => {
        if (!form.currentPassword.trim()) {
            toast.error("Vui lòng nhập mật khẩu hiện tại");
            return;
        }
        if (form.newPassword.trim().length < 6) {
            toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
            return;
        }
        if (form.newPassword !== form.confirmPassword) {
            toast.error("Xác nhận mật khẩu mới không khớp");
            return;
        }
        try {
            setSaving(true);
            await setPassword(
                form.newPassword.trim(),
                form.currentPassword.trim(),
            );
            toast.success("Đã đổi mật khẩu");
            handleOpenChange(false);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Đổi mật khẩu</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <div className="space-y-1.5">
                        <Label>Mật khẩu hiện tại</Label>
                        <Input
                            type="password"
                            autoComplete="current-password"
                            value={form.currentPassword}
                            onChange={e =>
                                setForm(prev => ({
                                    ...prev,
                                    currentPassword: e.target.value,
                                }))
                            }
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Mật khẩu mới</Label>
                        <Input
                            type="password"
                            autoComplete="new-password"
                            placeholder="Ít nhất 6 ký tự"
                            value={form.newPassword}
                            onChange={e =>
                                setForm(prev => ({
                                    ...prev,
                                    newPassword: e.target.value,
                                }))
                            }
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Xác nhận mật khẩu mới</Label>
                        <Input
                            type="password"
                            autoComplete="new-password"
                            value={form.confirmPassword}
                            onChange={e =>
                                setForm(prev => ({
                                    ...prev,
                                    confirmPassword: e.target.value,
                                }))
                            }
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                    >
                        Hủy
                    </Button>
                    <Button loading={saving} onClick={() => void handleSubmit()}>
                        Đổi mật khẩu
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ChangePasswordDialog;
