import { API_BASE_URL } from "@/lib/api-url";

export type DataRequestStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "completed"
  | "cancelled"
  | "expired";

export interface DataOperationResult {
  requestId: string;
  status: DataRequestStatus;
  message: string;
}

export interface DataConfirmationResult extends DataOperationResult {
  type: "export" | "deletion";
}

export interface ExportPreview {
  generatedAt: string;
  latestExport: {
    requestId: string;
    completedAt: string | null;
    sizeBytes: number;
    downloadUrl: string;
  } | null;
  sections: Array<{
    label: string;
    count: number;
  }>;
}

export async function requestDataExport(): Promise<DataOperationResult> {
  return request<DataOperationResult>("/privacy/export-request", { method: "POST" });
}

export async function getLatestExportPreview(): Promise<ExportPreview | null> {
  return request<ExportPreview>("/privacy/export/latest");
}

export async function requestDataDeletion(): Promise<DataOperationResult> {
  return request<DataOperationResult>("/privacy/delete-request", { method: "POST" });
}

export async function confirmDataRequest(token: string): Promise<DataConfirmationResult> {
  return request<DataConfirmationResult>("/privacy/requests/confirm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });
}

export function exportDownloadUrl(path?: string | null): string {
  if (!path) return "#";
  return path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} failed with ${response.status}`);
  }

  return response.json();
}
