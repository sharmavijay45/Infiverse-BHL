"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import {
  ThumbsUp,
  ThumbsDown,
  Github,
  ExternalLink,
  MessageSquare,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

export function SubmissionFeedbackCard({
  submission,
  onViewDetails,
  onSubmitRevision,
}) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)

  const getStatusIcon = () => {
    if (submission.status === "Approved") {
      return <ThumbsUp className="h-5 w-5 text-green-500" />
    } else if (submission.status === "Rejected") {
      return <ThumbsDown className="h-5 w-5 text-red-500" />
    }
    return null
  }

  const getStatusBadge = () => {
    if (submission.status === "Approved") {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 flex items-center gap-1">
          <ThumbsUp className="h-3 w-3" /> Approved
        </Badge>
      )
    } else if (submission.status === "Rejected") {
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 flex items-center gap-1">
          <ThumbsDown className="h-3 w-3" /> Rejected
        </Badge>
      )
    }
    return null
  }

  const getCardColor = () => {
    if (submission.status === "Approved") {
      return "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
    } else if (submission.status === "Rejected") {
      return "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
    }
    return "bg-muted border-border"
  }

  return (
    <Card className={`overflow-hidden ${getCardColor()}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-base font-semibold">
              {submission.task?.title || "Task Submission"}
            </CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Reviewed on {new Date(submission.updatedAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {submission.feedback && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              Feedback
            </div>
            <div className="bg-background rounded p-3 border text-sm">
              <p className="whitespace-pre-line">
                {expanded || submission.feedback.length <= 150
                  ? submission.feedback
                  : `${submission.feedback.slice(0, 150)}...`}
              </p>
              {submission.feedback.length > 150 && (
                <Button
                  variant="link"
                  className="p-0 h-auto text-xs mt-1"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? "Show less" : "Show more"}
                </Button>
              )}
            </div>
          </div>
        )}

        {submission.githubLink && (
          <div className="flex items-center gap-2 text-sm">
            <Github className="h-4 w-4 text-muted-foreground" />
            <a
              href={submission.githubLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline truncate flex items-center gap-1"
            >
              {submission.githubLink.replace(
                /^https?:\/\/(www\.)?github\.com\//,
                ""
              )}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(submission)}
        >
          View Details
        </Button>
        {submission.status === "Rejected" && (
          <Button size="sm" onClick={() => onSubmitRevision(submission)}>
            Submit Revision
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
