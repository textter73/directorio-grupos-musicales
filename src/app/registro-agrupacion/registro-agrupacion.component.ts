import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-registro-agrupacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro-agrupacion.component.html',
  styleUrl: './registro-agrupacion.component.css'
})
export class RegistroAgrupacionComponent {
  agrupacion = {
    nombre: '',
    tipo: '',
    anoFundacion: '',
    numeroIntegrantes: '',
    estado: '',
    municipio: '',
    codigoPostal: '',
    contacto: '',
    email: '',
    telefono: '',
    descripcion: '',
    repertorio: '',
    facebook: '',
    instagram: '',
    tiktok: ''
  };

  loading = false;
  success = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  uploadProgress = 0;

  estados = [
    'México', 'Ciudad de México'
  ];
  /*
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
    'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Guanajuato',
    'Guerrero', 'Hidalgo', 'Jalisco', 'México', 'Michoacán', 'Morelos', 'Nayarit',
    'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí',
    'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
  */

  ciudadesPorEstado: { [key: string]: string[] } = {
    'Ciudad de México': ['Álvaro Obregón', 'Azcapotzalco', 'Benito Juárez', 'Coyoacán', 'Cuajimalpa de Morelos', 'Cuauhtémoc', 'Gustavo A. Madero', 'Iztacalco', 'Iztapalapa', 'La Magdalena Contreras', 'Miguel Hidalgo', 'Milpa Alta', 'Tláhuac', 'Tlalpan', 'Venustiano Carranza', 'Xochimilco'],
    'México': ['Acambay', 'Acolman', 'Aculco', 'Almoloya de Alquisiras', 'Almoloya de Juárez', 'Almoloya del Río',
      'Amanalco',
      'Amatepec',
      'Amecameca',
      'Apaxco',
      'Atenco',
      'Atizapán',
      'Atizapán de Zaragoza',
      'Atlacomulco',
      'Atlautla',
      'Axapusco',
      'Ayapango',
      'Calimaya',
      'Capulhuac',
      'Coacalco de Berriozábal',
      'Coatepec Harinas',
      'Cocotitlán',
      'Coyotepec',
      'Cuautitlán',
      'Cuautitlán Izcalli',
      'Chalco',
      'Chapa de Mota',
      'Chapultepec',
      'Chiautla',
      'Chicoloapan',
      'Chiconcuac',
      'Chimalhuacán',
      'Donato Guerra',
      'Ecatepec de Morelos',
      'Ecatzingo',
      'El Oro',
      'Huehuetoca',
      'Hueypoxtla',
      'Huixquilucan',
      'Isidro Fabela',
      'Ixtapaluca',
      'Ixtapan de la Sal',
      'Ixtapan del Oro',
      'Ixtlahuaca',
      'Jaltenco',
      'Jilotepec',
      'Jilotzingo',
      'Jiquipilco',
      'Jocotitlán',
      'Joquicingo',
      'Juchitepec',
      'La Paz',
      'Lerma',
      'Luvianos',
      'Malinalco',
      'Melchor Ocampo',
      'Metepec',
      'Mexicaltzingo',
      'Morelos',
      'Naucalpan de Juárez',
      'Nezahualcóyotl',
      'Nextlalpan',
      'Nicolás Romero',
      'Nopaltepec',
      'Ocoyoacac',
      'Ocuilan',
      'Otumba',
      'Otzoloapan',
      'Otzolotepec',
      'Ozumba',
      'Papalotla',
      'Polotitlán',
      'Rayón',
      'San Antonio la Isla',
      'San Felipe del Progreso',
      'San Martín de las Pirámides',
      'San Mateo Atenco',
      'San Simón de Guerrero',
      'Santo Tomás',
      'Soyaniquilpan de Juárez',
      'Sultepec',
      'Tecámac',
      'Tejupilco',
      'Temamatla',
      'Temascalapa',
      'Temascalcingo',
      'Temascaltepec',
      'Temoaya',
      'Tenancingo',
      'Tenango del Aire',
      'Tenango del Valle',
      'Teoloyucan',
      'Teotihuacán',
      'Tepetlaoxtoc',
      'Tepetlixpa',
      'Tepotzotlán',
      'Tequixquiac',
      'Texcaltitlán',
      'Texcalyacac',
      'Texcoco',
      'Tezoyuca',
      'Tianguistenco',
      'Timilpan',
      'Tlalmanalco',
      'Tlalnepantla de Baz',
      'Tlapacoya',
      'Toluca',
      'Tonanitla',
      'Tonatico',
      'Tultepec',
      'Tultitlán',
      'Valle de Bravo',
      'Villa de Allende',
      'Villa del Carbón',
      'Villa Guerrero',
      'Villa Victoria',
      'Xalatlaco',
      'Xonacatlán',
      'Zinacantepec',
      'Zumpahuacán',
      'Zumpango'
    ]
  };
  /*
    'Jalisco': ['Guadalajara', 'Zapopan', 'Tlaquepaque', 'Tonalá', 'Puerto Vallarta', 'Tlajomulco', 'El Salto', 'Chapala', 'Lagos de Moreno', 'Tepatitlán'],
    'Nuevo León': ['Monterrey', 'Guadalupe', 'San Nicolás de los Garza', 'Apodaca', 'General Escobedo', 'Santa Catarina', 'San Pedro Garza García', 'Cadereyta Jiménez'],
    'Puebla': ['Puebla', 'Tehuacán', 'San Martín Texmelucan', 'Atlixco', 'Cholula', 'Huauchinango', 'Zacatlán', 'Tecamachalco'],
    'Veracruz': ['Veracruz', 'Xalapa', 'Coatzacoalcos', 'Córdoba', 'Poza Rica', 'Minatitlán', 'Orizaba', 'Boca del Río'],
    'Guanajuato': ['León', 'Irapuato', 'Celaya', 'Salamanca', 'Guanajuato', 'San Miguel de Allende', 'Dolores Hidalgo', 'Pénjamo'],
    
  */

  constructor(
    private firestore: AngularFirestore,
    private storage: AngularFireStorage,
    private router: Router
  ) { }

  async onSubmit() {
    if (this.isFormValid()) {
      this.loading = true;
      try {
        await this.firestore.collection('solicitudes-agrupaciones').add({
          ...this.agrupacion,
          imagenBase64: this.imagePreview || '',
          fechaSolicitud: new Date(),
          estatus: 'pendiente'
        });

        this.success = true;
        setTimeout(() => this.router.navigate(['/']), 9000);
      } catch (error) {
        console.error('Error al enviar solicitud:', error);
        alert('Error al enviar la solicitud. Intenta nuevamente.');
      }
      this.loading = false;
    }
  }

  private async uploadImage(): Promise<string> {
    if (!this.selectedFile) return '';

    try {
      const fileName = `agrupaciones/${Date.now()}_${this.selectedFile.name}`;
      const fileRef = this.storage.ref(fileName);
      const task = this.storage.upload(fileName, this.selectedFile);

      task.percentageChanges().subscribe(progress => {
        this.uploadProgress = progress || 0;
      });

      return new Promise((resolve, reject) => {
        task.snapshotChanges().pipe(
          finalize(() => {
            fileRef.getDownloadURL().subscribe({
              next: (url) => resolve(url),
              error: (error) => {
                console.error('Error obteniendo URL:', error);
                reject(error);
              }
            });
          })
        ).subscribe({
          error: (error) => {
            console.error('Error subiendo archivo:', error);
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error('Error en uploadImage:', error);
      throw error;
    }
  }

  isFormValid(): boolean {
    return !!(this.agrupacion.nombre && this.agrupacion.tipo &&
      this.agrupacion.estado &&
      this.agrupacion.contacto && this.agrupacion.email &&
      this.imagePreview);
  }

  getCiudades(): string[] {
    return this.ciudadesPorEstado[this.agrupacion.estado] || [];
  }

  getMunicipios(): string[] {
    return this.ciudadesPorEstado[this.agrupacion.estado] || [];
  }

  onEstadoChange() {
    this.agrupacion.municipio = '';
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

      if (allowedTypes.includes(file.type)) {
        this.selectedFile = file;

        const reader = new FileReader();
        reader.onload = (e) => {
          this.imagePreview = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        alert('Solo se permiten archivos JPG y PNG');
        event.target.value = '';
      }
    }
  }

  removeImage() {
    this.selectedFile = null;
    this.imagePreview = null;
    this.uploadProgress = 0;
  }

  volver() {
    this.router.navigate(['/']);
  }
}