import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-registro-organizador',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro-organizador.component.html',
  styleUrl: './registro-organizador.component.css'
})
export class RegistroOrganizadorComponent {
  organizador = {
    nombre: '',
    apellidos: '',
    empresa: '',
    tipoEvento: '',
    ciudad: '',
    estado: '',
    telefono: '',
    email: '',
    descripcion: ''
  };
  
  loading = false;
  success = false;

  estados = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
    'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Guanajuato',
    'Guerrero', 'Hidalgo', 'Jalisco', 'México', 'Michoacán', 'Morelos', 'Nayarit',
    'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí',
    'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
  ];

  ciudadesPorEstado: { [key: string]: string[] } = {
    'Ciudad de México': ['Álvaro Obregón', 'Azcapotzalco', 'Benito Juárez', 'Coyoacán', 'Cuajimalpa', 'Gustavo A. Madero', 'Iztacalco', 'Iztapalapa', 'Magdalena Contreras', 'Miguel Hidalgo', 'Milpa Alta', 'Tláhuac', 'Tlalpan', 'Venustiano Carranza', 'Xochimilco'],
    'Jalisco': ['Guadalajara', 'Zapopan', 'Tlaquepaque', 'Tonalá', 'Puerto Vallarta', 'Tlajomulco', 'El Salto', 'Chapala', 'Lagos de Moreno', 'Tepatitlán'],
    'Nuevo León': ['Monterrey', 'Guadalupe', 'San Nicolás de los Garza', 'Apodaca', 'General Escobedo', 'Santa Catarina', 'San Pedro Garza García', 'Cadereyta Jiménez'],
    'Puebla': ['Puebla', 'Tehuacán', 'San Martín Texmelucan', 'Atlixco', 'Cholula', 'Huauchinango', 'Zacatlán', 'Tecamachalco'],
    'Veracruz': ['Veracruz', 'Xalapa', 'Coatzacoalcos', 'Córdoba', 'Poza Rica', 'Minatitlán', 'Orizaba', 'Boca del Río'],
    'Guanajuato': ['León', 'Irapuato', 'Celaya', 'Salamanca', 'Guanajuato', 'San Miguel de Allende', 'Dolores Hidalgo', 'Pénjamo'],
    'México': ['Ecatepec', 'Nezahualcóyotl', 'Naucalpan', 'Tlalnepantla', 'Chimalhuacán', 'Toluca', 'Atizapán', 'Cuautitlán Izcalli']
  };

  constructor(
    private firestore: AngularFirestore,
    private router: Router
  ) {}

  async onSubmit() {
    if (this.isFormValid()) {
      this.loading = true;
      try {
        await this.firestore.collection('solicitudes-organizadores').add({
          ...this.organizador,
          fechaSolicitud: new Date(),
          estatus: 'pendiente'
        });
        
        this.success = true;
        setTimeout(() => this.router.navigate(['/']), 9000);
      } catch (error) {
        console.error('Error al enviar solicitud:', error);
        await Swal.fire({
          title: 'Error',
          text: 'Error al enviar la solicitud. Intenta nuevamente.',
          icon: 'error',
          confirmButtonColor: '#dc3545'
        });
      }
      this.loading = false;
    }
  }

  isFormValid(): boolean {
    return !!(this.organizador.nombre && this.organizador.apellidos && 
              this.organizador.estado && this.organizador.ciudad && 
              this.organizador.telefono && this.organizador.email);
  }

  getCiudades(): string[] {
    return this.ciudadesPorEstado[this.organizador.estado] || [];
  }

  onEstadoChange() {
    this.organizador.ciudad = '';
  }



  volver() {
    this.router.navigate(['/']);
  }
}