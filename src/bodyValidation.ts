import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const schema = Joi.object({
    // Couldn't implement that on time.
    //image: Joi.string().base64().required(),
    customer_code: Joi.string().required(),
    measure_datetime: Joi.date().iso().required(),
    measure_type: Joi.string().valid('WATER', 'GAS').required(),
});

const validateRequest = (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    next();
};

export default validateRequest;
