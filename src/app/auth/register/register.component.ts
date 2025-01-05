import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  email: string = '';
  password: string = '';
  error: string | null = null; // Add this property to handle errors

  constructor(private afAuth: AngularFireAuth) {}

  async register() {
    try {
      await this.afAuth.createUserWithEmailAndPassword(this.email, this.password);
      console.log('Registered successfully');
      this.error = null; // Clear error on successful registration
    } catch (err: any) {
      this.error = err.message; // Display error message
      console.error(err);
    }
  }
}
