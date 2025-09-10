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
    estado: '',
    municipio: '',
    codigoPostal: '',
    telefono: '',
    email: '',
    descripcion: ''
  };
  
  loading = false;
  success = false;

  estados = [
     'México', 'Ciudad de México'
  ];
  /*
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
    'Chihuahua', 'Coahuila', 'Colima', 'Durango', 'Guanajuato',
    'Guerrero', 'Hidalgo', 'Jalisco',  'Michoacán', 'Morelos', 'Nayarit',
    'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí',
    'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
  */

  ciudadesPorEstado: { [key: string]: string[] } = {
    'Ciudad de México': ['Álvaro Obregón', 'Azcapotzalco', 'Benito Juárez', 'Coyoacán', 'Cuajimalpa', 'Gustavo A. Madero', 'Iztacalco', 'Iztapalapa', 'Magdalena Contreras', 'Miguel Hidalgo', 'Milpa Alta', 'Tláhuac', 'Tlalpan', 'Venustiano Carranza', 'Xochimilco'],
    'México': ['Acambay', 'Acolman', 'Aculco', 'Almoloya de Alquisiras', 'Almoloya de Juárez', 'Almoloya del Río', 'Amanalco', 'Amatepec', 'Amecameca', 'Apaxco', 'Atenco', 'Atizapán', 'Atizapán de Zaragoza', 'Atlacomulco', 'Atlautla', 'Axapusco', 'Ayapango', 'Calimaya', 'Capulhuac', 'Coacalco de Berriozábal', 'Coatepec Harinas', 'Cocotitlán', 'Coyotepec', 'Cuautitlán', 'Cuautitlán Izcalli', 'Chalco', 'Chapa de Mota', 'Chapultepec', 'Chiautla', 'Chicoloapan', 'Chiconcuac', 'Chimalhuacán', 'Donato Guerra', 'Ecatepec de Morelos', 'Ecatzingo', 'El Oro', 'Huehuetoca', 'Hueypoxtla', 'Huixquilucan', 'Isidro Fabela', 'Ixtapaluca', 'Ixtapan de la Sal', 'Ixtapan del Oro', 'Ixtlahuaca', 'Jaltenco', 'Jilotepec', 'Jilotzingo', 'Jiquipilco', 'Jocotitlán', 'Joquicingo', 'Juchitepec', 'La Paz', 'Lerma', 'Luvianos', 'Malinalco', 'Melchor Ocampo', 'Metepec', 'Mexicaltzingo', 'Morelos', 'Naucalpan de Juárez', 'Nezahualcóyotl', 'Nextlalpan', 'Nicolás Romero', 'Nopaltepec', 'Ocoyoacac', 'Ocuilan', 'Otumba', 'Otzoloapan', 'Otzolotepec', 'Ozumba', 'Papalotla', 'Polotitlán', 'Rayón', 'San Antonio la Isla', 'San Felipe del Progreso', 'San Martín de las Pirámides', 'San Mateo Atenco', 'San Simón de Guerrero', 'Santo Tomás', 'Soyaniquilpan de Juárez', 'Sultepec', 'Tecámac', 'Tejupilco', 'Temamatla', 'Temascalapa', 'Temascalcingo', 'Temascaltepec', 'Temoaya', 'Tenancingo', 'Tenango del Aire', 'Tenango del Valle', 'Teoloyucan', 'Teotihuacán', 'Tepetlaoxtoc', 'Tepetlixpa', 'Tepotzotlán', 'Tequixquiac', 'Texcaltitlán', 'Texcalyacac', 'Texcoco', 'Tezoyuca', 'Tianguistenco', 'Timilpan', 'Tlalmanalco', 'Tlalnepantla de Baz', 'Tlapacoya', 'Toluca', 'Tonanitla', 'Tonatico', 'Tultepec', 'Tultitlán', 'Valle de Bravo', 'Villa de Allende', 'Villa del Carbón', 'Villa Guerrero', 'Villa Victoria', 'Xalatlaco', 'Xonacatlán', 'Zinacantepec', 'Zumpahuacán', 'Zumpango']
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
              this.organizador.estado && 
              this.organizador.telefono && this.organizador.email);
  }

  getMunicipios(): string[] {
    return this.ciudadesPorEstado[this.organizador.estado] || [];
  }

  onEstadoChange() {
    this.organizador.municipio = '';
  }



  volver() {
    this.router.navigate(['/']);
  }
}