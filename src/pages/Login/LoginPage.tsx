import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { useAuthStore } from "@store/authStore";
import { loginWithPhone } from "@service/authApi";
import AppBrand from "@components/layout/AppBrand";

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const setToken = useAuthStore(state => state.setToken);
    const setUser = useAuthStore(state => state.setUser);

    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

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
            </form>
        </div>
    );
};

export default LoginPage;
