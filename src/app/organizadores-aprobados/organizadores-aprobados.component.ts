import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';

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
    private router: Router
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
}