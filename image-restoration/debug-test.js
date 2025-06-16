const ImageRestoration = require('./imageRestoration');
const path = require('path');

async function debugTest() {
    console.log('🔍 Debug Test Starting...');
    
    try {
        const imageRestorer = new ImageRestoration();
        console.log('✅ ImageRestoration class instantiated successfully');
        
        // Check if methods exist
        const methods = ['enhanceImage', 'upscaleImage', 'restoreImage', 'getImageInfo', 'validateInputFile'];
        methods.forEach(method => {
            if (typeof imageRestorer[method] === 'function') {
                console.log(`✅ Method ${method} exists`);
            } else {
                console.log(`❌ Method ${method} missing`);
            }
        });
        
        // Test file validation
        const validation = imageRestorer.validateInputFile('nonexistent.jpg');
        console.log('✅ File validation works:', validation);
        
        // Test supported formats
        console.log('✅ Supported formats:', imageRestorer.supportedFormats);
        
        console.log('🎉 All basic tests passed!');
        
    } catch (error) {
        console.error('❌ Debug test failed:', error);
        console.error('Stack:', error.stack);
    }
}

debugTest();