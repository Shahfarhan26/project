import AuthService from './auth.js';

class API {
    static async upload(url, formData) {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${AuthService.getToken()}`
            }
        });
        return await response.json();
    }
    static async get(url) {
    return this._request('GET', url);
    }

  static async post(url, data) {
    return this._request('POST', url, data);
  }

  static async _request(method, url, data = null) {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AuthService.getToken()}`
      }
      
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(url, config);
    
    if (response.status === 401) {
      window.location.href = '/login.html';
      return;
    }

    return await response.json();
  }
}

export default API;