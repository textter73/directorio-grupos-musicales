import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoginComponent } from '../login/login.component';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, LoginComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  @ViewChild('loginModal') loginComponent!: LoginComponent;
  title = 'Directorio de Grupos Musicales';
  totalAgrupaciones = 0;
  totalOrganizadores = 0;

  constructor(private router: Router, private firestore: AngularFirestore) {}

  ngOnInit() {
    this.cargarEstadisticas();
  }

  registrarAgrupacion() {
    this.router.navigate(['/registro-agrupacion']);
  }

  registrarOrganizador() {
    this.router.navigate(['/registro-organizador']);
  }

  verRankingPublico() {
    this.router.navigate(['/ranking-publico']);
  }

  abrirLogin() {
    this.loginComponent.openLogin();
  }

  async cargarEstadisticas() {
    try {
      // Contar agrupaciones autorizadas
      const agrupacionesQuery = await this.firestore.collection('agrupaciones', ref => 
        ref.where('activo', '==', 'activa')
      ).get().toPromise();
      this.totalAgrupaciones = agrupacionesQuery ? agrupacionesQuery.size : 0;

      // Contar organizadores autorizados
      const organizadoresQuery = await this.firestore.collection('organizadores', ref => 
        ref.where('estatus', '==', 'activo')
      ).get().toPromise();
      this.totalOrganizadores = organizadoresQuery ? organizadoresQuery.size : 0;
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  }
}