import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-eventos-pendientes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-eventos-pendientes.component.html',
  styleUrl: './admin-eventos-pendientes.component.css'
})
export class AdminEventosPendientesComponent implements OnInit {
  eventosPendientes: any[] = [];
  loading = true;
  showImageModal = false;
  imagenModal = '';

  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarEventosPendientes();
  }

  async cargarEventosPendientes() {
    this.loading = true;
    try {
      const query = await this.firestore.collection('eventos', ref => 
        ref.where('estatusEvento', '==', 'pendiente-aprobacion')
      ).get().toPromise();
      
      if (query) {
        this.eventosPendientes = query.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as any
        })).sort((a, b) => {
          const fechaA = a.fechaCreacion?.toDate() || new Date(0);
          const fechaB = b.fechaCreacion?.toDate() || new Date(0);
          return fechaB.getTime() - fechaA.getTime();
        });
      }
    } catch (error) {
      console.error('Error cargando eventos pendientes:', error);
    }
    this.loading = false;
  }

  async aprobarEvento(evento: any) {
    const confirmacion = await Swal.fire({
      title: '¿Aprobar Evento?',
      text: `¿Aprobar el evento "${evento.nombre}"? Será visible para las agrupaciones.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar'
    });

    if (confirmacion.isConfirmed) {
      try {
        await this.firestore.collection('eventos').doc(evento.id).update({
          estatusEvento: 'abierto',
          fechaAprobacion: new Date(),
          aprobadoPor: 'admin'
        });

        await Swal.fire({
          title: 'Evento Aprobado',
          text: 'El evento ha sido aprobado y ya es visible para las agrupaciones.',
          icon: 'success',
          confirmButtonColor: '#00acc1'
        });

        this.cargarEventosPendientes();
      } catch (error) {
        console.error('Error aprobando evento:', error);
        await Swal.fire({
          title: 'Error',
          text: 'No se pudo aprobar el evento. Intenta nuevamente.',
          icon: 'error',
          confirmButtonColor: '#dc3545'
        });
      }
    }
  }

  async rechazarEvento(evento: any) {
    const { value: motivo } = await Swal.fire({
      title: 'Rechazar Evento',
      text: `¿Por qué rechazas el evento "${evento.nombre}"?`,
      input: 'textarea',
      inputPlaceholder: 'Escribe el motivo del rechazo...',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return 'Debes proporcionar un motivo para el rechazo';
        }
        return null;
      }
    });

    if (motivo) {
      try {
        await this.firestore.collection('eventos').doc(evento.id).update({
          estatusEvento: 'rechazado',
          fechaRechazo: new Date(),
          motivoRechazo: motivo,
          rechazadoPor: 'admin'
        });

        await Swal.fire({
          title: 'Evento Rechazado',
          text: 'El evento ha sido rechazado. El organizador será notificado.',
          icon: 'success',
          confirmButtonColor: '#00acc1'
        });

        this.cargarEventosPendientes();
      } catch (error) {
        console.error('Error rechazando evento:', error);
        await Swal.fire({
          title: 'Error',
          text: 'No se pudo rechazar el evento. Intenta nuevamente.',
          icon: 'error',
          confirmButtonColor: '#dc3545'
        });
      }
    }
  }

  abrirImagenModal(imagen: string) {
    this.imagenModal = imagen;
    this.showImageModal = true;
  }

  cerrarImagenModal() {
    this.showImageModal = false;
    this.imagenModal = '';
  }

  volver() {
    this.router.navigate(['/admin']);
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/']);
  }
}