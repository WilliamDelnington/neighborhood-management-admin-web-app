import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { useAuthStore } from "@store/authStore";
import { loginWithPhone } from "@service/authApi";

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
        <div className="flex min-h-screen items-center justify-center bg-app-bg p-6">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-sm rounded-2xl border border-divider_01 bg-white p-6 shadow-sm"
            >
                <h1 className="text-center text-lg font-semibold text-main">
                    Quản lý Tổ dân phố
                </h1>
                <p className="mb-6 mt-1 text-center text-sm text-text_2">
                    Đăng nhập bằng số điện thoại cán bộ
                </p>

                <div className="space-y-1.5">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input
                        id="phone"
                        placeholder="0xxxxxxxxx"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        autoFocus
                    />
                </div>
                <div className="mt-3 space-y-1.5">
                    <Label htmlFor="password">Mật khẩu</Label>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </div>

                <Button
                    type="submit"
                    className="mt-5 w-full"
                    loading={submitting}
                >
                    Đăng nhập
                </Button>
            </form>
        </div>
    );
};

export default LoginPage;
