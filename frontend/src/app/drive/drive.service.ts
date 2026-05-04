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

  downloadImage(fileId: string): void {
    // Simply redirect to the API endpoint. The browser will handle the download
    // because of the Content-Disposition header, and will send the auth cookie.
    window.location.href = `/api/drive/download?fileId=${fileId}`;
  }

  downloadAllImages(folderId?: string): void {
    const url = folderId 
      ? `/api/drive/download-all?folderId=${folderId}`
      : '/api/drive/download-all';
    window.location.href = url;
  }
}

