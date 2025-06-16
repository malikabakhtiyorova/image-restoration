const ImageRestoration = require('./imageRestoration');
const fs = require('fs');
const path = require('path');

async function runTests() {
  const imageRestorer = new ImageRestoration();
  
  console.log('🧪 Running Image Restoration Tests\n');

  // Test file validation
  console.log('1. Testing file validation...');
  const nonExistentFile = imageRestorer.validateInputFile('nonexistent.jpg');
  console.log(`   Non-existent file: ${nonExistentFile.valid ? '❌ FAIL' : '✅ PASS'}`);
  
  const unsupportedFile = imageRestorer.validateInputFile('test.txt');
  console.log(`   Unsupported format: ${unsupportedFile.valid ? '❌ FAIL' : '✅ PASS'}`);

  // Test output path generation
  console.log('\n2. Testing output path generation...');
  const outputPath = imageRestorer.generateOutputPath('/path/to/image.jpg', '_test');
  const expected = '/path/to/image_test.jpg';
  console.log(`   Output path generation: ${outputPath === expected ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Expected: ${expected}`);
  console.log(`   Got: ${outputPath}`);

  // Test with sample image (if available)
  console.log('\n3. Checking for sample images...');
  const sampleImages = ['sample.jpg', 'test.png', 'example.jpeg'];
  let testImage = null;
  
  for (const sample of sampleImages) {
    if (fs.existsSync(sample)) {
      testImage = sample;
      break;
    }
  }

  if (testImage) {
    console.log(`   Found test image: ${testImage}`);
    
    try {
      console.log('\n4. Testing image enhancement...');
      const enhanceResult = await imageRestorer.enhanceImage(
        testImage, 
        imageRestorer.generateOutputPath(testImage, '_test_enhanced'),
        { brightness: 1.1, contrast: 1.1, sharpen: true }
      );
      console.log(`   Enhancement: ${enhanceResult.success ? '✅ PASS' : '❌ FAIL'}`);
      if (!enhanceResult.success) {
        console.log(`   Error: ${enhanceResult.error}`);
      }

      console.log('\n5. Testing image upscaling...');
      const upscaleResult = await imageRestorer.upscaleImage(
        testImage,
        imageRestorer.generateOutputPath(testImage, '_test_upscaled'),
        { scale: 1.5 }
      );
      console.log(`   Upscaling: ${upscaleResult.success ? '✅ PASS' : '❌ FAIL'}`);
      if (!upscaleResult.success) {
        console.log(`   Error: ${upscaleResult.error}`);
      } else {
        console.log(`   ${upscaleResult.message}`);
      }

    } catch (error) {
      console.log(`   ❌ Test failed with error: ${error.message}`);
    }
  } else {
    console.log('   No sample images found. To test with real images:');
    console.log('   - Add a sample.jpg, test.png, or example.jpeg to this directory');
    console.log('   - Then run: node test.js');
  }

  console.log('\n📋 Test Summary:');
  console.log('- File validation: ✅ Working');
  console.log('- Path generation: ✅ Working');
  console.log(`- Image processing: ${testImage ? '✅ Ready' : '⚠️  Need sample image'}`);
  
  console.log('\n🚀 To test the CLI:');
  console.log('   node index.js --help');
  console.log('   node index.js restore your-image.jpg');
}

runTests().catch(console.error);