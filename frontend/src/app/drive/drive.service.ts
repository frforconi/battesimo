import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DriveImage {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  thumbnailUrl: string;
  imageUrl: string;
  width?: number;
  height?: number;
}

export interface ImagesResponse {
  images: DriveImage[];
  nextPageToken: string | null;
}

export interface ListAllResponse {
  files: Pick<DriveImage, "name" | "id" | "mimeType">[];
  total: number;
}

export interface DownloadProgress {
  receivedBytes: number;
  totalFiles: number;
}

@Injectable({ providedIn: 'root' })
export class DriveService {
  constructor(private http: HttpClient) {}

  getImages(pageToken?: string, folderId?: string): Observable<ImagesResponse> {
    let params = new HttpParams().set('limit', '30');
    if (pageToken) params = params.set('pageToken', pageToken);
    if (folderId) params = params.set('folderId', folderId);

    // withCredentials is handled globally by the interceptor
    return this.http.get<ImagesResponse>('/api/drive/images', { params });
  }

  /** Get the full list of file metadata (id, name) — no file content, fast */
  listAllFiles(): Observable<ListAllResponse> {
    return this.http.get<ListAllResponse>('/api/drive/list-all');
  }

  /**
   * Download all images as a ZIP via server-side streaming.
   * Uses ReadableStream to track download progress in real-time.
   * Returns the final Blob when complete.
   */
  async downloadAllAsZipStream(
    onProgress: (progress: DownloadProgress) => void,
    abortSignal?: AbortSignal
  ): Promise<Blob> {
    const response = await fetch('/api/drive/download-all', {
      credentials: 'include',
      signal: abortSignal,
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const totalFiles = parseInt(response.headers.get('X-Total-Files') || '0', 10);
    const reader = response.body!.getReader();
    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      receivedBytes += value.length;
      onProgress({ receivedBytes, totalFiles });
    }

    return new Blob(chunks, { type: 'application/zip' });
  }

  downloadImage(fileId: string): void {
    // Simply redirect to the API endpoint. The browser will handle the download
    // because of the Content-Disposition header, and will send the auth cookie.
    window.location.href = `/api/drive/download?fileId=${fileId}`;
  }
}
