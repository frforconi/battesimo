import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<User | null>(null);
  isLoading = signal(false);

  constructor(private http: HttpClient, private router: Router) {}

  /** Called once on startup — verifies session cookie with backend */
  init(): Promise<void> {
    this.isLoading.set(true);
    return new Promise((resolve) => {
      this.http.get<User>('/api/auth/me', { withCredentials: true }).subscribe({
        next: (user) => {
          this.currentUser.set(user);
          this.isLoading.set(false);
          resolve();
        },
        error: () => {
          this.currentUser.set(null);
          this.isLoading.set(false);
          resolve();
        },
      });
    });
  }

  loginWithGoogle(): void {
    window.location.href = '/api/auth/login';
  }

  logout(): void {
    this.http.post('/api/auth/logout', {}, { withCredentials: true }).subscribe({
      complete: () => {
        this.currentUser.set(null);
        this.router.navigate(['/']);
      },
    });
  }

  /** After OAuth redirect the cookie is already set — just check if /me works */
  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }
}
