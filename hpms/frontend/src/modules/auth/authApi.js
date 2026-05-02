import client from '../../api/client';

export const authApi = {
  login: async (email, password) => {
    const response = await client.post('/auth/login', { email, password });
    return response.data;
  },

  logout: async () => {
    const response = await client.post('/auth/logout');
    return response.data;
  },

  refresh: async () => {
    const response = await client.post('/auth/refresh');
    return response.data;
  },

  getMe: async () => {
    const response = await client.get('/auth/me');
    return response.data;
  }
};
