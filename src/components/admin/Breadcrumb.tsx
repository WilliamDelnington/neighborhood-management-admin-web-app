import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { MODULE_GROUPS, TOP_LEVEL_MODULES, findModuleForPath } from "@constants/modules";

/**
 * Tu suy ra "Trang chu / Nhom / Ten trang" tu route hien tai (dua vao
 * constants/modules.ts - cung nguon du lieu voi sidebar), khong can moi trang
 * tu khai bao lai. Dung chung boi PageHeader nen moi trang dang dung
 * PageHeader deu tu co breadcrumb.
 */
const Breadcrumb: React.FC = () => {
    const location = useLocation();
    const isHome = location.pathname === "/";
    const module = findModuleForPath(location.pathname);
    const isTopLevel = module
        ? TOP_LEVEL_MODULES.some(m => m.key === module.key)
        : false;
    const group = module
        ? MODULE_GROUPS.find(g => g.items.some(item => item.key === module.key))
        : undefined;

    return (
        <nav
            aria-label="breadcrumb"
            className="mb-2 flex items-center gap-1.5 text-xs text-text_2"
        >
            <Link
                to="/"
                className="flex items-center gap-1 hover:text-main hover:underline"
            >
                <Home className="h-3.5 w-3.5" />
                Trang chủ
            </Link>
            {!isHome && group && (
                <>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    <span>{group.label}</span>
                </>
            )}
            {!isHome && module && !isTopLevel && (
                <>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-medium text-text_1">
                        {module.label}
                    </span>
                </>
            )}
        </nav>
    );
};

export default Breadcrumb;
