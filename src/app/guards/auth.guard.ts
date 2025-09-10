import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const user = this.authService.getCurrentUser();
    
    if (!user) {
      this.router.navigate(['/']);
      return false;
    }

    const requiredRole = route.data['role'];
    if (requiredRole) {
      if (Array.isArray(requiredRole)) {
        if (!requiredRole.includes(user.tipo)) {
          this.router.navigate(['/']);
          return false;
        }
      } else {
        if (user.tipo !== requiredRole) {
          this.router.navigate(['/']);
          return false;
        }
      }
    }

    return true;
  }
}