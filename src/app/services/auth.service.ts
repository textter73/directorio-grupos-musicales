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

  getCurrentUser() {
    const userData = localStorage.getItem('userData');
    const loginTime = localStorage.getItem('loginTime');
    
    if (!userData || !loginTime) {
      return null;
    }
    
    const now = new Date().getTime();
    const loginTimestamp = parseInt(loginTime);
    const oneDayInMs = 24 * 60 * 60 * 1000;
    
    if (now - loginTimestamp > oneDayInMs) {
      localStorage.removeItem('userData');
      localStorage.removeItem('loginTime');
      return null;
    }
    
    return JSON.parse(userData);
  }

  setUserSession(userData: any) {
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('loginTime', new Date().getTime().toString());
  }
}