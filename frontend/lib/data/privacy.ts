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

export interface ExportPreview {
  generatedAt: string;
  sections: Array<{
    label: string;
    count: number;
  }>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export async function requestDataExport(): Promise<DataOperationResult> {
  return request<DataOperationResult>("/privacy/export-request", { method: "POST" });
}

export async function getLatestExportPreview(): Promise<ExportPreview | null> {
  return request<ExportPreview>("/privacy/export/latest");
}

export async function requestDataDeletion(): Promise<DataOperationResult> {
  return request<DataOperationResult>("/privacy/delete-request", { method: "POST" });
}

// Placeholder: replace with GET /privacy/export/:requestId/download later.
export function latestExportDownloadUrl(): string {
  return "#";
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
