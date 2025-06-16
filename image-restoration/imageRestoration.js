const sharp = require('sharp');
const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

class ImageRestoration {
  constructor() {
    this.supportedFormats = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.bmp', '.avif'];
    this.maxFileSize = 100 * 1024 * 1024; // 100MB
  }

  async getImageInfo(inputPath) {
    try {
      const image = sharp(inputPath);
      const metadata = await image.metadata();
      const stats = fs.statSync(inputPath);
      
      return {
        success: true,
        info: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          channels: metadata.channels,
          density: metadata.density,
          hasAlpha: metadata.hasAlpha,
          colorspace: metadata.space,
          fileSize: stats.size,
          fileSizeMB: (stats.size / (1024 * 1024)).toFixed(2)
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async enhanceImage(inputPath, outputPath, options = {}) {
    const {
      brightness = 1.0,
      contrast = 1.0,
      saturation = 1.0,
      sharpen = false,
      denoise = false,
      gamma = 1.0
    } = options;

    try {
      let image = sharp(inputPath);
      
      // Validate gamma range (Sharp expects 1.0-3.0)
      const validGamma = Math.max(1.0, Math.min(3.0, gamma));
      
      if (brightness !== 1.0 || contrast !== 1.0 || saturation !== 1.0) {
        image = image.modulate({
          brightness: brightness,
          saturation: saturation,
          hue: 0
        });
      }

      if (validGamma !== 1.0) {
        image = image.gamma(validGamma);
      }

      if (contrast !== 1.0) {
        image = image.linear(contrast, -(128 * contrast) + 128);
      }

      if (sharpen) {
        image = image.sharpen();
      }

      if (denoise) {
        image = image.median(3);
      }

      // Get metadata to determine output format
      const metadata = await image.metadata();
      const format = metadata.format;
      
      // Output in original format with high quality
      if (format === 'png') {
        await image.png({ quality: 95, compressionLevel: 6 }).toFile(outputPath);
      } else if (format === 'webp') {
        await image.webp({ quality: 95 }).toFile(outputPath);
      } else {
        await image.jpeg({ quality: 95, mozjpeg: true }).toFile(outputPath);
      }
      
      return { success: true, message: `Enhanced image saved to ${outputPath}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async upscaleImage(inputPath, outputPath, options = {}) {
    const {
      scale = 2,
      algorithm = 'lanczos3',
      maxWidth = 8000,
      maxHeight = 8000,
      enhanceAfterUpscale = true
    } = options;

    try {
      const image = sharp(inputPath);
      const metadata = await image.metadata();
      
      // Validate scale
      const validScale = Math.max(1.1, Math.min(8, scale));
      
      const newWidth = Math.min(Math.round(metadata.width * validScale), maxWidth);
      const newHeight = Math.min(Math.round(metadata.height * validScale), maxHeight);

      const resizeOptions = {
        width: newWidth,
        height: newHeight,
        kernel: algorithm,
        fit: 'fill'
      };

      let processedImage = image.resize(resizeOptions);
      
      if (enhanceAfterUpscale) {
        processedImage = processedImage
          .sharpen()
          .modulate({ brightness: 1.02, saturation: 1.05 });
      }
      
      // Output in original format
      const format = metadata.format;
      if (format === 'png') {
        await processedImage.png({ quality: 95, compressionLevel: 6 }).toFile(outputPath);
      } else if (format === 'webp') {
        await processedImage.webp({ quality: 95, effort: 6 }).toFile(outputPath);
      } else {
        await processedImage.jpeg({ quality: 95, mozjpeg: true }).toFile(outputPath);
      }

      return { 
        success: true, 
        message: `Upscaled image from ${metadata.width}x${metadata.height} to ${newWidth}x${newHeight}`,
        originalSize: `${metadata.width}x${metadata.height}`,
        newSize: `${newWidth}x${newHeight}`,
        scaleFactor: `${validScale.toFixed(1)}x`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async restoreImage(inputPath, outputPath, options = {}) {
    const defaultOptions = {
      brightness: 1.1,
      contrast: 1.2,
      saturation: 1.1,
      sharpen: true,
      denoise: true,
      gamma: 1.1,
      scale: 1.5,
      autoColorCorrection: true,
      preserveDetails: true
    };

    const mergedOptions = { ...defaultOptions, ...options };

    try {
      // Validate input
      const validation = await this.validateInputFile(inputPath);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const tempPath = outputPath.replace(/\.[^/.]+$/, '_temp$&');
      
      // Enhanced processing pipeline
      let result;
      
      if (mergedOptions.scale > 1) {
        // First upscale, then enhance for better quality
        const upscaleResult = await this.upscaleImage(inputPath, tempPath, {
          scale: mergedOptions.scale,
          enhanceAfterUpscale: false
        });
        
        if (!upscaleResult.success) {
          return upscaleResult;
        }
        
        result = await this.enhanceImage(tempPath, outputPath, mergedOptions);
        
        // Clean up temp file
        try {
          fs.unlinkSync(tempPath);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        
        if (result.success) {
          result.message = `Restored and upscaled image (${upscaleResult.scaleFactor}) saved to ${outputPath}`;
          result.originalSize = upscaleResult.originalSize;
          result.newSize = upscaleResult.newSize;
        }
      } else {
        result = await this.enhanceImage(inputPath, outputPath, mergedOptions);
      }
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async removeNoise(inputPath, outputPath, strength = 3) {
    try {
      const image = sharp(inputPath);
      const metadata = await image.metadata();
      
      // Validate strength
      const validStrength = Math.max(1, Math.min(10, strength));
      
      let processedImage = image;
      
      // Apply noise reduction based on strength
      if (validStrength <= 3) {
        processedImage = processedImage.median(validStrength);
      } else if (validStrength <= 6) {
        processedImage = processedImage
          .median(3)
          .blur(0.5)
          .sharpen();
      } else {
        processedImage = processedImage
          .median(3)
          .blur(0.8)
          .sharpen()
          .modulate({ brightness: 1.02 });
      }
      
      // Preserve original format
      const format = metadata.format;
      if (format === 'png') {
        await processedImage.png({ quality: 95 }).toFile(outputPath);
      } else if (format === 'webp') {
        await processedImage.webp({ quality: 95 }).toFile(outputPath);
      } else {
        await processedImage.jpeg({ quality: 95, mozjpeg: true }).toFile(outputPath);
      }

      return { 
        success: true, 
        message: `Noise removed (strength: ${validStrength}) and saved to ${outputPath}` 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async adjustColorBalance(inputPath, outputPath, options = {}) {
    const {
      temperature = 0,
      tint = 0,
      highlights = 0,
      shadows = 0,
      vibrance = 0
    } = options;

    try {
      const image = await Jimp.read(inputPath);
      
      if (temperature !== 0) {
        image.color([
          { apply: 'red', params: [temperature > 0 ? temperature * 10 : 0] },
          { apply: 'blue', params: [temperature < 0 ? Math.abs(temperature) * 10 : 0] }
        ]);
      }

      if (vibrance !== 0) {
        image.color([{ apply: 'saturate', params: [vibrance] }]);
      }

      if (highlights !== 0 || shadows !== 0) {
        image.brightness(shadows / 100).contrast(highlights / 100);
      }

      await image.quality(95).writeAsync(outputPath);
      return { success: true, message: `Color balance adjusted and saved to ${outputPath}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async validateInputFile(filePath) {
    if (!fs.existsSync(filePath)) {
      return { valid: false, error: 'File does not exist' };
    }

    const stats = fs.statSync(filePath);
    if (stats.size > this.maxFileSize) {
      return { 
        valid: false, 
        error: `File too large. Maximum size: ${this.maxFileSize / (1024 * 1024)}MB` 
      };
    }

    // For uploaded files without extensions, check using Sharp metadata
    try {
      const metadata = await sharp(filePath).metadata();
      const supportedSharpFormats = ['jpeg', 'png', 'webp', 'tiff', 'gif', 'avif', 'heif'];
      
      if (!supportedSharpFormats.includes(metadata.format)) {
        return { 
          valid: false, 
          error: `Unsupported format: ${metadata.format}. Supported formats: ${supportedSharpFormats.join(', ')}` 
        };
      }
    } catch (error) {
      // If Sharp can't read it, check file extension as fallback
      const ext = path.extname(filePath).toLowerCase();
      if (!this.supportedFormats.includes(ext)) {
        return { 
          valid: false, 
          error: `Unsupported format. Unable to process file.` 
        };
      }
    }

    return { valid: true };
  }

  async batchProcess(inputPaths, outputDir, operation, options = {}) {
    const results = [];
    
    for (const inputPath of inputPaths) {
      const validation = await this.validateInputFile(inputPath);
      if (!validation.valid) {
        results.push({ inputPath, success: false, error: validation.error });
        continue;
      }
      
      const fileName = path.basename(inputPath, path.extname(inputPath));
      const ext = path.extname(inputPath);
      const outputPath = path.join(outputDir, `${fileName}_${operation}${ext}`);
      
      let result;
      switch (operation) {
        case 'restore':
          result = await this.restoreImage(inputPath, outputPath, options);
          break;
        case 'enhance':
          result = await this.enhanceImage(inputPath, outputPath, options);
          break;
        case 'upscale':
          result = await this.upscaleImage(inputPath, outputPath, options);
          break;
        case 'denoise':
          result = await this.removeNoise(inputPath, outputPath, options.strength || 3);
          break;
        default:
          result = { success: false, error: 'Unknown operation' };
      }
      
      results.push({ inputPath, outputPath, ...result });
    }
    
    return results;
  }

  generateOutputPath(inputPath, suffix = '_restored') {
    const dir = path.dirname(inputPath);
    const name = path.basename(inputPath, path.extname(inputPath));
    const ext = path.extname(inputPath);
    return path.join(dir, `${name}${suffix}${ext}`);
  }

  async createThumbnail(inputPath, outputPath, size = 300) {
    try {
      const image = sharp(inputPath);
      const metadata = await image.metadata();
      
      await image
        .resize(size, size, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85 })
        .toFile(outputPath);
        
      return { 
        success: true, 
        message: `Thumbnail created at ${outputPath}`,
        originalSize: `${metadata.width}x${metadata.height}`,
        thumbnailSize: `${size}x${size} (max)` 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async convertFormat(inputPath, outputPath, targetFormat, quality = 95) {
    try {
      const image = sharp(inputPath);
      
      switch (targetFormat.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
          await image.jpeg({ quality, mozjpeg: true }).toFile(outputPath);
          break;
        case 'png':
          await image.png({ quality, compressionLevel: 6 }).toFile(outputPath);
          break;
        case 'webp':
          await image.webp({ quality, effort: 6 }).toFile(outputPath);
          break;
        case 'avif':
          await image.avif({ quality, effort: 4 }).toFile(outputPath);
          break;
        default:
          throw new Error(`Unsupported target format: ${targetFormat}`);
      }
      
      return { 
        success: true, 
        message: `Converted to ${targetFormat.toUpperCase()} and saved to ${outputPath}` 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export additional utility functions
ImageRestoration.supportedFormats = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.bmp', '.avif'];

ImageRestoration.getOptimalSettings = function(imageWidth, imageHeight, targetUse = 'general') {
  const megapixels = (imageWidth * imageHeight) / 1000000;
  
  const settings = {
    general: {
      brightness: 1.05,
      contrast: 1.1,
      saturation: 1.05,
      sharpen: true,
      scale: megapixels < 1 ? 2 : megapixels < 4 ? 1.5 : 1.2
    },
    print: {
      brightness: 1.02,
      contrast: 1.15,
      saturation: 1.1,
      sharpen: true,
      scale: megapixels < 2 ? 2.5 : megapixels < 8 ? 1.8 : 1.3
    },
    web: {
      brightness: 1.08,
      contrast: 1.12,
      saturation: 1.15,
      sharpen: true,
      scale: megapixels > 4 ? 0.8 : 1.2
    }
  };
  
  return settings[targetUse] || settings.general;
};

module.exports = ImageRestoration;