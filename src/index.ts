import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import express, { Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import os from 'os';
import validateRequest from "./bodyValidation.js";
import checkExistingEntry from "./databaseConnect.js";

dotenv.config();
// Express setup
const app = express();
const port = 3000;

// Keys and env.
const apiKey = process.env.GEMINI_API_KEY as string;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);
// genAI model

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});

// Multer setup
const upload = multer() 

app.post('/reading', upload.single('image'), validateRequest, checkExistingEntry, async (req: Request, res: Response) => {
    
    
    //Check for buffer
    const buffer = req.file?.buffer;
    if (!buffer) throw new Error('File buffer is missing');

    try {

        // Write the buffer to a temporary file
        const tempPath = path.join(os.tmpdir(), req.file!.originalname);

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
            const aiReturn = result.response.candidates![0].content.parts[0].text
            const measurement = aiReturn!.match(/\d+/g)![0]

            // Data to be returned:
            const returnedData = {
                "measure_id": uuidv4(),
                "measure_value": parseInt(measurement)
            }
            res.send(returnedData)

            // Deletion of temp file after it's used
            fs.unlink(tempPath, (unlinkErr) => {
                if (unlinkErr) console.error('Failed to delete temporary file:', unlinkErr);
            });
        });


    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ocorreu um erro ao processar a imagem' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

/*
await client.db('cluster0').collection('leituras').insertOne({
      _id: uuidv4(),
      imagem: req.file.buffer,
      texto_extraido: text,
      valor_medido: extractedValue
    });
*/
