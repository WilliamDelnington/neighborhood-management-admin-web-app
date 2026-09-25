import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, Phone } from "lucide-react";
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
import neighborhoodMap from "@assets/neighborhood-map.jpg";

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const setToken = useAuthStore(state => state.setToken);
    const setUser = useAuthStore(state => state.setUser);

    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
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
        <div className="flex h-screen overflow-hidden bg-app-bg">
            <div className="relative flex w-full flex-col items-center justify-center overflow-y-auto p-6 lg:w-1/2 lg:min-w-[28rem]">
                {/* Vong sang mo phia sau the dang nhap - tao chieu sau/diem
                nhan thi giac cho khoang trang lon ben trai, thay vi 1 the
                phang giua nen trong khong. */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                >
                    <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-main/10 blur-3xl" />
                    <div className="absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-primary-dark/10 blur-3xl" />
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="relative z-10 w-full max-w-[26rem] rounded-2xl border border-divider_01 bg-ui_bg p-8 shadow-xl"
                >
                    <div className="flex justify-center">
                        <AppBrand
                            imgClassName="h-14 max-w-[240px] object-contain"
                            textClassName="items-center text-center text-[2.1rem] font-semibold leading-[1.3] tracking-[-0.03em] text-main"
                        />
                    </div>
                    <h1 className="mt-4 text-center text-lg font-semibold text-text_1">
                        Chào mừng trở lại
                    </h1>
                    <p className="mb-6 mt-1 text-center text-sm text-text_2">
                        Đăng nhập bằng số điện thoại cán bộ
                    </p>

                    <div className="space-y-2">
                        <Label htmlFor="phone" className="font-medium text-text_1">
                            Số điện thoại
                        </Label>
                        <div className="relative">
                            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text_3" />
                            <Input
                                id="phone"
                                placeholder="0xxxxxxxxx"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                autoFocus
                                className="h-11 pl-9"
                            />
                        </div>
                    </div>
                    <div className="mt-4 space-y-2">
                        <Label htmlFor="password" className="font-medium text-text_1">
                            Mật khẩu
                        </Label>
                        <div className="relative">
                            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text_3" />
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="h-11 pl-9 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                aria-label={
                                    showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                                }
                                title={
                                    showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                                }
                                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-text_3 hover:text-text_1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="mt-6 h-11 w-full text-base font-semibold"
                        loading={submitting}
                    >
                        Đăng nhập
                    </Button>

                    <Button
                        type="button"
                        variant="link"
                        className="mt-3 h-auto w-full p-0 text-sm text-text_2"
                        onClick={() => setForgotOpen(true)}
                    >
                        Quên mật khẩu?
                    </Button>
                </form>
            </div>

            <div className="relative hidden overflow-hidden bg-[#0a1f33] lg:block lg:w-1/2">
                <img
                    src={neighborhoodMap}
                    alt="Bản đồ tổ chức các tổ dân phố phường Dương Nội"
                    className="h-full w-full object-cover object-top"
                />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a1f33]/70 to-transparent" />
                <div className="absolute bottom-5 right-6 rounded-full bg-[#0a1f33]/70 px-4 py-1.5 backdrop-blur-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white">
                        Phường Dương Nội · Hà Nội
                    </p>
                </div>
            </div>

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
