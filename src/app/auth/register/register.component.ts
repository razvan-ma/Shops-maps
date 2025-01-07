import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  email: string = '';
  password: string = '';
  error: string | null = null; // For displaying errors
  success: string | null = null; // For displaying success messages

  constructor(private afAuth: AngularFireAuth, private router: Router) {}

  async register() {
    // Basic validation
    if (!this.email || !this.password) {
      this.error = 'Please fill in both email and password.';
      return;
    }

    try {
      await this.afAuth.createUserWithEmailAndPassword(this.email, this.password);
      console.log('Registered successfully');
      this.error = null; // Clear error
      this.success = 'Registration successful! Redirecting to login...';

      // Redirect to login page after a delay
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
    } catch (err: any) {
      this.success = null; // Clear success message
      this.error = err.message; // Display error message
      console.error(err);
    }
  }
}