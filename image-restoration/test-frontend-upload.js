const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function testFrontendUpload() {
    console.log('🧪 Testing Frontend Upload Simulation\n');
    
    try {
        // 1. Create test image (simulate user upload)
        console.log('1. Creating test image...');
        const testImagePath = path.join(__dirname, 'frontend-test-image.jpg');
        
        await sharp({
            create: {
                width: 800,
                height: 600,
                channels: 3,
                background: { r: 120, g: 180, b: 220 }
            }
        })
        .jpeg({ quality: 85 })
        .toFile(testImagePath);
        
        console.log(`✅ Test image created: ${testImagePath}`);
        console.log(`   File size: ${fs.statSync(testImagePath).size} bytes`);
        
        // 2. Test the FormData creation (what frontend does)
        console.log('\n2. Simulating FormData creation...');
        const FormData = require('form-data');
        const form = new FormData();
        
        // Add the image file
        form.append('image', fs.createReadStream(testImagePath), {
            filename: 'test-image.jpg',
            contentType: 'image/jpeg'
        });
        
        // Add form parameters (what sliders send)
        form.append('brightness', '1.2');
        form.append('contrast', '1.3');
        form.append('saturation', '1.1');
        form.append('scale', '2.0');
        form.append('sharpen', 'true');
        form.append('denoise', 'true');
        
        console.log('✅ FormData prepared with image and parameters');
        
        // 3. Start server in background for testing
        console.log('\n3. Starting server for testing...');
        const { spawn } = require('child_process');
        const serverProcess = spawn('node', ['server.js'], {
            detached: false,
            stdio: ['ignore', 'pipe', 'pipe']
        });
        
        // Wait for server to start
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 4. Test the upload
        console.log('\n4. Testing upload to server...');
        const fetch = require('node-fetch');
        
        try {
            const response = await fetch('http://localhost:3000/api/restore', {
                method: 'POST',
                body: form,
                headers: form.getHeaders()
            });
            
            console.log(`   Response status: ${response.status}`);
            console.log(`   Response headers:`, Object.fromEntries(response.headers));
            
            const result = await response.text();
            console.log(`   Raw response: ${result.substring(0, 500)}...`);
            
            try {
                const jsonResult = JSON.parse(result);
                console.log(`   Parsed response:`, jsonResult);
                
                if (jsonResult.success) {
                    console.log('✅ Upload and processing successful!');
                    console.log(`   Output path: ${jsonResult.outputPath}`);
                    
                    // Check if output file exists
                    const outputFilePath = path.join(__dirname, 'outputs', path.basename(jsonResult.outputPath));
                    console.log(`   Checking output file: ${outputFilePath}`);
                    console.log(`   Output file exists: ${fs.existsSync(outputFilePath)}`);
                    
                    if (fs.existsSync(outputFilePath)) {
                        const stats = fs.statSync(outputFilePath);
                        console.log(`   Output file size: ${stats.size} bytes`);
                    }
                } else {
                    console.log('❌ Processing failed:', jsonResult.error);
                }
            } catch (parseError) {
                console.log('❌ Failed to parse JSON response:', parseError.message);
            }
            
        } catch (fetchError) {
            console.log('❌ Fetch error:', fetchError.message);
        }
        
        // 5. Cleanup
        console.log('\n5. Cleaning up...');
        serverProcess.kill();
        
        if (fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath);
            console.log('   Removed test image');
        }
        
        console.log('\n🎉 Frontend upload test complete!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    }
}

// Check if required packages are available
try {
    require('form-data');
    require('node-fetch');
    testFrontendUpload();
} catch (e) {
    console.log('❌ Missing dependencies. Install with:');
    console.log('npm install form-data node-fetch');
}