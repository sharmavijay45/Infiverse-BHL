import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Monitor,
  Activity,
  AlertTriangle,
  Users,
  Eye,
  Clock,
  TrendingUp,
  Shield,
  Camera,
  Globe,
  Play,
  Square,
  Search,
  Filter,
  Download,
  Brain,
  Zap
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import axios from 'axios';
import { API_URL } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

// Import monitoring components
import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard';
import { EmployeeSelector } from '@/components/monitoring/EmployeeSelector';
import { ActivityChart } from '@/components/monitoring/ActivityChart';
import { ScreenshotGallery } from '@/components/monitoring/ScreenshotGallery';
import { AlertsPanel } from '@/components/monitoring/AlertsPanel';
import { ReportsGenerator } from '@/components/monitoring/ReportsGenerator';
import { BulkMonitoringControls } from '@/components/monitoring/BulkMonitoringControls';
import { AIInsightsPanel } from '@/components/monitoring/AIInsightsPanel';
import { WhitelistManager } from '@/components/monitoring/WhitelistManager';
import { ProductionDashboard } from '@/components/monitoring/ProductionDashboard';

export function EmployeeMonitoring() {
  const { user } = useAuth();
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [monitoringStatus, setMonitoringStatus] = useState({});
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [intelligentMode, setIntelligentMode] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch data on component mount
    fetchEmployees();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchMonitoringStatus();
      // Set up real-time status updates
      const interval = setInterval(fetchMonitoringStatus, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setEmployees(response.data.filter(emp => emp.role !== 'admin'));
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch employees',
        type: 'destructive'
      });
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API_URL}/departments`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchMonitoringStatus = async () => {
    if (!selectedEmployee) return;

    try {
      const response = await axios.get(`${API_URL}/monitoring/status/${selectedEmployee._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMonitoringStatus(response.data);
    } catch (error) {
      console.error('Error fetching monitoring status:', error);
    }
  };

  const startMonitoring = async () => {
    if (!selectedEmployee) return;

    setLoading(true);
    try {
      await axios.post(`${API_URL}/monitoring/start/${selectedEmployee._id}`, {
        workHours: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8 hours from now
        },
        intelligentMode
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      toast({
        title: 'Success',
        description: `${intelligentMode ? 'Intelligent' : 'Legacy'} monitoring started for ${selectedEmployee.name}`,
      });

      fetchMonitoringStatus();
    } catch (error) {
      console.error('Error starting monitoring:', error);
      toast({
        title: 'Error',
        description: 'Failed to start monitoring',
        type: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const stopMonitoring = async () => {
    if (!selectedEmployee) return;

    setLoading(true);
    try {
      await axios.post(`${API_URL}/monitoring/stop/${selectedEmployee._id}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      toast({
        title: 'Success',
        description: `Monitoring stopped for ${selectedEmployee.name}`,
      });

      fetchMonitoringStatus();
    } catch (error) {
      console.error('Error stopping monitoring:', error);
      toast({
        title: 'Error',
        description: 'Failed to stop monitoring',
        type: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || 
                             emp.department?._id === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 gradient-primary rounded-2xl glow-primary">
            <Monitor className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Employee Monitoring</h1>
            <p className="text-muted-foreground">Real-time activity tracking and productivity insights</p>
          </div>
        </div>

        {/* Employee Selection and Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employee Selector */}
          <Card className="neo-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Select Employee
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept._id} value={dept._id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <EmployeeSelector
                employees={filteredEmployees}
                selectedEmployee={selectedEmployee}
                onEmployeeSelect={setSelectedEmployee}
              />
            </CardContent>
          </Card>

          {/* Monitoring Status */}
          <Card className="neo-card border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-accent" />
                Monitoring Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEmployee ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Employee:</span>
                    <span className="text-foreground">{selectedEmployee.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={monitoringStatus.monitoring?.active ? 'default' : 'secondary'}>
                      {monitoringStatus.monitoring?.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {monitoringStatus.activity?.lastActivity && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Last Activity:</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(monitoringStatus.activity.lastActivity).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Select an employee to view monitoring status
                </p>
              )}
            </CardContent>
          </Card>

          {/* Control Panel */}
          <Card className="neo-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEmployee ? (
                <div className="space-y-3">
                  {/* Intelligent Mode Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      {intelligentMode ? (
                        <Brain className="h-4 w-4 text-primary" />
                      ) : (
                        <Camera className="h-4 w-4 text-accent" />
                      )}
                      <span className="text-sm font-medium text-foreground">
                        {intelligentMode ? 'Intelligent Mode' : 'Legacy Mode'}
                      </span>
                    </div>
                    <Switch
                      checked={intelligentMode}
                      onCheckedChange={setIntelligentMode}
                      disabled={monitoringStatus.monitoring?.active}
                    />
                  </div>

                  <div className="text-xs text-muted-foreground px-3">
                    {intelligentMode
                      ? 'Event-driven screenshots with AI analysis'
                      : 'Time-based screenshots every 5 minutes'
                    }
                  </div>

                  {monitoringStatus.monitoring?.active ? (
                    <Button
                      onClick={stopMonitoring}
                      disabled={loading}
                      variant="destructive"
                      className="w-full"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Stop Monitoring
                    </Button>
                  ) : (
                    <Button
                      onClick={startMonitoring}
                      disabled={loading}
                      className="w-full gradient-primary text-primary-foreground"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {intelligentMode ? 'Start Intelligent Monitoring' : 'Start Legacy Monitoring'}
                    </Button>
                  )}

                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Select an employee to control monitoring
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Tabs */}
      {selectedEmployee && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-9 neo-card">
            <TabsTrigger value="bulk">Bulk Controls</TabsTrigger>
            <TabsTrigger value="production">Production</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="screenshots">Screenshots</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
            <TabsTrigger value="whitelist">Whitelist</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="bulk">
            <BulkMonitoringControls />
          </TabsContent>

          <TabsContent value="production">
            <ProductionDashboard
              employee={selectedEmployee}
            />
          </TabsContent>

          <TabsContent value="dashboard">
            <MonitoringDashboard
              employee={selectedEmployee}
              monitoringStatus={monitoringStatus}
            />
          </TabsContent>

          <TabsContent value="activity">
            <ActivityChart
              employee={selectedEmployee}
            />
          </TabsContent>

          <TabsContent value="screenshots">
            <ScreenshotGallery
              employee={selectedEmployee}
            />
          </TabsContent>

          <TabsContent value="alerts">
            <AlertsPanel
              employee={selectedEmployee}
            />
          </TabsContent>

          <TabsContent value="ai-insights">
            <AIInsightsPanel
              employee={selectedEmployee}
            />
          </TabsContent>

          <TabsContent value="whitelist">
            <WhitelistManager />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsGenerator
              employee={selectedEmployee}
            />
          </TabsContent>
        </Tabs>
      )}

      <Toaster />
    </div>
  );
}
