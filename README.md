# 🎨 AI Image Restoration Studio - Frontend

A modern, interactive web application for professional image restoration, enhancement, and upscaling with real-time progress tracking and beautiful animations developed as a course project for American University of Technology by Malika Bakhtiyorova.

## 🚀 Features

### 🎯 **Core Functionality**
- **AI Image Restoration** - Automatic enhancement with intelligent algorithms
- **Smart Upscaling** - Up to 8x resolution increase with quality preservation
- **Advanced Enhancement** - Brightness, contrast, saturation, gamma controls
- **Noise Reduction** - Intelligent noise removal with adjustable strength
- **Color Correction** - Temperature, tint, vibrance, and exposure adjustments
- **Format Conversion** - Convert between JPEG, PNG, WebP, AVIF formats
- **Thumbnail Generation** - Create optimized thumbnails
- **Batch Processing** - Process multiple images simultaneously

### 🎨 **User Interface**
- **Modern Dark Theme** - Professional, eye-friendly design
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **Smooth Animations** - Fluid transitions and micro-interactions
- **Interactive Elements** - Hover effects, animated buttons, and loading states
- **Real-time Progress** - Live processing updates via WebSocket
- **Before/After Comparison** - Side-by-side and slider comparison views

### 🛠 **Advanced Tools**
- **Professional Controls** - Fine-tune every aspect of image processing
- **Preset Settings** - Optimized settings for General, Print, and Web use
- **Drag & Drop Upload** - Intuitive file handling with preview
- **Live Preview** - Real-time preview of adjustments
- **Download Options** - Multiple format export with quality settings

## 🎬 **Interactive Elements**

### **Hero Section**
- Animated floating card with demo transformation
- Gradient text effects and smooth hover animations
- Call-to-action buttons with shimmer effects

### **Navigation**
- Smooth section transitions with fade animations
- Active state indicators with animated dots
- Responsive mobile navigation

### **Upload Zone**
- Drag & drop with visual feedback
- Animated upload progress with shimmer effects
- File validation with helpful error messages
- Image preview with overlay information

### **Control Panels**
- Animated sliders with real-time value display
- Toggle switches with smooth transitions
- Preset buttons with loading animations
- Reset functionality with confirmation

### **Image Comparison**
- **Comparison View** - Side-by-side before/after display
- **Slider View** - Interactive slider to reveal changes
- **Zoom & Pan** - Detailed examination capabilities
- **Info Display** - Processing time, size changes, quality scores

### **Processing Modal**
- Animated spinner with pulsing dots
- Real-time progress bar with shimmer effect
- Status updates via WebSocket connection
- Smooth modal transitions

### **Tool Modals**
- Individual tools with specialized interfaces
- Contextual controls for each operation
- Live parameter adjustment
- Dedicated processing workflows

### **Notification System**
- Toast notifications with animations
- Success, error, and info states
- Auto-dismiss with slide animations
- Action feedback for all operations

## 🎨 **Design Features**

### **Color Scheme**
```css
Primary: #6366f1 (Indigo)
Secondary: #10b981 (Emerald)
Background: #0f0f23 (Dark Blue)
Surface: #1a1a2e (Dark Purple)
Accent: #8b5cf6 (Purple)
```

### **Typography**
- **Inter Font Family** - Clean, modern typeface
- **Responsive Text Sizing** - Scales beautifully across devices
- **Gradient Text Effects** - Eye-catching headers and accents

### **Animations**
- **Entrance Animations** - `fadeInUp`, `fadeInLeft`, `fadeInRight`
- **Hover Effects** - Scale, glow, and color transitions
- **Loading States** - Spinners, progress bars, and skeleton screens
- **Micro-interactions** - Button presses, slider movements, toggle switches

### **Layout**
- **CSS Grid & Flexbox** - Modern, responsive layouts
- **Container Queries** - Adaptive components
- **Smooth Scrolling** - Elegant navigation between sections

## 🚀 **Getting Started**

### **Installation**
```bash
# Clone the repository
cd image-restoration

# Install dependencies
npm install

# Start the server
`npm start`
```

### **Access the Application**
```
🌐 Web Interface: http://localhost:3000
🔌 WebSocket: ws://localhost:3000/ws
```

### **Usage**
1. **Upload Image** - Drag & drop or click to select
2. **Choose Operation** - Restore, Enhance, or use specific tools
3. **Adjust Settings** - Use sliders and toggles for fine control
4. **Process Image** - Watch real-time progress updates
5. **Compare Results** - View before/after with comparison tools
6. **Download** - Save in your preferred format

## 🎛 **Control Features**

### **Restoration Controls**
- **Brightness** (0.5 - 2.0) - Lighten or darken image
- **Contrast** (0.5 - 2.0) - Increase or decrease contrast
- **Saturation** (0.5 - 2.0) - Adjust color intensity
- **Scale Factor** (1.0 - 4.0) - Upscaling amount
- **Sharpen Toggle** - Apply intelligent sharpening
- **Denoise Toggle** - Remove noise and grain

### **Preset Options**
- **General** - Balanced settings for everyday photos
- **Print** - Optimized for high-quality printing
- **Web** - Perfect for online use and social media

### **Advanced Tools**
- **Upscaling** - Dedicated resolution enhancement
- **Noise Reduction** - Specialized noise removal
- **Color Correction** - Professional color grading
- **Format Conversion** - File format optimization
- **Thumbnail Creation** - Generate preview images
- **Batch Processing** - Bulk image operations

## 📱 **Responsive Design**

### **Desktop (1200px+)**
- Full-width hero section with side-by-side layout
- Multi-column feature grids
- Advanced control panels with detailed settings

### **Tablet (768px - 1199px)**
- Stacked hero layout with centered content
- Two-column feature grids
- Compact control panels

### **Mobile (< 768px)**
- Single-column layouts throughout
- Touch-optimized controls and buttons
- Simplified navigation with icons
- Full-screen modals and overlays

## 🔄 **Real-time Features**

### **WebSocket Integration**
- Live progress updates during processing
- Real-time status messages
- Instant error notifications
- Automatic reconnection on disconnect

### **Progressive Enhancement**
- Works without JavaScript (basic functionality)
- Enhanced experience with full JS support
- Graceful degradation for older browsers

## 🎨 **Animation Details**

### **CSS Animations**
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

### **Interactive Elements**
- **Button Hover** - Scale up with glow effect
- **Card Hover** - Lift with shadow increase
- **Slider Interaction** - Smooth value transitions
- **Toggle Animation** - Sliding switch effect

## 🛡️ **Error Handling**

### **User-Friendly Messages**
- Clear error descriptions
- Helpful suggestions for resolution
- Visual feedback for all actions
- Graceful fallbacks for failed operations

### **Validation**
- File type checking (JPEG, PNG, WebP, TIFF, BMP, AVIF)
- File size limits (100MB maximum)
- Real-time form validation
- Progressive image loading

## 🎯 **Performance Features**

### **Optimization**
- Lazy loading for images
- Progressive image enhancement
- Efficient WebSocket management
- Automatic cleanup of temporary files

### **Caching**
- Static asset caching
- Intelligent image caching
- Service worker ready (for PWA)

## 🔧 **Browser Support**
- Chrome/Chromium 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 📁 **File Structure**
```
public/
├── index.html      # Main HTML structure
├── styles.css      # Complete CSS with animations
└── app.js          # Frontend JavaScript application

server.js           # Express.js backend with WebSocket
imageRestoration.js # Core image processing engine
```

## 🎉 **Key Highlights**

✨ **Modern UI/UX** - Beautiful, intuitive interface
🚀 **Real-time Processing** - Live progress updates
🎨 **Professional Tools** - Advanced image enhancement
📱 **Fully Responsive** - Works on all devices
⚡ **High Performance** - Optimized for speed
🛡️ **Error Handling** - Robust and user-friendly
🎯 **Batch Processing** - Handle multiple images
🔄 **Format Support** - All major image formats

Your AI Image Restoration Studio is now ready with a stunning, interactive frontend that provides a professional-grade user experience! 🎨✨
