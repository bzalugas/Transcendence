import { API_BASE_URL } from "@/lib/api-url";
import type { FileAsset } from "@/lib/types";

export const ACCEPTED_UPLOAD_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.oasis.opendocument.text",
];

export const UPLOAD_ACCEPT = ACCEPTED_UPLOAD_TYPES.join(",");

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;
const MAX_ARCHIVE_BYTES = 20 * 1024 * 1024;

export function validateUploadFile(file: File): string | null {
  if (!ACCEPTED_UPLOAD_TYPES.includes(file.type)) {
    return "Unsupported file type.";
  }

  const maxBytes = file.type.startsWith("image/")
    ? MAX_IMAGE_BYTES
    : file.type === "application/zip"
      ? MAX_ARCHIVE_BYTES
      : MAX_DOCUMENT_BYTES;

  if (file.size > maxBytes) {
    return `File is too large. Maximum size is ${formatFileSize(maxBytes)}.`;
  }

  return null;
}

export function uploadFile(
  file: File,
  onProgress: (progress: number) => void,
  signal?: AbortSignal,
): Promise<FileAsset> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    const data = new FormData();

    data.append("file", file);
    request.open("POST", `${API_BASE_URL}/files`);
    request.withCredentials = true;

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    request.onload = () => {
      if (request.status < 200 || request.status >= 300) {
        reject(new Error(`POST /files failed with ${request.status}`));
        return;
      }

      resolve(JSON.parse(request.responseText) as FileAsset);
    };

    request.onerror = () => reject(new Error("Upload failed"));
    request.onabort = () => reject(new Error("Upload canceled"));
    signal?.addEventListener("abort", () => request.abort(), { once: true });
    request.send(data);
  });
}

export async function deleteUploadedFile(fileId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`DELETE /files/${fileId} failed with ${response.status}`);
  }
}

export function fileUrl(path: string): string {
  return path.startsWith("http") || path.startsWith("data:") ? path : `${API_BASE_URL}${path}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
