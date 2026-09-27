import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  email = '';
  password = '';
  message = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  login(): void {
    this.message = '';

    this.authService.login(this.email, this.password)
      .subscribe({
        next: (response) => {

          localStorage.setItem('token', response.token);

          this.router.navigate(['/dashboard']);
        },

        error: (error) => {
          console.error('Login failed:', error);

          this.message = 'Invalid email or password';
        }
      });
  }
}