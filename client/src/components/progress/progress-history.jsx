import { format } from "date-fns";
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export function ProgressHistory({ history }) {
  // Sort history by date (newest first)
  const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-4">
      {sortedHistory.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">No progress history available</div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-6">
            {sortedHistory.map((entry, index) => (
              <div key={entry._id || index} className="relative pl-10">
                <div className="absolute left-0 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border">
                  {getProgressIcon(entry.progressPercentage)}
                </div>
                <div className="bg-card rounded-lg p-4 border border-border">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                    <h4 className="font-medium">Progress: {entry.progressPercentage}%</h4>
                    <time className="text-sm text-muted-foreground">
                      {format(new Date(entry.date), "PPP 'at' p")}
                    </time>
                  </div>
                  
                  {entry.notes && (
                    <div className="mt-2">
                      <h5 className="text-sm font-medium mb-1">Notes</h5>
                      <p className="text-sm text-muted-foreground">{entry.notes}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                    {entry.blockers && (
                      <div>
                        <h5 className="text-sm font-medium mb-1 flex items-center">
                          <AlertTriangle className="h-3.5 w-3.5 mr-1 text-amber-500" />
                          Blockers
                        </h5>
                        <p className="text-sm text-muted-foreground">{entry.blockers}</p>
                      </div>
                    )}
                    
                    {entry.achievements && (
                      <div>
                        <h5 className="text-sm font-medium mb-1 flex items-center">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                          Achievements
                        </h5>
                        <p className="text-sm text-muted-foreground">{entry.achievements}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getProgressIcon(progress) {
  if (progress >= 75) {
    return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  } else if (progress >= 25) {
    return <Info className="h-4 w-4 text-blue-500" />;
  } else {
    return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  }
}
