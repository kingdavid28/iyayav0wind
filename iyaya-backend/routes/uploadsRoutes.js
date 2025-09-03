const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Simple document upload without multer for now
// Will implement base64 upload instead

// POST /api/uploads/base64
// Body: { imageBase64: string, mimeType?: string, folder?: string, name?: string }
router.post('/base64', async (req, res, next) => {
  try {
    const { imageBase64, mimeType, folder, name } = req.body || {};
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ success: false, error: 'imageBase64 is required' });
    }
    const baseDir = path.join(__dirname, '..', 'uploads', 'user');
    const targetDir = folder
      ? path.join(baseDir, String(folder).replace(/[^a-zA-Z0-9/_-]/g, '_'))
      : baseDir;
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    // Determine extension from mimeType or data URL header, default to jpg
    let ext = 'jpg';
    if (mimeType) {
      const mt = mimeType.toLowerCase();
      if (mt.includes('png')) ext = 'png';
      else if (mt.includes('webp')) ext = 'webp';
      else if (mt.includes('gif')) ext = 'gif';
      else if (mt.includes('jpg') || mt.includes('jpeg')) ext = 'jpg';
      else if (mt.includes('/')) ext = mt.split('/')[1];
    }
    const safeName = (name || `upload-${Date.now()}`).toString().replace(/[^a-zA-Z0-9_.-]/g, '_');
    const fileName = `${safeName}.${ext}`;
    const filePath = path.join(targetDir, fileName);

    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);

    const publicPath = path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/');
    const url = `/${publicPath}`; // served by app.use('/uploads', express.static(...))
    console.log(`🖼️  Image uploaded: ${fileName} (${buffer.length} bytes)`);
    res.json({ success: true, url, size: buffer.length, mimeType: mimeType || 'image/jpeg' });
  } catch (err) {
    next(err);
  }
});

// POST /api/uploads/document
// Handle document uploads using base64 (similar to image uploads)
router.post('/document', async (req, res, next) => {
  try {
    const { documentBase64, mimeType, documentType, folder, fileName } = req.body || {};
    
    if (!documentBase64 || typeof documentBase64 !== 'string') {
      return res.status(400).json({ success: false, error: 'documentBase64 is required' });
    }

    const baseDir = path.join(__dirname, '..', 'uploads', 'user');
    const targetDir = folder
      ? path.join(baseDir, String(folder).replace(/[^a-zA-Z0-9/_-]/g, '_'))
      : path.join(baseDir, 'documents');
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Determine file extension from mimeType
    let ext = 'bin';
    if (mimeType) {
      if (mimeType.includes('pdf')) ext = 'pdf';
      else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
      else if (mimeType.includes('png')) ext = 'png';
      else ext = mimeType.split('/')[1] || 'bin';
    }

    const docType = documentType || 'document';
    const timestamp = Date.now();
    const safeName = fileName ? fileName.replace(/[^a-zA-Z0-9_.-]/g, '_') : `${docType}_${timestamp}`;
    const fullFileName = `${safeName}.${ext}`;
    const filePath = path.join(targetDir, fullFileName);

    // Handle base64 data (remove data URL prefix if present)
    const base64Data = documentBase64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);

    const publicPath = path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/');
    const url = `/${publicPath}`;

    console.log(`📄 Document uploaded: ${fullFileName} (${buffer.length} bytes)`);
    
    res.json({ 
      success: true, 
      url,
      fileName: fullFileName,
      size: buffer.length,
      mimeType: mimeType || 'application/octet-stream',
      documentType: docType
    });
  } catch (err) {
    console.error('Document upload error:', err);
    next(err);
  }
});

module.exports = router;
