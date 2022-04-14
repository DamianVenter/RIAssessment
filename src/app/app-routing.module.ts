import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CardValidatorComponent } from './pages/card-validator/card-validator.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'card-validator', component: CardValidatorComponent },
  { path: '**', redirectTo: 'dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
