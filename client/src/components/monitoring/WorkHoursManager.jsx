import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Play, 
  Pause, 
  Square, 
  Timer,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { format, differenceInMinutes, differenceInHours } from 'date-fns';
import axios from 'axios';
import { API_URL } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../../context/auth-context';

export function WorkHoursManager({ employee }) {
  const [workSession, setWorkSession] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Use current user if no employee prop is provided (for user dashboard)
  const currentEmployee = employee || user;

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch current work session
  useEffect(() => {
    if (currentEmployee) {
      fetchWorkSession();
    }
  }, [currentEmployee]);

  const fetchWorkSession = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/monitoring/work-session/${currentEmployee._id || currentEmployee.id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setWorkSession(response.data);
    } catch (error) {
      console.error('Error fetching work session:', error);
    }
  };

  const startWorkDay = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/monitoring/work-session/start`,
        {
          employeeId: currentEmployee._id || currentEmployee.id,
          startTime: new Date(),
          targetHours: 8 // Default 8-hour work day
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      setWorkSession(response.data);
      toast({
        title: "Work Day Started",
        description: "Your 8-hour work session has begun. Good luck!",
      });
    } catch (error) {
      console.error('Error starting work day:', error);
      toast({
        title: "Error",
        description: "Failed to start work day. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const pauseWorkDay = async () => {
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/monitoring/work-session/pause`,
        { employeeId: currentEmployee._id || currentEmployee.id },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      await fetchWorkSession();
      toast({
        title: "Work Day Paused",
        description: "Your work session has been paused.",
      });
    } catch (error) {
      console.error('Error pausing work day:', error);
      toast({
        title: "Error",
        description: "Failed to pause work day.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resumeWorkDay = async () => {
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/monitoring/work-session/resume`,
        { employeeId: currentEmployee._id || currentEmployee.id },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      await fetchWorkSession();
      toast({
        title: "Work Day Resumed",
        description: "Your work session has been resumed.",
      });
    } catch (error) {
      console.error('Error resuming work day:', error);
      toast({
        title: "Error",
        description: "Failed to resume work day.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const endWorkDay = async () => {
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/monitoring/work-session/end`,
        { employeeId: currentEmployee._id || currentEmployee.id },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      setWorkSession(null);
      toast({
        title: "Work Day Ended",
        description: "Your work session has been completed.",
      });
    } catch (error) {
      console.error('Error ending work day:', error);
      toast({
        title: "Error",
        description: "Failed to end work day.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate work progress
  const getWorkProgress = () => {
    if (!workSession || !workSession.startTime) return { hours: 0, minutes: 0, percentage: 0 };
    
    const startTime = new Date(workSession.startTime);
    const totalMinutes = differenceInMinutes(currentTime, startTime);
    const totalHours = totalMinutes / 60;
    const targetHours = workSession.targetHours || 8;
    const percentage = Math.min((totalHours / targetHours) * 100, 100);
    
    return {
      hours: Math.floor(totalHours),
      minutes: totalMinutes % 60,
      percentage,
      remaining: Math.max(targetHours - totalHours, 0)
    };
  };

  const progress = getWorkProgress();
  const isWorkDayActive = workSession && workSession.status === 'active';
  const isWorkDayPaused = workSession && workSession.status === 'paused';
  const isWorkDayCompleted = workSession && workSession.status === 'completed';

  return (
    <Card className="neo-card border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-primary" />
          Work Hours Manager
          {isWorkDayActive && (
            <Badge variant="default" className="ml-auto animate-pulse">
              Active
            </Badge>
          )}
          {isWorkDayPaused && (
            <Badge variant="secondary" className="ml-auto">
              Paused
            </Badge>
          )}
          {isWorkDayCompleted && (
            <Badge variant="outline" className="ml-auto">
              Completed
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Time */}
        <div className="text-center">
          <p className="text-2xl font-mono font-bold text-foreground">
            {format(currentTime, 'HH:mm:ss')}
          </p>
          <p className="text-sm text-muted-foreground">
            {format(currentTime, 'EEEE, MMMM do, yyyy')}
          </p>
        </div>

        {/* Work Progress */}
        {workSession && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Work Progress</span>
              <span className="text-sm text-muted-foreground">
                {progress.hours}h {progress.minutes}m / {workSession.targetHours || 8}h
              </span>
            </div>
            <Progress value={progress.percentage} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progress.percentage.toFixed(1)}% complete</span>
              <span>{progress.remaining.toFixed(1)}h remaining</span>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!workSession && (
            <Button 
              onClick={startWorkDay} 
              disabled={loading}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Work Day
            </Button>
          )}
          
          {isWorkDayActive && (
            <>
              <Button 
                onClick={pauseWorkDay} 
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
              <Button 
                onClick={endWorkDay} 
                disabled={loading}
                variant="destructive"
                className="flex-1"
              >
                <Square className="h-4 w-4 mr-2" />
                End Day
              </Button>
            </>
          )}
          
          {isWorkDayPaused && (
            <>
              <Button 
                onClick={resumeWorkDay} 
                disabled={loading}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
              <Button 
                onClick={endWorkDay} 
                disabled={loading}
                variant="destructive"
                className="flex-1"
              >
                <Square className="h-4 w-4 mr-2" />
                End Day
              </Button>
            </>
          )}
          
          {isWorkDayCompleted && (
            <Button 
              onClick={startWorkDay} 
              disabled={loading}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Start New Day
            </Button>
          )}
        </div>

        {/* Work Session Info */}
        {workSession && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Started: {format(new Date(workSession.startTime), 'HH:mm')}</p>
            {workSession.endTime && (
              <p>Ended: {format(new Date(workSession.endTime), 'HH:mm')}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
