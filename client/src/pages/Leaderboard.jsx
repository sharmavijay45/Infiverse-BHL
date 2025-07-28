import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { useToast } from "../hooks/use-toast";
import { Trophy, Medal, Award } from "lucide-react";

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      // Fetch all users with their task statistics
      const users = await api.users.getUsers();
      const leaderboardData = await Promise.all(
        users.map(async (user) => {
          const tasks = await api.users.getUserTasks(user._id, { status: "Completed" });
          const allTasks = await api.users.getUserTasks(user._id);
          const dependencies = await Promise.all(
            tasks.map(async (task) => {
              const deps = await api.tasks.getTask(task._id);
              return deps.dependencies.length;
            })
          );
          const totalDependencies = dependencies.reduce((sum, count) => sum + count, 0);
          
          return {
            ...user,
            completedTasks: tasks.length,
            totalDependencies,
            workload: allTasks.length - tasks.length, // Pending/In Progress tasks
            completionRate: allTasks.length > 0 ? (tasks.length / allTasks.length) * 100 : 0,
          };
        })
      );

      // Sort by completed tasks (descending)
      const sortedLeaderboard = leaderboardData.sort(
        (a, b) => b.completedTasks - a.completedTasks
      );
      setLeaderboard(sortedLeaderboard);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load leaderboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      const [user, tasks, submissions] = await Promise.all([
        api.users.getUser(userId),
        api.users.getUserTasks(userId),
        api.users.getUserSubmissions(userId),
      ]);

      const completedTasks = tasks.filter((task) => task.status === "Completed");
      const pendingTasks = tasks.filter((task) => task.status !== "Completed");
      
      setUserDetails({
        ...user,
        completedTasks,
        pendingTasks,
        submissions,
        totalTasks: tasks.length,
        completionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load user details",
        variant: "destructive",
      });
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    fetchUserDetails(user._id);
  };

  const getRankBadge = (index) => {
    switch (index) {
      case 0:
        return <Trophy className="h-6 w-6 text-yellow-400" />;
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 2:
        return <Award className="h-6 w-6 text-yellow-600" />;
      default:
        return <span className="text-lg font-bold">{index + 1}</span>;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Task Completion Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Completed Tasks</TableHead>
                  <TableHead>Workload</TableHead>
                  <TableHead>Dependencies</TableHead>
                  <TableHead>Completion Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((user, index) => (
                  <TableRow
                    key={user._id}
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleUserClick(user)}
                  >
                    <TableCell>{getRankBadge(index)}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.department?.name || "N/A"}</TableCell>
                    <TableCell>{user.completedTasks}</TableCell>
                    <TableCell>
                      <Badge variant={user.workload > 5 ? "destructive" : "default"}>
                        {user.workload} tasks
                      </Badge>
                    </TableCell>
                    <TableCell>{user.totalDependencies}</TableCell>
                    <TableCell>{user.completionRate.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}  className="dialog-overlay">
        <DialogContent  className="dialog-content sm:max-w-[525px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details: {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          {userDetails ? (
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p><strong>Email:</strong> {userDetails.email}</p>
                    <p><strong>Role:</strong> {userDetails.role}</p>
                    <p><strong>Department:</strong> {userDetails.department?.name || "N/A"}</p>
                    <p><strong>Total Tasks:</strong> {userDetails.totalTasks}</p>
                    <p><strong>Completion Rate:</strong> {userDetails.completionRate.toFixed(1)}%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p><strong>Completed Tasks:</strong> {userDetails.completedTasks.length}</p>
                    <p><strong>Pending Tasks:</strong> {userDetails.pendingTasks.length}</p>
                    <p><strong>Submissions:</strong> {userDetails.submissions.length}</p>
                    <p>
                      <strong>Average Task Completion Time:</strong>{" "}
                      {userDetails.completedTasks.length > 0
                        ? `${(
                            userDetails.completedTasks.reduce(
                              (sum, task) =>
                                sum +
                                (new Date(task.updatedAt) - new Date(task.createdAt)) /
                                  (1000 * 60 * 60 * 24),
                              0
                            ) / userDetails.completedTasks.length
                          ).toFixed(1)} days`
                        : "N/A"}
                    </p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Completed Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Dependencies</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userDetails.completedTasks.map((task) => (
                        <TableRow key={task._id}>
                          <TableCell>{task.title}</TableCell>
                          <TableCell>{task.department?.name || "N/A"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                task.priority === "High"
                                  ? "destructive"
                                  : task.priority === "Medium"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {task.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(task.dueDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{task.dependencies.length}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div>Loading user details...</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leaderboard;
