import { MongoClient, ServerApiVersion } from 'mongodb';
import { Request, Response, NextFunction } from 'express';
import * as dotenv from 'dotenv';
dotenv.config();

// Initialize MongoDB Client
const uri = process.env.MONGODB_URI as string;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// Middleware to check existing entry for measure_id and if monthly reading was already done
const checkCustomerEntry = async (req: Request, res: Response, next: NextFunction) => {
    const { customer_code } = req.params;

    try {
        await client.connect();
        const db = client.db('teste');
        const collection = db.collection('leituras');

        // Check for an existing entry
        const existingEntry = await collection.findOne({
            customer_code
        });

        if (!existingEntry) {
            return res.status(404).json({
                error_code: "CUSTOMER_NOT_FOUND",
                error_description: "Código de cliente não encontrado"
            });
        }

        next();
    } catch (err) {
        console.error('Error checking for existing entry:', err);
        return res.status(500).json({ error: 'Database query failed' });
    }
};

export default checkCustomerEntry;

