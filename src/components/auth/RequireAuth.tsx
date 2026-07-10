import React, { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@store/authStore";
import { Loader2 } from "lucide-react";

const RequireAuth: React.FC<PropsWithChildren> = ({ children }) => {
    const location = useLocation();
    const token = useAuthStore(state => state.token);
    const bootstrapping = useAuthStore(state => state.bootstrapping);

    if (bootstrapping) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-main" />
            </div>
        );
    }

    if (!token) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return children as React.ReactElement;
};

export default RequireAuth;
