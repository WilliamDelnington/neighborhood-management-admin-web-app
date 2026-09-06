import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { findModuleForPath } from "@constants/modules";
import { resolveAssetUrl } from "@constants/common";
import { useAppBrandStore } from "@store/appBrandStore";

// Phai khop voi <title> mac dinh trong index.html va href cua the <link
// rel="icon"> mac dinh - dung khi admin chua cau hinh "app_tab_title"/
// "app_favicon_url" (xem SettingsPage.tsx).
const DEFAULT_TAB_TITLE = "Quản trị Tổ dân phố Hòa Bình";
const DEFAULT_FAVICON_HREF = "/favicon.svg";

/**
 * Dat document.title theo trang dang xem (ten module - tieu de tab chung) va
 * href cua favicon theo cau hinh admin, vi truoc day ca hai deu co dinh trong
 * index.html nen khong doi khi chuyen giua cac muc menu. Khong render gi -
 * chi mount 1 lan trong App.tsx (ben trong BrowserRouter) de dung duoc
 * useLocation cho moi route.
 */
const DocumentMeta: React.FC = () => {
    const location = useLocation();
    const tabTitle = useAppBrandStore(state => state.tabTitle);
    const faviconUrl = useAppBrandStore(state => state.faviconUrl);
    const loaded = useAppBrandStore(state => state.loaded);
    const load = useAppBrandStore(state => state.load);

    useEffect(() => {
        if (!loaded) load();
    }, [loaded, load]);

    useEffect(() => {
        const baseTitle = tabTitle || DEFAULT_TAB_TITLE;
        const module = findModuleForPath(location.pathname);
        document.title = module ? `${module.label} - ${baseTitle}` : baseTitle;
    }, [location.pathname, tabTitle]);

    useEffect(() => {
        const href = faviconUrl
            ? resolveAssetUrl(faviconUrl)
            : DEFAULT_FAVICON_HREF;
        let link = document.querySelector<HTMLLinkElement>(
            "link[rel~='icon']",
        );
        if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.head.appendChild(link);
        }
        link.href = href;
    }, [faviconUrl]);

    return null;
};

export default DocumentMeta;
