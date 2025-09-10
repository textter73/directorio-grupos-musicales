import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-insignias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-insignias.component.html',
  styleUrl: './admin-insignias.component.css'
})
export class AdminInsigniasComponent implements OnInit {
  insigniasPendientes: any[] = [];
  loading = true;

  constructor(
    private firestore: AngularFirestore,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarInsigniasPendientes();
  }

  async cargarInsigniasPendientes() {
    this.loading = true;
    try {
      const query = await this.firestore.collection('insignias', ref => 
        ref.where('estado', '==', 'reclamada')
      ).get().toPromise();
      
      if (query) {
        this.insigniasPendientes = query.docs.map(doc => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            ...data
          };
        });
      }
    } catch (error) {
      console.error('Error cargando insignias pendientes:', error);
    }
    this.loading = false;
  }

  async aprobarInsignia(insignia: any) {
    const confirmacion = await Swal.fire({
      title: '¿Aprobar Insignia?',
      text: `¿Aprobar la insignia de ${insignia.agrupacionNombre} para el evento "${insignia.eventoNombre}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar'
    });

    if (confirmacion.isConfirmed) {
      try {
        await this.firestore.collection('insignias').doc(insignia.id).update({
          estado: 'aprobada',
          fechaAprobacion: new Date()
        });

        await this.actualizarRankingAgrupacion(insignia.agrupacionId);

        this.insigniasPendientes = this.insigniasPendientes.filter(i => i.id !== insignia.id);

        await Swal.fire({
          title: 'Insignia Aprobada',
          text: 'La insignia ha sido aprobada y los puntos se han sumado al ranking.',
          icon: 'success',
          confirmButtonColor: '#00acc1'
        });
      } catch (error) {
        console.error('Error aprobando insignia:', error);
        await Swal.fire({
          title: 'Error',
          text: 'No se pudo aprobar la insignia. Intenta nuevamente.',
          icon: 'error',
          confirmButtonColor: '#dc3545'
        });
      }
    }
  }

  async rechazarInsignia(insignia: any) {
    const { value: motivo } = await Swal.fire({
      title: 'Rechazar Insignia',
      text: `¿Por qué rechazas la insignia de ${insignia.agrupacionNombre}?`,
      input: 'textarea',
      inputPlaceholder: 'Motivo del rechazo...',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar'
    });

    if (motivo !== undefined) {
      try {
        await this.firestore.collection('insignias').doc(insignia.id).update({
          estado: 'rechazada',
          fechaRechazo: new Date(),
          motivoRechazo: motivo
        });

        this.insigniasPendientes = this.insigniasPendientes.filter(i => i.id !== insignia.id);

        await Swal.fire({
          title: 'Insignia Rechazada',
          text: 'La insignia ha sido rechazada.',
          icon: 'info',
          confirmButtonColor: '#00acc1'
        });
      } catch (error) {
        console.error('Error rechazando insignia:', error);
        await Swal.fire({
          title: 'Error',
          text: 'No se pudo rechazar la insignia. Intenta nuevamente.',
          icon: 'error',
          confirmButtonColor: '#dc3545'
        });
      }
    }
  }

  async actualizarRankingAgrupacion(agrupacionId: string) {
    try {
      const insigniasQuery = await this.firestore.collection('insignias', ref => 
        ref.where('agrupacionId', '==', agrupacionId)
           .where('estado', '==', 'aprobada')
      ).get().toPromise();

      let totalPuntos = 0;
      let eventosAsistidos = 0;
      let totalEstrellas = 0;
      let totalCalificaciones = 0;

      if (insigniasQuery) {
        insigniasQuery.docs.forEach(doc => {
          const insignia = doc.data() as any;
          eventosAsistidos++;
          totalPuntos += 10;
          
          if (insignia.calificacion) {
            totalPuntos += insignia.calificacion;
            totalEstrellas += insignia.calificacion;
            totalCalificaciones++;
          }
        });
      }

      const promedioEstrellas = totalCalificaciones > 0 ? totalEstrellas / totalCalificaciones : 0;

      await this.firestore.collection('agrupaciones').doc(agrupacionId).update({
        ranking: {
          puntosTotales: totalPuntos,
          eventosAsistidos: eventosAsistidos,
          promedioEstrellas: Math.round(promedioEstrellas * 10) / 10,
          totalCalificaciones: totalCalificaciones,
          fechaActualizacion: new Date()
        }
      });
    } catch (error) {
      console.error('Error actualizando ranking:', error);
    }
  }

  volverAdmin() {
    this.router.navigate(['/admin']);
  }
}