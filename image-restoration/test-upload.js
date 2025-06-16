const sharp = require('sharp');
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testUpload() {
    console.log('🧪 Testing image upload and processing...');
    
    try {
        // Create test image
        console.log('Creating test image...');
        const testImagePath = 'test-upload-image.jpg';
        
        await sharp({
            create: {
                width: 400,
                height: 300,
                channels: 3,
                background: { r: 255, g: 100, b: 100 }
            }
        })
        .jpeg({ quality: 80 })
        .toFile(testImagePath);
        
        console.log('✅ Test image created');
        
        // Test the upload
        const form = new FormData();
        form.append('image', fs.createReadStream(testImagePath));
        form.append('brightness', '1.2');
        form.append('contrast', '1.3');
        form.append('scale', '2.0');
        form.append('sharpen', 'true');
        form.append('denoise', 'true');
        
        console.log('Uploading to server...');
        
        const response = await fetch('http://localhost:3000/api/restore', {
            method: 'POST',
            body: form
        });
        
        const result = await response.json();
        
        console.log('Response status:', response.status);
        console.log('Response data:', result);
        
        if (result.success) {
            console.log('✅ Upload and processing successful!');
        } else {
            console.log('❌ Processing failed:', result.error);
        }
        
        // Cleanup
        if (fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Only run if form-data is available
try {
    require('form-data');
    require('node-fetch');
    testUpload();
} catch (e) {
    console.log('Install form-data and node-fetch to run upload test:');
    console.log('npm install form-data node-fetch');
}