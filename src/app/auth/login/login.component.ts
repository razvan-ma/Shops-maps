import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
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

  constructor(private afAuth: AngularFireAuth, private db: AngularFireDatabase, private router: Router) {}

  async login() {
    // Basic validation
    if (!this.email || !this.password) {
      this.error = 'Please fill in both email and password.';
      return;
    }

    try {
      const userCredential = await this.afAuth.signInWithEmailAndPassword(this.email, this.password);
      const userId = userCredential.user?.uid;

      // Retrieve user type from the database
      if (userId) {
        const userRef = this.db.object(`users/${userId}`).valueChanges();
        userRef.subscribe((user: any) => {
          if (user) {
            console.log('Logged in successfully as', user.userType);
            this.error = null; // Clear error on successful login

            // Redirect based on user type
            if (user.userType === 'customer') {
              this.router.navigate(['/home']);
            } else if (user.userType === 'shopOwner') {
              this.router.navigate(['/shop-dashboard']); // Replace with the actual shop owner dashboard route
            }
          }
        });
      }
    } catch (err: any) {
      this.error = err.message; // Display error message
      console.error(err);
    }
  }
}