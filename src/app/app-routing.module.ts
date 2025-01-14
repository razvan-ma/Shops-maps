import { NgModule } from '@angular/core';
import { RouterModule, Routes, ExtraOptions } from '@angular/router';
import { EsriMapComponent } from './pages/esri-map/esri-map.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { BookmarksComponent } from './pages/bookmarks/bookmarks.component';

const routes: Routes = [
  {
    path: 'home',
    component: HomeComponent,
  },
  { 
    path: 'map',
    component: EsriMapComponent,
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  { 
    path: 'login', 
    component: LoginComponent 
  },
  { 
    path: 'register', 
    component: RegisterComponent 
  },
  { 
    path: 'shop-dashboard', 
    loadChildren: () => import('./pages/shop-dashboard/shop-dashboard.module').then(m => m.ShopDashboardModule)
  },
  { path: 'bookmarks', component: BookmarksComponent },

  { path: '', redirectTo: '/map', pathMatch: 'full' },
];

const config: ExtraOptions = {
  useHash: false,
};

@NgModule({
  imports: [RouterModule.forRoot(routes, config)],
  exports: [RouterModule],
})
export class AppRoutingModule { }