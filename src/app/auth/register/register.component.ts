import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  email: string = '';
  password: string = '';
  userType: string = 'customer'; // Default user type
  error: string | null = null; // For displaying errors
  success: string | null = null; // For displaying success messages

  constructor(private afAuth: AngularFireAuth, private db: AngularFireDatabase, private router: Router) {}

  async register() {
    // Basic validation
    if (!this.email || !this.password || !this.userType) {
      this.error = 'Please fill in all fields.';
      return;
    }

    try {
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(this.email, this.password);
      const userId = userCredential.user?.uid;

      // Store user type in the database
      if (userId) {
        await this.db.object(`users/${userId}`).set({ email: this.email, userType: this.userType });
      }

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