import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import os from 'os';
import bodyParser from "body-parser";
import validatePost from "./validations/bodyValidationPost.js";
import validatePatch from "./validations/bodyValidationPatch.js";
import checkMonthlyEntry from "./validations/checkMonthlyEntry.js";
import checkIdEntry from "./validations/checkIdEntry.js";
import { MongoClient, ServerApiVersion } from "mongodb";
import monthYearParser from "./utils/monthYearParser.js";
import checkCustomerEntry from "./validations/checkCustomerEntry.js";


dotenv.config();
// Express and Bodyparser setup
const port = 3000;
const app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Keys and env.
const apiKey = process.env.GEMINI_API_KEY as string;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

// genAI model
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});

//DB setup
const uri = process.env.MONGODB_URI as string;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.post('/reading', validatePost, checkMonthlyEntry, async (req: Request, res: Response) => {
    const { base64_image, customer_code, measure_type, measure_datetime } = req.body;

    try {

        // Convert base64 to buffer
        const buffer = Buffer.from(base64_image, "base64");

        // Create temp path
        const tempPath = path.join(os.tmpdir(), "image");

        // Write image from the buffer
        fs.writeFile(tempPath, buffer, async (err) => {
            if (err) throw err;
            //Extract numbers from image
            const uploadResponse = await fileManager.uploadFile(tempPath, {
                mimeType: "image/jpeg",
                displayName: "gas/water measurement"
            });

            const result = await model.generateContent([
                {
                    fileData: {
                        mimeType: uploadResponse.file.mimeType,
                        fileUri: uploadResponse.file.uri
                    }
                },
                { text: "Return only the numbers measured in the meter." },
            ]);

            // Parse only numbers from AI reading
            const aiReturn = result.response.candidates![0].content.parts[0].text;
            const measurement = aiReturn!.match(/\d+/g)![0];
            const measure_value = parseInt(measurement);

            // Creates id
            const measure_id = uuidv4();

            // Writes in DB            
            await client.connect();
            const db = client.db('teste');
            const collection = db.collection('leituras');
            await collection.insertOne({
                customer_code: customer_code,
                measure_type: measure_type,
                measure_id: measure_id,
                measure_datetime: measure_datetime,
                measure_year_month: monthYearParser(measure_datetime),
                measure_value: measurement,
                confirmed: false
            });

            res.status(200).json({
                measure_id: measure_id,
                measure_value: measure_value
            })
        });
 
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error while processing the image.' });
    }
});

//Receives measure_id and value to return confirmed value
app.patch('/reading/:measure_id', validatePatch, checkIdEntry, async (req: Request, res: Response) => {
    const { measure_id } = req.params;
    const { confirmed_value } = req.body;
    try {

        await client.connect();
        const db = client.db('teste');
        const collection = db.collection('leituras');
        const query = { measure_id: measure_id };
        const newValues = { $set: { measure_value: confirmed_value, confirmed: true } };
        collection.updateOne(query, newValues)
        res.status(200).json({ measure_id, confirmed_value, "success": true })

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error while confirming entry.' });
    }
})

//Returns all reading from customer_code or filters by measure_type if informed in params.
app.get('/reading/:customer_code', checkCustomerEntry, async (req: Request, res: Response) => {
    const { customer_code } = req.params;

    interface Query {
        measure_type: string;
    };
    const { measure_type } = req.query as unknown as Query;

    try {

        await client.connect();
        const db = client.db('teste');
        const collection = db.collection('leituras');

        if (measure_type) {
            if (measure_type !== 'WATER' && measure_type !== 'GAS') {
                return res.status(400).json({ error: 'Invalid measure_type. Must be WATER or GAS.' });
            } else {
                const query = { "customer_code": customer_code, "measure_type": measure_type };
                const results = await collection.find(query).toArray();
                res.status(200).json(results)
            }
        } else {
            const query = { "customer_code" : customer_code }
            const results = await collection.find(query).toArray();
            res.status(200).json(results)
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error while confirming entry.' });
    }

})

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

