import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-eventos-activos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-eventos-activos.component.html',
  styleUrl: './admin-eventos-activos.component.css'
})
export class AdminEventosActivosComponent implements OnInit {
  eventosActivos: any[] = [];
  loading = true;
  showDetalleModal = false;
  eventoDetalle: any = null;
  mensajesChat: any[] = [];
  showChatModal = false;

  constructor(
    private firestore: AngularFirestore,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarEventosActivos();
  }

  async cargarEventosActivos() {
    try {
      const eventosQuery = await this.firestore.collection('eventos').get().toPromise();
      const fechaActual = new Date();
      
      this.eventosActivos = eventosQuery?.docs
        .map(doc => {
          const data = doc.data();
          return data ? { id: doc.id, ...data } : null;
        })
        .filter((evento: any) => {
          if (!evento || !evento.fecha) return false;
          const fechaEvento = new Date(evento.fecha);
          return fechaEvento >= fechaActual || evento.estatusEvento === 'abierto';
        }) || [];
        
    } catch (error) {
      console.error('Error cargando eventos activos:', error);
    }
    this.loading = false;
  }

  getAgrupacionesConfirmadas(evento: any): any[] {
    const invitaciones = evento.invitaciones || [];
    return invitaciones.filter((inv: any) => inv.estatusInvitacion === 'aceptada');
  }

  async verDetalle(evento: any) {
    this.eventoDetalle = evento;
    this.showDetalleModal = true;
    await this.cargarMensajesChat(evento.id);
  }

  cerrarDetalle() {
    this.showDetalleModal = false;
    this.eventoDetalle = null;
    this.mensajesChat = [];
  }

  async cargarMensajesChat(eventoId: string) {
    try {
      const mensajesQuery = await this.firestore.collection('chats')
        .doc(eventoId)
        .collection('mensajes', ref => ref.orderBy('fecha', 'asc'))
        .get().toPromise();
      
      this.mensajesChat = mensajesQuery?.docs.map(doc => {
        const data = doc.data();
        return data ? { id: doc.id, ...data } : null;
      }).filter(msg => msg !== null) || [];
    } catch (error) {
      console.error('Error cargando mensajes del chat:', error);
      this.mensajesChat = [];
    }
  }

  getMensajesRecientes(): any[] {
    return this.mensajesChat.slice(0, 3);
  }

  verChat() {
    this.showChatModal = true;
  }

  cerrarChat() {
    this.showChatModal = false;
  }

  async eliminarEvento(evento: any) {
    const result = await Swal.fire({
      title: '¿Eliminar evento?',
      text: `¿Estás seguro de eliminar "${evento.nombre}"? Se eliminará el evento y todo su chat. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar todo',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        // Eliminar todos los mensajes del chat
        await this.eliminarChatEvento(evento.id);
        
        // Eliminar el evento
        await this.firestore.collection('eventos').doc(evento.id).delete();
        
        Swal.fire({
          title: 'Eliminado',
          text: 'El evento y su chat han sido eliminados exitosamente.',
          icon: 'success',
          confirmButtonColor: '#28a745'
        });
        
        this.cargarEventosActivos();
      } catch (error) {
        console.error('Error eliminando evento:', error);
        
        Swal.fire({
          title: 'Error',
          text: 'No se pudo eliminar el evento. Inténtalo de nuevo.',
          icon: 'error',
          confirmButtonColor: '#dc3545'
        });
      }
    }
  }

  async eliminarChatEvento(eventoId: string) {
    try {
      // Eliminar todos los mensajes del chat
      const mensajesQuery = await this.firestore.collection('chats')
        .doc(eventoId)
        .collection('mensajes')
        .get().toPromise();
      
      if (mensajesQuery && !mensajesQuery.empty) {
        const batch = this.firestore.firestore.batch();
        mensajesQuery.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }
      
      // Eliminar el documento del chat
      await this.firestore.collection('chats').doc(eventoId).delete();
    } catch (error) {
      console.error('Error eliminando chat del evento:', error);
      // No lanzamos el error para que continúe eliminando el evento
    }
  }

  volver() {
    this.router.navigate(['/admin']);
  }
}