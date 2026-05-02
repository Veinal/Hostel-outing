import client from '../../api/client';

export const adminApi = {
  getSummary: async () => (await client.get('/admin/reports/summary')).data.data,
  
  getWardens: async () => (await client.get('/admin/wardens')).data.data.wardens,
  createWarden: async (data) => (await client.post('/admin/wardens', data)).data.data,
  updateWarden: async (id, data) => (await client.put(`/admin/wardens/${id}`, data)).data.data,
  deleteWarden: async (id) => (await client.delete(`/admin/wardens/${id}`)).data,
  assignWarden: async (id, blockId) => (await client.put(`/admin/wardens/${id}/assign`, { blockId })).data,
  
  getStudents: async (params) => (await client.get('/admin/students', { params })).data.data,
  getStudent: async (id) => (await client.get(`/admin/students/${id}`)).data.data,
  updateStudent: async (id, data) => (await client.put(`/admin/students/${id}`, data)).data.data,
  resetPassword: async (id) => (await client.post(`/admin/students/${id}/reset-password`)).data,
  importStudents: async (formData) => (await client.post('/admin/students/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data,
  
  getRequestsReport: async (params) => (await client.get('/admin/reports/requests', { params })).data.data,
  getOverdueReport: async () => (await client.get('/admin/reports/overdue')).data.data,
  
  getBlocks: async () => (await client.get('/master/blocks')).data.data.blocks
};
