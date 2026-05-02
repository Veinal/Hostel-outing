import Joi from 'joi';

export class AuthValidator {
  static login(data) {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    });
    return schema.validate(data, { abortEarly: false });
  }
}
