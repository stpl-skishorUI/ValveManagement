import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccessDeniedComponent } from 'src/app/errors/access-denied/access-denied.component';

const routes: Routes = [
  {
    path: 'dashboard', loadChildren: () => import('../partial/dashboard/dashboard.module').then(m => m.DashboardModule),
    data: { breadcrumb: [{ title: 'Dashboard', active: true }] }
  },
  {
    path: 'valve-list', loadChildren: () => import('../partial/valve-list/valve-list.module').then(m => m.ValveListModule),
    data: { breadcrumb: [{ title: 'Valve List', active: true }] }
  },
  {
    path: 'sim-list', loadChildren: () => import('../partial/sim-list/sim-list.module').then(m => m.SimListModule),
    data: { breadcrumb: [{ title: 'SIM List', active: true }] }
  },
  {
    path: 'user-registration', loadChildren: () => import('../partial/user-registration/user-registration.module').then(m => m.UserRegistrationModule),
    data: { breadcrumb: [{ title: 'User Registration', active: true }] }
  },
  { path: 'access-denied', component: AccessDeniedComponent, data: { title: 'Access Denied' } },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PartialLayoutRoutingModule { }
