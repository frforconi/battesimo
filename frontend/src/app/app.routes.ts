import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { GalleryComponent } from './gallery/gallery.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  {
    path: 'gallery',
    component: GalleryComponent,
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '' },
];
