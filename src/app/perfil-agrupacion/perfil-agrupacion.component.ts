import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-perfil-agrupacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil-agrupacion.component.html',
  styleUrl: './perfil-agrupacion.component.css'
})
export class PerfilAgrupacionComponent implements OnInit {
  agrupacion: any = null;
  loading = true;
  primaryColor = '#00acc1';
  secondaryColor = '#26c6da';
  invitaciones: any[] = [];
  loadingInvitaciones = false;
  showInvitaciones = false;
  totalInvitacionesPendientes = 0;
  showImageModal = false;
  imagenModal = '';
  totalEventosConfirmados = 0;
  eventosConfirmados: any[] = [];
  showConfirmadosModal = false;
  loadingConfirmados = false;
  showEventoDetalleModal = false;
  eventoDetalle: any = null;
  invitacionesRechazadas: any[] = [];
  loadingRechazadas = false;
  eventosActivos: any[] = [];
  loadingActivos = false;
  paginaActual = 1;
  eventosPorPagina = 6;
  showChatModal = false;
  eventoChat: any = null;
  mensajes: any[] = [];
  nuevoMensaje = '';
  organizadorEvento: any = null;
  showInvitacionDetalleModal = false;
  invitacionDetalle: any = null;

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
        const query = await this.firestore.collection('agrupaciones', ref => 
          ref.where('uid', '==', user.uid)
        ).get().toPromise();
        
        if (query && !query.empty) {
          const data = query.docs[0].data() as any;
          this.agrupacion = { id: query.docs[0].id, ...data };
          
          // Extraer colores del logo si existe
          if (this.agrupacion.imagenBase64) {
            this.extractColorsFromImage(this.agrupacion.imagenBase64);
          }
          
          // Cargar contador de invitaciones
          this.cargarContadorInvitaciones();
          
          // Cargar contador de eventos confirmados
          this.cargarContadorEventosConfirmados();
          
          // Cargar invitaciones automáticamente
          this.cargarInvitaciones();
          
          // Cargar eventos confirmados automáticamente
          this.cargarEventosConfirmados();
          
          // Cargar invitaciones rechazadas automáticamente
          this.cargarInvitacionesRechazadas();
          
          // Cargar eventos activos automáticamente
          this.cargarEventosActivos();
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

  extractColorsFromImage(imageBase64: string) {
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
      
      if (colors.length >= 2) {
        this.primaryColor = colors[0];
        this.secondaryColor = colors[1];
        this.applyDynamicColors();
      }
    };
    
    img.onerror = () => {
      console.error('Error cargando imagen para extraer colores');
    };
    
    img.src = imageBase64;
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
      const groupedR = Math.floor(r / 20) * 20;
      const groupedG = Math.floor(g / 20) * 20;
      const groupedB = Math.floor(b / 20) * 20;
      
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

  applyDynamicColors() {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', this.primaryColor);
    root.style.setProperty('--secondary-color', this.secondaryColor);
  }

  calcularAnosTrayectoria(): number {
    if (!this.agrupacion?.anoFundacion) return 0;
    const anoActual = new Date().getFullYear();
    return anoActual - this.agrupacion.anoFundacion;
  }

  async mostrarInvitaciones() {
    this.showInvitaciones = true;
    if (this.invitaciones.length === 0) {
      await this.cargarInvitaciones();
    }
  }

  ocultarInvitaciones() {
    this.showInvitaciones = false;
  }

  async cargarInvitaciones() {
    if (!this.agrupacion?.id) return;
    
    this.loadingInvitaciones = true;
    try {
      const eventosQuery = await this.firestore.collection('eventos').get().toPromise();
      const invitacionesEncontradas: any[] = [];

      eventosQuery?.docs.forEach(doc => {
        const data = doc.data() as any;
        const evento = { id: doc.id, ...data };
        const invitacionesEvento = evento.invitaciones || [];
        
        invitacionesEvento.forEach((invitacion: any) => {
          if (invitacion.agrupacionId === this.agrupacion.id && invitacion.estado === 'pendiente') {
            invitacionesEncontradas.push({
              ...invitacion,
              evento: evento
            });
          }
        });
      });

      this.invitaciones = invitacionesEncontradas;
      this.totalInvitacionesPendientes = invitacionesEncontradas.length;
    } catch (error) {
      console.error('Error cargando invitaciones:', error);
    }
    this.loadingInvitaciones = false;
  }

  async cargarContadorInvitaciones() {
    if (!this.agrupacion?.id) return;
    
    try {
      const eventosQuery = await this.firestore.collection('eventos').get().toPromise();
      let contador = 0;

      eventosQuery?.docs.forEach(doc => {
        const data = doc.data() as any;
        const invitacionesEvento = data.invitaciones || [];
        
        invitacionesEvento.forEach((invitacion: any) => {
          if (invitacion.agrupacionId === this.agrupacion.id && invitacion.estado === 'pendiente') {
            contador++;
          }
        });
      });

      this.totalInvitacionesPendientes = contador;
    } catch (error) {
      console.error('Error cargando contador de invitaciones:', error);
    }
  }

  async responderInvitacion(invitacion: any, respuesta: 'aceptada' | 'rechazada') {
    try {
      const evento = invitacion.evento;
      const invitacionesActualizadas = evento.invitaciones.map((inv: any) => {
        if (inv.agrupacionId === this.agrupacion.id) {
          return { ...inv, estado: respuesta, fechaRespuesta: new Date() };
        }
        return inv;
      });

      await this.firestore.collection('eventos').doc(evento.id).update({
        invitaciones: invitacionesActualizadas
      });

      // Si se aceptó la invitación, enviar mensaje al chat
      if (respuesta === 'aceptada') {
        await this.enviarMensajeConfirmacion(evento);
        this.totalEventosConfirmados++;
      }

      // Remover de la lista local
      this.invitaciones = this.invitaciones.filter(inv => inv !== invitacion);
      this.totalInvitacionesPendientes = this.invitaciones.length;
      
      const mensaje = respuesta === 'aceptada' ? 'Invitación aceptada' : 'Invitación rechazada';
      const icono = respuesta === 'aceptada' ? 'success' : 'info';
      
      await Swal.fire({
        title: mensaje,
        text: 'La respuesta ha sido enviada exitosamente.',
        icon: icono,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#00acc1'
      });
      
      // Recargar página después de confirmar
      window.location.reload();
    } catch (error) {
      console.error('Error respondiendo invitación:', error);
      
      Swal.fire({
        title: 'Error',
        text: 'No se pudo responder la invitación. Inténtalo de nuevo.',
        icon: 'error',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#dc3545'
      });
    }
  }

  abrirImagenModal(imagen: string) {
    this.imagenModal = imagen;
    this.showImageModal = true;
  }

  cerrarImagenModal() {
    this.showImageModal = false;
    this.imagenModal = '';
  }

  async cargarContadorEventosConfirmados() {
    if (!this.agrupacion?.id) return;
    
    try {
      const eventosQuery = await this.firestore.collection('eventos').get().toPromise();
      let contador = 0;

      eventosQuery?.docs.forEach(doc => {
        const data = doc.data() as any;
        const invitacionesEvento = data.invitaciones || [];
        
        invitacionesEvento.forEach((invitacion: any) => {
          if (invitacion.agrupacionId === this.agrupacion.id && invitacion.estado === 'aceptada') {
            contador++;
          }
        });
      });

      this.totalEventosConfirmados = contador;
    } catch (error) {
      console.error('Error cargando contador de eventos confirmados:', error);
    }
  }

  async mostrarEventosConfirmados() {
    this.showConfirmadosModal = true;
    if (this.eventosConfirmados.length === 0) {
      await this.cargarEventosConfirmados();
    }
  }

  cerrarConfirmadosModal() {
    this.showConfirmadosModal = false;
  }

  async cargarEventosConfirmados() {
    if (!this.agrupacion?.id) return;
    
    this.loadingConfirmados = true;
    try {
      const eventosQuery = await this.firestore.collection('eventos').get().toPromise();
      const eventosEncontrados: any[] = [];

      eventosQuery?.docs.forEach(doc => {
        const data = doc.data() as any;
        const evento = { id: doc.id, ...data };
        const invitacionesEvento = evento.invitaciones || [];
        
        invitacionesEvento.forEach((invitacion: any) => {
          if (invitacion.agrupacionId === this.agrupacion.id && invitacion.estado === 'aceptada') {
            eventosEncontrados.push({
              ...invitacion,
              evento: evento
            });
          }
        });
      });

      this.eventosConfirmados = eventosEncontrados;
      
      // Cargar colores de los logos de las agrupaciones
      await this.cargarColoresAgrupaciones();
    } catch (error) {
      console.error('Error cargando eventos confirmados:', error);
    }
    this.loadingConfirmados = false;
  }

  async cargarColoresAgrupaciones() {
    for (const confirmado of this.eventosConfirmados) {
      if (!confirmado.primaryColor && this.agrupacion?.imagenBase64) {
        const colors = await this.extractColorsFromImageAsync(this.agrupacion.imagenBase64);
        if (colors.length >= 2) {
          confirmado.primaryColor = colors[0];
          confirmado.secondaryColor = colors[1];
        }
      }
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

  getAgrupacionesConfirmadas(evento: any): any[] {
    const invitaciones = evento.invitaciones || [];
    return invitaciones.filter((inv: any) => inv.estado === 'aceptada');
  }

  getAgrupacionesRechazadas(evento: any): any[] {
    const invitaciones = evento.invitaciones || [];
    return invitaciones.filter((inv: any) => inv.estado === 'rechazada');
  }

  async cargarLogosAgrupaciones(confirmadas: any[]) {
    for (const confirmada of confirmadas) {
      if (!confirmada.agrupacionLogo && confirmada.agrupacionId) {
        try {
          const agrupacionDoc = await this.firestore.collection('agrupaciones').doc(confirmada.agrupacionId).get().toPromise();
          if (agrupacionDoc && agrupacionDoc.exists) {
            const agrupacionData = agrupacionDoc.data() as any;
            confirmada.agrupacionLogo = agrupacionData.imagenBase64;
          }
        } catch (error) {
          console.error('Error cargando logo de agrupación:', error);
        }
      }
    }
  }

  abrirEventoDetalle(evento: any) {
    this.eventoDetalle = evento;
    this.showEventoDetalleModal = true;
  }

  cerrarEventoDetalle() {
    this.showEventoDetalleModal = false;
    this.eventoDetalle = null;
  }

  async cargarInvitacionesRechazadas() {
    if (!this.agrupacion?.id) return;
    
    this.loadingRechazadas = true;
    try {
      const eventosQuery = await this.firestore.collection('eventos').get().toPromise();
      const rechazadasEncontradas: any[] = [];

      eventosQuery?.docs.forEach(doc => {
        const data = doc.data() as any;
        const evento = { id: doc.id, ...data };
        const invitacionesEvento = evento.invitaciones || [];
        
        invitacionesEvento.forEach((invitacion: any) => {
          if (invitacion.agrupacionId === this.agrupacion.id && invitacion.estado === 'rechazada') {
            rechazadasEncontradas.push({
              ...invitacion,
              evento: evento
            });
          }
        });
      });

      this.invitacionesRechazadas = rechazadasEncontradas;
    } catch (error) {
      console.error('Error cargando invitaciones rechazadas:', error);
    }
    this.loadingRechazadas = false;
  }

  async cargarEventosActivos() {
    this.loadingActivos = true;
    try {
      const eventosQuery = await this.firestore.collection('eventos', ref => 
        ref.where('estado', '==', 'abierto')
      ).get().toPromise();
      
      const eventosEncontrados: any[] = [];
      eventosQuery?.docs.forEach(doc => {
        const data = doc.data() as any;
        const evento = { id: doc.id, ...data };
        
        // Verificar que no sea un evento donde ya está invitado o confirmado
        const yaInvitado = evento.invitaciones?.some((inv: any) => 
          inv.agrupacionId === this.agrupacion.id
        );
        
        if (!yaInvitado) {
          eventosEncontrados.push(evento);
        }
      });
      
      this.eventosActivos = eventosEncontrados;
    } catch (error) {
      console.error('Error cargando eventos activos:', error);
    }
    this.loadingActivos = false;
  }

  yaSePostulo(evento: any): boolean {
    return evento.postulaciones?.some((post: any) => 
      post.agrupacionId === this.agrupacion.id
    ) || false;
  }

  async postularseEvento(evento: any) {
    try {
      const nuevaPostulacion = {
        agrupacionId: this.agrupacion.id,
        agrupacionNombre: this.agrupacion.nombre,
        agrupacionEmail: this.agrupacion.contacto,
        agrupacionTipo: this.agrupacion.tipo,
        fechaPostulacion: new Date()
      };
      
      const postulacionesActualizadas = [...(evento.postulaciones || []), nuevaPostulacion];
      
      await this.firestore.collection('eventos').doc(evento.id).update({
        postulaciones: postulacionesActualizadas
      });
      
      // Actualizar localmente
      evento.postulaciones = postulacionesActualizadas;
      
      Swal.fire({
        title: '¡Postulación Enviada!',
        text: 'Tu postulación ha sido enviada al organizador del evento.',
        icon: 'success',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#00acc1'
      });
    } catch (error) {
      console.error('Error postulándose al evento:', error);
      
      Swal.fire({
        title: 'Error',
        text: 'No se pudo enviar la postulación. Inténtalo de nuevo.',
        icon: 'error',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#dc3545'
      });
    }
  }

  getEventosActivosPaginados(): any[] {
    const inicio = (this.paginaActual - 1) * this.eventosPorPagina;
    const fin = inicio + this.eventosPorPagina;
    return this.eventosActivos.slice(inicio, fin);
  }

  getTotalPaginas(): number {
    return Math.ceil(this.eventosActivos.length / this.eventosPorPagina);
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.getTotalPaginas()) {
      this.paginaActual++;
    }
  }

  abrirChat(evento: any) {
    this.eventoChat = evento;
    this.showChatModal = true;
    this.cargarMensajes();
    this.cargarOrganizadorEvento();
  }

  cerrarChat() {
    this.showChatModal = false;
    this.eventoChat = null;
    this.mensajes = [];
    this.nuevoMensaje = '';
    this.organizadorEvento = null;
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
        
        // Cargar avatares de organizadores
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
      autor: this.agrupacion.nombre,
      autorTipo: 'agrupacion',
      autorEtiqueta: `${this.agrupacion.contacto} (${this.agrupacion.nombre})`,
      autorAvatar: this.agrupacion.imagenBase64 || '',
      autorId: this.agrupacion.id,
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

  async cargarAvataresMensajes() {
    const organizadoresIds = [...new Set(this.mensajes
      .filter(m => m.autorTipo === 'organizador' && !m.autorAvatar)
      .map(m => m.autorId)
    )];
    
    for (const organizadorId of organizadoresIds) {
      try {
        const organizadorDoc = await this.firestore.collection('organizadores').doc(organizadorId).get().toPromise();
        if (organizadorDoc && organizadorDoc.exists) {
          const organizadorData = organizadorDoc.data() as any;
          const avatar = organizadorData.imagenBase64 || '';
          
          // Actualizar mensajes de este organizador
          this.mensajes.forEach(mensaje => {
            if (mensaje.autorId === organizadorId && mensaje.autorTipo === 'organizador') {
              mensaje.autorAvatar = avatar;
            }
          });
        }
      } catch (error) {
        console.error('Error cargando avatar de organizador:', error);
      }
    }
  }

  async enviarMensajeConfirmacion(evento: any) {
    const mensaje = {
      texto: `🎉 ${this.agrupacion.nombre} se ha integrado a la conversación del evento`,
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
      console.error('Error enviando mensaje de confirmación:', error);
    }
  }

  async cargarOrganizadorEvento() {
    if (!this.eventoChat?.organizadorId) return;
    
    try {
      const organizadorDoc = await this.firestore.collection('organizadores').doc(this.eventoChat.organizadorId).get().toPromise();
      if (organizadorDoc && organizadorDoc.exists) {
        const data = organizadorDoc.data();
        if (data) {
          this.organizadorEvento = { id: organizadorDoc.id, ...data };
        }
      }
    } catch (error) {
      console.error('Error cargando organizador del evento:', error);
    }
    
    // Cargar logos de agrupaciones confirmadas
    await this.cargarLogosAgrupacionesConfirmadas();
  }

  async cargarLogosAgrupacionesConfirmadas() {
    const agrupacionesConfirmadas = this.getAgrupacionesConfirmadas(this.eventoChat);
    
    for (const confirmada of agrupacionesConfirmadas) {
      if (!confirmada.agrupacionLogo && confirmada.agrupacionId) {
        try {
          const agrupacionDoc = await this.firestore.collection('agrupaciones').doc(confirmada.agrupacionId).get().toPromise();
          if (agrupacionDoc && agrupacionDoc.exists) {
            const agrupacionData = agrupacionDoc.data() as any;
            confirmada.agrupacionLogo = agrupacionData.imagenBase64;
          }
        } catch (error) {
          console.error('Error cargando logo de agrupación:', error);
        }
      }
    }
  }

  getParticipantesChat(): any[] {
    const participantes: any[] = [];
    
    // Agregar organizador
    if (this.organizadorEvento) {
      participantes.push({
        id: this.organizadorEvento.id,
        nombre: this.organizadorEvento.nombre,
        tipo: 'organizador',
        avatar: this.organizadorEvento.imagenBase64 || ''
      });
    }
    
    // Agregar agrupaciones confirmadas
    if (this.eventoChat) {
      const agrupacionesConfirmadas = this.getAgrupacionesConfirmadas(this.eventoChat);
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

  verDetalleInvitacion(invitacion: any) {
    this.invitacionDetalle = invitacion;
    this.showInvitacionDetalleModal = true;
  }

  cerrarInvitacionDetalle() {
    this.showInvitacionDetalleModal = false;
    this.invitacionDetalle = null;
  }

  async responderInvitacionDesdeModal(respuesta: 'aceptada' | 'rechazada') {
    if (!this.invitacionDetalle) return;
    
    await this.responderInvitacion(this.invitacionDetalle, respuesta);
    this.cerrarInvitacionDetalle();
  }
}