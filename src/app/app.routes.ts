import { Routes } from '@angular/router';
import { AddressFormComponent } from './address-form/address-form.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { TableComponent } from './table/table.component';
import {HomepageComponent} from './features/homepage/homepage.component';
import {LoginComponent} from './features/auth/login/login.component';
import {RegisterComponent} from './features/auth/register/register.component';

export const routes: Routes = [
    {
        path: '',
        component: DashboardComponent
    },
    {
        path: 'address',
        component: AddressFormComponent
    },
    {
        path: 'table',
        component: TableComponent
    },
    {
      path: 'home',
      component: HomepageComponent
    },
    {
      path: 'login',
      component: LoginComponent
    },
    {
      path: 'register',
      component: RegisterComponent
    }
];
