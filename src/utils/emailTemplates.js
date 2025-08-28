// Email template utility functions for different actions

export const getEmailTemplateParams = (action, data) => {
  const baseParams = {
    to_email: data.studentEmail,
    to_name: data.studentName,
    warden_name: data.wardenName,
    request_type: data.requestType,
    out_date: data.outDate,
    out_time: data.outTime,
    return_date: data.returnDate,
    return_time: data.returnTime,
    location: data.location || '-',
    reason: data.reason,
  };

  switch (action) {
    case 'approve':
      return {
        ...baseParams,
        action: 'approved',
        action_message: 'Your request has been approved successfully!',
        subject: `Request Approved - ${data.requestType} for ${data.outDate}`,
        template_id: 'template_1n2v4lu' // Separate template for approval
      };

    case 'reject':
      return {
        ...baseParams,
        action: 'rejected',
        action_message: `Your request has been rejected. Reason: ${data.rejectionReason}`,
        rejection_reason: data.rejectionReason,
        subject: `Request Rejected - ${data.requestType} for ${data.outDate}`,
        template_id: 'template_rejection_warden' // Separate template for rejection
      };

    case 'cancel':
      return {
        ...baseParams,
        action: 'cancelled',
        action_message: `Your previously approved request has been cancelled. Reason: ${data.cancellationReason}`,
        cancellation_reason: data.cancellationReason,
        subject: `Request Cancelled - ${data.requestType} for ${data.outDate}`,
        template_id: 'template_cancellation_warden' // Separate template for cancellation
      };

    default:
      return baseParams;
  }
};

// Email service configuration
export const EMAIL_CONFIG = {
  service_id: 'service_ozk7gdj', // Your EmailJS service ID
  public_key: 'SjHmsrhvp6R0qw-Vx', // Your EmailJS public key
};

// Helper function to format email content
export const formatEmailContent = (action, data) => {
  const actionText = {
    approve: 'APPROVED',
    reject: 'REJECTED',
    cancel: 'CANCELLED'
  }[action] || 'UPDATED';

  const color = {
    approve: '#10B981', // Green
    reject: '#EF4444',  // Red
    cancel: '#F59E0B'   // Orange
  }[action] || '#6B7280'; // Gray

  return {
    actionText,
    color,
    statusMessage: getStatusMessage(action, data)
  };
};

const getStatusMessage = (action, data) => {
  switch (action) {
    case 'approve':
      return `Your ${data.requestType} request has been approved! You can now proceed with your outing.`;
    case 'reject':
      return `Your ${data.requestType} request has been rejected. Please review the reason and submit a new request if needed.`;
    case 'cancel':
      return `Your previously approved ${data.requestType} request has been cancelled. Please contact the warden for more information.`;
    default:
      return 'Your request status has been updated.';
  }
};
