import { API, BASE_URL } from "@constants/common";
import {
    KpiDataSource,
    KpiDefinition,
    KpiEvaluationItem,
    KpiFormulaType,
    KpiPeriod,
    PaginatedData,
} from "@dts";
import { useAuthStore } from "@store/authStore";
import { request } from "./request";

export type KpiDefinitionInput = {
    code: string;
    name: string;
    description?: string;
    formulaType: KpiFormulaType;
    dataSource: KpiDataSource;
    targetValue: number;
    targetDirection: "gte" | "lte";
    unit: string;
    period: KpiPeriod;
    active: boolean;
};

export const fetchKpiDefinitions = (active?: boolean) =>
    request<PaginatedData<KpiDefinition>>("GET", API.KPI_DEFINITIONS, {
        page: 1,
        limit: 100,
        active,
    });

export const createKpiDefinition = (input: KpiDefinitionInput) =>
    request<KpiDefinition>("POST", API.KPI_DEFINITIONS, input);

export const updateKpiDefinition = (
    id: string,
    input: Partial<Omit<KpiDefinitionInput, "code">>,
) => request<KpiDefinition>("PATCH", `${API.KPI_DEFINITIONS}/${id}`, input);

export const archiveKpiDefinition = (id: string) =>
    request<KpiDefinition>("DELETE", `${API.KPI_DEFINITIONS}/${id}`);

export const evaluateKpis = (params?: {
    fromDate?: string;
    toDate?: string;
    neighborhoodId?: string;
}) =>
    request<{ generatedAt: string; items: KpiEvaluationItem[] }>(
        "GET",
        `${API.KPIS}/evaluate`,
        params,
    );

export const downloadKpiExport = async (
    format: "excel" | "pdf",
    params?: { fromDate?: string; toDate?: string; neighborhoodId?: string },
) => {
    const { token } = useAuthStore.getState();
    const url = new URL(`${API.KPIS}/export`, BASE_URL);
    url.searchParams.set("format", format);
    Object.entries(params || {}).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
    });
    const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok) throw new Error("Không thể xuất báo cáo KPI");
    const objectUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `bao-cao-kpi.${format === "excel" ? "xlsx" : "pdf"}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
};
