class AuthService {
    static getToken() {
      return localStorage.getItem('authToken');
    }
  
    static async isAuthenticated() {
      const token = this.getToken();
      if (!token) return false;
      
      try {
        const response = await fetch('/api/auth/verify', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok;
      } catch (error) {
        return false;
      }
    }
  
    static async handleProtectedPage() {
      const isAuthPage = window.location.pathname.includes('login.html') || 
                        window.location.pathname.includes('register.html');
      
      if (!(await this.isAuthenticated()) && !isAuthPage) {
        window.location.href = '/login.html';
      }
    }
  
    static updateUI() {
      const token = this.getToken();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          document.getElementById('login-link').style.display = 'none';
          document.getElementById('user-greeting').style.display = 'inline';
          document.getElementById('username-display').textContent = payload.username;
        } catch (e) {
          console.error("Token parsing failed:", e);
        }
      }
    }
  }
  
  // Initialize auth on page load
  document.addEventListener('DOMContentLoaded', () => {
    AuthService.handleProtectedPage();
    AuthService.updateUI();
    
    // Logout handler
    document.getElementById('logout-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('authToken');
      window.location.href = '/login.html';
    });
  });
  
  export default AuthService;