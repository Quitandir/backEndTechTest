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

// Middleware to check existing entry
const checkExistingEntry = async (req: Request, res: Response, next: NextFunction) => {
    const { customer_code, measure_datetime } = req.body;

    // Parse the date
    const date = new Date(measure_datetime);
    const month = date.getMonth();
    const year = date.getFullYear();
    const year_month = `${year}-${month + 1}`

    try {
        await client.connect();

        const db = client.db('teste');
        const collection = db.collection('leituras');

        // Check for an existing entry
        const existingEntry = await collection.findOne({
            customer_code,
            year_month
        });

        if (existingEntry) {
            return res.status(409).json({
                message: 'An entry for this customer already exists for this month.',
            });
        }        

        next();
    } catch (err) {
        console.error('Error checking for existing entry:', err);
        return res.status(500).json({ error: 'Database query failed' });
    }
};

export default checkExistingEntry;

