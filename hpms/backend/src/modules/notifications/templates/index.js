export const Templates = {
  REQUEST_SUBMITTED: (payload) => ({
    subject: `Request Submitted: ${payload.approvalNumber}`,
    html: `<p>Your request (<strong>${payload.approvalNumber}</strong>) for ${payload.requestType} has been successfully submitted and is pending warden approval.</p>`
  }),

  REQUEST_APPROVED: (payload) => ({
    subject: `Request Approved: ${payload.approvalNumber}`,
    html: `<p>Good news! Your request (<strong>${payload.approvalNumber}</strong>) has been approved. You can view your QR code on the dashboard.</p>`
  }),

  REQUEST_REJECTED: (payload) => ({
    subject: `Request Rejected: ${payload.approvalNumber}`,
    html: `<p>Your request (<strong>${payload.approvalNumber}</strong>) was rejected.</p><p>Reason: ${payload.reason}</p>`
  }),

  REQUEST_CANCELLED: (payload) => ({
    subject: `Request Cancelled: ${payload.approvalNumber}`,
    html: `<p>Your approved request (<strong>${payload.approvalNumber}</strong>) has been cancelled.</p><p>Reason: ${payload.reason}</p>`
  })
};
