import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const schema = Joi.object({

    confirmed_value: Joi.number().integer().required()
});

//Checks if patch request has a confirmed_value to update db
const validatePatch = (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    next();
};

export default validatePatch;
