import React, { useEffect, useState } from "react";
import { cn } from "@lib/utils";
import { resolveAssetUrl } from "@constants/common";
import { fetchPublicSettings } from "@service/settingsApi";

const APP_NAME = "Quản lý Tổ dân phố";
const WARD_NAME = "Phường Dương Nội";

export interface AppBrandProps {
    imgClassName?: string;
    textClassName?: string;
}

/**
 * Hien logo neu admin da tai len (Setting key "app_logo_url", xem
 * SettingsPage.tsx), nguoc lai giu nguyen chu "Quan ly To dan pho" nhu truoc -
 * dung chung cho AdminLayout (sidebar) va LoginPage de doi logo o mot noi duy
 * nhat co hieu luc ca hai.
 */
const AppBrand: React.FC<AppBrandProps> = ({ imgClassName, textClassName }) => {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    useEffect(() => {
        fetchPublicSettings()
            .then(settings => {
                const url = settings.app_logo_url;
                if (typeof url === "string" && url) setLogoUrl(url);
            })
            .catch(() => {});
    }, []);

    if (logoUrl) {
        return (
            <img
                src={resolveAssetUrl(logoUrl)}
                alt={APP_NAME}
                className={imgClassName}
            />
        );
    }
    return (
        <span className={cn("flex flex-col items-center leading-tight", textClassName)}>
            <span>{APP_NAME}</span>
            <span className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-main/75">
                {WARD_NAME}
            </span>
        </span>
    );
};

export default AppBrand;
