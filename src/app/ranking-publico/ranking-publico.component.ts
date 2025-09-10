import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-ranking-publico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ranking-publico.component.html',
  styleUrl: './ranking-publico.component.css'
})
export class RankingPublicoComponent implements OnInit {
  agrupaciones: any[] = [];
  agrupacionesFiltradas: any[] = [];
  loading = true;
  showInsigniasModal = false;
  agrupacionSeleccionada: any = null;
  busqueda = '';

  constructor(
    private firestore: AngularFirestore,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarRanking();
  }

  async cargarRanking() {
    this.loading = true;
    try {
      const query = await this.firestore.collection('agrupaciones', ref => 
        ref.where('estatus', '==', 'activo')
      ).get().toPromise();
      
      if (query) {
        this.agrupaciones = query.docs.map(doc => {
          const data = doc.data() as any;
          return { id: doc.id, ...data };
        }).sort((a, b) => {
          const puntosA = a.ranking?.puntosTotales || 0;
          const puntosB = b.ranking?.puntosTotales || 0;
          return puntosB - puntosA;
        });
        
        // Asignar posición original
        this.agrupaciones.forEach((agrupacion, index) => {
          agrupacion.posicionOriginal = index + 1;
        });
        
        // Cargar insignias para cada agrupación
        await this.cargarInsignias();
        this.agrupacionesFiltradas = [...this.agrupaciones];
      }
    } catch (error) {
      console.error('Error cargando ranking:', error);
    }
    this.loading = false;
  }

  async cargarInsignias() {
    for (const agrupacion of this.agrupaciones) {
      try {
        const insigniasQuery = await this.firestore.collection('insignias', ref => 
          ref.where('agrupacionId', '==', agrupacion.id)
             .where('estado', '==', 'aprobada')
        ).get().toPromise();
        
        if (insigniasQuery) {
          agrupacion.insignias = insigniasQuery.docs.map(doc => {
            const data = doc.data() as any;
            return { id: doc.id, ...data };
          });
        } else {
          agrupacion.insignias = [];
        }
      } catch (error) {
        console.error('Error cargando insignias:', error);
        agrupacion.insignias = [];
      }
    }
  }

  volverInicio() {
    this.router.navigate(['/']);
  }

  verInsignias(agrupacion: any) {
    this.agrupacionSeleccionada = agrupacion;
    this.showInsigniasModal = true;
  }

  cerrarInsigniasModal() {
    this.showInsigniasModal = false;
    this.agrupacionSeleccionada = null;
  }

  filtrarAgrupaciones() {
    if (!this.busqueda.trim()) {
      this.agrupacionesFiltradas = [...this.agrupaciones];
      return;
    }
    
    const termino = this.busqueda.toLowerCase();
    this.agrupacionesFiltradas = this.agrupaciones.filter(agrupacion => 
      agrupacion.nombre.toLowerCase().includes(termino) ||
      agrupacion.tipo.toLowerCase().includes(termino) ||
      agrupacion.municipio?.toLowerCase().includes(termino) ||
      agrupacion.estado.toLowerCase().includes(termino)
    );
  }
}