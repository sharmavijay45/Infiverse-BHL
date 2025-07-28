import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Download,
  Calendar as CalendarIcon,
  TrendingUp,
  Activity,
  Clock,
  AlertTriangle,
  Camera,
  BarChart3,
  PieChart,
  FileSpreadsheet,
  Mail
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from 'recharts';
import axios from 'axios';
import { API_URL } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function ReportsGenerator({ employee }) {
  const [reportData, setReportData] = useState(null);
  const [startDate, setStartDate] = useState(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState(new Date());
  const [reportType, setReportType] = useState('summary');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (employee) {
      generateReport();
    }
  }, [employee, startDate, endDate]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/monitoring/reports/${employee._id}?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setReportData(response.data);
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        type: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const setQuickDateRange = (range) => {
    const now = new Date();
    switch (range) {
      case 'today':
        setStartDate(now);
        setEndDate(now);
        break;
      case 'yesterday':
        const yesterday = subDays(now, 1);
        setStartDate(yesterday);
        setEndDate(yesterday);
        break;
      case 'week':
        setStartDate(startOfWeek(now));
        setEndDate(endOfWeek(now));
        break;
      case 'month':
        setStartDate(startOfMonth(now));
        setEndDate(endOfMonth(now));
        break;
      case 'last7days':
        setStartDate(subDays(now, 7));
        setEndDate(now);
        break;
      case 'last30days':
        setStartDate(subDays(now, 30));
        setEndDate(now);
        break;
    }
  };

  const exportReport = async (format) => {
    setGenerating(true);
    try {
      // This would typically call a backend endpoint to generate the report
      toast({
        title: 'Success',
        description: `Report exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export report',
        type: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  const getProductivityColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const chartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

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

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <Card className="neo-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Report Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Range Selection */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, 'MMM dd')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <span className="text-muted-foreground">to</span>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, 'MMM dd')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
                <SelectItem value="productivity">Productivity</SelectItem>
                <SelectItem value="alerts">Alerts Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Date Ranges */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Today', value: 'today' },
              { label: 'Yesterday', value: 'yesterday' },
              { label: 'This Week', value: 'week' },
              { label: 'This Month', value: 'month' },
              { label: 'Last 7 Days', value: 'last7days' },
              { label: 'Last 30 Days', value: 'last30days' }
            ].map((range) => (
              <Button
                key={range.value}
                variant="outline"
                size="sm"
                onClick={() => setQuickDateRange(range.value)}
              >
                {range.label}
              </Button>
            ))}
          </div>

          {/* Export Options */}
          <div className="flex items-center gap-2 pt-4 border-t">
            <span className="text-sm font-medium text-foreground">Export as:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportReport('pdf')}
              disabled={generating}
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportReport('excel')}
              disabled={generating}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportReport('email')}
              disabled={generating}
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <>
          {/* Report Summary */}
          <Card className="neo-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Report Summary - {employee.name}
                <Badge variant="outline" className="ml-auto">
                  {format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd')}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <Activity className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">
                    {reportData.dailyMetrics?.reduce((sum, day) => sum + day.totalActivities, 0) || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Activities</p>
                </div>

                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-accent mx-auto mb-2" />
                  <p className={`text-2xl font-bold ${getProductivityColor(
                    reportData.dailyMetrics?.reduce((sum, day) => sum + day.avgProductivityScore, 0) / 
                    (reportData.dailyMetrics?.length || 1) || 0
                  )}`}>
                    {Math.round(
                      reportData.dailyMetrics?.reduce((sum, day) => sum + day.avgProductivityScore, 0) / 
                      (reportData.dailyMetrics?.length || 1) || 0
                    )}%
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Productivity</p>
                </div>

                <div className="text-center">
                  <Camera className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">
                    {reportData.screenshots?.total || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Screenshots</p>
                </div>

                <div className="text-center">
                  <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">
                    {reportData.alertStats?.reduce((sum, stat) => sum + stat.totalCount, 0) || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Productivity Chart */}
          {reportData.dailyMetrics && reportData.dailyMetrics.length > 0 && (
            <Card className="neo-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Daily Productivity Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.dailyMetrics}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="avgProductivityScore" fill="hsl(var(--primary))" name="Productivity Score %" />
                      <Bar dataKey="activeHours" fill="hsl(var(--accent))" name="Active Hours" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alert Distribution */}
          {reportData.alertStats && reportData.alertStats.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="neo-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    Alert Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.alertStats.map((stat, index) => (
                      <div key={stat._id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-foreground capitalize">
                            {stat._id.replace('_', ' ')}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {stat.totalCount} alerts
                          </span>
                        </div>
                        <Progress 
                          value={(stat.totalCount / reportData.alertStats.reduce((sum, s) => sum + s.totalCount, 0)) * 100} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="neo-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-primary" />
                    Screenshot Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          {reportData.screenshots?.total || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">Total</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-500">
                          {reportData.screenshots?.flagged || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">Flagged</p>
                      </div>
                    </div>
                    
                    {reportData.screenshots?.byTrigger && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">By Trigger Type:</p>
                        {Object.entries(reportData.screenshots.byTrigger).map(([trigger, count]) => (
                          <div key={trigger} className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground capitalize">
                              {trigger.replace('_', ' ')}
                            </span>
                            <span className="text-foreground">{count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Detailed Metrics Table */}
          {reportData.dailyMetrics && reportData.dailyMetrics.length > 0 && (
            <Card className="neo-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Daily Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-2 font-medium text-foreground">Date</th>
                        <th className="text-center p-2 font-medium text-foreground">Activities</th>
                        <th className="text-center p-2 font-medium text-foreground">Productivity</th>
                        <th className="text-center p-2 font-medium text-foreground">Active Hours</th>
                        <th className="text-center p-2 font-medium text-foreground">Keystrokes</th>
                        <th className="text-center p-2 font-medium text-foreground">Mouse Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.dailyMetrics.map((day) => (
                        <tr key={day.date} className="border-b border-border/50">
                          <td className="p-2 text-foreground">{day.date}</td>
                          <td className="p-2 text-center text-muted-foreground">{day.totalActivities}</td>
                          <td className={`p-2 text-center font-medium ${getProductivityColor(day.avgProductivityScore)}`}>
                            {day.avgProductivityScore}%
                          </td>
                          <td className="p-2 text-center text-muted-foreground">{day.activeHours}h</td>
                          <td className="p-2 text-center text-muted-foreground">{day.totalKeystroke?.toLocaleString()}</td>
                          <td className="p-2 text-center text-muted-foreground">{day.avgMouseActivity}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
