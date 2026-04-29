import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="noise"></div>
      <div class="content">
        <div class="brand">
          <div class="logo">◈</div>
          <h1>Drive Gallery</h1>
          <p class="tagline">Your memories, beautifully presented</p>
        </div>
        <div class="card">
          <p class="prompt">Sign in to view the collection</p>
          <button class="google-btn" (click)="login()" [disabled]="loading">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>{{ loading ? 'Signing in…' : 'Continue with Google' }}</span>
          </button>
        </div>
        <p class="error" *ngIf="errorMsg">{{ errorMsg }}</p>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400&display=swap');
    :host { display: block; height: 100vh; }
    .page { height:100%; background:#0a0a0f; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; }
    .page::before { content:''; position:absolute; inset:0; background: radial-gradient(ellipse 80% 60% at 20% 80%, rgba(120,80,255,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(60,160,255,0.1) 0%, transparent 60%); }
    .noise { position:absolute; inset:0; opacity:0.03; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-size:200px; }
    .content { position:relative; z-index:1; display:flex; flex-direction:column; align-items:center; gap:2.5rem; animation:fadeUp 0.8s ease both; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    .brand { text-align:center; }
    .logo { font-size:2.5rem; color:rgba(150,120,255,0.8); margin-bottom:0.75rem; display:block; animation:pulse 3s ease infinite; }
    @keyframes pulse { 0%,100%{opacity:0.7} 50%{opacity:1} }
    h1 { font-family:'Cormorant Garamond',serif; font-weight:300; font-size:3rem; color:#f0ece8; margin:0; letter-spacing:0.08em; }
    .tagline { font-family:'DM Sans',sans-serif; font-weight:300; font-size:0.85rem; color:rgba(240,236,232,0.4); margin:0.4rem 0 0; letter-spacing:0.15em; text-transform:uppercase; }
    .card { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:2.5rem 3rem; display:flex; flex-direction:column; align-items:center; gap:1.5rem; backdrop-filter:blur(12px); min-width:340px; }
    .prompt { font-family:'DM Sans',sans-serif; font-size:0.9rem; color:rgba(240,236,232,0.5); margin:0; letter-spacing:0.05em; }
    .google-btn { display:flex; align-items:center; gap:12px; background:#fff; color:#1a1a2e; border:none; border-radius:10px; padding:0.85rem 1.75rem; font-family:'DM Sans',sans-serif; font-size:0.95rem; cursor:pointer; transition:all 0.2s ease; width:100%; justify-content:center; }
    .google-btn:hover:not(:disabled) { background:#f0f0f0; transform:translateY(-1px); box-shadow:0 8px 24px rgba(0,0,0,0.3); }
    .google-btn:disabled { opacity:0.6; cursor:not-allowed; }
    .google-btn svg { width:20px; height:20px; flex-shrink:0; }
    .error { font-family:'DM Sans',sans-serif; font-size:0.8rem; color:#ff7070; background:rgba(255,80,80,0.1); border:1px solid rgba(255,80,80,0.2); border-radius:8px; padding:0.6rem 1.2rem; margin:0; }
  `],
})
export class LoginComponent implements OnInit {
  loading = false;
  errorMsg = '';

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    
    if (error) {
      if (error === 'unauthorized') {
        this.errorMsg = 'Access denied. Your email is not authorized to view this gallery.';
      } else {
        this.errorMsg = 'Authentication failed. Please try again.';
      }
      return;
    }

    // If cookie session already valid, go straight to gallery
    this.auth.init().then(() => {
      if (this.auth.isLoggedIn()) {
        this.router.navigate(['/gallery']);
      }
    });
  }

  login(): void {
    this.loading = true;
    this.auth.loginWithGoogle();
  }
}
