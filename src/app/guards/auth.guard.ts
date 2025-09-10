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
    console.log(requiredRole);
    console.log(user);
    if (requiredRole && user.tipo !== requiredRole) {
      this.router.navigate(['/']);
      return false;
    }

    return true;
  }
}