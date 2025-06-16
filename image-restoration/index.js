#!/usr/bin/env node

const { Command } = require('commander');
const ImageRestoration = require('./imageRestoration');
const path = require('path');

const program = new Command();
const imageRestorer = new ImageRestoration();

program
  .name('image-restoration')
  .description('CLI tool for image restoration, enhancement, and upscaling')
  .version('1.0.0');

program
  .command('restore')
  .description('Restore an image with automatic enhancement and upscaling')
  .argument('<input>', 'Input image file path')
  .option('-o, --output <path>', 'Output file path (optional)')
  .option('-s, --scale <number>', 'Upscale factor (default: 1.5)', '1.5')
  .option('-b, --brightness <number>', 'Brightness adjustment (default: 1.1)', '1.1')
  .option('-c, --contrast <number>', 'Contrast adjustment (default: 1.2)', '1.2')
  .option('--no-sharpen', 'Disable sharpening')
  .option('--no-denoise', 'Disable noise reduction')
  .action(async (input, options) => {
    const validation = imageRestorer.validateInputFile(input);
    if (!validation.valid) {
      console.error(`Error: ${validation.error}`);
      process.exit(1);
    }

    const outputPath = options.output || imageRestorer.generateOutputPath(input, '_restored');
    
    const restoreOptions = {
      scale: parseFloat(options.scale),
      brightness: parseFloat(options.brightness),
      contrast: parseFloat(options.contrast),
      sharpen: options.sharpen !== false,
      denoise: options.denoise !== false
    };

    console.log(`Restoring image: ${input}`);
    console.log(`Output will be saved to: ${outputPath}`);
    
    const result = await imageRestorer.restoreImage(input, outputPath, restoreOptions);
    
    if (result.success) {
      console.log(`✅ ${result.message}`);
      if (result.originalSize && result.newSize) {
        console.log(`📏 Size: ${result.originalSize} → ${result.newSize}`);
      }
    } else {
      console.error(`❌ Error: ${result.error}`);
      process.exit(1);
    }
  });

program
  .command('enhance')
  .description('Enhance image quality without upscaling')
  .argument('<input>', 'Input image file path')
  .option('-o, --output <path>', 'Output file path (optional)')
  .option('-b, --brightness <number>', 'Brightness adjustment (default: 1.0)', '1.0')
  .option('-c, --contrast <number>', 'Contrast adjustment (default: 1.0)', '1.0')
  .option('-s, --saturation <number>', 'Saturation adjustment (default: 1.0)', '1.0')
  .option('-g, --gamma <number>', 'Gamma correction (default: 1.0)', '1.0')
  .option('--sharpen', 'Apply sharpening filter')
  .option('--denoise', 'Apply noise reduction')
  .action(async (input, options) => {
    const validation = imageRestorer.validateInputFile(input);
    if (!validation.valid) {
      console.error(`Error: ${validation.error}`);
      process.exit(1);
    }

    const outputPath = options.output || imageRestorer.generateOutputPath(input, '_enhanced');
    
    const enhanceOptions = {
      brightness: parseFloat(options.brightness),
      contrast: parseFloat(options.contrast),
      saturation: parseFloat(options.saturation),
      gamma: parseFloat(options.gamma),
      sharpen: options.sharpen || false,
      denoise: options.denoise || false
    };

    console.log(`Enhancing image: ${input}`);
    
    const result = await imageRestorer.enhanceImage(input, outputPath, enhanceOptions);
    
    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.error(`❌ Error: ${result.error}`);
      process.exit(1);
    }
  });

program
  .command('upscale')
  .description('Upscale image resolution')
  .argument('<input>', 'Input image file path')
  .option('-o, --output <path>', 'Output file path (optional)')
  .option('-s, --scale <number>', 'Upscale factor (default: 2)', '2')
  .option('-a, --algorithm <type>', 'Resize algorithm (lanczos3, lanczos2, cubic, mitchell)', 'lanczos3')
  .option('--max-width <number>', 'Maximum output width (default: 4000)', '4000')
  .option('--max-height <number>', 'Maximum output height (default: 4000)', '4000')
  .action(async (input, options) => {
    const validation = imageRestorer.validateInputFile(input);
    if (!validation.valid) {
      console.error(`Error: ${validation.error}`);
      process.exit(1);
    }

    const outputPath = options.output || imageRestorer.generateOutputPath(input, '_upscaled');
    
    const upscaleOptions = {
      scale: parseFloat(options.scale),
      algorithm: options.algorithm,
      maxWidth: parseInt(options.maxWidth),
      maxHeight: parseInt(options.maxHeight)
    };

    console.log(`Upscaling image: ${input} (${upscaleOptions.scale}x)`);
    
    const result = await imageRestorer.upscaleImage(input, outputPath, upscaleOptions);
    
    if (result.success) {
      console.log(`✅ ${result.message}`);
      console.log(`📏 Size: ${result.originalSize} → ${result.newSize}`);
    } else {
      console.error(`❌ Error: ${result.error}`);
      process.exit(1);
    }
  });

program
  .command('denoise')
  .description('Remove noise from image')
  .argument('<input>', 'Input image file path')
  .option('-o, --output <path>', 'Output file path (optional)')
  .option('-s, --strength <number>', 'Noise reduction strength (1-10, default: 3)', '3')
  .action(async (input, options) => {
    const validation = imageRestorer.validateInputFile(input);
    if (!validation.valid) {
      console.error(`Error: ${validation.error}`);
      process.exit(1);
    }

    const outputPath = options.output || imageRestorer.generateOutputPath(input, '_denoised');
    const strength = parseInt(options.strength);

    console.log(`Removing noise from: ${input}`);
    
    const result = await imageRestorer.removeNoise(input, outputPath, strength);
    
    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.error(`❌ Error: ${result.error}`);
      process.exit(1);
    }
  });

program
  .command('color')
  .description('Adjust color balance and temperature')
  .argument('<input>', 'Input image file path')
  .option('-o, --output <path>', 'Output file path (optional)')
  .option('-t, --temperature <number>', 'Color temperature (-100 to 100, default: 0)', '0')
  .option('--tint <number>', 'Tint adjustment (-100 to 100, default: 0)', '0')
  .option('--vibrance <number>', 'Vibrance adjustment (-100 to 100, default: 0)', '0')
  .option('--highlights <number>', 'Highlights adjustment (-100 to 100, default: 0)', '0')
  .option('--shadows <number>', 'Shadows adjustment (-100 to 100, default: 0)', '0')
  .action(async (input, options) => {
    const validation = imageRestorer.validateInputFile(input);
    if (!validation.valid) {
      console.error(`Error: ${validation.error}`);
      process.exit(1);
    }

    const outputPath = options.output || imageRestorer.generateOutputPath(input, '_color_adjusted');
    
    const colorOptions = {
      temperature: parseInt(options.temperature),
      tint: parseInt(options.tint),
      vibrance: parseInt(options.vibrance),
      highlights: parseInt(options.highlights),
      shadows: parseInt(options.shadows)
    };

    console.log(`Adjusting color balance: ${input}`);
    
    const result = await imageRestorer.adjustColorBalance(input, outputPath, colorOptions);
    
    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.error(`❌ Error: ${result.error}`);
      process.exit(1);
    }
  });

program.parse();