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
    const adminEmails = [ 'texttter73@gmail.com'];
    const normalizedEmail = email.trim().toLowerCase();
    
    // Verificación directa
    const isAdmin = normalizedEmail === 'texttter73@gmail.com';
    
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