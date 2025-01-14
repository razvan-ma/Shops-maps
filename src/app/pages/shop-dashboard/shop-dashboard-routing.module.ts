import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ShopDashboardComponent } from './shop-dashboard.component';

const routes: Routes = [{ path: '', component: ShopDashboardComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ShopDashboardRoutingModule { }
