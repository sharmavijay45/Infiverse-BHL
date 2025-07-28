import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Brain,
  Activity,
  FileText,
  Download,
  Eye,
  Keyboard,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  PieChart,
  Users,
  Shield,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, BarChart, Bar } from 'recharts';
import axios from 'axios';
import { API_URL } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function ProductionDashboard({ employee }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [keystrokeData, setKeystrokeData] = useState([]);
  const [productivitySummary, setProductivitySummary] = useState(null);
  const [ocrStatus, setOcrStatus] = useState(null);
  const [timeRange, setTimeRange] = useState('7days');
  const [loading, setLoading] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (employee) {
      fetchDashboardData();
      fetchKeystrokeData();
      fetchProductivitySummary();
      fetchOCRStatus();
    }
  }, [employee, timeRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '1day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case '7days':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(startDate.getDate() - 30);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      const [screenshotsRes, activitiesRes, alertsRes] = await Promise.all([
        axios.get(`${API_URL}/monitoring/screenshots/${employee._id}`, {
          params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${API_URL}/monitoring/activity/${employee._id}`, {
          params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${API_URL}/monitoring/alerts/${employee._id}`, {
          params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      setDashboardData({
        screenshots: screenshotsRes.data.screenshots || [],
        activities: activitiesRes.data.activities || [],
        alerts: alertsRes.data.alerts || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch dashboard data',
        type: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchKeystrokeData = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (timeRange === '1day' ? 1 : timeRange === '7days' ? 7 : 30));

      const response = await axios.get(`${API_URL}/monitoring/keystroke/${employee._id}`, {
        params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setKeystrokeData(response.data.analytics || []);
    } catch (error) {
      console.error('Error fetching keystroke data:', error);
    }
  };

  const fetchProductivitySummary = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (timeRange === '1day' ? 1 : timeRange === '7days' ? 7 : 30));

      const response = await axios.get(`${API_URL}/monitoring/productivity/${employee._id}`, {
        params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setProductivitySummary(response.data.summary || {});
    } catch (error) {
      console.error('Error fetching productivity summary:', error);
    }
  };

  const fetchOCRStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/monitoring/ocr/status`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setOcrStatus(response.data.stats || {});
    } catch (error) {
      console.error('Error fetching OCR status:', error);
    }
  };

  const generatePDFReport = async () => {
    setReportGenerating(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (timeRange === '1day' ? 1 : timeRange === '7days' ? 7 : 30));

      const response = await axios.post(`${API_URL}/monitoring/report/pdf/${employee._id}`, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        options: { includeCharts: true, includeOCR: true }
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        // Download the report
        window.open(`${API_URL}${response.data.report.downloadUrl}`, '_blank');
        
        toast({
          title: 'Success',
          description: 'PDF report generated successfully',
        });
      }
    } catch (error) {
      console.error('Error generating PDF report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF report',
        type: 'destructive'
      });
    } finally {
      setReportGenerating(false);
    }
  };

  const exportToCSV = async (dataType) => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (timeRange === '1day' ? 1 : timeRange === '7days' ? 7 : 30));

      const response = await axios.post(`${API_URL}/monitoring/export/csv/${employee._id}`, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        dataType
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        window.open(`${API_URL}${response.data.export.downloadUrl}`, '_blank');
        
        toast({
          title: 'Success',
          description: `${dataType} data exported successfully`,
        });
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Error',
        description: 'Failed to export data',
        type: 'destructive'
      });
    }
  };

  const getProductivityColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getEfficiencyBadgeColor = (rating) => {
    switch (rating) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="neo-card animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-32 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <Card className="neo-card border-border/50">
        <CardContent className="p-12 text-center">
          <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Data Available</h3>
          <p className="text-muted-foreground">
            No monitoring data found for the selected time period.
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Production Monitoring Dashboard</h2>
          <p className="text-muted-foreground">Employee: {employee.name}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1day">Last 24 Hours</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={generatePDFReport}
            disabled={reportGenerating}
            className="gradient-primary text-primary-foreground"
          >
            <FileText className="h-4 w-4 mr-2" />
            {reportGenerating ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
      </div>

      {/* System Status */}
      <Card className="neo-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">OCR Analysis:</span>
              <Badge variant={ocrStatus?.workerInitialized ? 'default' : 'destructive'}>
                {ocrStatus?.workerInitialized ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">AI Service:</span>
              <Badge variant={ocrStatus?.aiEnabled ? 'default' : 'secondary'}>
                {ocrStatus?.aiEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">Screenshots:</span>
              <Badge variant="outline">{dashboardData.screenshots.length}</Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">Alerts:</span>
              <Badge variant={dashboardData.alerts.length > 0 ? 'destructive' : 'default'}>
                {dashboardData.alerts.length}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="neo-card border-green-500/20">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className={`text-2xl font-bold ${getProductivityColor(productivitySummary?.avgProductivityScore || 0)}`}>
              {Math.round(productivitySummary?.avgProductivityScore || 0)}%
            </p>
            <p className="text-xs text-muted-foreground">Productivity Score</p>
          </CardContent>
        </Card>

        <Card className="neo-card border-blue-500/20">
          <CardContent className="p-4 text-center">
            <Keyboard className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {Math.round(productivitySummary?.avgTypingSpeed || 0)}
            </p>
            <p className="text-xs text-muted-foreground">WPM Average</p>
          </CardContent>
        </Card>

        <Card className="neo-card border-purple-500/20">
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {Math.round(productivitySummary?.avgAccuracy || 0)}%
            </p>
            <p className="text-xs text-muted-foreground">Typing Accuracy</p>
          </CardContent>
        </Card>

        <Card className="neo-card border-orange-500/20">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {Math.round((productivitySummary?.totalActiveTime || 0) / 3600)}h
            </p>
            <p className="text-xs text-muted-foreground">Active Time</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="productivity" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 neo-card">
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="keystrokes">Keystrokes</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="productivity">
          <Card className="neo-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Productivity Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {productivitySummary && Object.keys(productivitySummary).length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Focus Score</label>
                      <Progress value={productivitySummary.avgFocusScore || 0} className="h-3" />
                      <p className="text-xs text-muted-foreground">
                        {Math.round(productivitySummary.avgFocusScore || 0)}% - Application focus consistency
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Efficiency Rating</label>
                      <div className="flex items-center gap-2">
                        <Badge className={getEfficiencyBadgeColor('medium')}>
                          Medium
                        </Badge>
                        <span className="text-sm text-muted-foreground">Based on typing patterns</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Total Keystrokes</label>
                      <p className="text-2xl font-bold text-foreground">
                        {(productivitySummary.totalKeystrokes || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">In selected period</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-foreground mb-3">Time Distribution</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Active Time</span>
                          <span className="text-foreground">
                            {Math.round((productivitySummary.totalActiveTime || 0) / 60)} min
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Idle Time</span>
                          <span className="text-foreground">
                            {Math.round((productivitySummary.totalIdleTime || 0) / 60)} min
                          </span>
                        </div>
                        <Progress 
                          value={
                            ((productivitySummary.totalActiveTime || 0) / 
                            ((productivitySummary.totalActiveTime || 0) + (productivitySummary.totalIdleTime || 1))) * 100
                          } 
                          className="h-2"
                        />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-foreground mb-3">Performance Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Typing Speed</span>
                          <span className="text-sm font-medium text-foreground">
                            {Math.round(productivitySummary.avgTypingSpeed || 0)} WPM
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Accuracy</span>
                          <span className="text-sm font-medium text-foreground">
                            {Math.round(productivitySummary.avgAccuracy || 0)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Overall Score</span>
                          <span className={`text-sm font-medium ${getProductivityColor(productivitySummary.avgProductivityScore || 0)}`}>
                            {Math.round(productivitySummary.avgProductivityScore || 0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No productivity data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keystrokes">
          <Card className="neo-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-primary" />
                Keystroke Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {keystrokeData.length > 0 ? (
                <div className="space-y-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={keystrokeData.slice(-20)}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="timestamp" 
                          tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleString()}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="keystroke_data.typing_speed_wpm" 
                          stroke="#8884d8" 
                          name="Typing Speed (WPM)"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="productivity_metrics.productivity_score" 
                          stroke="#82ca9d" 
                          name="Productivity Score"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {keystrokeData.slice(-3).map((data, index) => (
                      <Card key={index} className="neo-card border-border/30">
                        <CardContent className="p-4">
                          <div className="text-xs text-muted-foreground mb-2">
                            {new Date(data.timestamp).toLocaleString()}
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Speed</span>
                              <span className="text-sm font-medium text-foreground">
                                {data.keystroke_data?.typing_speed_wpm || 0} WPM
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Accuracy</span>
                              <span className="text-sm font-medium text-foreground">
                                {data.keystroke_data?.typing_accuracy || 0}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Content</span>
                              <Badge variant="outline" className="text-xs">
                                {data.content_analysis?.estimated_content_type || 'Unknown'}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Keyboard className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No keystroke data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <Card className="neo-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.activities.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.activities.slice(0, 10).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-foreground">
                          {activity.activity_type || 'Unknown Activity'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.application_name || 'Unknown Application'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-foreground">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {activity.duration ? `${Math.round(activity.duration / 60)}m` : 'Active'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No activity data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations">
          <Card className="neo-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Policy Violations & Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.alerts.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.alerts.map((alert, index) => (
                    <div key={index} className="p-4 border rounded-lg neo-card">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={alert.severity === 'high' ? 'destructive' : alert.severity === 'medium' ? 'default' : 'secondary'}>
                              {alert.severity}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(alert.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <h4 className="font-semibold text-foreground mb-1">{alert.title}</h4>
                          <p className="text-sm text-muted-foreground">{alert.description}</p>
                          
                          {alert.data?.ocr_analysis && (
                            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                              <h5 className="text-xs font-medium text-foreground mb-2">AI Analysis:</h5>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Activity:</span>
                                  <span className="ml-1 text-foreground">
                                    {alert.data.ocr_analysis.analysis?.activityDescription || 'Unknown'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Task Relevance:</span>
                                  <span className="ml-1 text-foreground">
                                    {alert.data.ocr_analysis.analysis?.taskRelevance || 0}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-foreground font-medium">No Violations Detected</p>
                  <p className="text-muted-foreground">Employee is following all policies</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export">
          <Card className="neo-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Export & Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-foreground mb-3">Generate Reports</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={generatePDFReport}
                      disabled={reportGenerating}
                      className="gradient-primary text-primary-foreground"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {reportGenerating ? 'Generating...' : 'Comprehensive PDF Report'}
                    </Button>
                    
                    <Button variant="outline" onClick={() => exportToCSV('all')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export All Data (CSV)
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-3">Export Specific Data</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button variant="outline" size="sm" onClick={() => exportToCSV('activities')}>
                      Activities
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportToCSV('keystrokes')}>
                      Keystrokes
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportToCSV('alerts')}>
                      Alerts
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportToCSV('screenshots')}>
                      Screenshots
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h5 className="font-medium text-foreground mb-2">Report Features</h5>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• OCR text extraction and analysis</li>
                    <li>• AI-powered work relevance assessment</li>
                    <li>• Comprehensive keystroke analytics</li>
                    <li>• Productivity metrics and trends</li>
                    <li>• Policy violation summaries</li>
                    <li>• Professional charts and visualizations</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
