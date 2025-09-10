import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-solicitudes-organizadores',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './solicitudes-organizadores.component.html',
  styleUrl: './solicitudes-organizadores.component.css'
})
export class SolicitudesOrganizadoresComponent implements OnInit {
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
    this.firestore.collection('solicitudes-organizadores').valueChanges({ idField: 'id' }).subscribe({
      next: (solicitudes: any[]) => {
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
      text: `¿Estás seguro de aprobar la solicitud de "${solicitud.nombre} ${solicitud.apellidos}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ff9800',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const contrasenaAleatoria = this.generarContrasenaAleatoria();
        
        const userCredential = await this.afAuth.createUserWithEmailAndPassword(
          solicitud.email, 
          contrasenaAleatoria
        );
        
        const organizadorAprobado = {
          ...solicitud,
          fechaAprobacion: new Date(),
          fechaSolicitud: solicitud.fechaSolicitud,
          estatus: 'activo',
          uid: userCredential.user?.uid,
          contrasenaGenerada: contrasenaAleatoria
        };
        
        delete organizadorAprobado.id;
        
        await this.firestore.collection('organizadores').add(organizadorAprobado);
        await this.firestore.collection('solicitudes-organizadores').doc(solicitud.id).delete();
        
        await Swal.fire({
          title: '¡Solicitud Aprobada!',
          html: `
            <div style="text-align: left;">
              <p><strong>Credenciales de acceso:</strong></p>
              <p><strong>Usuario:</strong> ${solicitud.email}</p>
              <p><strong>Contraseña:</strong> <code>${contrasenaAleatoria}</code></p>
              <br>
              <p style="color: #ff9800;"><strong>¡Comunica estas credenciales al organizador!</strong></p>
            </div>
          `,
          icon: 'success',
          confirmButtonColor: '#ff9800'
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
      text: `¿Estás seguro de rechazar la solicitud de "${solicitud.nombre} ${solicitud.apellidos}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, rechazar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const organizadorRechazado = {
          ...solicitud,
          fechaRechazo: new Date(),
          fechaSolicitud: solicitud.fechaSolicitud,
          estado: 'rechazado'
        };
        
        delete organizadorRechazado.id;
        
        await this.firestore.collection('organizadores-rechazados').add(organizadorRechazado);
        await this.firestore.collection('solicitudes-organizadores').doc(solicitud.id).delete();
        
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