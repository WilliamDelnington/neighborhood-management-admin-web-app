import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { findModuleKeyForPath } from "@constants/modules";
import { useSectionDescriptionsStore } from "@store/sectionDescriptionsStore";

// "description" truyen vao la mo ta mac dinh (hardcode) - neu trang hien tai
// khop voi mot mo-dun trong constants/modules.ts VA admin da tuy chinh mo ta
// cho mo-dun do (xem SettingsPage.tsx, cung 1 gia tri voi tooltip sidebar
// trong AdminLayout.tsx), uu tien hien mo ta tuy chinh - khong can moi trang
// goi PageHeader tu khai bao them prop nao.
const PageHeader: React.FC<{
    title: string;
    description?: string;
    action?: React.ReactNode;
}> = ({ title, description, action }) => {
    const location = useLocation();
    const overrides = useSectionDescriptionsStore(state => state.overrides);
    const loaded = useSectionDescriptionsStore(state => state.loaded);
    const load = useSectionDescriptionsStore(state => state.load);

    useEffect(() => {
        if (!loaded) load();
    }, [loaded, load]);

    const moduleKey = findModuleKeyForPath(location.pathname);
    const effectiveDescription = moduleKey
        ? (overrides[moduleKey] ?? description)
        : description;

    return (
        <div className="mb-4 flex items-center justify-between gap-4">
            <div>
                <h1 className="text-lg font-semibold">{title}</h1>
                {effectiveDescription && (
                    <p className="mt-0.5 text-sm text-text_2">
                        {effectiveDescription}
                    </p>
                )}
            </div>
            {action}
        </div>
    );
};

export default PageHeader;
