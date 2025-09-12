import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoginComponent } from '../login/login.component';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { NotificationService } from '../services/notification.service';

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
  eventos: any[] = [];
  showCartelModal = false;
  cartelImagen = '';
  cartelTitulo = '';

  constructor(
    private router: Router, 
    private firestore: AngularFirestore,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.cargarEstadisticas();
    this.cargarEventosRecientes();
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
        ref.where('estatus', '==', 'activo')
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

  async cargarEventosRecientes() {
    try {
      const eventosQuery = await this.firestore.collection('eventos').get().toPromise();
      
      if (eventosQuery) {
        const todosEventos = eventosQuery.docs.map(doc => {
          const data = doc.data() as any;
          const fechaEvento = data.fechaEvento?.toDate();
          const ahora = new Date();
          
          return {
            id: doc.id,
            ...data,
            fechaEvento,
            esPasado: fechaEvento < ahora
          };
        });
        
        // Filtrar, ordenar por estado (abiertos primero) y luego por fecha
        this.eventos = todosEventos
          .filter(evento => ['abierto', 'cupo-lleno', 'concluido'].includes(evento.estatusEvento))
          .sort((a, b) => {
            // Prioridad: abierto > cupo-lleno > concluido
            const prioridadEstado: { [key: string]: number } = { 'abierto': 3, 'cupo-lleno': 2, 'concluido': 1 };
            const prioridadA = prioridadEstado[a.estatusEvento] || 0;
            const prioridadB = prioridadEstado[b.estatusEvento] || 0;
            
            if (prioridadA !== prioridadB) {
              return prioridadB - prioridadA;
            }
            
            // Si tienen el mismo estado, ordenar por fecha más reciente
            return new Date(b.fechaEvento).getTime() - new Date(a.fechaEvento).getTime();
          })
          .slice(0, 5);
      }
    } catch (error) {
      console.error('Error cargando eventos:', error);
    }
  }

  verCartelCompleto(imagen: string, titulo: string) {
    if (imagen) {
      this.cartelImagen = imagen;
      this.cartelTitulo = titulo;
      this.showCartelModal = true;
    }
  }

  cerrarCartelModal() {
    this.showCartelModal = false;
    this.cartelImagen = '';
    this.cartelTitulo = '';
  }
}