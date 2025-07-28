import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Phone,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Award,
  Target,
  Activity
} from 'lucide-react';
import { getUserDetails, getUserTasks, getUserPerformance } from '@/lib/user-api';

export function UserDetailsModal({ user, isOpen, onClose }) {
  const [userDetails, setUserDetails] = useState(null);
  const [userTasks, setUserTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock detailed user data
  const mockUserDetails = {
    ...user,
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    bio: 'Experienced developer with a passion for creating innovative solutions.',
    skills: ['React', 'Node.js', 'Python', 'AWS', 'Docker'],
    totalTasks: 67,
    completedTasks: 57,
    inProgressTasks: 3,
    overdueTasks: 1,
    averageCompletionTime: '2.3 days',
    performanceScore: 8.7,
    recentActivity: [
      { date: '2024-01-15', action: 'Completed task: API Integration', type: 'completed' },
      { date: '2024-01-14', action: 'Started task: Database Optimization', type: 'started' },
      { date: '2024-01-13', action: 'Commented on: UI Review', type: 'comment' },
    ]
  };

  const mockTasks = [
    {
      id: 1,
      title: 'API Integration for User Management',
      status: 'completed',
      priority: 'high',
      dueDate: '2024-01-15',
      completedDate: '2024-01-15',
      department: 'Engineering'
    },
    {
      id: 2,
      title: 'Database Schema Optimization',
      status: 'in-progress',
      priority: 'medium',
      dueDate: '2024-01-20',
      progress: 65,
      department: 'Engineering'
    },
    {
      id: 3,
      title: 'Code Review for Authentication Module',
      status: 'pending',
      priority: 'low',
      dueDate: '2024-01-25',
      department: 'Engineering'
    }
  ];

  useEffect(() => {
    if (isOpen && user) {
      fetchUserDetails();
    }
  }, [isOpen, user]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const [details, tasks, performance] = await Promise.all([
        getUserDetails(user._id || user.id),
        getUserTasks(user._id || user.id),
        getUserPerformance(user._id || user.id)
      ]);

      // Merge the data
      const enhancedDetails = {
        ...details,
        ...performance,
        completionRate: user.completionRate || performance.completionRate
      };

      setUserDetails(enhancedDetails);
      setUserTasks(tasks);
    } catch (error) {
      console.error('Error fetching user details:', error);
      // Fallback to provided user data
      setUserDetails({
        ...mockUserDetails,
        ...user
      });
      setUserTasks(mockTasks);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'low': return 'text-green-500 bg-green-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto neo-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">User Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse-cyber text-muted-foreground">Loading user details...</div>
          </div>
        ) : userDetails ? (
          <div className="space-y-6">
            {/* User Header */}
            <Card className="neo-card border-primary/10">
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <Avatar className="h-20 w-20 ring-4 ring-primary/20">
                    <AvatarImage src={userDetails.avatar} alt={userDetails.name} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xl font-bold">
                      {userDetails.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-foreground">{userDetails.name}</h2>
                      <Badge className="gradient-primary text-primary-foreground">
                        {userDetails.role}
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground mb-4">{userDetails.bio}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">{userDetails.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">{userDetails.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">{userDetails.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">
                          Joined {new Date(userDetails.joinDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="neo-card border-green-500/20">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">{userDetails.completedTasks}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </CardContent>
              </Card>
              
              <Card className="neo-card border-blue-500/20">
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">{userDetails.inProgressTasks}</div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </CardContent>
              </Card>
              
              <Card className="neo-card border-yellow-500/20">
                <CardContent className="p-4 text-center">
                  <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">{userDetails.overdueTasks}</div>
                  <div className="text-sm text-muted-foreground">Overdue</div>
                </CardContent>
              </Card>
              
              <Card className="neo-card border-purple-500/20">
                <CardContent className="p-4 text-center">
                  <Award className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">{userDetails.performanceScore}</div>
                  <div className="text-sm text-muted-foreground">Performance</div>
                </CardContent>
              </Card>
            </div>

            {/* Completion Rate */}
            <Card className="neo-card border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span className="font-semibold">{userDetails.completionRate}%</span>
                  </div>
                  <Progress value={userDetails.completionRate} className="h-3" />
                  <div className="text-xs text-muted-foreground">
                    Average completion time: {userDetails.averageCompletionTime}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for detailed information */}
            <Tabs defaultValue="tasks" className="w-full">
              <TabsList className="grid w-full grid-cols-3 neo-card">
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tasks" className="space-y-4">
                {userTasks.filter(task => task && task.title).map((task) => (
                  <Card key={task._id || task.id} className="neo-card border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground mb-2">{task.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                            <span>{task.department?.name || task.department || 'No Department'}</span>
                          </div>
                          {task.progress && (
                            <div className="mt-2">
                              <Progress value={task.progress} className="h-2" />
                              <span className="text-xs text-muted-foreground">{task.progress}% complete</span>
                            </div>
                          )}
                        </div>
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`}></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="skills" className="space-y-4">
                <Card className="neo-card border-border/50">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {(userDetails.skills || []).map((skill, index) => (
                        <Badge key={index} variant="outline" className="neo-button">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="activity" className="space-y-4">
                {(userDetails.recentActivity || []).map((activity, index) => (
                  <Card key={index} className="neo-card border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Activity className="h-4 w-4 text-primary" />
                        <div className="flex-1">
                          <p className="text-sm text-foreground">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
