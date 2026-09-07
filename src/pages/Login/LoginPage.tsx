import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@components/ui/dialog";
import { useAuthStore } from "@store/authStore";
import { loginWithPhone } from "@service/authApi";
import { createPasswordResetRequest } from "@service/passwordResetRequestApi";
import { AppError } from "@dts";
import AppBrand from "@components/layout/AppBrand";

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const setToken = useAuthStore(state => state.setToken);
    const setUser = useAuthStore(state => state.setUser);

    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [forgotOpen, setForgotOpen] = useState(false);
    const [forgotPhone, setForgotPhone] = useState("");
    const [forgotNote, setForgotNote] = useState("");
    const [forgotSubmitting, setForgotSubmitting] = useState(false);

    const handleForgotPasswordSubmit = async () => {
        if (!forgotPhone.trim()) {
            toast.error("Vui lòng nhập số điện thoại");
            return;
        }
        try {
            setForgotSubmitting(true);
            await createPasswordResetRequest({
                phone: forgotPhone.trim(),
                note: forgotNote.trim() || undefined,
            });
            toast.success(
                "Đã gửi yêu cầu. Quản trị viên/tổ trưởng sẽ liên hệ lại để hỗ trợ đặt lại mật khẩu.",
            );
            setForgotOpen(false);
            setForgotPhone("");
            setForgotNote("");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setForgotSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone.trim() || !password) {
            toast.error("Vui lòng nhập số điện thoại và mật khẩu");
            return;
        }
        try {
            setSubmitting(true);
            const { token, user } = await loginWithPhone({
                phone: phone.trim(),
                password,
            });
            setToken(token);
            setUser(user);
            const from =
                (location.state as { from?: { pathname: string } } | null)
                    ?.from?.pathname || "/";
            navigate(from, { replace: true });
        } catch (err: any) {
            toast.error(err?.message || "Đăng nhập thất bại");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#eef1f4] p-6">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-[28rem] rounded-xl border border-[#d7dee6] bg-[#f7f9fb] p-6 shadow-[0_2px_0_rgba(15,23,42,0.02)]"
            >
                <div className="flex justify-center">
                    <AppBrand
                        imgClassName="h-12 max-w-[240px] object-contain"
                        textClassName="items-center text-center text-[2.1rem] font-semibold leading-[1.3] tracking-[-0.03em] text-main"
                    />
                </div>
                <p className="mb-6 mt-1 text-center text-[1.05rem] text-[#4b5f73]">
                    Đăng nhập bằng số điện thoại cán bộ
                </p>

                <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[1.05rem] font-medium text-[#1f2b38]">
                        Số điện thoại
                    </Label>
                    <Input
                        id="phone"
                        placeholder="0xxxxxxxxx"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        autoFocus
                        className="h-12 rounded-lg border border-[#c9d5df] bg-[#edf4fa] px-3 text-base text-[#1f2b38] shadow-none placeholder:text-[#8aa0b2] focus-visible:ring-[#7ca8d6]"
                    />
                </div>
                <div className="mt-4 space-y-2">
                    <Label htmlFor="password" className="text-[1.05rem] font-medium text-[#1f2b38]">
                        Mật khẩu
                    </Label>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="h-12 rounded-lg border border-[#c9d5df] bg-[#edf4fa] px-3 text-base text-[#1f2b38] shadow-none placeholder:text-[#8aa0b2] focus-visible:ring-[#7ca8d6]"
                    />
                </div>

                <Button
                    type="submit"
                    className="mt-5 h-12 w-full rounded-lg bg-[#0a5a8a] text-base font-semibold text-white shadow-none hover:bg-[#0a4f7c]"
                    loading={submitting}
                >
                    Đăng nhập
                </Button>

                <Button
                    type="button"
                    variant="link"
                    className="mt-3 h-auto w-full p-0 text-sm text-[#4b5f73]"
                    onClick={() => setForgotOpen(true)}
                >
                    Quên mật khẩu?
                </Button>
            </form>

            <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Quên mật khẩu?</DialogTitle>
                        <DialogDescription>
                            Gửi yêu cầu kèm số điện thoại đăng nhập của bạn -
                            quản trị viên hoặc tổ trưởng/tổ phó phụ trách sẽ
                            liên hệ xác minh và đặt lại mật khẩu giúp bạn. Nếu
                            bạn là quản trị viên duy nhất của hệ thống, vui
                            lòng liên hệ trực tiếp nhà phát triển thay vì gửi
                            yêu cầu tại đây.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="forgot-phone">
                                Số điện thoại
                            </Label>
                            <Input
                                id="forgot-phone"
                                placeholder="0xxxxxxxxx"
                                value={forgotPhone}
                                onChange={e => setForgotPhone(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="forgot-note">
                                Ghi chú (không bắt buộc)
                            </Label>
                            <Textarea
                                id="forgot-note"
                                placeholder="VD: Tôi là tổ trưởng tổ dân phố số 4..."
                                value={forgotNote}
                                onChange={e => setForgotNote(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setForgotOpen(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            loading={forgotSubmitting}
                            onClick={handleForgotPasswordSubmit}
                        >
                            Gửi yêu cầu
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LoginPage;
