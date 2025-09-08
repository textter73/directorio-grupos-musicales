import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-solicitudes-pendientes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './solicitudes-pendientes.component.html',
  styleUrl: './solicitudes-pendientes.component.css'
})
export class SolicitudesPendientesComponent implements OnInit {
  solicitudes: any[] = [];
  loading = true;

  get contadorPendientes(): number {
    return this.solicitudes.length;
  }

  generarContrasenaAleatoria(): string {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let contrasena = '';
    for (let i = 0; i < 8; i++) {
      contrasena += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return contrasena;
  }

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarSolicitudes();
  }

  cargarSolicitudes() {
    this.firestore.collection('solicitudes-agrupaciones').valueChanges({ idField: 'id' }).subscribe({
      next: (solicitudes: any[]) => {
        // Filtrar solo las pendientes y ordenar en el cliente
        this.solicitudes = solicitudes
          .filter(s => s.estatus === 'pendiente')
          .sort((a, b) => {
            const fechaA = a.fechaSolicitud?.toDate() || new Date(0);
            const fechaB = b.fechaSolicitud?.toDate() || new Date(0);
            return fechaB.getTime() - fechaA.getTime();
          });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando solicitudes:', error);
        this.loading = false;
      }
    });
  }

  async aprobar(solicitud: any) {
    const result = await Swal.fire({
      title: '¿Aprobar solicitud?',
      text: `¿Estás seguro de aprobar la solicitud de "${solicitud.nombre}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        // Generar contraseña aleatoria
        const contrasenaAleatoria = this.generarContrasenaAleatoria();
        
        // Crear usuario en Firebase Auth
        const userCredential = await this.afAuth.createUserWithEmailAndPassword(
          solicitud.email, 
          contrasenaAleatoria
        );
        
        // Crear la agrupación aprobada en la colección 'agrupaciones'
        const agrupacionAprobada = {
          ...solicitud,
          fechaAprobacion: new Date(),
          fechaSolicitud: solicitud.fechaSolicitud,
          activo: 'activa',
          uid: userCredential.user?.uid,
          contrasenaGenerada: contrasenaAleatoria
        };
        
        // Eliminar el campo 'id' para evitar conflictos
        delete agrupacionAprobada.id;
        
        // Guardar en la colección 'agrupaciones'
        await this.firestore.collection('agrupaciones').add(agrupacionAprobada);
        
        // Eliminar de 'solicitudes-agrupaciones'
        await this.firestore.collection('solicitudes-agrupaciones').doc(solicitud.id).delete();
        
        await Swal.fire({
          title: '¡Solicitud Aprobada!',
          html: `
            <div style="text-align: left;">
              <p><strong>Credenciales de acceso:</strong></p>
              <p><strong>Usuario:</strong> ${solicitud.email}</p>
              <p><strong>Contraseña:</strong> <code>${contrasenaAleatoria}</code></p>
              <br>
              <p style="color: #28a745;"><strong>¡Comunica estas credenciales a la agrupación!</strong></p>
            </div>
          `,
          icon: 'success',
          confirmButtonColor: '#28a745'

        });
      } catch (error) {
        console.error('Error al aprobar solicitud:', error);
        await Swal.fire({
          title: 'Error',
          text: 'Error al procesar la solicitud. Intenta nuevamente.',
          icon: 'error',
          confirmButtonColor: '#dc3545'
        });
      }
    }
  }

  async rechazar(solicitud: any) {
    const result = await Swal.fire({
      title: '¿Rechazar solicitud?',
      text: `¿Estás seguro de rechazar la solicitud de "${solicitud.nombre}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, rechazar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        // Crear el registro de agrupación rechazada
        const agrupacionRechazada = {
          ...solicitud,
          fechaRechazo: new Date(),
          fechaSolicitud: solicitud.fechaSolicitud,
          estado: 'rechazada'
        };
        
        // Eliminar el campo 'id' para evitar conflictos
        delete agrupacionRechazada.id;
        
        // Guardar en la colección 'agrupaciones-rechazadas'
        await this.firestore.collection('agrupaciones-rechazadas').add(agrupacionRechazada);
        
        // Eliminar de 'solicitudes-agrupaciones'
        await this.firestore.collection('solicitudes-agrupaciones').doc(solicitud.id).delete();
        
        await Swal.fire({
          title: 'Solicitud Rechazada',
          text: 'La solicitud ha sido rechazada y archivada correctamente.',
          icon: 'info',
          confirmButtonColor: '#17a2b8'
        });
      } catch (error) {
        console.error('Error al rechazar solicitud:', error);
        await Swal.fire({
          title: 'Error',
          text: 'Error al procesar el rechazo. Intenta nuevamente.',
          icon: 'error',
          confirmButtonColor: '#dc3545'
        });
      }
    }
  }

  volver() {
    this.router.navigate(['/admin']);
  }
}