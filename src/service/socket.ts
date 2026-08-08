import { io, Socket } from "socket.io-client";
import { BASE_URL } from "@constants/common";

let socket: Socket | null = null;

/**
 * Mo mot ket noi socket moi cho token hien tai (dong ket noi cu neu co - vd
 * doi tai khoan trong cung tab). BASE_URL la origin thuan (khong co /api),
 * socket.io dung duong dan mac dinh /socket.io/ nen khong dung API path.
 */
export function connectSocket(token: string): Socket {
    socket?.disconnect();
    socket = io(BASE_URL, {
        auth: { token },
    });
    return socket;
}

export function disconnectSocket(): void {
    socket?.disconnect();
    socket = null;
}
