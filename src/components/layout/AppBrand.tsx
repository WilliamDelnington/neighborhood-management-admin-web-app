import React, { useEffect, useState } from "react";
import { resolveAssetUrl } from "@constants/common";
import { fetchPublicSettings } from "@service/settingsApi";

const APP_NAME = "Quản lý Tổ dân phố";

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
    return <span className={textClassName}>{APP_NAME}</span>;
};

export default AppBrand;
