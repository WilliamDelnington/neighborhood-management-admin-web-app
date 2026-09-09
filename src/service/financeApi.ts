import { API, DEFAULT_PAGE_SIZE } from "@constants/common";
import { FinanceSummary, FinanceTransaction, PaginatedData } from "@dts";
import { request } from "./request";

export interface ListFinanceParams {
    page?: number;
    limit?: number;
    type?: FinanceTransaction["type"];
    status?: FinanceTransaction["status"];
    fromDate?: string;
    toDate?: string;
}

export const fetchFinanceTransactions = (
    params: ListFinanceParams = {},
): Promise<PaginatedData<FinanceTransaction>> =>
    request<PaginatedData<FinanceTransaction>>("GET", API.FINANCE, {
        page: params.page || 1,
        limit: params.limit || DEFAULT_PAGE_SIZE,
        type: params.type,
        status: params.status,
        fromDate: params.fromDate,
        toDate: params.toDate,
    });

export interface FinanceTransactionInput {
    type: FinanceTransaction["type"];
    partyName: string;
    amount: number;
    transactionDate: string;
    content: string;
    status?: FinanceTransaction["status"];
}

export const createFinanceTransaction = (
    input: FinanceTransactionInput,
): Promise<FinanceTransaction> =>
    request<FinanceTransaction>("POST", API.FINANCE, input);

export const updateFinanceTransaction = (
    id: string,
    input: Partial<FinanceTransactionInput>,
): Promise<FinanceTransaction> =>
    request<FinanceTransaction>("PATCH", `${API.FINANCE}/${id}`, input);

export const cancelFinanceTransaction = (
    id: string,
): Promise<FinanceTransaction> =>
    request<FinanceTransaction>("POST", `${API.FINANCE}/${id}/cancel`);

export const deleteFinanceTransaction = (id: string): Promise<null> =>
    request<null>("DELETE", `${API.FINANCE}/${id}`);

export const fetchFinanceSummary = (
    fromDate?: string,
    toDate?: string,
): Promise<FinanceSummary> =>
    request<FinanceSummary>("GET", `${API.FINANCE}/summary`, {
        fromDate,
        toDate,
    });
