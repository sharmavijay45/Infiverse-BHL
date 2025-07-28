# Employee Monitoring System - Deployment Guide

## Cross-Platform Compatibility

### Supported Platforms

#### ✅ Windows (Fully Supported)
- Uses `tasklist` command for browser detection
- Supports all major browsers (Chrome, Firefox, Edge, Opera, Brave)
- No additional dependencies required

#### ✅ Linux (Supported with Dependencies)
- Uses `xdotool` and `wmctrl` for window detection
- Requires additional packages to be installed
- Fallback methods available if tools are not installed

**Required Linux Packages:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install xdotool wmctrl

# CentOS/RHEL/Fedora
sudo yum install xdotool wmctrl
# or
sudo dnf install xdotool wmctrl

# Arch Linux
sudo pacman -S xdotool wmctrl
```

#### ✅ macOS (Supported)
- Uses AppleScript for window detection
- No additional dependencies required
- Built-in system APIs

#### ⚠️ Other Platforms
- Graceful fallback to disable browser monitoring
- System continues to function without browser detection
- Other monitoring features remain active

## Performance Configuration

### Environment Variables

```bash
# Browser Detection Performance
BROWSER_CHECK_INTERVAL=5000        # Check browser every 5 seconds
WEBSITE_MONITORING_INTERVAL=8000   # Process website data every 8 seconds
ACTIVITY_FLUSH_INTERVAL=30000      # Save to database every 30 seconds

# Caching and Rate Limiting
BROWSER_CACHE_TIMEOUT=2000         # Cache results for 2 seconds
BROWSER_RATE_LIMIT=1000           # Minimum 1 second between checks

# Feature Toggles
BROWSER_MONITORING_ENABLED=true    # Enable/disable browser monitoring
AI_ANALYSIS_ENABLED=true          # Enable/disable AI analysis
ENABLE_PERFORMANCE_LOGS=false     # Enable detailed performance logging
```

### Recommended Production Settings

#### Small Deployment (1-10 employees)
```bash
BROWSER_CHECK_INTERVAL=5000
WEBSITE_MONITORING_INTERVAL=8000
ACTIVITY_FLUSH_INTERVAL=30000
```

#### Medium Deployment (10-50 employees)
```bash
BROWSER_CHECK_INTERVAL=7000
WEBSITE_MONITORING_INTERVAL=10000
ACTIVITY_FLUSH_INTERVAL=45000
```

#### Large Deployment (50+ employees)
```bash
BROWSER_CHECK_INTERVAL=10000
WEBSITE_MONITORING_INTERVAL=15000
ACTIVITY_FLUSH_INTERVAL=60000
```

## Deployment Steps

### 1. Server Preparation

#### Linux Server Setup
```bash
# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install required packages for browser detection
sudo apt-get install xdotool wmctrl

# Install PM2 for process management
sudo npm install -g pm2
```

#### Windows Server Setup
```bash
# Install Node.js from https://nodejs.org/
# No additional packages required

# Install PM2 for process management
npm install -g pm2
```

### 2. Application Deployment

```bash
# Clone and setup application
git clone <your-repo-url>
cd server

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit environment variables
nano .env
```

### 3. Environment Configuration

```bash
# Required variables
MONGODB_URI=mongodb://your-mongodb-server:27017/workflow-management
JWT_SECRET=your-super-secure-jwt-secret
PORT=5000

# Platform-specific optimization
BROWSER_CHECK_INTERVAL=7000  # Adjust based on server load
WEBSITE_MONITORING_INTERVAL=10000
ACTIVITY_FLUSH_INTERVAL=45000

# Security
CORS_ORIGIN=https://your-frontend-domain.com
```

### 4. Production Start

```bash
# Start with PM2
pm2 start index.js --name "employee-monitoring"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## Performance Monitoring

### Key Metrics to Monitor

1. **CPU Usage**: Should remain below 10% per employee
2. **Memory Usage**: ~50MB base + ~5MB per active employee
3. **Database Connections**: Monitor MongoDB connection pool
4. **Response Times**: API endpoints should respond within 200ms

### Performance Optimization Tips

1. **Adjust Intervals**: Increase intervals for better performance
2. **Enable Caching**: Use Redis for session caching in large deployments
3. **Database Indexing**: Ensure proper indexes on frequently queried fields
4. **Load Balancing**: Use multiple server instances for 100+ employees

## Troubleshooting

### Browser Detection Not Working

#### Linux Issues
```bash
# Check if required tools are installed
which xdotool
which wmctrl

# Install if missing
sudo apt-get install xdotool wmctrl

# Check X11 display
echo $DISPLAY
```

#### Permission Issues
```bash
# Ensure proper permissions for system commands
sudo chmod +x /usr/bin/xdotool
sudo chmod +x /usr/bin/wmctrl
```

### Performance Issues

#### High CPU Usage
- Increase `BROWSER_CHECK_INTERVAL`
- Reduce number of concurrent monitoring sessions
- Check for memory leaks in logs

#### High Memory Usage
- Enable cache cleanup (automatic)
- Restart service periodically
- Monitor for memory leaks

### Logs and Debugging

```bash
# View PM2 logs
pm2 logs employee-monitoring

# Enable performance logging
export ENABLE_PERFORMANCE_LOGS=true

# Monitor system resources
htop
```

## Security Considerations

1. **Firewall**: Only expose necessary ports
2. **SSL/TLS**: Use HTTPS in production
3. **Authentication**: Implement proper JWT validation
4. **Rate Limiting**: Configure appropriate limits
5. **Data Encryption**: Encrypt sensitive monitoring data

## Backup and Recovery

1. **Database Backups**: Regular MongoDB backups
2. **Configuration Backups**: Backup .env and config files
3. **Screenshot Storage**: Backup violation screenshots
4. **Recovery Testing**: Regular recovery drills
