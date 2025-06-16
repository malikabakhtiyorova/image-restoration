const ImageRestoration = require('./imageRestoration');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

async function debugServerIssues() {
    console.log('🔍 Debug Server Issues\n');
    
    try {
        // 1. Test ImageRestoration class
        console.log('1. Testing ImageRestoration class...');
        const imageRestorer = new ImageRestoration();
        console.log('✅ ImageRestoration instantiated');
        
        // 2. Create a test image
        console.log('\n2. Creating test image...');
        const testImagePath = path.join(__dirname, 'debug-test-image.jpg');
        
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
        
        console.log(`✅ Test image created: ${testImagePath}`);
        console.log(`   File exists: ${fs.existsSync(testImagePath)}`);
        
        // 3. Test file validation
        console.log('\n3. Testing file validation...');
        const validation = imageRestorer.validateInputFile(testImagePath);
        console.log(`   Validation result:`, validation);
        
        // 4. Test output path generation
        console.log('\n4. Testing output path generation...');
        const outputPath = path.join(__dirname, 'outputs', 'debug-restored.jpg');
        console.log(`   Output path: ${outputPath}`);
        console.log(`   Output dir exists: ${fs.existsSync(path.dirname(outputPath))}`);
        
        // 5. Test image info extraction
        console.log('\n5. Testing image info extraction...');
        const info = await imageRestorer.getImageInfo(testImagePath);
        console.log(`   Image info result:`, info);
        
        // 6. Test basic enhancement
        console.log('\n6. Testing basic enhancement...');
        const enhanceOptions = {
            brightness: 1.1,
            contrast: 1.2,
            saturation: 1.1,
            gamma: 1.1,
            sharpen: true,
            denoise: false
        };
        
        const enhanceResult = await imageRestorer.enhanceImage(testImagePath, outputPath, enhanceOptions);
        console.log(`   Enhancement result:`, enhanceResult);
        console.log(`   Output file exists: ${fs.existsSync(outputPath)}`);
        
        if (fs.existsSync(outputPath)) {
            const stats = fs.statSync(outputPath);
            console.log(`   Output file size: ${stats.size} bytes`);
        }
        
        // 7. Test full restoration
        console.log('\n7. Testing full restoration...');
        const restoreOutputPath = path.join(__dirname, 'outputs', 'debug-full-restored.jpg');
        const restoreOptions = {
            brightness: 1.1,
            contrast: 1.2,
            saturation: 1.1,
            scale: 1.5,
            sharpen: true,
            denoise: true
        };
        
        const restoreResult = await imageRestorer.restoreImage(testImagePath, restoreOutputPath, restoreOptions);
        console.log(`   Restoration result:`, restoreResult);
        console.log(`   Restore output exists: ${fs.existsSync(restoreOutputPath)}`);
        
        // 8. Check file permissions
        console.log('\n8. Checking file permissions...');
        const uploadsDir = path.join(__dirname, 'uploads');
        const outputsDir = path.join(__dirname, 'outputs');
        
        try {
            fs.accessSync(uploadsDir, fs.constants.W_OK);
            console.log(`✅ Uploads directory writable: ${uploadsDir}`);
        } catch (error) {
            console.log(`❌ Uploads directory not writable: ${error.message}`);
        }
        
        try {
            fs.accessSync(outputsDir, fs.constants.W_OK);
            console.log(`✅ Outputs directory writable: ${outputsDir}`);
        } catch (error) {
            console.log(`❌ Outputs directory not writable: ${error.message}`);
        }
        
        // 9. Clean up test files
        console.log('\n9. Cleaning up...');
        [testImagePath, outputPath, restoreOutputPath].forEach(file => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
                console.log(`   Removed: ${path.basename(file)}`);
            }
        });
        
        console.log('\n🎉 Debug complete!');
        
    } catch (error) {
        console.error('❌ Debug failed:', error);
        console.error('Stack trace:', error.stack);
    }
}

debugServerIssues();