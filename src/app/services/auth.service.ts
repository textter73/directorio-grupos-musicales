import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$ = this.afAuth.authState;

  constructor(private afAuth: AngularFireAuth) {}

  async login(email: string, password: string) {
    try {
      const result = await this.afAuth.signInWithEmailAndPassword(email, password);
      return result;
    } catch (error) {
      throw error;
    }
  }

  isAdmin(email: string): boolean {
    const adminEmails = ['admin@estudiantina.com', 'tonantzin@estudiantina.com', 'admin@correo.com'];
    const normalizedEmail = email.trim().toLowerCase();
    
    console.log('=== VERIFICACIÓN ADMIN ===');
    console.log('Email original:', email);
    console.log('Email normalizado:', normalizedEmail);
    console.log('Lista de admins:', adminEmails);
    
    // Verificación directa
    const isAdmin = normalizedEmail === 'admin@estudiantina.com' || normalizedEmail === 'tonantzin@estudiantina.com' || normalizedEmail === 'admin@correo.com';
    
    console.log('RESULTADO - Es admin:', isAdmin);
    console.log('========================');
    
    return isAdmin;
  }

  async register(email: string, password: string) {
    try {
      const result = await this.afAuth.createUserWithEmailAndPassword(email, password);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    await this.afAuth.signOut();
  }
}