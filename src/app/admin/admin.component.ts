import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  contadorPendientes = 0;
  contadorOrganizadores = 0;
  contadorAgrupaciones = 0;
  contadorOrganizadoresRegistrados = 0;
  contadorEventosActivos = 0;
  contadorEventosRealizados = 0;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private firestore: AngularFirestore
  ) {}

  ngOnInit() {
    this.cargarContadorSolicitudes();
    this.cargarContadorOrganizadores();
    this.cargarContadorAgrupaciones();
    this.cargarContadorOrganizadoresRegistrados();
    this.cargarContadorEventos();
  }

  cargarContadorSolicitudes() {
    this.firestore.collection('solicitudes-agrupaciones').valueChanges().subscribe({
      next: (solicitudes: any[]) => {
        this.contadorPendientes = solicitudes.filter(s => s.estatus === 'pendiente').length;
      },
      error: (error) => {
        console.error('Error cargando contador:', error);
      }
    });
  }

  cargarContadorOrganizadores() {
    this.firestore.collection('solicitudes-organizadores').valueChanges().subscribe({
      next: (solicitudes: any[]) => {
        this.contadorOrganizadores = solicitudes.filter(s => s.estatus === 'pendiente').length;
      },
      error: (error) => {
        console.error('Error cargando contador organizadores:', error);
      }
    });
  }

  cargarContadorAgrupaciones() {
    this.firestore.collection('agrupaciones').valueChanges().subscribe({
      next: (agrupaciones: any[]) => {
        this.contadorAgrupaciones = agrupaciones.length;
      },
      error: (error) => {
        console.error('Error cargando contador agrupaciones:', error);
      }
    });
  }

  cargarContadorOrganizadoresRegistrados() {
    this.firestore.collection('organizadores').valueChanges().subscribe({
      next: (organizadores: any[]) => {
        this.contadorOrganizadoresRegistrados = organizadores.length;
      },
      error: (error) => {
        console.error('Error cargando contador organizadores registrados:', error);
      }
    });
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/']);
  }

  verSolicitudes() {
    this.router.navigate(['/solicitudes-pendientes']);
  }

  verAgrupaciones() {
    this.router.navigate(['/agrupaciones-aprobadas']);
  }

  verSolicitudesOrganizadores() {
    this.router.navigate(['/solicitudes-organizadores']);
  }

  verOrganizadores() {
    this.router.navigate(['/organizadores-aprobados']);
  }

  cargarContadorEventos() {
    this.firestore.collection('eventos').valueChanges().subscribe({
      next: (eventos: any[]) => {
        const fechaActual = new Date();
        this.contadorEventosActivos = eventos.filter(evento => {
          if (!evento.fecha) return false;
          const fechaEvento = new Date(evento.fecha);
          return fechaEvento >= fechaActual || evento.estado === 'abierto';
        }).length;
        
        this.contadorEventosRealizados = eventos.filter(evento => {
          if (!evento.fecha) return false;
          const fechaEvento = new Date(evento.fecha);
          return fechaEvento < fechaActual && evento.estado !== 'abierto';
        }).length;
      },
      error: (error) => {
        console.error('Error cargando contador eventos:', error);
      }
    });
  }

  verEventosActivos() {
    this.router.navigate(['/admin-eventos-activos']);
  }

  verEventosRealizados() {
    this.router.navigate(['/admin-eventos-realizados']);
  }
}