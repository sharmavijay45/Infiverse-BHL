import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Clock,
  Mouse,
  Keyboard,
  Globe,
  Camera,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Eye
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import axios from 'axios';
import { API_URL } from '@/lib/api';


export function MonitoringDashboard({ employee, monitoringStatus }) {
  const [activityData, setActivityData] = useState([]);
  const [dailyMetrics, setDailyMetrics] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employee) {
      fetchDashboardData();
      // Set up real-time updates - more frequent for better real-time experience
      const interval = setInterval(fetchDashboardData, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [employee]);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch today's activity data
      const activityResponse = await axios.get(
        `${API_URL}/monitoring/employees/${employee._id}/activity?date=${today}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      // Fetch recent alerts
      const alertsResponse = await axios.get(
        `${API_URL}/monitoring/alerts?employeeId=${employee._id}&limit=5`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      // Process activity data for charts
      const processedData = processActivityData(activityResponse.data.activities);
      setActivityData(processedData);

      // Calculate daily metrics
      const metrics = calculateDailyMetrics(activityResponse.data.activities);
      setDailyMetrics(metrics);

      setRecentAlerts(alertsResponse.data.alerts);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const processActivityData = (activities) => {
    if (!activities || activities.length === 0) return [];

    // Group activities by hour
    const hourlyData = {};
    activities.forEach(activity => {
      const hour = new Date(activity.timestamp).getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = {
          hour: `${hour}:00`,
          keystroke_count: 0,
          mouse_activity_score: 0,
          productivity_score: 0,
          idle_duration: 0,
          count: 0
        };
      }
      
      hourlyData[hour].keystroke_count += activity.keystroke_count;
      hourlyData[hour].mouse_activity_score += activity.mouse_activity_score;
      hourlyData[hour].productivity_score += activity.productivity_score;
      hourlyData[hour].idle_duration += activity.idle_duration;
      hourlyData[hour].count++;
    });

    // Calculate averages and return sorted data
    return Object.values(hourlyData)
      .map(data => ({
        ...data,
        mouse_activity_score: Math.round(data.mouse_activity_score / data.count),
        productivity_score: Math.round(data.productivity_score / data.count),
        idle_duration: Math.round(data.idle_duration / data.count)
      }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
  };

  const calculateDailyMetrics = (activities) => {
    if (!activities || activities.length === 0) {
      return {
        totalKeystroke: 0,
        avgMouseActivity: 0,
        avgProductivityScore: 0,
        totalIdleTime: 0,
        activeHours: 0,
        totalActivities: 0
      };
    }

    const totalKeystroke = activities.reduce((sum, a) => sum + a.keystroke_count, 0);
    const avgMouseActivity = activities.reduce((sum, a) => sum + a.mouse_activity_score, 0) / activities.length;
    const avgProductivityScore = activities.reduce((sum, a) => sum + a.productivity_score, 0) / activities.length;
    const totalIdleTime = activities.reduce((sum, a) => sum + a.idle_duration, 0);
    
    // Calculate active hours
    const firstActivity = activities[activities.length - 1]?.timestamp;
    const lastActivity = activities[0]?.timestamp;
    const activeHours = firstActivity && lastActivity 
      ? (new Date(lastActivity) - new Date(firstActivity)) / (1000 * 60 * 60)
      : 0;

    return {
      totalKeystroke,
      avgMouseActivity: Math.round(avgMouseActivity),
      avgProductivityScore: Math.round(avgProductivityScore),
      totalIdleTime: Math.round(totalIdleTime / 60), // Convert to minutes
      activeHours: Math.round(activeHours * 100) / 100,
      totalActivities: activities.length
    };
  };

  const getProductivityColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getActivityStatus = () => {
    if (!monitoringStatus.activity) return { status: 'Unknown', color: 'text-gray-500' };
    
    if (monitoringStatus.activity.isIdle) {
      return { status: 'Idle', color: 'text-yellow-500' };
    } else if (monitoringStatus.activity.active) {
      return { status: 'Active', color: 'text-green-500' };
    } else {
      return { status: 'Inactive', color: 'text-red-500' };
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="neo-card animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const activityStatus = getActivityStatus();

  return (
    <div className="space-y-6">
      {/* Real-Time Activity Display */}
      <Card className="neo-card border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary animate-pulse" />
            Real-Time Activity Monitor
            <Badge variant="outline" className="ml-auto">
              Live
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Current Application</p>
              <p className="text-lg font-semibold text-foreground">
                {monitoringStatus.activity?.currentApplication?.name || 'No application detected'}
              </p>
              <p className="text-xs text-muted-foreground">
                {monitoringStatus.activity?.currentApplication?.title || 'No window title'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Current Website/URL</p>
              <p className="text-sm text-foreground truncate">
                {monitoringStatus.activity?.currentApplication?.url || 'No URL detected'}
              </p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  monitoringStatus.activity?.isIdle ? 'bg-orange-500' : 'bg-green-500'
                }`} />
                <span className="text-xs text-muted-foreground">
                  {monitoringStatus.activity?.isIdle ? 'Idle' : 'Active'}
                </span>
              </div>
              {/* Platform compatibility indicator */}
              {typeof window !== 'undefined' && !navigator.userAgent.includes('Windows') && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-xs text-yellow-700">
                    Browser monitoring requires Windows platform
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Session Info</p>
              <p className="text-sm text-foreground">
                Duration: {Math.floor((monitoringStatus.activity?.sessionDuration || 0) / 60)}m
              </p>
              <p className="text-xs text-muted-foreground">
                Last activity: {monitoringStatus.activity?.timeSinceLastActivity || 0}s ago
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="neo-card border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Status</p>
                <p className={`text-2xl font-bold ${activityStatus.color}`}>
                  {activityStatus.status}
                </p>
              </div>
              <Activity className={`h-8 w-8 ${activityStatus.color}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="neo-card border-accent/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Productivity Score</p>
                <p className={`text-2xl font-bold ${getProductivityColor(dailyMetrics?.avgProductivityScore || 0)}`}>
                  {dailyMetrics?.avgProductivityScore || 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="neo-card border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Hours</p>
                <p className="text-2xl font-bold text-green-500">
                  {dailyMetrics?.activeHours || 0}h
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="neo-card border-yellow-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Idle Time</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {dailyMetrics?.totalIdleTime || 0}m
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="neo-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Keystrokes Today</p>
                <p className="text-3xl font-bold text-foreground">
                  {dailyMetrics?.totalKeystroke?.toLocaleString() || 0}
                </p>
              </div>
              <Keyboard className="h-8 w-8 text-primary" />
            </div>
            <Progress value={Math.min((dailyMetrics?.totalKeystroke || 0) / 5000 * 100, 100)} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">Target: 5,000 keystrokes</p>
          </CardContent>
        </Card>

        <Card className="neo-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mouse Activity</p>
                <p className="text-3xl font-bold text-foreground">
                  {dailyMetrics?.avgMouseActivity || 0}%
                </p>
              </div>
              <Mouse className="h-8 w-8 text-accent" />
            </div>
            <Progress value={dailyMetrics?.avgMouseActivity || 0} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">Average activity level</p>
          </CardContent>
        </Card>

        <Card className="neo-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Activity</p>
                <p className="text-lg font-semibold text-foreground truncate">
                  {monitoringStatus.activity?.currentApplication?.name || 'Unknown'}
                </p>
              </div>
              <Globe className="h-8 w-8 text-primary" />
            </div>
            {monitoringStatus.activity?.currentApplication?.url && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground truncate">
                  {monitoringStatus.activity.currentApplication.url}
                </p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    monitoringStatus.activity?.isIdle ? 'bg-orange-500' : 'bg-green-500'
                  }`} />
                  <span className="text-xs text-muted-foreground">
                    {monitoringStatus.activity?.isIdle ? 'Idle' : 'Active'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    • Last activity: {monitoringStatus.activity?.timeSinceLastActivity || 0}s ago
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card className="neo-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Today's Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="productivity_score" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.3}
                  name="Productivity Score"
                />
                <Area 
                  type="monotone" 
                  dataKey="mouse_activity_score" 
                  stroke="hsl(var(--accent))" 
                  fill="hsl(var(--accent))" 
                  fillOpacity={0.3}
                  name="Mouse Activity"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card className="neo-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentAlerts.length > 0 ? (
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div key={alert._id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`h-4 w-4 ${
                      alert.severity === 'high' ? 'text-red-500' :
                      alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                    }`} />
                    <div>
                      <p className="font-medium text-foreground">{alert.title}</p>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={alert.status === 'active' ? 'destructive' : 'secondary'}>
                      {alert.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-muted-foreground">No recent alerts</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
