import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-organizadores-aprobados',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './organizadores-aprobados.component.html',
  styleUrl: './organizadores-aprobados.component.css'
})
export class OrganizadoresAprobadosComponent implements OnInit {
  organizadores: any[] = [];
  loading = true;

  constructor(
    private firestore: AngularFirestore,
    private router: Router,
    private afAuth: AngularFireAuth
  ) {}

  ngOnInit() {
    this.cargarOrganizadores();
  }

  cargarOrganizadores() {
    this.firestore.collection('organizadores').valueChanges({ idField: 'id' }).subscribe({
      next: (organizadores: any[]) => {
        this.organizadores = organizadores.sort((a, b) => {
          const fechaA = a.fechaAprobacion?.toDate() || new Date(0);
          const fechaB = b.fechaAprobacion?.toDate() || new Date(0);
          return fechaB.getTime() - fechaA.getTime();
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando organizadores:', error);
        this.loading = false;
      }
    });
  }

  volver() {
    this.router.navigate(['/admin']);
  }

  async resetPassword(email: string) {
    try {
      await this.afAuth.sendPasswordResetEmail(email);
      Swal.fire({
        title: 'Email Enviado',
        text: `Se ha enviado un enlace de restablecimiento de contraseña a ${email}`,
        icon: 'success',
        confirmButtonColor: '#ff9800'
      });
    } catch (error) {
      console.error('Error enviando reset email:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo enviar el email de restablecimiento',
        icon: 'error',
        confirmButtonColor: '#dc3545'
      });
    }
  }
}