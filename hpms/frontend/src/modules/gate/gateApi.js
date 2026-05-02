import client from '../../api/client';

export const gateApi = {
  scanQr: async (qrToken, deviceId) => {
    const response = await client.post('/gate/scan', { qrToken, deviceId });
    return response.data;
  },
  verifyManual: async (approvalNumber) => {
    const response = await client.get(`/certificates/approval/${approvalNumber}`);
    return response.data;
  }
};
