import React from "react";

const PageHeader: React.FC<{
    title: string;
    description?: string;
    action?: React.ReactNode;
}> = ({ title, description, action }) => (
    <div className="mb-4 flex items-center justify-between gap-4">
        <div>
            <h1 className="text-lg font-semibold">{title}</h1>
            {description && (
                <p className="mt-0.5 text-sm text-text_2">{description}</p>
            )}
        </div>
        {action}
    </div>
);

export default PageHeader;
