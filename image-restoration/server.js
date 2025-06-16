const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');

const ImageRestoration = require('./imageRestoration');

class ImageRestorationServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.imageRestorer = new ImageRestoration();
        this.clients = new Set();
        this.port = process.env.PORT || 3000;
        
        this.setupDirectories();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
    }

    setupDirectories() {
        // Create necessary directories
        const dirs = ['uploads', 'outputs', 'temp'];
        dirs.forEach(dir => {
            const fullPath = path.join(__dirname, dir);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
                console.log(`Created directory: ${fullPath}`);
            }
        });
    }

    setupMiddleware() {
        // CORS
        this.app.use(cors());
        
        // JSON parsing
        this.app.use(express.json({ limit: '100mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '100mb' }));
        
        // Static files
        this.app.use(express.static('public'));
        this.app.use('/outputs', express.static('outputs'));
        
        // Multer for file uploads
        this.upload = multer({
            dest: 'uploads/',
            limits: {
                fileSize: 100 * 1024 * 1024 // 100MB
            },
            fileFilter: (req, file, cb) => {
                const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/bmp'];
                if (allowedTypes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new Error('Unsupported file type'), false);
                }
            }
        });
    }

    setupRoutes() {
        // Main routes
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        });

        // API Routes
        this.app.post('/api/restore', this.upload.single('image'), this.handleRestore.bind(this));
        this.app.post('/api/enhance', this.upload.single('image'), this.handleEnhance.bind(this));
        this.app.post('/api/upscale', this.upload.single('image'), this.handleUpscale.bind(this));
        this.app.post('/api/denoise', this.upload.single('image'), this.handleDenoise.bind(this));
        this.app.post('/api/color', this.upload.single('image'), this.handleColorBalance.bind(this));
        this.app.post('/api/format', this.upload.single('image'), this.handleFormatConversion.bind(this));
        this.app.post('/api/thumbnail', this.upload.single('image'), this.handleThumbnail.bind(this));
        this.app.post('/api/batch', this.upload.array('images', 50), this.handleBatch.bind(this));
        
        // Utility routes
        this.app.post('/api/info', this.upload.single('image'), this.handleImageInfo.bind(this));
        this.app.post('/api/download', this.handleDownload.bind(this));
        
        // Test endpoint
        this.app.get('/api/test', (req, res) => {
            res.json({ 
                success: true, 
                message: 'Server is working!', 
                timestamp: new Date().toISOString(),
                directories: {
                    uploads: fs.existsSync('uploads'),
                    outputs: fs.existsSync('outputs'),
                    temp: fs.existsSync('temp')
                }
            });
        });
        
        // Error handling
        this.app.use(this.errorHandler.bind(this));
    }

    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('Client connected to WebSocket');
            this.clients.add(ws);
            
            ws.on('close', () => {
                this.clients.delete(ws);
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.clients.delete(ws);
            });
        });
    }

    broadcastProgress(progress, message) {
        const data = JSON.stringify({
            type: 'progress',
            progress: progress,
            message: message
        });
        
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }

    broadcastStatus(message) {
        const data = JSON.stringify({
            type: 'status',
            message: message
        });
        
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }

    async handleRestore(req, res) {
        let uploadedFilePath = null;
        let outputPath = null;
        
        try {
            console.log('\n🔄 RESTORE REQUEST RECEIVED');
            console.log('📁 File:', req.file ? {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                filename: req.file.filename,
                path: req.file.path
            } : 'NO FILE');
            console.log('📋 Body:', req.body);
            
            if (!req.file) {
                console.log('❌ No file uploaded');
                return res.status(400).json({ success: false, error: 'No file uploaded' });
            }

            uploadedFilePath = req.file.path;
            console.log('📂 File path:', uploadedFilePath);
            console.log('📄 File exists:', fs.existsSync(uploadedFilePath));
            
            if (!fs.existsSync(uploadedFilePath)) {
                console.log('❌ Uploaded file not found at path');
                return res.status(400).json({ success: false, error: 'Uploaded file not found' });
            }

            const options = this.extractOptions(req.body);
            console.log('⚙️  Extracted options:', options);
            
            outputPath = this.generateOutputPath(req.file.filename, 'restored');
            console.log('📤 Output path:', outputPath);
            console.log('📁 Output dir exists:', fs.existsSync(path.dirname(outputPath)));
            
            // Ensure output directory exists
            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
                console.log('📁 Created output directory:', outputDir);
            }
            
            this.broadcastStatus('Starting restoration process...');
            this.broadcastProgress(10, 'Analyzing image...');
            
            console.log('🔄 Starting image restoration...');
            const result = await this.imageRestorer.restoreImage(uploadedFilePath, outputPath, options);
            console.log('✅ Restoration result:', result);
            
            if (result.success) {
                console.log('📤 Output file exists:', fs.existsSync(outputPath));
                if (fs.existsSync(outputPath)) {
                    const stats = fs.statSync(outputPath);
                    console.log('📊 Output file size:', stats.size, 'bytes');
                }
                
                this.broadcastProgress(100, 'Restoration complete!');
                
                // Get image info for response
                const info = await this.imageRestorer.getImageInfo(outputPath);
                console.log('📊 Image info:', info);
                
                const response = {
                    success: true,
                    message: result.message,
                    outputPath: `/outputs/${path.basename(outputPath)}`,
                    originalSize: result.originalSize,
                    newSize: result.newSize,
                    info: info.success ? info.info : null
                };
                
                console.log('📤 Sending response:', response);
                res.json(response);
            } else {
                console.log('❌ Restoration failed:', result);
                res.status(500).json(result);
            }
        } catch (error) {
            console.error('❌ RESTORE ERROR:', error);
            console.error('📋 Error stack:', error.stack);
            res.status(500).json({ success: false, error: error.message });
        } finally {
            // Cleanup uploaded file
            if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
                try {
                    fs.unlinkSync(uploadedFilePath);
                    console.log('🧹 Cleaned up uploaded file:', uploadedFilePath);
                } catch (cleanupError) {
                    console.error('⚠️  Failed to cleanup uploaded file:', cleanupError.message);
                }
            }
        }
    }

    async handleEnhance(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, error: 'No file uploaded' });
            }

            const options = this.extractOptions(req.body);
            const outputPath = this.generateOutputPath(req.file.filename, 'enhanced');
            
            this.broadcastStatus('Enhancing image...');
            this.broadcastProgress(20, 'Applying enhancements...');
            
            const result = await this.imageRestorer.enhanceImage(req.file.path, outputPath, options);
            
            if (result.success) {
                this.broadcastProgress(100, 'Enhancement complete!');
                res.json({
                    success: true,
                    message: result.message,
                    outputPath: `/outputs/${path.basename(outputPath)}`
                });
            } else {
                res.status(500).json(result);
            }
        } catch (error) {
            console.error('Enhance error:', error);
            res.status(500).json({ success: false, error: error.message });
        } finally {
            this.cleanupUpload(req.file);
        }
    }

    async handleUpscale(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, error: 'No file uploaded' });
            }

            const options = this.extractUpscaleOptions(req.body);
            const outputPath = this.generateOutputPath(req.file.filename, 'upscaled');
            
            this.broadcastStatus('Upscaling image...');
            this.broadcastProgress(30, 'Increasing resolution...');
            
            const result = await this.imageRestorer.upscaleImage(req.file.path, outputPath, options);
            
            if (result.success) {
                this.broadcastProgress(100, 'Upscaling complete!');
                res.json({
                    success: true,
                    message: result.message,
                    outputPath: `/outputs/${path.basename(outputPath)}`,
                    originalSize: result.originalSize,
                    newSize: result.newSize,
                    scaleFactor: result.scaleFactor
                });
            } else {
                res.status(500).json(result);
            }
        } catch (error) {
            console.error('Upscale error:', error);
            res.status(500).json({ success: false, error: error.message });
        } finally {
            this.cleanupUpload(req.file);
        }
    }

    async handleDenoise(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, error: 'No file uploaded' });
            }

            const strength = parseInt(req.body.strength) || 5;
            const outputPath = this.generateOutputPath(req.file.filename, 'denoised');
            
            this.broadcastStatus('Removing noise...');
            this.broadcastProgress(25, 'Analyzing noise patterns...');
            
            const result = await this.imageRestorer.removeNoise(req.file.path, outputPath, strength);
            
            if (result.success) {
                this.broadcastProgress(100, 'Noise removal complete!');
                res.json({
                    success: true,
                    message: result.message,
                    outputPath: `/outputs/${path.basename(outputPath)}`
                });
            } else {
                res.status(500).json(result);
            }
        } catch (error) {
            console.error('Denoise error:', error);
            res.status(500).json({ success: false, error: error.message });
        } finally {
            this.cleanupUpload(req.file);
        }
    }

    async handleColorBalance(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, error: 'No file uploaded' });
            }

            const options = this.extractColorOptions(req.body);
            const outputPath = this.generateOutputPath(req.file.filename, 'color_corrected');
            
            this.broadcastStatus('Adjusting colors...');
            this.broadcastProgress(35, 'Balancing color channels...');
            
            const result = await this.imageRestorer.adjustColorBalance(req.file.path, outputPath, options);
            
            if (result.success) {
                this.broadcastProgress(100, 'Color correction complete!');
                res.json({
                    success: true,
                    message: result.message,
                    outputPath: `/outputs/${path.basename(outputPath)}`
                });
            } else {
                res.status(500).json(result);
            }
        } catch (error) {
            console.error('Color balance error:', error);
            res.status(500).json({ success: false, error: error.message });
        } finally {
            this.cleanupUpload(req.file);
        }
    }

    async handleFormatConversion(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, error: 'No file uploaded' });
            }

            const targetFormat = req.body.format || 'jpeg';
            const quality = parseInt(req.body.quality) || 95;
            const outputPath = this.generateOutputPath(req.file.filename, `converted.${targetFormat}`);
            
            this.broadcastStatus('Converting format...');
            this.broadcastProgress(40, 'Converting to new format...');
            
            const result = await this.imageRestorer.convertFormat(req.file.path, outputPath, targetFormat, quality);
            
            if (result.success) {
                this.broadcastProgress(100, 'Format conversion complete!');
                res.json({
                    success: true,
                    message: result.message,
                    outputPath: `/outputs/${path.basename(outputPath)}`
                });
            } else {
                res.status(500).json(result);
            }
        } catch (error) {
            console.error('Format conversion error:', error);
            res.status(500).json({ success: false, error: error.message });
        } finally {
            this.cleanupUpload(req.file);
        }
    }

    async handleThumbnail(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, error: 'No file uploaded' });
            }

            const size = parseInt(req.body.size) || 300;
            const outputPath = this.generateOutputPath(req.file.filename, `thumbnail_${size}`);
            
            this.broadcastStatus('Creating thumbnail...');
            this.broadcastProgress(50, 'Generating thumbnail...');
            
            const result = await this.imageRestorer.createThumbnail(req.file.path, outputPath, size);
            
            if (result.success) {
                this.broadcastProgress(100, 'Thumbnail creation complete!');
                res.json({
                    success: true,
                    message: result.message,
                    outputPath: `/outputs/${path.basename(outputPath)}`,
                    originalSize: result.originalSize,
                    thumbnailSize: result.thumbnailSize
                });
            } else {
                res.status(500).json(result);
            }
        } catch (error) {
            console.error('Thumbnail error:', error);
            res.status(500).json({ success: false, error: error.message });
        } finally {
            this.cleanupUpload(req.file);
        }
    }

    async handleBatch(req, res) {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ success: false, error: 'No files uploaded' });
            }

            const operation = req.body.operation || 'restore';
            const options = this.extractOptions(req.body);
            const results = [];
            
            this.broadcastStatus(`Starting batch ${operation}...`);
            
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const progress = ((i + 1) / req.files.length) * 100;
                
                this.broadcastProgress(progress, `Processing ${i + 1} of ${req.files.length} images...`);
                
                try {
                    const outputPath = this.generateOutputPath(file.filename, `${operation}_${i}`);
                    let result;
                    
                    switch (operation) {
                        case 'restore':
                            result = await this.imageRestorer.restoreImage(file.path, outputPath, options);
                            break;
                        case 'enhance':
                            result = await this.imageRestorer.enhanceImage(file.path, outputPath, options);
                            break;
                        case 'upscale':
                            result = await this.imageRestorer.upscaleImage(file.path, outputPath, options);
                            break;
                        case 'denoise':
                            result = await this.imageRestorer.removeNoise(file.path, outputPath, options.strength || 5);
                            break;
                        default:
                            result = { success: false, error: 'Unknown operation' };
                    }
                    
                    if (result.success) {
                        result.outputPath = `/outputs/${path.basename(outputPath)}`;
                    }
                    
                    results.push({
                        filename: file.originalname,
                        ...result
                    });
                    
                } catch (error) {
                    results.push({
                        filename: file.originalname,
                        success: false,
                        error: error.message
                    });
                }
                
                // Cleanup individual file
                this.cleanupUpload(file);
            }
            
            this.broadcastProgress(100, 'Batch processing complete!');
            
            res.json({
                success: true,
                message: `Batch ${operation} completed`,
                results: results,
                processed: results.filter(r => r.success).length,
                total: results.length
            });
            
        } catch (error) {
            console.error('Batch processing error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async handleImageInfo(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, error: 'No file uploaded' });
            }

            const result = await this.imageRestorer.getImageInfo(req.file.path);
            res.json(result);
            
        } catch (error) {
            console.error('Image info error:', error);
            res.status(500).json({ success: false, error: error.message });
        } finally {
            this.cleanupUpload(req.file);
        }
    }

    handleDownload(req, res) {
        try {
            const { filePath, format, filename } = req.body;
            
            if (!filePath) {
                return res.status(400).json({ success: false, error: 'File path required' });
            }
            
            const fullPath = path.join(__dirname, 'outputs', path.basename(filePath));
            
            if (!fs.existsSync(fullPath)) {
                return res.status(404).json({ success: false, error: 'File not found' });
            }
            
            const downloadName = filename || path.basename(fullPath);
            res.download(fullPath, downloadName, (err) => {
                if (err) {
                    console.error('Download error:', err);
                    res.status(500).json({ success: false, error: 'Download failed' });
                }
            });
            
        } catch (error) {
            console.error('Download handler error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Helper methods
    extractOptions(body) {
        return {
            brightness: parseFloat(body.brightness) || 1.0,
            contrast: parseFloat(body.contrast) || 1.0,
            saturation: parseFloat(body.saturation) || 1.0,
            gamma: parseFloat(body.gamma) || 1.0,
            scale: parseFloat(body.scale) || 1.0,
            sharpen: body.sharpen === 'true',
            denoise: body.denoise === 'true'
        };
    }

    extractUpscaleOptions(body) {
        return {
            scale: parseFloat(body.scale) || 2.0,
            algorithm: body.algorithm || 'lanczos3',
            maxWidth: parseInt(body.maxWidth) || 8000,
            maxHeight: parseInt(body.maxHeight) || 8000,
            enhanceAfterUpscale: body.enhanceAfterUpscale !== 'false'
        };
    }

    extractColorOptions(body) {
        return {
            temperature: parseInt(body.temperature) || 0,
            tint: parseInt(body.tint) || 0,
            vibrance: parseInt(body.vibrance) || 0,
            exposure: parseInt(body.exposure) || 0,
            highlights: parseInt(body.highlights) || 0,
            shadows: parseInt(body.shadows) || 0
        };
    }

    generateOutputPath(filename, suffix) {
        const id = uuidv4().slice(0, 8);
        const ext = path.extname(filename) || '.jpg';
        return path.join(__dirname, 'outputs', `${suffix}_${id}${ext}`);
    }

    cleanupUpload(file) {
        if (file && file.path && fs.existsSync(file.path)) {
            try {
                fs.unlinkSync(file.path);
            } catch (error) {
                console.error('Failed to cleanup upload:', error);
            }
        }
    }

    errorHandler(error, req, res, next) {
        console.error('Server error:', error);
        
        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    error: 'File too large. Maximum size is 100MB.'
                });
            }
        }
        
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`🚀 AI Image Restoration Studio running on port ${this.port}`);
            console.log(`📱 Open http://localhost:${this.port} in your browser`);
            console.log(`🔌 WebSocket server ready for real-time updates`);
        });
    }

    // Cleanup old files periodically
    startCleanupSchedule() {
        setInterval(() => {
            this.cleanupOldFiles();
        }, 60 * 60 * 1000); // Every hour
    }

    cleanupOldFiles() {
        const dirs = ['uploads', 'outputs', 'temp'];
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        dirs.forEach(dir => {
            if (fs.existsSync(dir)) {
                fs.readdirSync(dir).forEach(file => {
                    const filePath = path.join(dir, file);
                    const stats = fs.statSync(filePath);
                    
                    if (Date.now() - stats.mtime.getTime() > maxAge) {
                        try {
                            fs.unlinkSync(filePath);
                            console.log(`Cleaned up old file: ${filePath}`);
                        } catch (error) {
                            console.error(`Failed to cleanup file: ${filePath}`, error);
                        }
                    }
                });
            }
        });
    }
}

// Start the server
const server = new ImageRestorationServer();
server.start();
server.startCleanupSchedule();

module.exports = ImageRestorationServer;