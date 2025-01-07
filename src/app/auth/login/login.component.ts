import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  error: string | null = null; // For displaying errors

  constructor(private afAuth: AngularFireAuth, private router: Router) {}

  async login() {
    // Basic validation
    if (!this.email || !this.password) {
      this.error = 'Please fill in both email and password.';
      return;
    }

    try {
      await this.afAuth.signInWithEmailAndPassword(this.email, this.password);
      console.log('Logged in successfully');
      this.error = null; // Clear error on successful login

      // Redirect to home or dashboard
      this.router.navigate(['/home']);
    } catch (err: any) {
      this.error = err.message; // Display error message
      console.error(err);
    }
  }
}