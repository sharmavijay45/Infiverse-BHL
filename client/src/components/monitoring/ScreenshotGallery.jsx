import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Camera,
  Calendar as CalendarIcon,
  Filter,
  Search,
  Download,
  Eye,
  Flag,
  Clock,
  AlertTriangle,
  Image as ImageIcon,
  Brain,
  ZoomIn,
  X,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';
import { API_URL } from '@/lib/api';

export function ScreenshotGallery({ employee }) {
  const [screenshots, setScreenshots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  useEffect(() => {
    if (employee) {
      fetchScreenshots();
    }
  }, [employee, selectedDate, filterType]);

  const fetchScreenshots = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      // Always fetch only violation screenshots (the backend now filters automatically)
      let url = `${API_URL}/monitoring/employees/${employee._id}/screenshots?date=${dateStr}`;

      console.log(`🔍 Fetching screenshots for employee ${employee._id} on date ${dateStr}`);
      console.log(`📡 API URL: ${url}`);

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // The backend now only returns violation screenshots
      const violationScreenshots = response.data.screenshots || [];
      console.log(`📸 Received ${violationScreenshots.length} violation screenshots`);
      console.log('📋 Response data:', response.data);

      setScreenshots(violationScreenshots);
    } catch (error) {
      console.error('❌ Error fetching screenshots:', error);
      console.error('📡 Error details:', error.response?.data || error.message);
      setScreenshots([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredScreenshots = screenshots.filter(screenshot => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      screenshot.active_application?.name?.toLowerCase().includes(searchLower) ||
      screenshot.active_application?.title?.toLowerCase().includes(searchLower) ||
      screenshot.active_application?.url?.toLowerCase().includes(searchLower) ||
      screenshot.capture_trigger?.toLowerCase().includes(searchLower)
    );
  });

  const getTriggerColor = (trigger) => {
    switch (trigger) {
      case 'unauthorized_site': return 'bg-red-500/20 text-red-500';
      case 'activity_change': return 'bg-blue-500/20 text-blue-500';
      case 'manual': return 'bg-purple-500/20 text-purple-500';
      case 'scheduled': return 'bg-green-500/20 text-green-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const ScreenshotCard = ({ screenshot }) => (
    <Card 
      className={`neo-card cursor-pointer transition-cyber hover:neo-inset ${
        screenshot.is_flagged ? 'border-red-500/30' : 'border-border/50'
      }`}
      onClick={() => setSelectedScreenshot(screenshot)}
    >
      <CardContent className="p-4">
        <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
          <img
            src={`${API_URL}/monitoring/screenshots/${screenshot._id}`}
            alt="Screenshot"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="hidden w-full h-full items-center justify-center bg-muted">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          
          {screenshot.is_flagged && (
            <div className="absolute top-2 right-2">
              <Flag className="h-4 w-4 text-red-500" />
            </div>
          )}
          
          <div className="absolute bottom-2 left-2">
            <Badge className={getTriggerColor(screenshot.capture_trigger)}>
              {screenshot.capture_trigger}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground truncate">
              {screenshot.active_application?.name || 'Unknown App'}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(screenshot.file_size)}
            </p>
          </div>
          
          {screenshot.active_application?.title && (
            <p className="text-xs text-muted-foreground truncate">
              {screenshot.active_application.title}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{new Date(screenshot.timestamp).toLocaleTimeString()}</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{screenshot.screen_resolution?.width}x{screenshot.screen_resolution?.height}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ScreenshotListItem = ({ screenshot }) => (
    <Card 
      className={`neo-card cursor-pointer transition-cyber hover:neo-inset ${
        screenshot.is_flagged ? 'border-red-500/30' : 'border-border/50'
      }`}
      onClick={() => setSelectedScreenshot(screenshot)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-14 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img
              src={`${API_URL}/monitoring/screenshots/${screenshot._id}`}
              alt="Screenshot"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden w-full h-full items-center justify-center bg-muted">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-foreground truncate">
                {screenshot.active_application?.name || 'Unknown App'}
              </p>
              <Badge className={getTriggerColor(screenshot.capture_trigger)}>
                {screenshot.capture_trigger}
              </Badge>
              {screenshot.is_flagged && (
                <Flag className="h-4 w-4 text-red-500" />
              )}
            </div>
            
            {screenshot.active_application?.title && (
              <p className="text-sm text-muted-foreground truncate mb-1">
                {screenshot.active_application.title}
              </p>
            )}
            
            {screenshot.active_application?.url && (
              <p className="text-xs text-muted-foreground truncate mb-2">
                {screenshot.active_application.url}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{new Date(screenshot.timestamp).toLocaleTimeString()}</span>
              <span>{formatFileSize(screenshot.file_size)}</span>
              <span>{screenshot.screen_resolution?.width}x{screenshot.screen_resolution?.height}</span>
            </div>
          </div>
          
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-60 justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, 'PPP')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-sm font-medium text-red-500">Violation Screenshots Only</span>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by app, title, or URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={viewMode} onValueChange={setViewMode}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="View" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">Grid</SelectItem>
            <SelectItem value="list">List</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="neo-card border-red-500/20">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{screenshots.length}</p>
            <p className="text-xs text-muted-foreground">Policy Violations</p>
          </CardContent>
        </Card>

        <Card className="neo-card border-orange-500/20">
          <CardContent className="p-4 text-center">
            <Brain className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {screenshots.filter(s => s.metadata?.ai_analysis).length}
            </p>
            <p className="text-xs text-muted-foreground">AI Analyzed</p>
          </CardContent>
        </Card>

        <Card className="neo-card border-purple-500/20">
          <CardContent className="p-4 text-center">
            <Eye className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {screenshots.filter(s => s.metadata?.ocr_analysis?.text).length}
            </p>
            <p className="text-xs text-muted-foreground">OCR Analyzed</p>
          </CardContent>
        </Card>

        <Card className="neo-card border-blue-500/20">
          <CardContent className="p-4 text-center">
            <Shield className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {screenshots.filter(s => s.capture_trigger === 'unauthorized_access').length}
            </p>
            <p className="text-xs text-muted-foreground">Smart Captures</p>
          </CardContent>
        </Card>
      </div>

      {/* Screenshots Gallery */}
      <Card className="neo-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Screenshots - {employee.name}
            <Badge variant="outline" className="ml-auto">
              {filteredScreenshots.length} items
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="neo-card animate-pulse">
                  <CardContent className="p-4">
                    <div className="aspect-video bg-muted rounded-lg mb-3"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredScreenshots.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredScreenshots.map((screenshot) => (
                  <ScreenshotCard key={screenshot._id} screenshot={screenshot} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredScreenshots.map((screenshot) => (
                  <ScreenshotListItem key={screenshot._id} screenshot={screenshot} />
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-green-500 font-medium mb-2">No Policy Violations Detected</p>
              <p className="text-muted-foreground text-sm">
                The intelligent monitoring system found no non-work-related activities for this date.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Screenshot Detail Modal */}
      {selectedScreenshot && (
        <Dialog open={!!selectedScreenshot} onOpenChange={() => setSelectedScreenshot(null)}>
         <DialogContent 
    className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border border-border shadow-2xl z-[100] 
    bg-opacity-100 backdrop-blur-none" // Ensure full opacity and no blur
    style={{ backgroundColor: 'hsl(var(--background))', opacity: 1 }} // Force solid background
  >   <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Policy Violation Screenshot
                <Badge variant="destructive" className="ml-2">
                  Non-Work Activity
                </Badge>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={`${API_URL}/monitoring/screenshots/${selectedScreenshot._id}`}
                  alt="Screenshot"
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-foreground mb-1">Application</p>
                  <p className="text-muted-foreground">
                    {selectedScreenshot.active_application?.name || 'Unknown'}
                  </p>
                </div>
                
                <div>
                  <p className="font-medium text-foreground mb-1">Capture Trigger</p>
                  <Badge className={getTriggerColor(selectedScreenshot.capture_trigger)}>
                    {selectedScreenshot.capture_trigger}
                  </Badge>
                </div>
                
                <div>
                  <p className="font-medium text-foreground mb-1">Timestamp</p>
                  <p className="text-muted-foreground">
                    {new Date(selectedScreenshot.timestamp).toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <p className="font-medium text-foreground mb-1">File Size</p>
                  <p className="text-muted-foreground">
                    {formatFileSize(selectedScreenshot.file_size)}
                  </p>
                </div>
                
                {selectedScreenshot.active_application?.title && (
                  <div className="col-span-2">
                    <p className="font-medium text-foreground mb-1">Window Title</p>
                    <p className="text-muted-foreground">
                      {selectedScreenshot.active_application.title}
                    </p>
                  </div>
                )}
                
                {selectedScreenshot.active_application?.url && (
                  <div className="col-span-2">
                    <p className="font-medium text-foreground mb-1">URL</p>
                    <p className="text-muted-foreground break-all">
                      {selectedScreenshot.active_application.url}
                    </p>
                  </div>
                )}
              </div>

              {/* AI Analysis Section */}
              {selectedScreenshot.metadata?.ai_analysis && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-red-500" />
                    AI Violation Analysis
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-foreground mb-1">Activity Type</p>
                      <Badge variant="outline" className="text-red-500 border-red-500">
                        {selectedScreenshot.metadata.ai_analysis.activityType || 'Unknown'}
                      </Badge>
                    </div>

                    <div>
                      <p className="font-medium text-foreground mb-1">Task Relevance</p>
                      <p className="text-red-500 font-medium">
                        {selectedScreenshot.metadata.ai_analysis.taskRelevance || 0}%
                      </p>
                    </div>

                    <div className="col-span-full">
                      <p className="font-medium text-foreground mb-1">AI Description</p>
                      <p className="text-muted-foreground">
                        {selectedScreenshot.metadata.ai_analysis.activityDescription || 'No description available'}
                      </p>
                    </div>

                    <div className="col-span-full">
                      <p className="font-medium text-foreground mb-1">Violation Reason</p>
                      <p className="text-red-500">
                        {selectedScreenshot.metadata.ai_analysis.alertReason || 'Non-work-related activity detected'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* OCR Analysis Section */}
              {selectedScreenshot.metadata?.ocr_analysis?.text && (
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-blue-500" />
                    OCR Text Extraction
                  </h4>

                  <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">Extracted Text</p>
                    <div className="bg-muted/50 p-3 rounded border max-h-32 overflow-y-auto">
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {selectedScreenshot.metadata.ocr_analysis.text || 'No text extracted'}
                      </p>
                    </div>

                    <div className="mt-2 flex items-center gap-4">
                      <span className="text-muted-foreground">
                        Confidence: {selectedScreenshot.metadata.ocr_analysis.confidence || 0}%
                      </span>
                      <span className="text-muted-foreground">
                        Extracted: {new Date(selectedScreenshot.metadata.ocr_analysis.extractedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
