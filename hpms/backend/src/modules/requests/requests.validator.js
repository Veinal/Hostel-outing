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
    return schema.validate(data, { abortEarly: false });
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
