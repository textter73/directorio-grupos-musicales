import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AdminComponent } from './admin/admin.component';
import { RegistroAgrupacionComponent } from './registro-agrupacion/registro-agrupacion.component';
import { RegistroOrganizadorComponent } from './registro-organizador/registro-organizador.component';
import { SolicitudesPendientesComponent } from './solicitudes-pendientes/solicitudes-pendientes.component';
import { SolicitudesOrganizadoresComponent } from './solicitudes-organizadores/solicitudes-organizadores.component';
import { AgrupacionesAprobadasComponent } from './agrupaciones-aprobadas/agrupaciones-aprobadas.component';
import { OrganizadoresAprobadosComponent } from './organizadores-aprobados/organizadores-aprobados.component';
import { PerfilAgrupacionComponent } from './perfil-agrupacion/perfil-agrupacion.component';
import { PerfilOrganizadorComponent } from './perfil-organizador/perfil-organizador.component';
import { AdminEventosActivosComponent } from './admin-eventos-activos/admin-eventos-activos.component';
import { AdminEventosPendientesComponent } from './admin-eventos-pendientes/admin-eventos-pendientes.component';
import { AdminInsigniasComponent } from './admin-insignias/admin-insignias.component';
import { RankingPublicoComponent } from './ranking-publico/ranking-publico.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuard], data: { role: 'admin' } },
  { path: 'registro-agrupacion', component: RegistroAgrupacionComponent },
  { path: 'registro-organizador', component: RegistroOrganizadorComponent },
  { path: 'solicitudes-pendientes', component: SolicitudesPendientesComponent, canActivate: [AuthGuard], data: { role: 'admin' } },
  { path: 'solicitudes-organizadores', component: SolicitudesOrganizadoresComponent, canActivate: [AuthGuard], data: { role: 'admin' } },
  { path: 'agrupaciones-aprobadas', component: AgrupacionesAprobadasComponent, canActivate: [AuthGuard], data: { role: 'admin' } },
  { path: 'organizadores-aprobados', component: OrganizadoresAprobadosComponent, canActivate: [AuthGuard], data: { role: 'admin' } },
  { path: 'perfil-agrupacion', component: PerfilAgrupacionComponent, canActivate: [AuthGuard], data: { role: 'agrupacion' } },
  { path: 'perfil-organizador', component: PerfilOrganizadorComponent, canActivate: [AuthGuard], data: { role: 'organizador' } },
  { path: 'admin-eventos-activos', component: AdminEventosActivosComponent, canActivate: [AuthGuard], data: { role: 'admin' } },
  { path: 'admin-eventos-pendientes', component: AdminEventosPendientesComponent, canActivate: [AuthGuard], data: { role: 'admin' } },
  { path: 'admin-insignias', component: AdminInsigniasComponent, canActivate: [AuthGuard], data: { role: 'admin' } },
  { path: 'ranking-publico', component: RankingPublicoComponent }
];