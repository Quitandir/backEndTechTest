import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const schema = Joi.object({
    base64_image: Joi.string().base64({ paddingRequired: false }).required(),
    customer_code: Joi.string().required(),
    measure_datetime: Joi.date().iso().required(),
    measure_type: Joi.string().valid('WATER', 'GAS').required(),
});

const validatePost = (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    next();
};

export default validatePost;
