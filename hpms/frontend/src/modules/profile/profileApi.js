import client from '../../api/client';

export const profileApi = {
  updateStudentProfile: async (data) => {
    const response = await client.put('/users/me/profile', data);
    return response.data;
  },
  changePassword: async (currentPassword, newPassword) => {
    const response = await client.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },
  getBlocks: async () => {
    const response = await client.get('/master/blocks');
    return response.data.data.blocks;
  }
};
