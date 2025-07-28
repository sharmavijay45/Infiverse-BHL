import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Activity,
  TrendingUp,
  Calendar as CalendarIcon,
  Download,
  Filter,
  Keyboard,
  Mouse,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';
import { API_URL } from '@/lib/api';

export function ActivityChart({ employee }) {
  const [activityData, setActivityData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateRange, setDateRange] = useState('today');
  const [chartType, setChartType] = useState('productivity');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (employee) {
      fetchActivityData();
    }
  }, [employee, selectedDate, dateRange]);

  const fetchActivityData = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/monitoring/employees/${employee._id}/activity`;
      
      if (dateRange === 'today') {
        url += `?date=${format(selectedDate, 'yyyy-MM-dd')}`;
      } else if (dateRange === 'week') {
        const startDate = new Date(selectedDate);
        startDate.setDate(startDate.getDate() - 7);
        url += `?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(selectedDate, 'yyyy-MM-dd')}`;
      } else if (dateRange === 'month') {
        const startDate = new Date(selectedDate);
        startDate.setDate(1);
        const endDate = new Date(selectedDate);
        endDate.setMonth(endDate.getMonth() + 1, 0);
        url += `?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      const processedData = processActivityData(response.data.activities);
      setActivityData(processedData);
      
      const summaryData = calculateSummary(response.data.activities);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processActivityData = (activities) => {
    if (!activities || activities.length === 0) return [];

    if (dateRange === 'today') {
      // Group by hour for daily view
      const hourlyData = {};
      activities.forEach(activity => {
        const hour = new Date(activity.timestamp).getHours();
        const key = `${hour}:00`;
        
        if (!hourlyData[key]) {
          hourlyData[key] = {
            time: key,
            keystroke_count: 0,
            mouse_activity_score: 0,
            productivity_score: 0,
            idle_duration: 0,
            count: 0
          };
        }
        
        hourlyData[key].keystroke_count += activity.keystroke_count;
        hourlyData[key].mouse_activity_score += activity.mouse_activity_score;
        hourlyData[key].productivity_score += activity.productivity_score;
        hourlyData[key].idle_duration += activity.idle_duration;
        hourlyData[key].count++;
      });

      return Object.values(hourlyData)
        .map(data => ({
          ...data,
          mouse_activity_score: Math.round(data.mouse_activity_score / data.count),
          productivity_score: Math.round(data.productivity_score / data.count),
          idle_duration: Math.round(data.idle_duration / data.count / 60) // Convert to minutes
        }))
        .sort((a, b) => parseInt(a.time) - parseInt(b.time));
    } else {
      // Group by day for weekly/monthly view
      const dailyData = {};
      activities.forEach(activity => {
        const date = format(new Date(activity.timestamp), 'MM/dd');
        
        if (!dailyData[date]) {
          dailyData[date] = {
            time: date,
            keystroke_count: 0,
            mouse_activity_score: 0,
            productivity_score: 0,
            idle_duration: 0,
            count: 0
          };
        }
        
        dailyData[date].keystroke_count += activity.keystroke_count;
        dailyData[date].mouse_activity_score += activity.mouse_activity_score;
        dailyData[date].productivity_score += activity.productivity_score;
        dailyData[date].idle_duration += activity.idle_duration;
        dailyData[date].count++;
      });

      return Object.values(dailyData)
        .map(data => ({
          ...data,
          mouse_activity_score: Math.round(data.mouse_activity_score / data.count),
          productivity_score: Math.round(data.productivity_score / data.count),
          idle_duration: Math.round(data.idle_duration / data.count / 60)
        }))
        .sort((a, b) => new Date(a.time) - new Date(b.time));
    }
  };

  const calculateSummary = (activities) => {
    if (!activities || activities.length === 0) {
      return {
        totalKeystroke: 0,
        avgProductivity: 0,
        avgMouseActivity: 0,
        totalIdleTime: 0,
        peakHour: 'N/A',
        totalActivities: 0
      };
    }

    const totalKeystroke = activities.reduce((sum, a) => sum + a.keystroke_count, 0);
    const avgProductivity = activities.reduce((sum, a) => sum + a.productivity_score, 0) / activities.length;
    const avgMouseActivity = activities.reduce((sum, a) => sum + a.mouse_activity_score, 0) / activities.length;
    const totalIdleTime = activities.reduce((sum, a) => sum + a.idle_duration, 0);

    // Find peak productivity hour
    const hourlyProductivity = {};
    activities.forEach(activity => {
      const hour = new Date(activity.timestamp).getHours();
      if (!hourlyProductivity[hour]) {
        hourlyProductivity[hour] = { total: 0, count: 0 };
      }
      hourlyProductivity[hour].total += activity.productivity_score;
      hourlyProductivity[hour].count++;
    });

    let peakHour = 'N/A';
    let maxAvgProductivity = 0;
    Object.entries(hourlyProductivity).forEach(([hour, data]) => {
      const avg = data.total / data.count;
      if (avg > maxAvgProductivity) {
        maxAvgProductivity = avg;
        peakHour = `${hour}:00`;
      }
    });

    return {
      totalKeystroke,
      avgProductivity: Math.round(avgProductivity),
      avgMouseActivity: Math.round(avgMouseActivity),
      totalIdleTime: Math.round(totalIdleTime / 60), // Convert to minutes
      peakHour,
      totalActivities: activities.length
    };
  };

  const renderChart = () => {
    if (loading) {
      return (
        <div className="h-80 flex items-center justify-center">
          <div className="animate-pulse-cyber text-muted-foreground">Loading chart data...</div>
        </div>
      );
    }

    if (activityData.length === 0) {
      return (
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No activity data available</p>
          </div>
        </div>
      );
    }

    const commonProps = {
      data: activityData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'productivity':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="time" />
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
                name="Productivity Score (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'activity':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="keystroke_count" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Keystrokes"
              />
              <Line 
                type="monotone" 
                dataKey="mouse_activity_score" 
                stroke="hsl(var(--accent))" 
                strokeWidth={2}
                name="Mouse Activity (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'idle':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="idle_duration" 
                fill="hsl(var(--destructive))" 
                name="Idle Time (minutes)"
                opacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>

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

        <Select value={chartType} onValueChange={setChartType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Chart Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="productivity">Productivity</SelectItem>
            <SelectItem value="activity">Activity</SelectItem>
            <SelectItem value="idle">Idle Time</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="neo-card border-primary/20">
            <CardContent className="p-4 text-center">
              <Keyboard className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{summary.totalKeystroke.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Keystrokes</p>
            </CardContent>
          </Card>

          <Card className="neo-card border-accent/20">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{summary.avgProductivity}%</p>
              <p className="text-xs text-muted-foreground">Avg Productivity</p>
            </CardContent>
          </Card>

          <Card className="neo-card border-green-500/20">
            <CardContent className="p-4 text-center">
              <Mouse className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{summary.avgMouseActivity}%</p>
              <p className="text-xs text-muted-foreground">Mouse Activity</p>
            </CardContent>
          </Card>

          <Card className="neo-card border-yellow-500/20">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{summary.totalIdleTime}m</p>
              <p className="text-xs text-muted-foreground">Idle Time</p>
            </CardContent>
          </Card>

          <Card className="neo-card border-purple-500/20">
            <CardContent className="p-4 text-center">
              <Activity className="h-6 w-6 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{summary.peakHour}</p>
              <p className="text-xs text-muted-foreground">Peak Hour</p>
            </CardContent>
          </Card>

          <Card className="neo-card border-blue-500/20">
            <CardContent className="p-4 text-center">
              <Filter className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{summary.totalActivities}</p>
              <p className="text-xs text-muted-foreground">Data Points</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Chart */}
      <Card className="neo-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Activity Analysis - {employee.name}
            <Badge variant="outline" className="ml-auto">
              {chartType.charAt(0).toUpperCase() + chartType.slice(1)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderChart()}
        </CardContent>
      </Card>
    </div>
  );
}
