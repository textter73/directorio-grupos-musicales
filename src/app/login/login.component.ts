import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  showLogin = false;
  loading = false;
  error = '';

  constructor(
    private authService: AuthService, 
    private router: Router,
    private firestore: AngularFirestore
  ) {}

  async onLogin() {
    if (this.email && this.password) {
      this.loading = true;
      this.error = '';
      try {
        const result = await this.authService.login(this.email, this.password);
        
        if (this.authService.isAdmin(this.email)) {
          this.authService.setUserSession({ tipo: 'admin', email: this.email });
          await this.router.navigate(['/admin']);
          this.closeLogin();
          this.loading = false;
          return;
        }
        
        const uid = result.user?.uid;
        
        // Buscar en agrupaciones
        const agrupacionQuery = await this.firestore.collection('agrupaciones', ref => 
          ref.where('uid', '==', uid)
        ).get().toPromise();
        
        
        if (agrupacionQuery && !agrupacionQuery.empty) {
          const agrupacionData = agrupacionQuery.docs[0].data() as any;
          
          if (agrupacionData.estatus === 'activa') {
            this.authService.setUserSession({ tipo: 'agrupacion', ...agrupacionData });
            await this.router.navigate(['/perfil-agrupacion']);
            this.closeLogin();
            this.loading = false;
            return;
          } else {
            this.error = 'Tu agrupación aún no ha sido aprobada';
            this.loading = false;
            return;
          }
        }
        
        // Buscar en organizadores
        const organizadorQuery = await this.firestore.collection('organizadores', ref => 
          ref.where('uid', '==', uid)
        ).get().toPromise();
        
        
        if (organizadorQuery && !organizadorQuery.empty) {
          const organizadorData = organizadorQuery.docs[0].data() as any;
          
          if (organizadorData.activo === 'activa') {
            this.authService.setUserSession({ tipo: 'organizador', ...organizadorData });
            await this.router.navigate(['/perfil-organizador']);
            this.closeLogin();
            this.loading = false;
            return;
          } else {
            this.error = 'Tu cuenta de organizador aún no ha sido aprobada';
            this.loading = false;
            return;
          }
        }
        
        // Si no se encuentra en ninguna colección
        this.error = 'Usuario no encontrado en el sistema';
        
      } catch (error: any) {
        console.error('Error en login:', error);
        this.error = 'Email o contraseña incorrectos';
      }
      this.loading = false;
    }
  }

  openLogin() {
    this.showLogin = true;
  }

  closeLogin() {
    this.showLogin = false;
    this.email = '';
    this.password = '';
  }
}