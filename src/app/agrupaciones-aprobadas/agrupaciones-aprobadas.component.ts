import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agrupaciones-aprobadas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agrupaciones-aprobadas.component.html',
  styleUrl: './agrupaciones-aprobadas.component.css'
})
export class AgrupacionesAprobadasComponent implements OnInit {
  agrupaciones: any[] = [];
  loading = true;

  constructor(
    private firestore: AngularFirestore,
    private router: Router,
    private afAuth: AngularFireAuth
  ) {}

  ngOnInit() {
    this.cargarAgrupaciones();
  }

  cargarAgrupaciones() {
    this.firestore.collection('agrupaciones').valueChanges({ idField: 'id' }).subscribe({
      next: (agrupaciones: any[]) => {
        this.agrupaciones = agrupaciones
          .filter(a => !a.eliminada) // Filtrar eliminadas
          .sort((a, b) => {
            const fechaA = a.fechaAprobacion?.toDate() || new Date(0);
            const fechaB = b.fechaAprobacion?.toDate() || new Date(0);
            return fechaB.getTime() - fechaA.getTime();
          });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando agrupaciones:', error);
        this.loading = false;
      }
    });
  }

  volver() {
    this.router.navigate(['/admin']);
  }

  async eliminarAgrupacion(agrupacion: any) {
    const confirmacion = await Swal.fire({
      title: '¿Eliminar Agrupación?',
      html: `
        <p>Esta acción eliminará <strong>PERMANENTEMENTE</strong>:</p>
        <ul style="text-align: left; margin: 10px 0;">
          <li>• Todos los datos de <strong>${agrupacion.nombre}</strong></li>
          <li>• Su cuenta de usuario y contraseña</li>
          <li>• Su historial de eventos</li>
          <li>• Toda la información asociada</li>
        </ul>
        <p style="color: #dc3545; font-weight: bold;">¡Esta acción NO se puede deshacer!</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar todo',
      cancelButtonText: 'Cancelar',
      focusCancel: true
    });

    if (confirmacion.isConfirmed) {
      try {
        // 1. Marcar como eliminada y desactivar
        await this.firestore.collection('agrupaciones').doc(agrupacion.id).update({
          eliminada: true,
          fechaEliminacion: new Date(),
          activo: 'Eliminada',
          eliminadaPorAdmin: true
        });

        // 2. Remover de la lista local
        this.agrupaciones = this.agrupaciones.filter(a => a.id !== agrupacion.id);

        await Swal.fire({
          title: 'Agrupación Eliminada',
          text: `${agrupacion.nombre} ha sido desactivada y marcada como eliminada. La cuenta no podrá acceder al sistema.`,
          icon: 'success',
          confirmButtonColor: '#00acc1'
        });

      } catch (error) {
        console.error('Error eliminando agrupación:', error);
        await Swal.fire({
          title: 'Error',
          text: 'No se pudo eliminar la agrupación. Inténtalo nuevamente.',
          icon: 'error',
          confirmButtonColor: '#dc3545'
        });
      }
    }
  }
}