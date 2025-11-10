import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class DownloadService {
  constructor(private api: ApiService) {}

  /** Download và tự tạo link tải */
  download(url: string, params?: Record<string, any>, filename?: string) {
    this.api.download(url, params).subscribe(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename || this.guessFileName(url);
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  private guessFileName(url: string) {
    try {
      const u = new URL(url, window.location.origin);
      const path = u.pathname.split('/').filter(Boolean);
      return path[path.length - 1] || 'download.bin';
    } catch {
      const parts = url.split('?')[0].split('/').filter(Boolean);
      return parts[parts.length - 1] || 'download.bin';
    }
  }
}
