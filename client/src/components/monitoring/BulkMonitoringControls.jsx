import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Play,
  Square,
  Brain,
  Camera,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Shield,
  Zap
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function BulkMonitoringControls() {
  const [allEmployeesStatus, setAllEmployeesStatus] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [intelligentMode, setIntelligentMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [bulkOperationProgress, setBulkOperationProgress] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllEmployeesStatus();
    fetchDepartments();
    
    // Set up real-time updates
    const interval = setInterval(fetchAllEmployeesStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAllEmployeesStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/monitoring/status/all`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAllEmployeesStatus(response.data.employees || []);
    } catch (error) {
      console.error('Error fetching all employees status:', error);
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

  const startBulkMonitoring = async () => {
    setLoading(true);
    setBulkOperationProgress({ current: 0, total: 0, status: 'Starting...' });
    
    try {
      const payload = {
        intelligentMode,
        departmentFilter: selectedDepartment !== 'all' ? selectedDepartment : null
      };

      const response = await axios.post(`${API_URL}/monitoring/start-all`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setBulkOperationProgress({
        current: response.data.results.length,
        total: response.data.results.length + response.data.errors.length,
        status: 'Completed'
      });

      toast({
        title: 'Success',
        description: `Monitoring started for ${response.data.results.length} employees`,
      });

      if (response.data.errors.length > 0) {
        toast({
          title: 'Warning',
          description: `${response.data.errors.length} employees failed to start monitoring`,
          type: 'warning'
        });
      }

      fetchAllEmployeesStatus();
    } catch (error) {
      console.error('Error starting bulk monitoring:', error);
      toast({
        title: 'Error',
        description: 'Failed to start bulk monitoring',
        type: 'destructive'
      });
    } finally {
      setLoading(false);
      setTimeout(() => setBulkOperationProgress(null), 3000);
    }
  };

  const stopBulkMonitoring = async () => {
    setLoading(true);
    setBulkOperationProgress({ current: 0, total: 0, status: 'Stopping all monitoring...' });
    
    try {
      await axios.post(`${API_URL}/monitoring/stop-all`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setBulkOperationProgress({ current: 1, total: 1, status: 'All monitoring stopped' });

      toast({
        title: 'Success',
        description: 'All monitoring sessions stopped successfully',
      });

      fetchAllEmployeesStatus();
    } catch (error) {
      console.error('Error stopping bulk monitoring:', error);
      toast({
        title: 'Error',
        description: 'Failed to stop all monitoring',
        type: 'destructive'
      });
    } finally {
      setLoading(false);
      setTimeout(() => setBulkOperationProgress(null), 3000);
    }
  };

  const filteredEmployees = allEmployeesStatus.filter(emp => 
    selectedDepartment === 'all' || emp.employee.department === selectedDepartment
  );

  const summary = {
    total: filteredEmployees.length,
    active: filteredEmployees.filter(emp => emp.monitoring.isActive).length,
    intelligent: filteredEmployees.filter(emp => emp.monitoring.mode === 'intelligent').length,
    withViolations: filteredEmployees.filter(emp => emp.monitoring.violationCount > 0).length
  };

  return (
    <div className="space-y-6">
      {/* Bulk Controls */}
      <Card className="neo-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Bulk Monitoring Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Department Filter</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept._id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Monitoring Mode</label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={intelligentMode}
                  onCheckedChange={setIntelligentMode}
                  id="intelligent-mode"
                />
                <label htmlFor="intelligent-mode" className="text-sm text-muted-foreground">
                  {intelligentMode ? 'Intelligent Mode' : 'Legacy Mode'}
                </label>
                {intelligentMode && <Brain className="h-4 w-4 text-primary" />}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Target Employees</label>
              <div className="text-2xl font-bold text-primary">
                {filteredEmployees.length}
              </div>
            </div>
          </div>

          {/* Mode Description */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              {intelligentMode ? (
                <>
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">Intelligent Mode</span>
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 text-accent" />
                  <span className="font-medium text-foreground">Legacy Mode</span>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {intelligentMode 
                ? 'Event-driven screenshots only on unauthorized access, AI-powered content analysis, smart alerts with task correlation'
                : 'Time-based screenshots every 5 minutes, basic violation detection, standard alerting system'
              }
            </p>
          </div>

          {/* Progress Bar */}
          {bulkOperationProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{bulkOperationProgress.status}</span>
                <span className="text-foreground">
                  {bulkOperationProgress.current}/{bulkOperationProgress.total}
                </span>
              </div>
              <Progress 
                value={bulkOperationProgress.total > 0 
                  ? (bulkOperationProgress.current / bulkOperationProgress.total) * 100 
                  : 0
                } 
                className="h-2"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={startBulkMonitoring}
              disabled={loading}
              className="flex-1 gradient-primary text-primary-foreground"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Monitoring All
            </Button>
            
            <Button
              onClick={stopBulkMonitoring}
              disabled={loading}
              variant="destructive"
              className="flex-1"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop All Monitoring
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="neo-card border-primary/20">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{summary.total}</p>
            <p className="text-xs text-muted-foreground">Total Employees</p>
          </CardContent>
        </Card>

        <Card className="neo-card border-green-500/20">
          <CardContent className="p-4 text-center">
            <Activity className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{summary.active}</p>
            <p className="text-xs text-muted-foreground">Currently Monitored</p>
          </CardContent>
        </Card>

        <Card className="neo-card border-blue-500/20">
          <CardContent className="p-4 text-center">
            <Brain className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{summary.intelligent}</p>
            <p className="text-xs text-muted-foreground">Intelligent Mode</p>
          </CardContent>
        </Card>

        <Card className="neo-card border-yellow-500/20">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{summary.withViolations}</p>
            <p className="text-xs text-muted-foreground">With Violations</p>
          </CardContent>
        </Card>
      </div>

      {/* Employee Status Grid */}
      <Card className="neo-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Employee Monitoring Status
            <Badge variant="outline" className="ml-auto">
              {filteredEmployees.length} employees
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((employee) => (
              <Card key={employee.employee.id} className="neo-card border-border/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-foreground">{employee.employee.name}</h4>
                      <p className="text-xs text-muted-foreground">{employee.employee.department}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {employee.monitoring.isActive ? (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-cyber"></div>
                          <Badge variant="default" className="text-xs">Active</Badge>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                      
                      {employee.monitoring.mode === 'intelligent' && (
                        <Brain className="h-3 w-3 text-primary" />
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    {employee.monitoring.lastActivity && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Last: {new Date(employee.monitoring.lastActivity).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                    
                    {employee.monitoring.violationCount > 0 && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-yellow-500" />
                        <span className="text-yellow-500">
                          {employee.monitoring.violationCount} violations
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredEmployees.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No employees found for the selected criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
