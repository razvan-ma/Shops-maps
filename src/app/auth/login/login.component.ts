import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  error: string | null = null; // Add this property to handle errors

  constructor(private afAuth: AngularFireAuth) {}

  async login() {
    try {
      await this.afAuth.signInWithEmailAndPassword(this.email, this.password);
      console.log('Logged in successfully');
      this.error = null; // Clear error on successful login
    } catch (err: any) {
      this.error = err.message; // Display error message
      console.error(err);
    }
  }
}
