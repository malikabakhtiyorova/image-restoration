// AI Image Restoration Studio - Frontend Application
class ImageRestorationApp {
    constructor() {
        this.currentImage = null;
        this.currentSection = 'home';
        this.isProcessing = false;
        this.websocket = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.setupAnimations();
        this.setupFileHandling();
        this.setupSliders();
        this.setupImageComparison();
        this.connectWebSocket();
        
        // Initialize first section
        this.showSection('home');
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
            });
        });

        // Hero buttons
        document.querySelector('[data-action="get-started"]')?.addEventListener('click', () => {
            this.showSection('restore');
        });

        document.querySelector('[data-action="demo"]')?.addEventListener('click', () => {
            this.showDemo();
        });

        // Tool cards
        document.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('click', () => {
                const tool = card.dataset.tool;
                this.openTool(tool);
            });
        });

        // File input
        document.getElementById('fileInput')?.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });

        // Upload zone
        const uploadZone = document.getElementById('uploadZone');
        if (uploadZone) {
            uploadZone.addEventListener('click', () => {
                document.getElementById('fileInput').click();
            });

            uploadZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadZone.classList.add('dragover');
            });

            uploadZone.addEventListener('dragleave', () => {
                uploadZone.classList.remove('dragover');
            });

            uploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadZone.classList.remove('dragover');
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    this.handleFileSelect(file);
                }
            });
        }

        // Control buttons
        document.getElementById('restoreBtn')?.addEventListener('click', () => {
            this.processImage('restore');
        });

        document.getElementById('resetBtn')?.addEventListener('click', () => {
            this.resetControls();
        });

        document.getElementById('downloadBtn')?.addEventListener('click', () => {
            this.downloadResult();
        });

        // Preset buttons
        document.querySelectorAll('[data-preset]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.applyPreset(btn.dataset.preset);
            });
        });

        // View controls
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchView(btn.dataset.view);
            });
        });

        // Modal close
        document.getElementById('closeModal')?.addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal on backdrop click
        document.getElementById('toolModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'toolModal') {
                this.closeModal();
            }
        });
    }

    // Navigation
    setupNavigation() {
        // Update active nav link
        this.updateActiveNavLink = (section) => {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.dataset.section === section) {
                    link.classList.add('active');
                }
            });
        };
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        document.getElementById(sectionName)?.classList.add('active');
        
        // Update navigation
        this.updateActiveNavLink(sectionName);
        this.currentSection = sectionName;

        // Trigger animations
        this.triggerSectionAnimations(sectionName);
    }

    // Animations
    setupAnimations() {
        // Intersection Observer for scroll animations
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, { threshold: 0.1 });

        // Observe all animatable elements
        document.querySelectorAll('[data-animate]').forEach(el => {
            this.observer.observe(el);
        });
    }

    triggerSectionAnimations(section) {
        // Reset and trigger animations for the current section
        const sectionEl = document.getElementById(section);
        if (sectionEl) {
            const animatables = sectionEl.querySelectorAll('[data-animate]');
            animatables.forEach((el, index) => {
                el.classList.remove('animate');
                setTimeout(() => {
                    el.classList.add('animate');
                }, index * 100);
            });
        }
    }

    // File Handling
    setupFileHandling() {
        this.supportedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/bmp'];
        this.maxFileSize = 100 * 1024 * 1024; // 100MB
    }

    handleFileSelect(file) {
        if (!file) return;

        // Validate file
        if (!this.supportedFormats.includes(file.type)) {
            this.showNotification('error', 'Unsupported Format', 'Please select a valid image file (JPEG, PNG, WebP, TIFF, BMP)');
            return;
        }

        if (file.size > this.maxFileSize) {
            this.showNotification('error', 'File Too Large', 'Please select a file smaller than 100MB');
            return;
        }

        // Show upload progress
        this.showUploadProgress();

        // Create file reader
        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentImage = {
                file: file,
                data: e.target.result,
                name: file.name,
                size: file.size,
                type: file.type
            };

            this.displayUploadedImage();
            this.showControls();
            this.hideUploadProgress();
        };

        reader.readAsDataURL(file);
    }

    showUploadProgress() {
        document.querySelector('.upload-content').style.display = 'none';
        document.getElementById('uploadProgress').style.display = 'block';
        
        // Simulate progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            this.updateProgress(progress, 'uploadProgress');
        }, 100);
    }

    hideUploadProgress() {
        document.getElementById('uploadProgress').style.display = 'none';
        document.querySelector('.upload-content').style.display = 'block';
    }

    displayUploadedImage() {
        const uploadZone = document.getElementById('uploadZone');
        uploadZone.style.background = `url(${this.currentImage.data}) center/cover`;
        uploadZone.style.border = '2px solid var(--primary-color)';
        
        // Update upload text
        const uploadContent = uploadZone.querySelector('.upload-content');
        uploadContent.innerHTML = `
            <div class="upload-icon" style="color: var(--secondary-color);">
                <i class="fas fa-check-circle"></i>
            </div>
            <h3>${this.currentImage.name}</h3>
            <p>File size: ${this.formatFileSize(this.currentImage.size)}</p>
            <div class="supported-formats">Click to select a different image</div>
        `;
    }

    showControls() {
        document.getElementById('controlsPanel').style.display = 'block';
        document.getElementById('controlsPanel').scrollIntoView({ behavior: 'smooth' });
    }

    // Sliders
    setupSliders() {
        document.querySelectorAll('input[type="range"]').forEach(slider => {
            const valueDisplay = slider.parentNode.querySelector('.slider-value');
            
            slider.addEventListener('input', () => {
                let value = slider.value;
                if (slider.id === 'scale') {
                    value += 'x';
                }
                valueDisplay.textContent = value;
                
                // Real-time preview (debounced)
                clearTimeout(this.previewTimeout);
                this.previewTimeout = setTimeout(() => {
                    if (this.currentImage && !this.isProcessing) {
                        this.updatePreview();
                    }
                }, 500);
            });
        });
    }

    resetControls() {
        // Reset all sliders to default values
        document.getElementById('brightness').value = 1.1;
        document.getElementById('contrast').value = 1.2;
        document.getElementById('saturation').value = 1.1;
        document.getElementById('scale').value = 1.5;
        
        // Reset checkboxes
        document.getElementById('sharpen').checked = true;
        document.getElementById('denoise').checked = true;
        
        // Update displays
        this.updateSliderDisplays();
        
        this.showNotification('info', 'Controls Reset', 'All settings have been reset to default values');
    }

    updateSliderDisplays() {
        document.querySelectorAll('input[type="range"]').forEach(slider => {
            const valueDisplay = slider.parentNode.querySelector('.slider-value');
            let value = slider.value;
            if (slider.id === 'scale') {
                value += 'x';
            }
            valueDisplay.textContent = value;
        });
    }

    applyPreset(preset) {
        const presets = {
            general: { brightness: 1.05, contrast: 1.1, saturation: 1.05, scale: 1.5 },
            print: { brightness: 1.02, contrast: 1.15, saturation: 1.1, scale: 2.0 },
            web: { brightness: 1.08, contrast: 1.12, saturation: 1.15, scale: 1.2 }
        };

        const settings = presets[preset];
        if (settings) {
            Object.keys(settings).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    element.value = settings[key];
                }
            });
            
            this.updateSliderDisplays();
            this.showNotification('success', 'Preset Applied', `${preset.charAt(0).toUpperCase() + preset.slice(1)} settings applied`);
        }
    }

    // Image Processing
    async processImage(operation) {
        if (!this.currentImage || this.isProcessing) return;

        this.isProcessing = true;
        this.showProcessingModal(operation);

        const formData = new FormData();
        formData.append('image', this.currentImage.file);
        
        // Get current settings
        const settings = this.getCurrentSettings();
        Object.keys(settings).forEach(key => {
            formData.append(key, settings[key]);
        });

        try {
            const startTime = Date.now();
            
            const response = await fetch(`/api/${operation}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const result = await response.json();
            const processingTime = Date.now() - startTime;

            if (result.success) {
                await this.displayResult(result, processingTime);
                this.showNotification('success', 'Processing Complete', `Image ${operation} completed successfully`);
            } else {
                throw new Error(result.error || 'Processing failed');
            }

        } catch (error) {
            console.error('Processing error:', error);
            this.showNotification('error', 'Processing Failed', error.message);
        } finally {
            this.isProcessing = false;
            this.hideProcessingModal();
        }
    }

    getCurrentSettings() {
        return {
            brightness: parseFloat(document.getElementById('brightness').value),
            contrast: parseFloat(document.getElementById('contrast').value),
            saturation: parseFloat(document.getElementById('saturation').value),
            scale: parseFloat(document.getElementById('scale').value),
            sharpen: document.getElementById('sharpen').checked,
            denoise: document.getElementById('denoise').checked
        };
    }

    async displayResult(result, processingTime) {
        // Show results panel
        document.getElementById('resultsPanel').style.display = 'block';
        
        // Set images
        document.getElementById('originalImage').src = this.currentImage.data;
        document.getElementById('restoredImage').src = result.outputPath;
        document.getElementById('sliderOriginal').src = this.currentImage.data;
        document.getElementById('sliderRestored').src = result.outputPath;
        
        // Update info
        document.getElementById('processingTime').textContent = `${(processingTime / 1000).toFixed(1)}s`;
        document.getElementById('sizeChange').textContent = result.sizeChange || 'N/A';
        document.getElementById('qualityScore').textContent = this.calculateQualityScore();
        
        // Store result for download
        this.currentResult = result;
        
        // Scroll to results
        document.getElementById('resultsPanel').scrollIntoView({ behavior: 'smooth' });
    }

    calculateQualityScore() {
        // Simulate quality score based on settings
        const settings = this.getCurrentSettings();
        let score = 85;
        
        if (settings.scale > 2) score += 5;
        if (settings.sharpen) score += 3;
        if (settings.denoise) score += 2;
        
        return Math.min(100, score) + '%';
    }

    // Image Comparison
    setupImageComparison() {
        // Slider comparison
        const sliderHandle = document.querySelector('.slider-handle');
        if (sliderHandle) {
            let isDragging = false;
            
            sliderHandle.addEventListener('mousedown', () => {
                isDragging = true;
                document.body.style.cursor = 'ew-resize';
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                
                const slider = document.querySelector('.slider-view');
                const rect = slider.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
                
                sliderHandle.style.left = percentage + '%';
                document.getElementById('sliderRestored').style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
            });
            
            document.addEventListener('mouseup', () => {
                isDragging = false;
                document.body.style.cursor = 'default';
            });
        }
    }

    switchView(view) {
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        document.getElementById('comparisonView').style.display = view === 'comparison' ? 'grid' : 'none';
        document.getElementById('sliderView').style.display = view === 'slider' ? 'block' : 'none';
    }

    // Download
    async downloadResult() {
        if (!this.currentResult) return;

        const format = document.getElementById('downloadFormat').value;
        
        try {
            const response = await fetch(`/api/download`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filePath: this.currentResult.outputPath,
                    format: format,
                    filename: this.currentImage.name
                })
            });

            if (!response.ok) {
                throw new Error('Download failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `restored_${this.currentImage.name}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            this.showNotification('success', 'Download Complete', 'Your restored image has been downloaded');

        } catch (error) {
            this.showNotification('error', 'Download Failed', error.message);
        }
    }

    // Tools
    openTool(tool) {
        const toolModal = document.getElementById('toolModal');
        const toolTitle = document.getElementById('toolTitle');
        const toolContent = document.getElementById('toolContent');
        
        toolTitle.textContent = this.getToolTitle(tool);
        toolContent.innerHTML = this.getToolContent(tool);
        
        toolModal.classList.add('active');
        
        // Setup tool-specific functionality
        this.setupToolFunctionality(tool);
    }

    getToolTitle(tool) {
        const titles = {
            upscale: 'Image Upscaling',
            denoise: 'Noise Reduction',
            color: 'Color Correction',
            format: 'Format Converter',
            thumbnail: 'Thumbnail Generator',
            batch: 'Batch Processing'
        };
        return titles[tool] || 'Tool';
    }

    getToolContent(tool) {
        // Return tool-specific HTML content
        switch (tool) {
            case 'upscale':
                return this.getUpscaleToolContent();
            case 'denoise':
                return this.getDenoiseToolContent();
            case 'color':
                return this.getColorToolContent();
            case 'format':
                return this.getFormatToolContent();
            case 'thumbnail':
                return this.getThumbnailToolContent();
            case 'batch':
                return this.getBatchToolContent();
            default:
                return '<p>Tool content not available</p>';
        }
    }

    getUpscaleToolContent() {
        return `
            <div class="tool-workspace">
                <div class="tool-upload">
                    <input type="file" id="toolFileInput" accept="image/*" hidden>
                    <div class="upload-zone" onclick="document.getElementById('toolFileInput').click()">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <p>Select image to upscale</p>
                    </div>
                </div>
                <div class="tool-controls">
                    <div class="control-group">
                        <label>Scale Factor</label>
                        <input type="range" min="1.1" max="8" step="0.1" value="2" id="toolScale">
                        <span class="slider-value">2x</span>
                    </div>
                    <div class="control-group">
                        <label>Algorithm</label>
                        <select id="toolAlgorithm">
                            <option value="lanczos3">Lanczos3 (Best Quality)</option>
                            <option value="cubic">Cubic</option>
                            <option value="mitchell">Mitchell</option>
                        </select>
                    </div>
                    <button class="btn btn-primary" onclick="app.processTool('upscale')">
                        <i class="fas fa-expand-arrows-alt"></i> Upscale Image
                    </button>
                </div>
            </div>
        `;
    }

    getDenoiseToolContent() {
        return `
            <div class="tool-workspace">
                <div class="tool-upload">
                    <input type="file" id="toolFileInput" accept="image/*" hidden>
                    <div class="upload-zone" onclick="document.getElementById('toolFileInput').click()">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <p>Select image to denoise</p>
                    </div>
                </div>
                <div class="tool-controls">
                    <div class="control-group">
                        <label>Noise Reduction Strength</label>
                        <input type="range" min="1" max="10" step="1" value="5" id="toolStrength">
                        <span class="slider-value">5</span>
                    </div>
                    <button class="btn btn-primary" onclick="app.processTool('denoise')">
                        <i class="fas fa-shield-alt"></i> Remove Noise
                    </button>
                </div>
            </div>
        `;
    }

    getColorToolContent() {
        return `
            <div class="tool-workspace">
                <div class="tool-upload">
                    <input type="file" id="toolFileInput" accept="image/*" hidden>
                    <div class="upload-zone" onclick="document.getElementById('toolFileInput').click()">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <p>Select image for color correction</p>
                    </div>
                </div>
                <div class="tool-controls">
                    <div class="controls-grid">
                        <div class="control-group">
                            <label>Temperature</label>
                            <input type="range" min="-100" max="100" step="5" value="0" id="toolTemperature">
                            <span class="slider-value">0</span>
                        </div>
                        <div class="control-group">
                            <label>Vibrance</label>
                            <input type="range" min="-100" max="100" step="5" value="0" id="toolVibrance">
                            <span class="slider-value">0</span>
                        </div>
                        <div class="control-group">
                            <label>Exposure</label>
                            <input type="range" min="-100" max="100" step="5" value="0" id="toolExposure">
                            <span class="slider-value">0</span>
                        </div>
                        <div class="control-group">
                            <label>Highlights</label>
                            <input type="range" min="-100" max="100" step="5" value="0" id="toolHighlights">
                            <span class="slider-value">0</span>
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="app.processTool('color')">
                        <i class="fas fa-palette"></i> Adjust Colors
                    </button>
                </div>
            </div>
        `;
    }

    getFormatToolContent() {
        return `
            <div class="tool-workspace">
                <div class="tool-upload">
                    <input type="file" id="toolFileInput" accept="image/*" hidden>
                    <div class="upload-zone" onclick="document.getElementById('toolFileInput').click()">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <p>Select image to convert</p>
                    </div>
                </div>
                <div class="tool-controls">
                    <div class="control-group">
                        <label>Output Format</label>
                        <select id="toolFormat">
                            <option value="jpeg">JPEG</option>
                            <option value="png">PNG</option>
                            <option value="webp">WebP</option>
                            <option value="avif">AVIF</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <label>Quality</label>
                        <input type="range" min="10" max="100" step="5" value="95" id="toolQuality">
                        <span class="slider-value">95%</span>
                    </div>
                    <button class="btn btn-primary" onclick="app.processTool('format')">
                        <i class="fas fa-exchange-alt"></i> Convert Format
                    </button>
                </div>
            </div>
        `;
    }

    getThumbnailToolContent() {
        return `
            <div class="tool-workspace">
                <div class="tool-upload">
                    <input type="file" id="toolFileInput" accept="image/*" hidden>
                    <div class="upload-zone" onclick="document.getElementById('toolFileInput').click()">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <p>Select image for thumbnail</p>
                    </div>
                </div>
                <div class="tool-controls">
                    <div class="control-group">
                        <label>Thumbnail Size</label>
                        <select id="toolThumbnailSize">
                            <option value="150">150x150</option>
                            <option value="300" selected>300x300</option>
                            <option value="500">500x500</option>
                            <option value="800">800x800</option>
                        </select>
                    </div>
                    <button class="btn btn-primary" onclick="app.processTool('thumbnail')">
                        <i class="fas fa-images"></i> Create Thumbnail
                    </button>
                </div>
            </div>
        `;
    }

    getBatchToolContent() {
        return `
            <div class="tool-workspace">
                <div class="tool-upload">
                    <input type="file" id="toolBatchInput" accept="image/*" multiple hidden>
                    <div class="upload-zone" onclick="document.getElementById('toolBatchInput').click()">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <p>Select multiple images</p>
                        <small>Hold Ctrl/Cmd to select multiple files</small>
                    </div>
                </div>
                <div class="tool-controls">
                    <div class="control-group">
                        <label>Operation</label>
                        <select id="toolBatchOperation">
                            <option value="restore">Restore</option>
                            <option value="enhance">Enhance</option>
                            <option value="upscale">Upscale</option>
                            <option value="denoise">Denoise</option>
                        </select>
                    </div>
                    <button class="btn btn-primary" onclick="app.processTool('batch')">
                        <i class="fas fa-layer-group"></i> Process Batch
                    </button>
                </div>
                <div id="batchProgress" style="display: none;">
                    <div class="progress-info">
                        <span id="batchProgressText">Processing 0 of 0 images...</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="batchProgressBar"></div>
                    </div>
                </div>
            </div>
        `;
    }

    setupToolFunctionality(tool) {
        // Setup sliders in tool modal
        const toolModal = document.getElementById('toolModal');
        toolModal.querySelectorAll('input[type="range"]').forEach(slider => {
            const valueDisplay = slider.parentNode.querySelector('.slider-value');
            
            slider.addEventListener('input', () => {
                let value = slider.value;
                if (slider.id === 'toolScale') {
                    value += 'x';
                } else if (slider.id === 'toolQuality') {
                    value += '%';
                }
                valueDisplay.textContent = value;
            });
        });

        // Setup file input for tool
        const toolFileInput = document.getElementById('toolFileInput') || document.getElementById('toolBatchInput');
        if (toolFileInput) {
            toolFileInput.addEventListener('change', (e) => {
                this.handleToolFileSelect(e.target.files, tool);
            });
        }
    }

    handleToolFileSelect(files, tool) {
        if (tool === 'batch') {
            this.displayBatchFiles(files);
        } else {
            const file = files[0];
            if (file) {
                this.displayToolFile(file);
            }
        }
    }

    displayToolFile(file) {
        const uploadZone = document.querySelector('#toolModal .upload-zone');
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadZone.style.background = `url(${e.target.result}) center/cover`;
            uploadZone.innerHTML = `
                <div style="background: rgba(0,0,0,0.8); padding: 1rem; border-radius: 8px;">
                    <i class="fas fa-check-circle" style="color: var(--secondary-color);"></i>
                    <p style="margin: 0.5rem 0;">${file.name}</p>
                    <small>Click to select different image</small>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }

    displayBatchFiles(files) {
        const uploadZone = document.querySelector('#toolModal .upload-zone');
        uploadZone.innerHTML = `
            <i class="fas fa-check-circle" style="color: var(--secondary-color); font-size: 2rem;"></i>
            <p>${files.length} image${files.length > 1 ? 's' : ''} selected</p>
            <small>Click to select different images</small>
        `;
    }

    async processTool(tool) {
        const fileInput = document.getElementById('toolFileInput') || document.getElementById('toolBatchInput');
        const file = fileInput && fileInput.files ? fileInput.files[0] : null;
        
        if (!file && tool !== 'batch') {
            this.showNotification('error', 'No File Selected', 'Please select an image file first');
            return;
        }

        if (tool === 'batch' && (!fileInput || !fileInput.files || fileInput.files.length === 0)) {
            this.showNotification('error', 'No Files Selected', 'Please select image files for batch processing');
            return;
        }

        this.showNotification('info', 'Processing', `${tool} operation started`);
        this.showProcessingModal(tool);

        try {
            const formData = new FormData();
            
            if (tool === 'batch') {
                // Handle batch processing
                for (let i = 0; i < fileInput.files.length; i++) {
                    formData.append('images', fileInput.files[i]);
                }
                formData.append('operation', document.getElementById('toolBatchOperation')?.value || 'restore');
            } else {
                formData.append('image', file);
                
                // Add tool-specific parameters
                this.addToolParameters(formData, tool);
            }

            const endpoint = tool === 'batch' ? '/api/batch' : `/api/${tool}`;
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.showToolResult(result, tool);
                this.showNotification('success', 'Complete', `${tool} operation completed successfully`);
            } else {
                throw new Error(result.error || 'Processing failed');
            }

        } catch (error) {
            console.error('Tool processing error:', error);
            this.showNotification('error', 'Processing Failed', error.message);
        } finally {
            this.hideProcessingModal();
        }
    }

    addToolParameters(formData, tool) {
        switch (tool) {
            case 'upscale':
                const scale = document.getElementById('toolScale')?.value || '2';
                const algorithm = document.getElementById('toolAlgorithm')?.value || 'lanczos3';
                formData.append('scale', scale);
                formData.append('algorithm', algorithm);
                break;
                
            case 'denoise':
                const strength = document.getElementById('toolStrength')?.value || '5';
                formData.append('strength', strength);
                break;
                
            case 'color':
                const temperature = document.getElementById('toolTemperature')?.value || '0';
                const vibrance = document.getElementById('toolVibrance')?.value || '0';
                const exposure = document.getElementById('toolExposure')?.value || '0';
                const highlights = document.getElementById('toolHighlights')?.value || '0';
                formData.append('temperature', temperature);
                formData.append('vibrance', vibrance);
                formData.append('exposure', exposure);
                formData.append('highlights', highlights);
                break;
                
            case 'format':
                const format = document.getElementById('toolFormat')?.value || 'jpeg';
                const quality = document.getElementById('toolQuality')?.value || '95';
                formData.append('format', format);
                formData.append('quality', quality);
                break;
                
            case 'thumbnail':
                const size = document.getElementById('toolThumbnailSize')?.value || '300';
                formData.append('size', size);
                break;
        }
    }

    showToolResult(result, tool) {
        // Create result display element
        const resultContainer = document.createElement('div');
        resultContainer.className = 'tool-result';
        resultContainer.innerHTML = `
            <div class="result-header">
                <h3><i class="fas fa-check-circle"></i> ${this.getToolTitle(tool)} Complete</h3>
                <button class="btn btn-secondary" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="result-content">
                ${this.getResultContent(result, tool)}
            </div>
            <div class="result-actions">
                <button class="btn btn-primary" onclick="app.downloadToolResult('${result.outputPath || result.results?.[0]?.outputPath}', '${tool}')">
                    <i class="fas fa-download"></i> Download
                </button>
                <button class="btn btn-secondary" onclick="app.viewToolResult('${result.outputPath || result.results?.[0]?.outputPath}')">
                    <i class="fas fa-eye"></i> View
                </button>
            </div>
        `;

        // Insert result into tool modal
        const toolContent = document.getElementById('toolContent');
        toolContent.appendChild(resultContainer);
        
        // Scroll to result
        resultContainer.scrollIntoView({ behavior: 'smooth' });
    }

    getResultContent(result, tool) {
        if (tool === 'batch') {
            const successCount = result.processed || 0;
            const totalCount = result.total || 0;
            return `
                <div class="batch-summary">
                    <div class="stat">
                        <span class="stat-number">${successCount}</span>
                        <span class="stat-label">Processed</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${totalCount}</span>
                        <span class="stat-label">Total</span>
                    </div>
                </div>
                <div class="batch-results">
                    ${result.results.map(r => `
                        <div class="batch-item ${r.success ? 'success' : 'error'}">
                            <span class="filename">${r.filename}</span>
                            <span class="status">${r.success ? 'Success' : 'Failed'}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            return `
                <div class="result-image-container">
                    <img src="${result.outputPath}" alt="Processed result" class="result-image">
                </div>
                <div class="result-info">
                    <p><strong>Message:</strong> ${result.message}</p>
                    ${result.originalSize ? `<p><strong>Original Size:</strong> ${result.originalSize}</p>` : ''}
                    ${result.newSize ? `<p><strong>New Size:</strong> ${result.newSize}</p>` : ''}
                    ${result.scaleFactor ? `<p><strong>Scale Factor:</strong> ${result.scaleFactor}</p>` : ''}
                </div>
            `;
        }
    }

    async downloadToolResult(outputPath, tool) {
        if (!outputPath) return;
        
        try {
            const response = await fetch('/api/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filePath: outputPath,
                    filename: `${tool}_result.jpg`
                })
            });

            if (!response.ok) {
                throw new Error('Download failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${tool}_result.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            this.showNotification('success', 'Download Complete', 'Result downloaded successfully');

        } catch (error) {
            this.showNotification('error', 'Download Failed', error.message);
        }
    }

    viewToolResult(outputPath) {
        if (!outputPath) return;
        
        // Open result in new window/tab
        window.open(outputPath, '_blank');
    }

    closeModal() {
        document.getElementById('toolModal').classList.remove('active');
    }

    // WebSocket for real-time updates
    connectWebSocket() {
        try {
            this.websocket = new WebSocket(`ws://${window.location.host}`);
            
            this.websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleWebSocketMessage(data);
            };
            
            this.websocket.onclose = () => {
                // Reconnect after 5 seconds
                setTimeout(() => this.connectWebSocket(), 5000);
            };
        } catch (error) {
            console.log('WebSocket connection failed:', error);
        }
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'progress':
                this.updateProgress(data.progress, 'processingProgress');
                document.getElementById('processingPercent').textContent = `${Math.round(data.progress)}%`;
                break;
            case 'status':
                document.getElementById('processingDescription').textContent = data.message;
                break;
            case 'complete':
                this.hideProcessingModal();
                break;
        }
    }

    // UI Helpers
    showProcessingModal(operation) {
        const modal = document.getElementById('processingModal');
        document.getElementById('processingTitle').textContent = `Processing ${operation}...`;
        document.getElementById('processingDescription').textContent = 'Initializing processing pipeline...';
        document.getElementById('processingProgress').style.width = '0%';
        document.getElementById('processingPercent').textContent = '0%';
        modal.classList.add('active');
    }

    hideProcessingModal() {
        document.getElementById('processingModal').classList.remove('active');
    }

    updateProgress(progress, elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.width = `${progress}%`;
        }
    }

    showNotification(type, title, message) {
        const container = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        }[type];
        
        notification.innerHTML = `
            <div class="notification-content">
                <i class="${icon} notification-icon"></i>
                <div class="notification-text">
                    <div class="notification-title">${title}</div>
                    <div class="notification-message">${message}</div>
                </div>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'fadeInRight 0.3s ease-out reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    showDemo() {
        this.showNotification('info', 'Demo Mode', 'Demo functionality coming soon!');
    }

    updatePreview() {
        // Implement real-time preview if needed
        console.log('Updating preview with current settings...');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}

// Initialize the application
const app = new ImageRestorationApp();

// Expose app globally for tool functions
window.app = app;