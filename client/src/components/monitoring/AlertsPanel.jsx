import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  MessageSquare,
  Filter,
  Search,
  Download,
  X,
  Flag,
  Activity,
  Globe,
  User,
  Calendar
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function AlertsPanel({ employee }) {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (employee) {
      fetchAlerts();
      // Set up real-time updates
      const interval = setInterval(fetchAlerts, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [employee, filterSeverity, filterStatus]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/monitoring/alerts?employeeId=${employee._id}`;
      
      if (filterSeverity !== 'all') {
        url += `&severity=${filterSeverity}`;
      }
      
      if (filterStatus !== 'all') {
        url += `&status=${filterStatus}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setAlerts(response.data.alerts || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId) => {
    setActionLoading(true);
    try {
      await axios.put(`${API_URL}/monitoring/alerts/${alertId}/acknowledge`, {
        notes: resolutionNotes
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      toast({
        title: 'Success',
        description: 'Alert acknowledged successfully',
      });

      fetchAlerts();
      setSelectedAlert(null);
      setResolutionNotes('');
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to acknowledge alert',
        type: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const resolveAlert = async (alertId) => {
    setActionLoading(true);
    try {
      await axios.put(`${API_URL}/monitoring/alerts/${alertId}/resolve`, {
        notes: resolutionNotes
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      toast({
        title: 'Success',
        description: 'Alert resolved successfully',
      });

      fetchAlerts();
      setSelectedAlert(null);
      setResolutionNotes('');
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve alert',
        type: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-red-500/20 text-red-500';
      case 'acknowledged': return 'bg-yellow-500/20 text-yellow-500';
      case 'resolved': return 'bg-green-500/20 text-green-500';
      case 'dismissed': return 'bg-gray-500/20 text-gray-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getAlertIcon = (alertType) => {
    switch (alertType) {
      case 'idle_timeout': return <Clock className="h-4 w-4" />;
      case 'unauthorized_website': return <Globe className="h-4 w-4" />;
      case 'suspicious_activity': return <Flag className="h-4 w-4" />;
      case 'productivity_drop': return <Activity className="h-4 w-4" />;
      case 'application_misuse': return <User className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      alert.title.toLowerCase().includes(searchLower) ||
      alert.description.toLowerCase().includes(searchLower) ||
      alert.alert_type.toLowerCase().includes(searchLower)
    );
  });

  const alertStats = {
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Alert Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="neo-card border-primary/20">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{alertStats.total}</p>
            <p className="text-xs text-muted-foreground">Total Alerts</p>
          </CardContent>
        </Card>

        <Card className="neo-card border-red-500/20">
          <CardContent className="p-4 text-center">
            <Flag className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{alertStats.active}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>

        <Card className="neo-card border-yellow-500/20">
          <CardContent className="p-4 text-center">
            <Eye className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{alertStats.acknowledged}</p>
            <p className="text-xs text-muted-foreground">Acknowledged</p>
          </CardContent>
        </Card>

        <Card className="neo-card border-green-500/20">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{alertStats.resolved}</p>
            <p className="text-xs text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>

        <Card className="neo-card border-orange-500/20">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{alertStats.critical}</p>
            <p className="text-xs text-muted-foreground">Critical</p>
          </CardContent>
        </Card>

        <Card className="neo-card border-red-400/20">
          <CardContent className="p-4 text-center">
            <Flag className="h-6 w-6 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{alertStats.high}</p>
            <p className="text-xs text-muted-foreground">High Priority</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card className="neo-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Monitoring Alerts - {employee.name}
            <Badge variant="outline" className="ml-auto">
              {filteredAlerts.length} alerts
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="neo-card animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAlerts.length > 0 ? (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <Card 
                  key={alert._id} 
                  className={`neo-card cursor-pointer transition-cyber hover:neo-inset ${getSeverityColor(alert.severity)}`}
                  onClick={() => setSelectedAlert(alert)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                          {getAlertIcon(alert.alert_type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground">{alert.title}</h4>
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <Badge className={getStatusColor(alert.status)}>
                              {alert.status}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {alert.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(alert.timestamp).toLocaleString()}</span>
                            </div>
                            <span className="capitalize">{alert.alert_type.replace('_', ' ')}</span>
                            {alert.age_minutes !== undefined && (
                              <span>{alert.age_minutes}m ago</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {alert.status === 'active' && (
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse-cyber"></div>
                        )}
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-muted-foreground">No alerts found for the selected criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getAlertIcon(selectedAlert.alert_type)}
                Alert Details
                <Badge className={getSeverityColor(selectedAlert.severity)}>
                  {selectedAlert.severity}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">{selectedAlert.title}</h3>
                <p className="text-muted-foreground">{selectedAlert.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-foreground mb-1">Alert Type</p>
                  <p className="text-muted-foreground capitalize">
                    {selectedAlert.alert_type.replace('_', ' ')}
                  </p>
                </div>
                
                <div>
                  <p className="font-medium text-foreground mb-1">Status</p>
                  <Badge className={getStatusColor(selectedAlert.status)}>
                    {selectedAlert.status}
                  </Badge>
                </div>
                
                <div>
                  <p className="font-medium text-foreground mb-1">Timestamp</p>
                  <p className="text-muted-foreground">
                    {new Date(selectedAlert.timestamp).toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <p className="font-medium text-foreground mb-1">Employee</p>
                  <p className="text-muted-foreground">
                    {selectedAlert.employee?.name || employee.name}
                  </p>
                </div>
              </div>
              
              {selectedAlert.data && Object.keys(selectedAlert.data).length > 0 && (
                <div>
                  <p className="font-medium text-foreground mb-2">Additional Data</p>
                  <div className="bg-muted rounded-lg p-3 text-sm">
                    <pre className="whitespace-pre-wrap text-muted-foreground">
                      {JSON.stringify(selectedAlert.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              {selectedAlert.status === 'active' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Resolution Notes (Optional)
                    </label>
                    <Textarea
                      placeholder="Add notes about this alert..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => acknowledgeAlert(selectedAlert._id)}
                      disabled={actionLoading}
                      variant="outline"
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Acknowledge
                    </Button>
                    
                    <Button
                      onClick={() => resolveAlert(selectedAlert._id)}
                      disabled={actionLoading}
                      className="flex-1 gradient-primary text-primary-foreground"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Resolve
                    </Button>
                  </div>
                </div>
              )}
              
              {selectedAlert.resolution_notes && (
                <div>
                  <p className="font-medium text-foreground mb-2">Resolution Notes</p>
                  <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground">
                    {selectedAlert.resolution_notes}
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
