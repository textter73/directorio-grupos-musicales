import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-perfil-organizador',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil-organizador.component.html',
  styleUrl: './perfil-organizador.component.css'
})
export class PerfilOrganizadorComponent implements OnInit {
  organizador: any = null;
  loading = true;
  showCreateEvent = false;
  showAgrupaciones = false;
  showMisEventos = false;
  agrupaciones: any[] = [];
  loadingAgrupaciones = false;
  agrupacionesSeleccionadas: any[] = [];
  misEventos: any[] = [];
  loadingEventos = false;
  puedeCrearEvento = true;
  showEditEvent = false;
  eventoEditando: any = null;
  showImageModal = false;
  imagenModal = '';
  showInvitacionesModal = false;
  invitacionesPendientes: any[] = [];
  showAceptadasModal = false;
  invitacionesAceptadas: any[] = [];
  showPostulacionesModal = false;
  postulaciones: any[] = [];
  eventoActual: any = null;
  showRechazadasModal = false;
  invitacionesRechazadas: any[] = [];
  showChatModal = false;
  eventoChat: any = null;
  mensajes: any[] = [];
  nuevoMensaje = '';
  showDirectorioModal = false;
  busquedaAgrupacion = '';
  paginaAgrupaciones = 1;
  agrupacionesPorPagina = 5;
  showRechazoModal = false;
  postulacionRechazo: any = null;
  notaRechazo = '';
  showAsistenciasModal = false;
  eventoAsistencias: any = null;
  gruposParaAsistencia: any[] = [];
  
  evento = {
    nombre: '',
    descripcion: '',
    fecha: '',
    horaRecepcion: '',
    horaComienzo: '',
    estado: '',
    ciudad: '',
    municipio: '',
    codigoPostal: '',
    localidad: '',
    tipoEvento: '',
    viaticos: '',
    gruposConViaticos: '',
    limiteGrupos: '',
    estacionamientoExclusivo: false,
    cartelBase64: '',
    notaCancelacion: '',
    estatusInvitacion: ''
  };

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarPerfil();
  }

  async cargarPerfil() {
    try {
      // Esperar a que Firebase inicialice la autenticación
      const user = await new Promise<any>((resolve) => {
        const subscription = this.afAuth.authState.subscribe(user => {
          subscription.unsubscribe();
          resolve(user);
        });
      });
      
      if (user) {
        const query = await this.firestore.collection('organizadores', ref => 
          ref.where('uid', '==', user.uid)
        ).get().toPromise();
        
        if (query && !query.empty) {
          const data = query.docs[0].data() as any;
          this.organizador = { id: query.docs[0].id, ...data };
          
          // Verificar si puede crear eventos
          this.puedeCrearEvento = !(await this.tieneEventoActivo());
          
          // Cargar eventos automáticamente y extraer colores del cartel
          await this.cargarMisEventos();
          await this.extraerColoresEventoActivo();
        }
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
    }
    this.loading = false;
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/']);
  }

  async mostrarFormularioEvento() {
    const tieneEventoActivo = await this.tieneEventoActivo();
    
    if (tieneEventoActivo) {
      await Swal.fire({
        title: 'Evento en Proceso',
        text: 'Ya tienes un evento activo. Debes finalizar o cerrar tu evento actual antes de crear uno nuevo.',
        icon: 'warning',
        confirmButtonColor: '#ff9800'
      });
      return;
    }
    
    this.showCreateEvent = true;
    if (this.agrupaciones.length === 0) {
      await this.cargarAgrupaciones();
    }
  }

  cancelarEvento() {
    this.showCreateEvent = false;
    this.resetFormulario();
    this.agrupacionesSeleccionadas = [];
  }

  resetFormulario() {
    this.evento = {
      nombre: '',
      descripcion: '',
      fecha: '',
      horaRecepcion: '',
      horaComienzo: '',
      estado: '',
      ciudad: '',
      municipio: '',
      codigoPostal: '',
      localidad: '',
      tipoEvento: '',
      viaticos: '',
      gruposConViaticos: '',
      limiteGrupos: '',
      estacionamientoExclusivo: false,
      cartelBase64: '',
      notaCancelacion: '',
      estatusInvitacion: ''
    };
  }

  async crearEvento() {
    if (this.isEventoValid()) {
      try {
        const user = await this.afAuth.currentUser;
        if (user && this.organizador) {
          const nuevoEvento = {
            ...this.evento,
            organizadorId: this.organizador.id,
            organizadorNombre: `${this.organizador.nombre} ${this.organizador.apellidos}`,
            organizadorEmail: this.organizador.email,
            fechaCreacion: new Date(),
            estatusEvento: 'pendiente-aprobacion',
            postulaciones: [],
            invitaciones: this.agrupacionesSeleccionadas.map(agrupacion => ({
              agrupacionId: agrupacion.id,
              agrupacionNombre: agrupacion.nombre,
              agrupacionEmail: agrupacion.email,
              fechaInvitacion: new Date(),
              estatusInvitacion: 'pendiente'
            }))
          };
          
          await this.firestore.collection('eventos').add(nuevoEvento);
          
          const mensajeInvitaciones = this.agrupacionesSeleccionadas.length > 0 
            ? ` Se enviaron ${this.agrupacionesSeleccionadas.length} invitaciones.`
            : '';
            
          await Swal.fire({
            title: '¡Evento Enviado!',
            text: `Tu evento ha sido enviado para revisión del administrador.${mensajeInvitaciones} Una vez aprobado, las agrupaciones podrán verlo y postularse.`,
            icon: 'info',
            confirmButtonColor: '#00acc1'
          });
          
          this.cancelarEvento();
          this.puedeCrearEvento = false;
          await this.cargarMisEventos();
        }
      } catch (error) {
        console.error('Error creando evento:', error);
        await Swal.fire({
          title: 'Error',
          text: 'No se pudo crear el evento. Intenta nuevamente.',
          icon: 'error',
          confirmButtonColor: '#dc3545'
        });
      }
    }
  }

  isEventoValid(): boolean {
    return !!(this.evento.nombre && this.evento.fecha && this.evento.horaRecepcion && this.evento.horaComienzo && 
              this.evento.estado);
  }

  async mostrarAgrupaciones() {
    this.showDirectorioModal = true;
    if (this.agrupaciones.length === 0) {
      await this.cargarAgrupaciones();
    }
  }

  cerrarDirectorioModal() {
    this.showDirectorioModal = false;
  }

  async cargarAgrupaciones() {
    this.loadingAgrupaciones = true;
    try {
      const query = await this.firestore.collection('agrupaciones', ref => 
        ref.where('activo', '==', 'activa')
      ).get().toPromise();
      if (query) {
        this.agrupaciones = query.docs.map(doc => {
          const data = doc.data() as any;
          return { id: doc.id, ...data };
        }).sort((a, b) => {
          const puntosA = a.ranking?.puntosTotales || 0;
          const puntosB = b.ranking?.puntosTotales || 0;
          return puntosB - puntosA; // Ordenar por puntos descendente
        });
      }
    } catch (error) {
      console.error('Error cargando agrupaciones:', error);
    }
    this.loadingAgrupaciones = false;
  }

  toggleAgrupacion(agrupacion: any) {
    const index = this.agrupacionesSeleccionadas.findIndex(a => a.id === agrupacion.id);
    if (index > -1) {
      this.agrupacionesSeleccionadas.splice(index, 1);
    } else {
      this.agrupacionesSeleccionadas.push(agrupacion);
    }
  }

  isAgrupacionSeleccionada(agrupacion: any): boolean {
    return this.agrupacionesSeleccionadas.some(a => a.id === agrupacion.id);
  }

  getAgrupacionesFiltradas(): any[] {
    if (!this.busquedaAgrupacion.trim()) {
      return this.agrupaciones;
    }
    
    const termino = this.busquedaAgrupacion.toLowerCase();
    return this.agrupaciones.filter(agrupacion => 
      agrupacion.nombre.toLowerCase().includes(termino) ||
      agrupacion.tipo.toLowerCase().includes(termino) ||
      agrupacion.municipio?.toLowerCase().includes(termino) ||
      agrupacion.estado.toLowerCase().includes(termino)
    );
  }

  getAgrupacionesPaginadas(): any[] {
    const agrupacionesFiltradas = this.getAgrupacionesFiltradas();
    const inicio = (this.paginaAgrupaciones - 1) * this.agrupacionesPorPagina;
    const fin = inicio + this.agrupacionesPorPagina;
    return agrupacionesFiltradas.slice(inicio, fin);
  }

  getTotalPaginasAgrupaciones(): number {
    return Math.ceil(this.getAgrupacionesFiltradas().length / this.agrupacionesPorPagina);
  }

  paginaAnteriorAgrupaciones(): void {
    if (this.paginaAgrupaciones > 1) {
      this.paginaAgrupaciones--;
    }
  }

  paginaSiguienteAgrupaciones(): void {
    if (this.paginaAgrupaciones < this.getTotalPaginasAgrupaciones()) {
      this.paginaAgrupaciones++;
    }
  }

  async mostrarMisEventos() {
    await this.cargarMisEventos();
  }

  async cargarMisEventos() {
    this.loadingEventos = true;
    try {
      const query = await this.firestore.collection('eventos', ref => 
        ref.where('organizadorId', '==', this.organizador.id)
      ).get().toPromise();
      
      if (query) {
        this.misEventos = query.docs.map(doc => {
          const data = doc.data() as any;
          return { id: doc.id, ...data };
        }).sort((a, b) => {
          const fechaA = a.fechaCreacion?.toDate() || new Date(0);
          const fechaB = b.fechaCreacion?.toDate() || new Date(0);
          return fechaB.getTime() - fechaA.getTime();
        });
        
        // Extraer colores del evento activo después de cargar los eventos
        await this.extraerColoresEventoActivo();
      }
    } catch (error) {
      console.error('Error cargando eventos:', error);
    }
    this.loadingEventos = false;
  }

  getInvitacionesPendientes(evento: any): number {
    return evento.invitaciones?.filter((inv: any) => inv.estatusInvitacion === 'pendiente').length || 0;
  }

  getInvitacionesAceptadas(evento: any): number {
    return evento.invitaciones?.filter((inv: any) => inv.estatusInvitacion === 'aceptada').length || 0;
  }

  getInvitacionesRechazadas(evento: any): number {
    return evento.invitaciones?.filter((inv: any) => inv.estatusInvitacion === 'rechazada').length || 0;
  }

  getPostulaciones(evento: any): number {
    return evento.postulaciones?.length || 0;
  }

  async tieneEventoActivo(): Promise<boolean> {
    try {
      const query = await this.firestore.collection('eventos', ref => 
        ref.where('organizadorId', '==', this.organizador.id)
           .where('estatusEvento', 'in', ['abierto', 'cupo-lleno', 'pendiente-aprobacion'])
      ).get().toPromise();
      
      return query ? !query.empty : false;
    } catch (error) {
      console.error('Error verificando eventos activos:', error);
      return false;
    }
  }

  editarEvento(evento: any) {
    this.eventoEditando = evento;
    this.evento = {
      nombre: evento.nombre,
      descripcion: evento.descripcion || '',
      fecha: evento.fecha,
      horaRecepcion: evento.horaRecepcion || '',
      horaComienzo: evento.horaComienzo || '',
      estado: evento.estado,
      estatusInvitacion: evento.estatusInvitacion || '',
      ciudad: evento.ciudad || '',
      municipio: evento.municipio || '',
      codigoPostal: evento.codigoPostal || '',
      localidad: evento.localidad || '',
      tipoEvento: evento.tipoEvento || '',
      viaticos: evento.viaticos || '',
      gruposConViaticos: evento.gruposConViaticos || '',
      limiteGrupos: evento.limiteGrupos || '',
      estacionamientoExclusivo: evento.estacionamientoExclusivo || false,
      cartelBase64: evento.cartelBase64 || '',
      notaCancelacion: evento.notaCancelacion || ''
    };
    this.showEditEvent = true;
    
    // Scroll to edit form after a short delay to ensure DOM is updated
    setTimeout(() => {
      const editSection = document.getElementById('edit-form-section');
      if (editSection) {
        editSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  cancelarEdicion() {
    this.showEditEvent = false;
    this.eventoEditando = null;
    this.resetFormulario();
  }

  async guardarCambios() {
    if (this.isEventoValidParaEdicion()) {
      try {
        const eventoActualizado = {
          ...this.eventoEditando,
          nombre: this.evento.nombre,
          descripcion: this.evento.descripcion,
          horaRecepcion: this.evento.horaRecepcion,
          horaComienzo: this.evento.horaComienzo,
          estado: this.evento.estado,
          ciudad: this.evento.ciudad,
          municipio: this.evento.municipio,
          codigoPostal: this.evento.codigoPostal,
          localidad: this.evento.localidad,
          tipoEvento: this.evento.tipoEvento,
          viaticos: this.evento.viaticos,
          gruposConViaticos: this.evento.gruposConViaticos,
          limiteGrupos: this.evento.limiteGrupos,
          estacionamientoExclusivo: this.evento.estacionamientoExclusivo,
          cartelBase64: this.evento.cartelBase64,
          notaCancelacion: this.evento.notaCancelacion,
          fechaModificacion: new Date()
        };
        
        await this.firestore.collection('eventos').doc(this.eventoEditando.id).update(eventoActualizado);
        
        await Swal.fire({
          title: '¡Evento Actualizado!',
          text: 'Los cambios han sido guardados exitosamente.',
          icon: 'success',
          confirmButtonColor: '#00acc1'
        });
        
        this.cancelarEdicion();
        await this.cargarMisEventos();
      } catch (error) {
        console.error('Error actualizando evento:', error);
        await Swal.fire({
          title: 'Error',
          text: 'No se pudieron guardar los cambios. Intenta nuevamente.',
          icon: 'error',
          confirmButtonColor: '#dc3545'
        });
      }
    }
  }

  isEventoValidParaEdicion(): boolean {
    const camposBasicos = !!(this.evento.nombre && this.evento.horaRecepcion && this.evento.horaComienzo && 
                            this.evento.estado);
    
    if (this.evento.estado === 'cancelado') {
      return camposBasicos && !!this.evento.notaCancelacion;
    }
    
    return camposBasicos;
  }

  onCartelSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.compressImage(file, (compressedBase64: string) => {
        this.evento.cartelBase64 = compressedBase64;
      });
    }
  }

  compressImage(file: File, callback: (result: string) => void) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      const maxWidth = 800;
      const maxHeight = 600;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
      callback(compressedBase64);
    };
    
    const reader = new FileReader();
    reader.onload = (e: any) => {
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  abrirImagenModal(imagen: string) {
    this.imagenModal = imagen;
    this.showImageModal = true;
  }

  cerrarImagenModal() {
    this.showImageModal = false;
    this.imagenModal = '';
  }

  async mostrarInvitacionesPendientes(evento: any) {
    const invitacionesPendientes = evento.invitaciones?.filter((inv: any) => inv.estatusInvitacion === 'pendiente') || [];
    
    // Obtener logos de las agrupaciones
    for (let invitacion of invitacionesPendientes) {
      try {
        const agrupacionDoc = await this.firestore.collection('agrupaciones').doc(invitacion.agrupacionId).get().toPromise();
        if (agrupacionDoc && agrupacionDoc.exists) {
          const agrupacionData = agrupacionDoc.data() as any;
          invitacion.agrupacionLogo = agrupacionData.imagenBase64 || '';
        }
      } catch (error) {
        console.error('Error obteniendo logo de agrupación:', error);
      }
    }
    
    this.invitacionesPendientes = invitacionesPendientes;
    this.showInvitacionesModal = true;
  }

  cerrarInvitacionesModal() {
    this.showInvitacionesModal = false;
    this.invitacionesPendientes = [];
  }

  async cancelarInvitacion(invitacion: any) {
    const confirmacion = await Swal.fire({
      title: '¿Cancelar Invitación?',
      text: `¿Estás seguro de cancelar la invitación a ${invitacion.agrupacionNombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No'
    });

    if (confirmacion.isConfirmed) {
      try {
        // Buscar el evento actual
        const eventoActual = this.misEventos.find(evento => 
          evento.invitaciones?.some((inv: any) => 
            inv.agrupacionId === invitacion.agrupacionId && inv.estatusInvitacion === 'pendiente'
          )
        );

        if (eventoActual) {
          // Filtrar la invitación cancelada
          const invitacionesActualizadas = eventoActual.invitaciones.filter((inv: any) => 
            inv.agrupacionId !== invitacion.agrupacionId
          );

          // Actualizar en Firebase
          await this.firestore.collection('eventos').doc(eventoActual.id).update({
            invitaciones: invitacionesActualizadas
          });

          // Actualizar localmente
          eventoActual.invitaciones = invitacionesActualizadas;
          
          // Actualizar lista del modal
          this.invitacionesPendientes = this.invitacionesPendientes.filter(inv => 
            inv.agrupacionId !== invitacion.agrupacionId
          );

          await Swal.fire({
            title: 'Invitación Cancelada',
            text: 'La invitación ha sido cancelada exitosamente.',
            icon: 'success',
            confirmButtonColor: '#00acc1'
          });
        }
      } catch (error) {
        console.error('Error cancelando invitación:', error);
        await Swal.fire({
          title: 'Error',
          text: 'No se pudo cancelar la invitación. Intenta nuevamente.',
          icon: 'error',
          confirmButtonColor: '#dc3545'
        });
      }
    }
  }

  async mostrarInvitacionesAceptadas(evento: any) {
    const invitacionesAceptadas = evento.invitaciones?.filter((inv: any) => inv.estatusInvitacion === 'aceptada') || [];
    
    // Obtener logos de las agrupaciones
    for (let invitacion of invitacionesAceptadas) {
      try {
        const agrupacionDoc = await this.firestore.collection('agrupaciones').doc(invitacion.agrupacionId).get().toPromise();
        if (agrupacionDoc && agrupacionDoc.exists) {
          const agrupacionData = agrupacionDoc.data() as any;
          invitacion.agrupacionLogo = agrupacionData.imagenBase64 || '';
        }
      } catch (error) {
        console.error('Error obteniendo logo de agrupación:', error);
      }
    }
    
    this.invitacionesAceptadas = invitacionesAceptadas;
    this.showAceptadasModal = true;
  }

  cerrarAceptadasModal() {
    this.showAceptadasModal = false;
    this.invitacionesAceptadas = [];
  }

  async mostrarPostulaciones(evento: any) {
    this.eventoActual = evento;
    const postulaciones = evento.postulaciones || [];
    
    // Obtener datos completos de las agrupaciones
    for (let postulacion of postulaciones) {
      try {
        const agrupacionDoc = await this.firestore.collection('agrupaciones').doc(postulacion.agrupacionId).get().toPromise();
        if (agrupacionDoc && agrupacionDoc.exists) {
          const agrupacionData = agrupacionDoc.data() as any;
          postulacion.agrupacionLogo = agrupacionData.imagenBase64 || '';
          postulacion.agrupacionNombre = agrupacionData.nombre;
          postulacion.agrupacionEmail = agrupacionData.contacto;
        }
      } catch (error) {
        console.error('Error obteniendo datos de agrupación:', error);
      }
    }
    
    this.postulaciones = postulaciones;
    this.showPostulacionesModal = true;
  }

  cerrarPostulacionesModal() {
    this.showPostulacionesModal = false;
    this.postulaciones = [];
    this.eventoActual = null;
  }

  async aceptarPostulacion(postulacion: any) {
    const confirmacion = await Swal.fire({
      title: '¿Aceptar Postulación?',
      text: `¿Aceptar la postulación de ${postulacion.agrupacionNombre}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, aceptar',
      cancelButtonText: 'Cancelar'
    });

    if (confirmacion.isConfirmed) {
      try {
        // Crear nueva invitación aceptada
        const nuevaInvitacion = {
          agrupacionId: postulacion.agrupacionId,
          agrupacionNombre: postulacion.agrupacionNombre,
          agrupacionEmail: postulacion.agrupacionEmail,
          fechaInvitacion: new Date(),
          estatusInvitacion: 'aceptada'
        };

        // Agregar a invitaciones y remover de postulaciones
        const invitacionesActualizadas = [...(this.eventoActual.invitaciones || []), nuevaInvitacion];
        const postulacionesActualizadas = this.eventoActual.postulaciones.filter((post: any) => 
          post.agrupacionId !== postulacion.agrupacionId
        );

        // Actualizar en Firebase
        await this.firestore.collection('eventos').doc(this.eventoActual.id).update({
          invitaciones: invitacionesActualizadas,
          postulaciones: postulacionesActualizadas
        });

        // Actualizar localmente
        this.eventoActual.invitaciones = invitacionesActualizadas;
        this.eventoActual.postulaciones = postulacionesActualizadas;
        
        // Actualizar lista del modal
        this.postulaciones = this.postulaciones.filter(post => 
          post.agrupacionId !== postulacion.agrupacionId
        );

        // Enviar mensaje al chat
        await this.enviarMensajeIntegracion(this.eventoActual, postulacion.agrupacionNombre);

        await Swal.fire({
          title: 'Postulación Aceptada',
          text: 'La agrupación ha sido aceptada exitosamente.',
          icon: 'success',
          confirmButtonColor: '#00acc1'
        });
      } catch (error) {
        console.error('Error aceptando postulación:', error);
        await Swal.fire({
          title: 'Error',
          text: 'No se pudo aceptar la postulación. Intenta nuevamente.',
          icon: 'error',
          confirmButtonColor: '#dc3545'
        });
      }
    }
  }

  async mostrarInvitacionesRechazadas(evento: any) {
    const invitacionesRechazadas = evento.invitaciones?.filter((inv: any) => inv.estatusInvitacion === 'rechazada') || [];
    
    // Obtener logos de las agrupaciones
    for (let invitacion of invitacionesRechazadas) {
      try {
        const agrupacionDoc = await this.firestore.collection('agrupaciones').doc(invitacion.agrupacionId).get().toPromise();
        if (agrupacionDoc && agrupacionDoc.exists) {
          const agrupacionData = agrupacionDoc.data() as any;
          invitacion.agrupacionLogo = agrupacionData.imagenBase64 || '';
        }
      } catch (error) {
        console.error('Error obteniendo logo de agrupación:', error);
      }
    }
    
    this.invitacionesRechazadas = invitacionesRechazadas;
    this.showRechazadasModal = true;
  }

  cerrarRechazadasModal() {
    this.showRechazadasModal = false;
    this.invitacionesRechazadas = [];
  }

  abrirChat(evento: any) {
    this.eventoChat = evento;
    this.showChatModal = true;
    this.cargarMensajes();
    this.cargarLogosAgrupacionesChat();
  }

  cerrarChat() {
    this.showChatModal = false;
    this.eventoChat = null;
    this.mensajes = [];
    this.nuevoMensaje = '';
  }

  async cargarMensajes() {
    if (!this.eventoChat?.id) return;
    
    try {
      // Intentar crear el documento del chat si no existe
      const chatDoc = this.firestore.collection('chats').doc(this.eventoChat.id);
      const chatExists = await chatDoc.get().toPromise();
      
      if (!chatExists?.exists) {
        await chatDoc.set({
          eventoId: this.eventoChat.id,
          eventoNombre: this.eventoChat.nombre,
          fechaCreacion: new Date()
        });
      }
      
      const mensajesQuery = await this.firestore.collection('chats')
        .doc(this.eventoChat.id)
        .collection('mensajes', ref => ref.orderBy('fecha', 'asc'))
        .get().toPromise();
      
      if (mensajesQuery) {
        this.mensajes = mensajesQuery.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Cargar avatares de agrupaciones
        await this.cargarAvataresMensajes();
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error);
      this.mensajes = [];
    }
  }

  async enviarMensaje() {
    if (!this.nuevoMensaje.trim() || !this.eventoChat?.id) return;
    
    const mensaje = {
      texto: this.nuevoMensaje.trim(),
      autor: this.organizador.nombre + ' ' + this.organizador.apellidos,
      autorTipo: 'organizador',
      autorEtiqueta: `${this.organizador.nombre} ${this.organizador.apellidos} (Organizador)`,
      autorAvatar: this.organizador.imagenBase64 || '',
      autorId: this.organizador.id,
      fecha: new Date(),
      eventoId: this.eventoChat.id
    };
    
    try {
      // Asegurar que el documento del chat existe
      const chatDoc = this.firestore.collection('chats').doc(this.eventoChat.id);
      const chatExists = await chatDoc.get().toPromise();
      
      if (!chatExists?.exists) {
        await chatDoc.set({
          eventoId: this.eventoChat.id,
          eventoNombre: this.eventoChat.nombre,
          fechaCreacion: new Date()
        });
      }
      
      await this.firestore.collection('chats')
        .doc(this.eventoChat.id)
        .collection('mensajes')
        .add(mensaje);
      
      // Agregar mensaje localmente
      this.mensajes.push({ ...mensaje, id: Date.now().toString() });
      this.nuevoMensaje = '';
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      
      Swal.fire({
        title: 'Error',
        text: 'No se pudo enviar el mensaje. Verifica los permisos de Firebase.',
        icon: 'error',
        confirmButtonColor: '#dc3545'
      });
    }
  }

  async mostrarResumenAgrupaciones(evento: any) {
    // Cargar tanto aceptadas como rechazadas
    await this.mostrarInvitacionesAceptadas(evento);
    await this.cargarInvitacionesRechazadas(evento);
  }

  async cargarInvitacionesRechazadas(evento: any) {
    const invitacionesRechazadas = evento.invitaciones?.filter((inv: any) => inv.estatusInvitacion === 'rechazada') || [];
    
    // Obtener logos de las agrupaciones
    for (let invitacion of invitacionesRechazadas) {
      try {
        const agrupacionDoc = await this.firestore.collection('agrupaciones').doc(invitacion.agrupacionId).get().toPromise();
        if (agrupacionDoc && agrupacionDoc.exists) {
          const agrupacionData = agrupacionDoc.data() as any;
          invitacion.agrupacionLogo = agrupacionData.imagenBase64 || '';
        }
      } catch (error) {
        console.error('Error obteniendo logo de agrupación:', error);
      }
    }
    
    this.invitacionesRechazadas = invitacionesRechazadas;
  }

  async extraerColoresEventoActivo() {
    try {
      const eventoActivo = this.misEventos.find(evento => evento.estatusEvento === 'abierto');
      if (eventoActivo && eventoActivo.cartelBase64) {
        const colors = await this.extractColorsFromImageAsync(eventoActivo.cartelBase64);
        if (colors.length >= 2) {
          this.applyDynamicColors(colors[0], colors[1]);
        }
      }
    } catch (error) {
      console.error('Error extrayendo colores del evento activo:', error);
    }
  }

  extractColorsFromImageAsync(imageBase64: string): Promise<string[]> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const colors = this.getDominantColors(imageData.data);
        resolve(colors);
      };
      
      img.onerror = () => resolve([]);
      img.src = imageBase64;
    });
  }

  getDominantColors(data: Uint8ClampedArray): string[] {
    const colorMap = new Map<string, number>();
    
    // Muestrear cada 4 píxeles para mejor rendimiento
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const alpha = data[i + 3];
      
      // Ignorar píxeles transparentes o muy claros/oscuros
      if (alpha < 128 || (r > 240 && g > 240 && b > 240) || (r < 15 && g < 15 && b < 15)) {
        continue;
      }
      
      // Agrupar colores similares
      const groupedR = Math.floor(r / 32) * 32;
      const groupedG = Math.floor(g / 32) * 32;
      const groupedB = Math.floor(b / 32) * 32;
      
      const colorKey = `${groupedR},${groupedG},${groupedB}`;
      colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
    }
    
    // Obtener los 2 colores más frecuentes
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([color]) => {
        const [r, g, b] = color.split(',').map(Number);
        return `rgb(${r}, ${g}, ${b})`;
      });
    
    return sortedColors;
  }

  applyDynamicColors(primaryColor: string, secondaryColor: string) {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', primaryColor);
    root.style.setProperty('--secondary-color', secondaryColor);
  }

  async cargarAvataresMensajes() {
    const agrupacionesIds = [...new Set(this.mensajes
      .filter(m => m.autorTipo === 'agrupacion' && !m.autorAvatar)
      .map(m => m.autorId)
    )];
    
    for (const agrupacionId of agrupacionesIds) {
      try {
        const agrupacionDoc = await this.firestore.collection('agrupaciones').doc(agrupacionId).get().toPromise();
        if (agrupacionDoc && agrupacionDoc.exists) {
          const agrupacionData = agrupacionDoc.data() as any;
          const avatar = agrupacionData.imagenBase64 || '';
          
          // Actualizar mensajes de esta agrupación
          this.mensajes.forEach(mensaje => {
            if (mensaje.autorId === agrupacionId && mensaje.autorTipo === 'agrupacion') {
              mensaje.autorAvatar = avatar;
            }
          });
        }
      } catch (error) {
        console.error('Error cargando avatar de agrupación:', error);
      }
    }
  }

  async cargarLogosAgrupacionesChat() {
    if (!this.eventoChat?.invitaciones) return;
    
    const agrupacionesConfirmadas = this.eventoChat.invitaciones.filter((inv: any) => inv.estatusInvitacion === 'aceptada');
    
    for (const confirmada of agrupacionesConfirmadas) {
      if (!confirmada.agrupacionLogo && confirmada.agrupacionId) {
        try {
          const agrupacionDoc = await this.firestore.collection('agrupaciones').doc(confirmada.agrupacionId).get().toPromise();
          if (agrupacionDoc && agrupacionDoc.exists) {
            const agrupacionData = agrupacionDoc.data() as any;
            confirmada.agrupacionLogo = agrupacionData.imagenBase64 || '';
          }
        } catch (error) {
          console.error('Error cargando logo de agrupación:', error);
        }
      }
    }
  }

  getParticipantesChat(): any[] {
    const participantes: any[] = [];
    
    // Agregar organizador (yo mismo)
    if (this.organizador) {
      participantes.push({
        id: this.organizador.id,
        nombre: `${this.organizador.nombre} ${this.organizador.apellidos}`,
        tipo: 'organizador',
        avatar: this.organizador.imagenBase64 || ''
      });
    }
    
    // Agregar agrupaciones confirmadas
    if (this.eventoChat) {
      const agrupacionesConfirmadas = this.eventoChat.invitaciones?.filter((inv: any) => inv.estatusInvitacion === 'aceptada') || [];
      agrupacionesConfirmadas.forEach((confirmada: any) => {
        participantes.push({
          id: confirmada.agrupacionId,
          nombre: confirmada.agrupacionNombre,
          tipo: 'agrupación',
          avatar: confirmada.agrupacionLogo || ''
        });
      });
    }
    
    return participantes;
  }

  async enviarMensajeIntegracion(evento: any, nombreAgrupacion: string) {
    const mensaje = {
      texto: `🎉 ${nombreAgrupacion} se ha integrado a la conversación del evento`,
      autor: 'Sistema',
      autorTipo: 'sistema',
      autorEtiqueta: 'Notificación del sistema',
      autorAvatar: '',
      autorId: 'sistema',
      fecha: new Date(),
      eventoId: evento.id
    };
    
    try {
      // Asegurar que el documento del chat existe
      const chatDoc = this.firestore.collection('chats').doc(evento.id);
      const chatExists = await chatDoc.get().toPromise();
      
      if (!chatExists?.exists) {
        await chatDoc.set({
          eventoId: evento.id,
          eventoNombre: evento.nombre,
          fechaCreacion: new Date()
        });
      }
      
      await this.firestore.collection('chats')
        .doc(evento.id)
        .collection('mensajes')
        .add(mensaje);
    } catch (error) {
      console.error('Error enviando mensaje de integración:', error);
    }
  }

  rechazarPostulacion(postulacion: any) {
    this.postulacionRechazo = postulacion;
    this.notaRechazo = '';
    this.showRechazoModal = true;
  }

  cerrarRechazoModal() {
    this.showRechazoModal = false;
    this.postulacionRechazo = null;
    this.notaRechazo = '';
  }

  async confirmarRechazo() {
    if (!this.postulacionRechazo) return;

    try {
      // Crear invitación rechazada
      const invitacionRechazada = {
        agrupacionId: this.postulacionRechazo.agrupacionId,
        agrupacionNombre: this.postulacionRechazo.agrupacionNombre,
        agrupacionEmail: this.postulacionRechazo.agrupacionEmail,
        fechaInvitacion: new Date(),
        fechaRespuesta: new Date(),
        estatusInvitacion: 'rechazada',
        notaRechazo: this.notaRechazo.trim() || null
      };

      // Agregar a invitaciones rechazadas y remover de postulaciones
      const invitacionesActualizadas = [...(this.eventoActual.invitaciones || []), invitacionRechazada];
      const postulacionesActualizadas = this.eventoActual.postulaciones.filter((post: any) => 
        post.agrupacionId !== this.postulacionRechazo.agrupacionId
      );

      // Actualizar en Firebase
      await this.firestore.collection('eventos').doc(this.eventoActual.id).update({
        invitaciones: invitacionesActualizadas,
        postulaciones: postulacionesActualizadas
      });

      // Actualizar localmente
      this.eventoActual.invitaciones = invitacionesActualizadas;
      this.eventoActual.postulaciones = postulacionesActualizadas;
      
      // Actualizar lista del modal
      this.postulaciones = this.postulaciones.filter(post => 
        post.agrupacionId !== this.postulacionRechazo.agrupacionId
      );

      this.cerrarRechazoModal();

      await Swal.fire({
        title: 'Postulación Rechazada',
        text: 'La postulación ha sido rechazada exitosamente.',
        icon: 'success',
        confirmButtonColor: '#00acc1'
      });
    } catch (error) {
      console.error('Error rechazando postulación:', error);
      await Swal.fire({
        title: 'Error',
        text: 'No se pudo rechazar la postulación. Intenta nuevamente.',
        icon: 'error',
        confirmButtonColor: '#dc3545'
      });
    }
  }

  async confirmarAsistencias(evento: any) {
    this.eventoAsistencias = evento;
    
    // Obtener grupos confirmados
    const gruposConfirmados = evento.invitaciones?.filter((inv: any) => inv.estatusInvitacion === 'aceptada') || [];
    
    // Cargar logos y preparar lista
    this.gruposParaAsistencia = [];
    for (let grupo of gruposConfirmados) {
      try {
        const agrupacionDoc = await this.firestore.collection('agrupaciones').doc(grupo.agrupacionId).get().toPromise();
        if (agrupacionDoc && agrupacionDoc.exists) {
          const agrupacionData = agrupacionDoc.data() as any;
          this.gruposParaAsistencia.push({
            ...grupo,
            agrupacionLogo: agrupacionData.imagenBase64 || '',
            asistio: grupo.asistio || false,
            calificacion: grupo.calificacion || 0
          });
        }
      } catch (error) {
        console.error('Error cargando datos de agrupación:', error);
      }
    }
    
    this.showAsistenciasModal = true;
  }

  setCalificacion(grupo: any, calificacion: number) {
    grupo.calificacion = calificacion;
  }

  async crearInsigniasAsistencia() {
    try {
      const gruposQueAsistieron = this.gruposParaAsistencia.filter(g => g.asistio);
      
      for (const grupo of gruposQueAsistieron) {
        // Contar total de eventos asistidos (insignias aprobadas)
        const insigniasQuery = await this.firestore.collection('insignias', ref => 
          ref.where('agrupacionId', '==', grupo.agrupacionId)
             .where('estado', '==', 'aprobada')
        ).get().toPromise();
        
        const totalEventosAsistidos = (insigniasQuery?.docs.length || 0) + 1; // +1 por este evento
        
        // Crear insignia pendiente
        await this.firestore.collection('insignias').add({
          agrupacionId: grupo.agrupacionId,
          agrupacionNombre: grupo.agrupacionNombre,
          eventoId: this.eventoAsistencias.id,
          eventoNombre: this.eventoAsistencias.nombre,
          fechaEvento: this.eventoAsistencias.fecha,
          cartelEvento: this.eventoAsistencias.cartelBase64 || '',
          calificacion: grupo.calificacion,
          totalEventosAsistidos: totalEventosAsistidos,
          estado: 'pendiente',
          fechaCreacion: new Date()
        });
      }
    } catch (error) {
      console.error('Error creando insignias:', error);
    }
  }

  cerrarAsistenciasModal() {
    this.showAsistenciasModal = false;
    this.eventoAsistencias = null;
    this.gruposParaAsistencia = [];
  }

  async guardarAsistencias() {
    try {
      // Actualizar invitaciones con asistencias
      const invitacionesActualizadas = this.eventoAsistencias.invitaciones.map((inv: any) => {
        const grupoAsistencia = this.gruposParaAsistencia.find(g => g.agrupacionId === inv.agrupacionId);
        if (grupoAsistencia) {
          return { 
            ...inv, 
            asistio: grupoAsistencia.asistio, 
            calificacion: grupoAsistencia.asistio ? grupoAsistencia.calificacion : null,
            fechaAsistencia: new Date() 
          };
        }
        return inv;
      });

      await this.firestore.collection('eventos').doc(this.eventoAsistencias.id).update({
        invitaciones: invitacionesActualizadas,
        asistenciasConfirmadas: true,
        fechaConfirmacionAsistencias: new Date(),
        estatusEvento: 'concluido'
      });

      // Crear insignias para grupos que asistieron
      await this.crearInsigniasAsistencia();

      // Actualizar localmente
      this.eventoAsistencias.invitaciones = invitacionesActualizadas;
      this.eventoAsistencias.asistenciasConfirmadas = true;
      this.eventoAsistencias.estatusEvento = 'concluido';
      
      const asistieron = this.gruposParaAsistencia.filter(g => g.asistio).length;
      const total = this.gruposParaAsistencia.length;
      
      this.cerrarAsistenciasModal();
      
      await Swal.fire({
        title: 'Asistencias Confirmadas',
        text: `Se confirmó la asistencia de ${asistieron} de ${total} grupos. Las insignias están pendientes de aprobación del administrador.`,
        icon: 'success',
        confirmButtonColor: '#00acc1'
      });
      
      await this.cargarMisEventos();
    } catch (error) {
      console.error('Error guardando asistencias:', error);
      await Swal.fire({
        title: 'Error',
        text: 'No se pudieron guardar las asistencias. Intenta nuevamente.',
        icon: 'error',
        confirmButtonColor: '#dc3545'
      });
    }
  }

  async cerrarInscripciones(evento: any) {
    const confirmacion = await Swal.fire({
      title: '¿Cerrar Inscripciones?',
      text: 'El evento pasará a estado "Cupo Lleno" y no se permitirán más postulaciones.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff9800',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, cerrar inscripciones',
      cancelButtonText: 'Cancelar'
    });

    if (confirmacion.isConfirmed) {
      try {
        await this.firestore.collection('eventos').doc(evento.id).update({
          estatusEvento: 'cupo-lleno',
          fechaCierreInscripciones: new Date()
        });

        // Actualizar localmente
        evento.estatusEvento = 'cupo-lleno';
        
        await Swal.fire({
          title: 'Inscripciones Cerradas',
          text: 'El evento ahora tiene el cupo lleno. No se permitirán más postulaciones.',
          icon: 'success',
          confirmButtonColor: '#00acc1'
        });
        
        await this.cargarMisEventos();
      } catch (error) {
        console.error('Error cerrando inscripciones:', error);
        await Swal.fire({
          title: 'Error',
          text: 'No se pudieron cerrar las inscripciones. Intenta nuevamente.',
          icon: 'error',
          confirmButtonColor: '#dc3545'
        });
      }
    }
  }

}