import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle, LifeBuoy, LogOut } from "lucide-react";
import { useAuthStore } from "@store/authStore";
import { logout as logoutApi } from "@service/authApi";
import { createSupportTicket } from "@service/supportTicketApi";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@components/ui/dialog";
import { AppError } from "@dts";

export interface AccessDeniedProps {
    /** Thong bao ly do cu the - mac dinh la thong bao thieu quyen truy cap chung. */
    message?: string;
}

const DEFAULT_MESSAGE = "Tính năng này chỉ dành cho cán bộ tổ dân phố phù hợp.";

const AccessDenied: React.FC<AccessDeniedProps> = ({
    message = DEFAULT_MESSAGE,
}) => {
    const navigate = useNavigate();
    const storeLogout = useAuthStore(state => state.logout);

    const [supportVisible, setSupportVisible] = useState(false);
    const [title, setTitle] = useState("Không thể truy cập trang quản trị");
    const [content, setContent] = useState(message);
    const [submitting, setSubmitting] = useState(false);

    const handleLogout = async () => {
        try {
            await logoutApi();
        } catch {
            // bo qua loi mang, van xoa session cuc bo
        }
        storeLogout();
        navigate("/login", { replace: true });
    };

    const openSupport = () => {
        setTitle("Không thể truy cập trang quản trị");
        setContent(message);
        setSupportVisible(true);
    };

    const handleSubmitSupport = async () => {
        if (title.trim().length < 3 || content.trim().length < 10) {
            toast.error(
                "Vui lòng nhập tiêu đề (tối thiểu 3 ký tự) và nội dung (tối thiểu 10 ký tự)",
            );
            return;
        }
        try {
            setSubmitting(true);
            const ticket = await createSupportTicket({
                type: "bao_loi",
                title: title.trim(),
                content: content.trim(),
            });
            toast.success(
                `Đã gửi yêu cầu hỗ trợ (mã ${ticket.code}). Quản trị viên sẽ xem xét sớm.`,
            );
            setSupportVisible(false);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
            <AlertTriangle className="h-10 w-10 text-text_3" />
            <div className="text-base font-semibold">
                Bạn không có quyền truy cập
            </div>
            <div className="max-w-md text-sm text-text_2">{message}</div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={openSupport}>
                    <LifeBuoy className="mr-2 h-4 w-4" />
                    Hỗ trợ
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất
                </Button>
            </div>

            <Dialog open={supportVisible} onOpenChange={setSupportVisible}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Gửi yêu cầu hỗ trợ</DialogTitle>
                    </DialogHeader>
                    <p className="text-left text-sm text-text_2">
                        Mô tả vấn đề tài khoản của bạn đang gặp phải - quản trị
                        viên sẽ xem yêu cầu này để xử lý.
                    </p>
                    <div className="space-y-1.5 text-left">
                        <Label>Tiêu đề</Label>
                        <Input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5 text-left">
                        <Label>Nội dung</Label>
                        <Textarea
                            rows={4}
                            value={content}
                            onChange={e => setContent(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setSupportVisible(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            loading={submitting}
                            onClick={handleSubmitSupport}
                        >
                            Gửi yêu cầu
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AccessDenied;
