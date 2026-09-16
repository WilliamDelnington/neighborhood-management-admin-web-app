import { API } from "@constants/common";
import { request } from "./request";

export type AiChatRole = "user" | "model";

export type AiChatHistoryItem = { role: AiChatRole; text: string };

export type AiChatUsage = {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
};

export type AiChatResponse = {
    reply: string;
    toolsCalled: string[];
    usage?: AiChatUsage;
};

// Stateless o backend (xem services/aiChatService.ts) - client tu giu lich su
// hoi thoai va gui kem `history` moi lan goi (chi 20 tin gan nhat, xem
// AiChatWidget.tsx), khong co API rieng de tai/luu lich su.
export const sendAiChatMessage = (
    message: string,
    history: AiChatHistoryItem[],
): Promise<AiChatResponse> =>
    request<AiChatResponse>("POST", API.AI_CHAT, { message, history });
