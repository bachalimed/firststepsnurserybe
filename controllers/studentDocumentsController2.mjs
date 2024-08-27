import fs from 'fs';
import path from 'path';
import mime from 'mime';
import asyncHandler from 'express-async-handler'; // Or whatever async handler you're using

const getFileById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: 'Missing required parameters: id' });
    }

    const document = await StudentDocument.findOne({ _id: id }).lean();

    if (!document) {
        return res.status(404).json({ message: 'Document not found' });
    }

    const filePath = document.file;

    if (fs.existsSync(filePath)) {
        const mimeType = mime.getType(filePath);
        res.setHeader('Content-Type', mimeType);
        res.sendFile(filePath, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).send('Error sending file');
            }
        });
    } else {
        res.status(404).json({ message: 'File not found' });
    }
});

module.exports = {
   
    getFileById,
 
}