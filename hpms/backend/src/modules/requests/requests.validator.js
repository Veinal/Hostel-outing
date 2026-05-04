import Joi from 'joi';

export const RequestsValidator = {
  create: (data) => {
    const schema = Joi.object({
      requestType: Joi.string().valid('OUTING', 'HOME_GOING', 'OTHERS').required(),
      location: Joi.alternatives().conditional('requestType', {
        is: 'OUTING',
        then: Joi.string().required(),
        otherwise: Joi.string().optional().allow(null, '')
      }),
      reason: Joi.string().required(),
      wardenId: Joi.string().uuid().required(),
      outDateTime: Joi.date().iso().required(),
      expectedReturnDateTime: Joi.date().iso().greater(Joi.ref('outDateTime')).required()
    });
    const { error, value } = schema.validate(data, { abortEarly: false });
    if (error) return { error, value };

    // OUTING: return must be same day
    if (value.requestType === 'OUTING') {
      const outDate = new Date(value.outDateTime);
      const returnDate = new Date(value.expectedReturnDateTime);
      
      const outDay = outDate.toDateString();
      const returnDay = returnDate.toDateString();
      
      if (outDay !== returnDay) {
        throw new AppError(
          'VALIDATION_ERROR',
          'Outing return time must be on the same day as departure.',
          400
        );
      }
    }

    return { error, value };
  },

  reject: (data) => {
    const schema = Joi.object({
      rejectionReason: Joi.string().min(10).required()
    });
    return schema.validate(data, { abortEarly: false });
  },

  cancel: (data) => {
    const schema = Joi.object({
      reason: Joi.string().required()
    });
    return schema.validate(data, { abortEarly: false });
  },

  delay: (data) => {
    const schema = Joi.object({
      newExpectedReturnDateTime: Joi.date().iso().required()
    });
    return schema.validate(data, { abortEarly: false });
  }
};
