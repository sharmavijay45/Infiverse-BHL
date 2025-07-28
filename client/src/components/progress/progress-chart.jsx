import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";

export function ProgressChart({ history, dueDate }) {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (history && history.length > 0) {
      // Sort history by date
      const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Create chart data with formatted dates
      const data = sortedHistory.map(entry => ({
        date: format(new Date(entry.date), "MMM dd"),
        progress: entry.progressPercentage,
        rawDate: new Date(entry.date),
      }));
      
      // Add due date with 100% target if it's in the future
      const dueDateObj = new Date(dueDate);
      if (dueDateObj > new Date()) {
        data.push({
          date: format(dueDateObj, "MMM dd"),
          target: 100,
          rawDate: dueDateObj,
        });
      }
      
      setChartData(data);
    }
  }, [history, dueDate]);

  if (chartData.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No progress data available</div>;
  }

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
          <XAxis 
            dataKey="date" 
            stroke="#6B7280" 
            fontSize={12} 
            tickLine={false}
          />
          <YAxis 
            stroke="#6B7280" 
            fontSize={12} 
            tickLine={false}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(17, 24, 39, 0.8)",
              border: "none",
              borderRadius: "4px",
              fontSize: "12px",
              color: "#F9FAFB",
            }}
            formatter={(value) => [`${value}%`, "Progress"]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="progress"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
          {chartData.some(item => item.target) && (
            <Line
              type="monotone"
              dataKey="target"
              stroke="#10B981"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4, strokeWidth: 2 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
