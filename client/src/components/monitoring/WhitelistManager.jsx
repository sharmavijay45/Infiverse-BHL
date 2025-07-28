import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  Shield,
  Plus,
  Search,
  Globe,
  Monitor,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Download,
  Upload,
  Brain,
  Clock
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function WhitelistManager() {
  const [whitelist, setWhitelist] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('approved');
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const { toast } = useToast();

  // Form state for adding/editing entries
  const [formData, setFormData] = useState({
    domain: '',
    applicationName: '',
    applicationExecutable: '',
    category: 'work_related',
    description: '',
    trustLevel: 'high',
    intelligentMonitoring: {
      enabled: true,
      screenshotOnViolation: false,
      maxScreenshotsPerSession: 0,
      aiAnalysisEnabled: false
    },
    timeRestrictions: {
      allowedHours: { start: '', end: '' },
      allowedDays: [],
      timezone: 'UTC'
    },
    usageLimits: {
      maxDailyMinutes: '',
      maxSessionMinutes: '',
      warningThresholdMinutes: ''
    }
  });

  const categories = [
    { value: 'work_related', label: 'Work Related' },
    { value: 'development_tools', label: 'Development Tools' },
    { value: 'communication', label: 'Communication' },
    { value: 'documentation', label: 'Documentation' },
    { value: 'cloud_services', label: 'Cloud Services' },
    { value: 'productivity', label: 'Productivity' },
    { value: 'learning', label: 'Learning' },
    { value: 'system_tools', label: 'System Tools' },
    { value: 'design_tools', label: 'Design Tools' },
    { value: 'project_management', label: 'Project Management' },
    { value: 'code_repositories', label: 'Code Repositories' },
    { value: 'other', label: 'Other' }
  ];

  const daysOfWeek = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];

  useEffect(() => {
    fetchWhitelist();
  }, [statusFilter, categoryFilter]);

  const fetchWhitelist = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/monitoring/whitelist`, {
        params: {
          status: statusFilter,
          category: categoryFilter !== 'all' ? categoryFilter : undefined
        },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setWhitelist(response.data.whitelist || []);
    } catch (error) {
      console.error('Error fetching whitelist:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch whitelist',
        type: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        domain: formData.domain,
        applicationName: formData.applicationName || undefined,
        applicationExecutable: formData.applicationExecutable || undefined,
        category: formData.category,
        description: formData.description,
        trustLevel: formData.trustLevel,
        intelligentMonitoring: formData.intelligentMonitoring,
        timeRestrictions: formData.timeRestrictions.allowedHours.start ? formData.timeRestrictions : undefined,
        usageLimits: formData.usageLimits.maxDailyMinutes ? formData.usageLimits : undefined
      };

      if (editingEntry) {
        // Update existing entry
        await axios.put(`${API_URL}/monitoring/whitelist/${editingEntry._id}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        toast({
          title: 'Success',
          description: 'Whitelist entry updated successfully'
        });
      } else {
        // Create new entry
        await axios.post(`${API_URL}/monitoring/whitelist`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        toast({
          title: 'Success',
          description: 'Website added to whitelist successfully'
        });
      }

      setShowAddDialog(false);
      setEditingEntry(null);
      resetForm();
      fetchWhitelist();
    } catch (error) {
      console.error('Error saving whitelist entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to save whitelist entry',
        type: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      domain: '',
      applicationName: '',
      applicationExecutable: '',
      category: 'work_related',
      description: '',
      trustLevel: 'high',
      intelligentMonitoring: {
        enabled: true,
        screenshotOnViolation: false,
        maxScreenshotsPerSession: 0,
        aiAnalysisEnabled: false
      },
      timeRestrictions: {
        allowedHours: { start: '', end: '' },
        allowedDays: [],
        timezone: 'UTC'
      },
      usageLimits: {
        maxDailyMinutes: '',
        maxSessionMinutes: '',
        warningThresholdMinutes: ''
      }
    });
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      domain: entry.domain,
      applicationName: entry.application_name || '',
      applicationExecutable: entry.application_executable || '',
      category: entry.category,
      description: entry.description,
      trustLevel: entry.trust_level || 'high',
      intelligentMonitoring: entry.intelligent_monitoring || {
        enabled: true,
        screenshotOnViolation: false,
        maxScreenshotsPerSession: 0,
        aiAnalysisEnabled: false
      },
      timeRestrictions: entry.time_restrictions || {
        allowedHours: { start: '', end: '' },
        allowedDays: [],
        timezone: 'UTC'
      },
      usageLimits: entry.usage_limits || {
        maxDailyMinutes: '',
        maxSessionMinutes: '',
        warningThresholdMinutes: ''
      }
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (entryId) => {
    if (!confirm('Are you sure you want to delete this whitelist entry?')) return;

    try {
      await axios.delete(`${API_URL}/monitoring/whitelist/${entryId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast({
        title: 'Success',
        description: 'Whitelist entry deleted successfully'
      });
      fetchWhitelist();
    } catch (error) {
      console.error('Error deleting whitelist entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete whitelist entry',
        type: 'destructive'
      });
    }
  };

  const filteredWhitelist = whitelist.filter(entry => {
    const matchesSearch = entry.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (entry.application_name && entry.application_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const getTrustLevelColor = (level) => {
    switch (level) {
      case 'high': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card className="neo-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Website & Application Whitelist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search domains, apps, or descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground" onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingEntry ? 'Edit Whitelist Entry' : 'Add New Whitelist Entry'}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Domain/Website URL *
                      </label>
                      <Input
                        placeholder="example.com or https://example.com"
                        value={formData.domain}
                        onChange={(e) => setFormData({...formData, domain: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Category *
                      </label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Application Name
                      </label>
                      <Input
                        placeholder="Chrome, Slack, VS Code, etc."
                        value={formData.applicationName}
                        onChange={(e) => setFormData({...formData, applicationName: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Trust Level
                      </label>
                      <Select value={formData.trustLevel} onValueChange={(value) => setFormData({...formData, trustLevel: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Trust Level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High (No Monitoring)</SelectItem>
                          <SelectItem value="medium">Medium (Basic Monitoring)</SelectItem>
                          <SelectItem value="low">Low (Full Monitoring)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Description *
                    </label>
                    <Textarea
                      placeholder="Describe why this website/application should be whitelisted..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      required
                      rows={3}
                    />
                  </div>

                  {/* Intelligent Monitoring Settings */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Intelligent Monitoring Settings
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formData.intelligentMonitoring.aiAnalysisEnabled}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            intelligentMonitoring: {
                              ...formData.intelligentMonitoring,
                              aiAnalysisEnabled: checked
                            }
                          })}
                        />
                        <label className="text-sm text-foreground">Enable AI Analysis</label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formData.intelligentMonitoring.screenshotOnViolation}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            intelligentMonitoring: {
                              ...formData.intelligentMonitoring,
                              screenshotOnViolation: checked
                            }
                          })}
                        />
                        <label className="text-sm text-foreground">Screenshot on Violation</label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="gradient-primary text-primary-foreground">
                      {editingEntry ? 'Update Entry' : 'Add to Whitelist'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Whitelist Entries */}
      <Card className="neo-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Whitelist Entries
            <Badge variant="outline" className="ml-auto">
              {filteredWhitelist.length} entries
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 border rounded-lg animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredWhitelist.length > 0 ? (
            <div className="space-y-3">
              {filteredWhitelist.map((entry) => (
                <div key={entry._id} className="p-4 border rounded-lg neo-card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-foreground">{entry.domain}</h4>
                        <Badge variant="outline">{entry.category.replace('_', ' ')}</Badge>
                        <Badge className={getTrustLevelColor(entry.trust_level)}>
                          {entry.trust_level} trust
                        </Badge>
                        {entry.intelligent_monitoring?.aiAnalysisEnabled && (
                          <Brain className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">{entry.description}</p>
                      
                      {entry.application_name && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Monitor className="h-3 w-3" />
                          <span>App: {entry.application_name}</span>
                        </div>
                      )}
                      
                      {entry.usage_stats && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span>Visits: {entry.usage_stats.total_visits}</span>
                          {entry.usage_stats.last_accessed && (
                            <span>Last: {new Date(entry.usage_stats.last_accessed).toLocaleDateString()}</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(entry)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(entry._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Whitelist Entries</h3>
              <p className="text-muted-foreground">
                Add websites and applications to the whitelist to allow employee access without monitoring.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
