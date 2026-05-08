export type DataRequestStatus = "idle" | "pending" | "confirmed" | "ready";

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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Placeholder: replace with POST /privacy/export-request when the backend exists.
export async function requestDataExport(): Promise<DataOperationResult> {
  await delay(500);
  return {
    requestId: `export-${Date.now()}`,
    status: "pending",
    message: "Your export request was received. We will email you when your JSON file is ready.",
  };
}

// Placeholder: replace with GET /privacy/export/latest when the backend exists.
export async function getLatestExportPreview(): Promise<ExportPreview | null> {
  await delay(250);
  return {
    generatedAt: new Date().toISOString(),
    sections: [
      { label: "Profile", count: 1 },
      { label: "Posts", count: 0 },
      { label: "Messages", count: 0 },
      { label: "Files", count: 0 },
    ],
  };
}

// Placeholder: replace with POST /privacy/delete-request when the backend exists.
export async function requestDataDeletion(): Promise<DataOperationResult> {
  await delay(500);
  return {
    requestId: `delete-${Date.now()}`,
    status: "pending",
    message: "Your deletion request was received. We will email you to confirm before deleting anything.",
  };
}

// Placeholder: replace with GET /privacy/export/:requestId/download later.
export function latestExportDownloadUrl(): string {
  return "#";
}
