import axios from 'axios';
import { API_URL } from './api';

/**
 * User Search and Details API Functions
 */

// Search users with query
export const searchUsers = async (query) => {
  try {
    const response = await axios.get(`${API_URL}/users/search`, {
      params: { q: query }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching users:', error);
    
    // Mock data fallback for development
    const mockUsers = [
      {
        _id: '1',
        name: 'John Doe',
        email: 'john.doe@company.com',
        role: 'Developer',
        avatar: null,
        joinDate: '2023-01-15',
        completionRate: 85,
        activeTasks: 3,
        completedTasks: 24,
        department: { name: 'Engineering', _id: 'eng1' }
      },
      {
        _id: '2',
        name: 'Jane Smith',
        email: 'jane.smith@company.com',
        role: 'Designer',
        avatar: null,
        joinDate: '2023-03-20',
        completionRate: 92,
        activeTasks: 2,
        completedTasks: 18,
        department: { name: 'Design', _id: 'des1' }
      },
      {
        _id: '3',
        name: 'Mike Johnson',
        email: 'mike.johnson@company.com',
        role: 'Manager',
        avatar: null,
        joinDate: '2022-11-10',
        completionRate: 78,
        activeTasks: 5,
        completedTasks: 45,
        department: { name: 'Management', _id: 'mgmt1' }
      }
    ];

    // Filter mock data based on query
    return mockUsers.filter(user =>
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase()) ||
      user.role.toLowerCase().includes(query.toLowerCase()) ||
      user.department.name.toLowerCase().includes(query.toLowerCase())
    );
  }
};

// Get detailed user information
export const getUserDetails = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    
    // Mock detailed user data
    return {
      _id: userId,
      name: 'John Doe',
      email: 'john.doe@company.com',
      role: 'Developer',
      avatar: null,
      joinDate: '2023-01-15',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      bio: 'Experienced developer with a passion for creating innovative solutions.',
      skills: ['React', 'Node.js', 'Python', 'AWS', 'Docker'],
      completionRate: 85,
      totalTasks: 67,
      completedTasks: 57,
      inProgressTasks: 3,
      overdueTasks: 1,
      averageCompletionTime: '2.3 days',
      performanceScore: 8.7,
      department: { name: 'Engineering', _id: 'eng1' },
      recentActivity: [
        { date: '2024-01-15', action: 'Completed task: API Integration', type: 'completed' },
        { date: '2024-01-14', action: 'Started task: Database Optimization', type: 'started' },
        { date: '2024-01-13', action: 'Commented on: UI Review', type: 'comment' },
      ]
    };
  }
};

// Get user's tasks
export const getUserTasks = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/users/${userId}/tasks`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    
    // Mock task data
    return [
      {
        _id: '1',
        title: 'API Integration for User Management',
        status: 'Completed',
        priority: 'High',
        dueDate: '2024-01-15',
        completedDate: '2024-01-15',
        department: { name: 'Engineering' },
        progress: 100
      },
      {
        _id: '2',
        title: 'Database Schema Optimization',
        status: 'In Progress',
        priority: 'Medium',
        dueDate: '2024-01-20',
        department: { name: 'Engineering' },
        progress: 65
      },
      {
        _id: '3',
        title: 'Code Review for Authentication Module',
        status: 'Pending',
        priority: 'Low',
        dueDate: '2024-01-25',
        department: { name: 'Engineering' },
        progress: 0
      },
      {
        _id: '4',
        title: 'Frontend Component Library',
        status: 'Completed',
        priority: 'Medium',
        dueDate: '2024-01-10',
        completedDate: '2024-01-10',
        department: { name: 'Engineering' },
        progress: 100
      },
      {
        _id: '5',
        title: 'Performance Optimization',
        status: 'Completed',
        priority: 'High',
        dueDate: '2024-01-05',
        completedDate: '2024-01-05',
        department: { name: 'Engineering' },
        progress: 100
      }
    ];
  }
};

// Calculate user statistics
export const calculateUserStats = (tasks) => {
  const total = tasks.length;
  const completed = tasks.filter(task => task.status === 'Completed').length;
  const inProgress = tasks.filter(task => task.status === 'In Progress').length;
  const pending = tasks.filter(task => task.status === 'Pending').length;
  const overdue = tasks.filter(task => {
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    return task.status !== 'Completed' && dueDate < today;
  }).length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    inProgress,
    pending,
    overdue,
    completionRate
  };
};

// Get user performance metrics
export const getUserPerformance = async (userId) => {
  try {
    const tasks = await getUserTasks(userId);
    const stats = calculateUserStats(tasks);
    
    // Calculate average completion time (mock calculation)
    const completedTasks = tasks.filter(task => task.status === 'Completed');
    const avgCompletionTime = completedTasks.length > 0 ? '2.3 days' : 'N/A';
    
    // Calculate performance score (mock calculation)
    const performanceScore = Math.min(10, (stats.completionRate / 10) + (stats.completed * 0.1));
    
    return {
      ...stats,
      avgCompletionTime,
      performanceScore: Math.round(performanceScore * 10) / 10
    };
  } catch (error) {
    console.error('Error calculating user performance:', error);
    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
      overdue: 0,
      completionRate: 0,
      avgCompletionTime: 'N/A',
      performanceScore: 0
    };
  }
};
