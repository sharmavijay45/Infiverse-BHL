# Cloudinary Integration for Employee Monitoring System

## Overview

The employee monitoring system now uses **Cloudinary** as the primary storage solution for violation screenshots, providing:

- ✅ **Scalable cloud storage** - No local disk space limitations
- ✅ **Automatic optimization** - Dynamic image resizing and compression
- ✅ **Enhanced security** - Private access with signed URLs
- ✅ **Better performance** - Global CDN delivery
- ✅ **Organized storage** - Structured folder hierarchy
- ✅ **Cost efficiency** - Pay-as-you-use pricing

## Current Storage Locations

### **Before Cloudinary Integration:**
```
./uploads/employee_data/
├── {employeeId}/
│   ├── screens/                    # Regular screenshots
│   │   └── {YYYY-MM-DD}/
│   │       └── screen_{timestamp}_{count}.jpg
│   └── intelligent_captures/       # Violation screenshots
│       └── {YYYY-MM-DD}/
│           └── violation_{timestamp}_{sequence}.jpg
```

### **After Cloudinary Integration:**
```
Cloudinary Cloud Storage:
├── employee-monitoring/
│   ├── violations/
│   │   └── {employeeId}/
│   │       └── {YYYY-MM-DD}/
│   │           └── violation_{timestamp}_{hash}.jpg
│   └── regular/
│       └── {employeeId}/
│           └── {YYYY-MM-DD}/
│               └── screen_{timestamp}_{hash}.jpg
```

## Key Features Implemented

### **1. Intelligent Storage Management**
- **Primary Storage**: Cloudinary (cloud-based)
- **Backup Storage**: Local files (optional, disabled by default)
- **Automatic Migration**: Script to move existing local files to Cloudinary

### **2. Enhanced Security**
- **Private Access**: Screenshots stored with private access mode
- **Signed URLs**: Secure, time-limited access to images
- **Organized Tagging**: Screenshots tagged by employee, date, and violation type

### **3. Performance Optimization**
- **Dynamic Resizing**: Generate thumbnails and optimized sizes on-demand
- **Format Optimization**: Automatic format selection (WebP, AVIF, etc.)
- **Quality Control**: Automatic quality optimization based on content

### **4. Advanced Metadata**
- **Context Information**: Employee ID, violation type, application, URL
- **AI Analysis Data**: Confidence scores and analysis results
- **Storage Statistics**: File sizes, formats, and usage tracking

## Environment Configuration

### **Required Environment Variables:**
```bash
# Cloudinary Configuration (Already in .env)
CLOUDINARY_CLOUD_NAME=dfqrz8kcp
CLOUDINARY_API_KEY=824115926461583
CLOUDINARY_API_SECRET=rYr1LffJL5OgFtQrkVjQTFPDCxI

# Storage Configuration
ENABLE_LOCAL_BACKUP=false                # Disable local file backup
CLOUDINARY_STORAGE_ENABLED=true          # Enable Cloudinary storage
```

## API Endpoints

### **1. Enhanced Screenshot Serving**
```
GET /api/monitoring/screenshots/:screenshotId
Query Parameters:
  - width: Desired width (e.g., 800)
  - height: Desired height (e.g., 600)
  - quality: Image quality (auto:good, auto:eco, etc.)

Response: Redirects to optimized Cloudinary URL
```

### **2. Cloudinary-Optimized Endpoint**
```
GET /api/monitoring/cloudinary-screenshots/:employeeId
Query Parameters:
  - date: Specific date (YYYY-MM-DD)
  - limit: Number of screenshots (default: 50)

Response: JSON with optimized Cloudinary URLs
```

## Database Schema Updates

### **Enhanced ScreenCapture Model:**
```javascript
{
  // Existing fields...
  file_path: String,              // Cloudinary URL or local path
  file_size: Number,              // File size from Cloudinary
  
  metadata: {
    // Existing metadata...
    
    // New Cloudinary fields
    cloudinary_url: String,       // Secure Cloudinary URL
    cloudinary_public_id: String, // Cloudinary public ID
    cloudinary_version: String,   // Version for cache busting
    storage_type: String,         // 'cloudinary' or 'local'
    local_backup_enabled: Boolean // Whether local backup exists
  }
}
```

## Migration Process

### **1. Automatic Migration for New Screenshots**
- All new violation screenshots automatically upload to Cloudinary
- Local backup optional (disabled by default for production)
- Database records include Cloudinary metadata

### **2. Existing Screenshot Migration**
```bash
# Dry run to see what would be migrated
node scripts/migrateScreenshotsToCloudinary.js --dry-run

# Migrate violation screenshots only (recommended)
node scripts/migrateScreenshotsToCloudinary.js

# Migrate all screenshots
node scripts/migrateScreenshotsToCloudinary.js --all

# Migrate and delete local files
node scripts/migrateScreenshotsToCloudinary.js --delete-local --cleanup
```

## Storage Benefits

### **Cost Comparison:**
- **Local Storage**: Fixed server costs + backup costs
- **Cloudinary**: Pay-per-use (typically $0.10-0.20 per GB/month)
- **Bandwidth**: Included in Cloudinary pricing vs. server bandwidth costs

### **Performance Benefits:**
- **Global CDN**: Faster image delivery worldwide
- **Automatic Optimization**: Reduced bandwidth usage
- **Dynamic Resizing**: No need to store multiple sizes
- **Format Selection**: Automatic WebP/AVIF for supported browsers

### **Operational Benefits:**
- **No Disk Management**: No server disk space concerns
- **Automatic Backups**: Cloudinary handles redundancy
- **Scalability**: Handles unlimited storage growth
- **Monitoring**: Built-in usage analytics

## Security Features

### **Access Control:**
- **Private Storage**: Images not publicly accessible
- **Signed URLs**: Time-limited access tokens
- **Employee-Specific**: Organized by employee ID
- **Admin-Only Access**: Only admins can generate access URLs

### **Data Protection:**
- **Encryption in Transit**: HTTPS for all transfers
- **Encryption at Rest**: Cloudinary handles encryption
- **Access Logging**: Track who accesses what images
- **Retention Policies**: Automatic cleanup of old images

## Monitoring and Analytics

### **Storage Statistics:**
```javascript
// Get storage usage statistics
const stats = await getStorageStatistics();
// Returns: violation count, regular count, formats, sizes
```

### **Cleanup Operations:**
```javascript
// Clean up old violation screenshots (90+ days)
const result = await cleanupOldViolationScreenshots(90);
// Returns: { deleted: count, details: {...} }
```

## Troubleshooting

### **Common Issues:**

1. **Cloudinary Upload Fails**
   - Check API credentials in .env
   - Verify network connectivity
   - Check Cloudinary account limits

2. **Images Not Loading**
   - Verify signed URL generation
   - Check private access permissions
   - Ensure correct public_id format

3. **Migration Errors**
   - Run with --dry-run first
   - Check local file permissions
   - Verify database connectivity

### **Monitoring Commands:**
```bash
# Check Cloudinary configuration
node -e "console.log(require('./utils/cloudinary'))"

# Test upload functionality
node scripts/testCloudinaryUpload.js

# View migration status
node scripts/migrateScreenshotsToCloudinary.js --dry-run
```

## Production Deployment

### **Recommended Settings:**
```bash
# Production .env settings
ENABLE_LOCAL_BACKUP=false
CLOUDINARY_STORAGE_ENABLED=true
SCREENSHOT_STORAGE_PATH=./uploads/employee_data  # For migration only
```

### **Deployment Steps:**
1. ✅ Update environment variables
2. ✅ Deploy updated code
3. ✅ Run migration script for existing screenshots
4. ✅ Monitor Cloudinary usage and costs
5. ✅ Clean up local files after successful migration

The system now provides enterprise-grade screenshot storage with Cloudinary integration! 🎉
