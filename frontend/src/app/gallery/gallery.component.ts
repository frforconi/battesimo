import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../auth/auth.service';
import { DriveService, DriveImage } from '../drive/drive.service';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="shell">
      <!-- Header -->
      <header class="header">
        <div class="header-left">
          <span class="logo-mark">◈</span>
          <span class="site-name">Gallery</span>
        </div>
        <div class="header-right" *ngIf="user()">
          <img class="avatar" [src]="user()!.picture" [alt]="user()!.name" />
          <span class="user-name">{{ user()!.name }}</span>
          <button class="logout-btn" (click)="logout()">Sign out</button>
        </div>
      </header>

      <!-- Main -->
      <main class="main">
        <!-- Loading skeleton -->
        <div class="grid skeleton-grid" *ngIf="loading() && images().length === 0">
          <div class="skeleton-card" *ngFor="let i of [1,2,3,4,5,6,7,8,9,10,11,12]"></div>
        </div>

        <!-- Error -->
        <div class="empty-state" *ngIf="error() && !loading()">
          <span class="empty-icon">⚠</span>
          <p>{{ error() }}</p>
          <button class="retry-btn" (click)="loadImages()">Retry</button>
        </div>

        <!-- Empty -->
        <div class="empty-state" *ngIf="!loading() && !error() && images().length === 0">
          <span class="empty-icon">🖼</span>
          <p>No images found in your Google Drive.</p>
        </div>

        <!-- Grid -->
        <div class="grid" *ngIf="images().length > 0">
          <div
            class="card"
            *ngFor="let img of images(); let i = index"
            [style.animation-delay]="(i % 12) * 40 + 'ms'"
            (click)="openLightbox(i)">
            <div class="card-inner">
              <img
                [src]="img.thumbnailUrl"
                [alt]="img.name"
                loading="lazy"
                (error)="onImgError($event)"
              />
              <div class="card-overlay">
                <span class="card-name">{{ img.name }}</span>
                <button class="download-icon-btn" (click)="download($event, img.id)" title="Download original">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 15L12 3M12 15L8 11M12 15L16 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 17L2 18C2 19.6569 3.34315 21 5 21L19 21C20.6569 21 22 19.6569 22 18L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Load more -->
        <div class="load-more" *ngIf="nextPageToken() && !loading()">
          <button class="load-btn" (click)="loadMore()">Load more</button>
        </div>

        <div class="loading-more" *ngIf="loading() && images().length > 0">
          <div class="spinner"></div>
        </div>
      </main>

      <!-- Lightbox -->
      <div
        class="lightbox"
        *ngIf="lightboxIndex() !== null"
        (click)="closeLightbox()">
        <button class="lb-close" (click)="closeLightbox()">✕</button>
        <button class="lb-nav lb-prev" (click)="prevImage($event)" [disabled]="lightboxIndex() === 0">‹</button>

        <div class="lb-content" (click)="$event.stopPropagation()">
          <img
            [src]="currentLightboxImage()!.imageUrl"
            [alt]="currentLightboxImage()!.name"
            (error)="onImgError($event)"
          />
          <div class="lb-footer">
            <p class="lb-caption">{{ currentLightboxImage()!.name }}</p>
            <button class="lb-download" (click)="download($event, currentLightboxImage()!.id)">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15L12 3M12 15L8 11M12 15L16 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 17L2 18C2 19.6569 3.34315 21 5 21L19 21C20.6569 21 22 19.6569 22 18L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Download Original
            </button>
          </div>
        </div>

        <button class="lb-nav lb-next" (click)="nextImage($event)" [disabled]="lightboxIndex() === images().length - 1">›</button>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=DM+Sans:wght@300;400;500&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    :host { display: block; min-height: 100vh; background: #0d0d12; color: #f0ece8; }

    /* ── Header ── */
    .header {
      position: sticky; top: 0; z-index: 100;
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 2.5rem;
      background: rgba(13,13,18,0.85);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }

    .header-left { display: flex; align-items: center; gap: 0.6rem; }

    .logo-mark { color: rgba(150,120,255,0.8); font-size: 1.2rem; }

    .site-name {
      font-family: 'Cormorant Garamond', serif;
      font-weight: 300; font-size: 1.3rem; letter-spacing: 0.08em;
    }

    .header-right { display: flex; align-items: center; gap: 1rem; }

    .avatar {
      width: 32px; height: 32px; border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.15);
    }

    .user-name {
      font-family: 'DM Sans', sans-serif;
      font-size: 0.85rem; color: rgba(240,236,232,0.6);
    }

    .logout-btn {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.15);
      color: rgba(240,236,232,0.6);
      font-family: 'DM Sans', sans-serif;
      font-size: 0.78rem;
      padding: 0.35rem 0.9rem;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .logout-btn:hover { border-color: rgba(255,255,255,0.35); color: #f0ece8; }

    /* ── Main ── */
    .main { padding: 2.5rem; max-width: 1400px; margin: 0 auto; }

    /* ── Grid ── */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
      @media (max-width: 600px) {
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 0.75rem;
      }
    }

    .card {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      animation: cardIn 0.5s ease both;
      background: rgba(255,255,255,0.03);
    }

    @keyframes cardIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .card-inner { 
      position: relative; 
      width: 100%;
      aspect-ratio: 1 / 1; 
      overflow: hidden;
    }

    .card-inner img {
      display: block; 
      width: 100%; 
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .card:hover .card-inner img { transform: scale(1.03); }

    .card-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%);
      opacity: 0; transition: opacity 0.3s ease;
      display: flex; align-items: flex-end; padding: 0.75rem;
    }

    .card:hover .card-overlay { opacity: 1; }

    .card-name {
      font-family: 'DM Sans', sans-serif;
      font-size: 0.72rem; color: #fff;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      flex: 1; margin-right: 0.5rem;
    }

    .download-icon-btn {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      color: #fff;
      width: 28px; height: 28px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.2s;
    }
    .download-icon-btn:hover { background: rgba(255,255,255,0.25); transform: scale(1.1); }
    .download-icon-btn svg { width: 14px; height: 14px; }

    /* ── Skeleton ── */
    .skeleton-grid { 
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .skeleton-card {
      aspect-ratio: 1 / 1;
      border-radius: 12px;
      background: rgba(255,255,255,0.05);
      animation: shimmer 1.5s ease infinite;
    }

    @keyframes shimmer {
      0%,100% { opacity: 0.4; }
      50%      { opacity: 0.8; }
    }

    /* ── Empty / Error ── */
    .empty-state {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      min-height: 50vh; gap: 1rem;
      font-family: 'DM Sans', sans-serif;
      color: rgba(240,236,232,0.4);
    }

    .empty-icon { font-size: 3rem; }

    .retry-btn {
      background: transparent;
      border: 1px solid rgba(150,120,255,0.5);
      color: rgba(150,120,255,0.9);
      font-family: 'DM Sans', sans-serif;
      padding: 0.5rem 1.5rem; border-radius: 8px;
      cursor: pointer; transition: all 0.2s;
    }
    .retry-btn:hover { background: rgba(150,120,255,0.1); }

    /* ── Load more ── */
    .load-more { display: flex; justify-content: center; padding: 2rem 0; }

    .load-btn {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.15);
      color: rgba(240,236,232,0.7);
      font-family: 'DM Sans', sans-serif;
      font-size: 0.9rem; padding: 0.7rem 2.5rem;
      border-radius: 10px; cursor: pointer; transition: all 0.2s;
    }
    .load-btn:hover { border-color: rgba(255,255,255,0.4); color: #f0ece8; }

    .loading-more { display: flex; justify-content: center; padding: 2rem; }

    .spinner {
      width: 28px; height: 28px;
      border: 2px solid rgba(255,255,255,0.1);
      border-top-color: rgba(150,120,255,0.7);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Lightbox ── */
    .lightbox {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(0,0,0,0.95);
      display: flex; align-items: center; justify-content: center;
      animation: lbIn 0.2s ease;
    }

    @keyframes lbIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    .lb-close {
      position: absolute; top: 1.5rem; right: 1.5rem;
      background: rgba(255,255,255,0.1); border: none;
      color: #fff; font-size: 1.2rem;
      width: 40px; height: 40px; border-radius: 50%;
      cursor: pointer; transition: background 0.2s;
    }
    .lb-close:hover { background: rgba(255,255,255,0.2); }

    .lb-nav {
      position: absolute;
      background: rgba(255,255,255,0.08); border: none;
      color: #fff; font-size: 2.5rem;
      width: 56px; height: 56px; border-radius: 50%;
      cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center; justify-content: center;
      line-height: 1;
    }
    .lb-nav:hover:not(:disabled) { background: rgba(255,255,255,0.18); }
    .lb-nav:disabled { opacity: 0.2; cursor: default; }
    .lb-prev { left: 2rem; }
    .lb-next { right: 2rem; }

    .lb-content {
      max-width: 90vw; max-height: 90vh;
      display: flex; flex-direction: column; align-items: center; gap: 1rem;
    }

    .lb-content img {
      max-width: 100%; max-height: 82vh;
      border-radius: 8px; object-fit: contain;
      box-shadow: 0 32px 80px rgba(0,0,0,0.6);
    }

    .lb-caption {
      font-family: 'DM Sans', sans-serif;
      font-size: 0.82rem; color: rgba(255,255,255,0.45);
    }

    .lb-footer {
      width: 100%; display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; margin-top: 0.5rem;
    }

    .lb-download {
      background: rgba(150,120,255,0.2);
      border: 1px solid rgba(150,120,255,0.4);
      color: rgba(150,120,255,0.9);
      font-family: 'DM Sans', sans-serif;
      font-size: 0.75rem; padding: 0.4rem 1rem;
      border-radius: 6px; cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center; gap: 0.5rem;
    }
    .lb-download:hover { background: rgba(150,120,255,0.3); color: #fff; }
    .lb-download svg { width: 14px; height: 14px; }
  `],
})
export class GalleryComponent implements OnInit, OnDestroy {
  user = signal<User | null>(null);
  images = signal<DriveImage[]>([]);
  loading = signal(true);
  error = signal('');
  nextPageToken = signal<string | null>(null);
  lightboxIndex = signal<number | null>(null);

  currentLightboxImage = computed(() => {
    const idx = this.lightboxIndex();
    return idx !== null ? this.images()[idx] : null;
  });

  private keyHandler = (e: KeyboardEvent) => {
    if (this.lightboxIndex() === null) return;
    if (e.key === 'Escape') this.closeLightbox();
    if (e.key === 'ArrowRight') this.nextImage();
    if (e.key === 'ArrowLeft') this.prevImage();
  };

  constructor(
    private auth: AuthService,
    private drive: DriveService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Restore user from cookie session
    this.auth.init().then(() => {
      if (!this.auth.isLoggedIn()) {
        this.router.navigate(['/']);
        return;
      }
      this.user.set(this.auth.currentUser());
    });

    this.loadImages();
    document.addEventListener('keydown', this.keyHandler);
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.keyHandler);
  }

  loadImages(append = false): void {
    this.loading.set(true);
    this.error.set('');

    const token = append ? (this.nextPageToken() ?? undefined) : undefined;

    this.drive.getImages(token).subscribe({
      next: (res) => {
        if (append) {
          this.images.update((prev) => [...prev, ...res.images]);
        } else {
          this.images.set(res.images);
        }
        this.nextPageToken.set(res.nextPageToken);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Failed to load images. Please try again.');
        this.loading.set(false);
      },
    });
  }

  loadMore(): void {
    this.loadImages(true);
  }

  openLightbox(index: number): void {
    this.lightboxIndex.set(index);
  }

  closeLightbox(): void {
    this.lightboxIndex.set(null);
  }

  nextImage(event?: Event): void {
    event?.stopPropagation();
    const cur = this.lightboxIndex();
    if (cur !== null && cur < this.images().length - 1) {
      this.lightboxIndex.set(cur + 1);
    }
  }

  prevImage(event?: Event): void {
    event?.stopPropagation();
    const cur = this.lightboxIndex();
    if (cur !== null && cur > 0) {
      this.lightboxIndex.set(cur - 1);
    }
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src =
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23222" width="100" height="100"/%3E%3Ctext x="50" y="55" text-anchor="middle" fill="%23555" font-size="30"%3E🖼%3C/text%3E%3C/svg%3E';
  }

  download(event: Event, fileId: string): void {
    event.stopPropagation();
    this.drive.downloadImage(fileId);
  }

  logout(): void {
    this.auth.logout();
  }
}
