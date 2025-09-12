import { Injectable } from '@angular/core';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(
    private afMessaging: AngularFireMessaging,
    private firestore: AngularFirestore
  ) {}

  async requestPermission(): Promise<string | null> {
    try {
      // Verificar si el navegador soporta notificaciones
      if (!('Notification' in window)) {
        console.warn('Este navegador no soporta notificaciones');
        return null;
      }

      // Solicitar permiso al usuario
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const token = await this.afMessaging.requestToken.toPromise();
        console.log('FCM Token obtenido:', token);
        return token || null;
      } else {
        console.warn('Permisos de notificación denegados');
        return null;
      }
    } catch (error) {
      console.error('Error solicitando permisos FCM:', error);
      return null;
    }
  }

  async initializeNotifications(userId: string): Promise<boolean> {
    try {
      const token = await this.requestPermission();
      if (token) {
        await this.saveTokenForUser(userId, token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error inicializando notificaciones:', error);
      return false;
    }
  }

  async saveTokenForUser(userId: string, token: string) {
    try {
      await this.firestore.collection('fcmTokens').doc(userId).set({
        token,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  async requestPermissionOnly(): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        return false;
      }
      
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      return false;
    }
  }

  async sendNotificationToEventParticipants(eventoId: string, mensaje: string, remitente: string) {
    try {
      // Obtener participantes del evento
      const eventoDoc = await this.firestore.collection('eventos').doc(eventoId).get().toPromise();
      const eventoData = eventoDoc?.data() as any;
      
      if (eventoData?.agrupacionesAceptadas) {
        const participantes = [...eventoData.agrupacionesAceptadas, eventoData.organizadorId];
        
        // Crear notificación en Firestore para que Cloud Functions la procese
        await this.firestore.collection('notificaciones').add({
          eventoId,
          participantes,
          mensaje: mensaje.substring(0, 100),
          remitente,
          timestamp: new Date(),
          tipo: 'chat_mensaje'
        });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
}