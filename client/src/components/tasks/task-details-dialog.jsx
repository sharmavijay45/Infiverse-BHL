
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog"
// import { Badge } from "../ui/badge"
// import { Button } from "../ui/button"
// import { Separator } from "../ui/separator"
// import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
// import { Edit, MessageSquare, LinkIcon, FileText } from "lucide-react"

// export function TaskDetailsDialog({ task, open, onOpenChange }) {
//   const getStatusColor = (status) => {
//     switch (status) {
//       case "Completed":
//         return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
//       case "In Progress":
//         return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
//       case "Pending":
//         return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20";
//       default:
//         return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
//     }
//   };

//   const getPriorityColor = (priority) => {
//     switch (priority) {
//       case "High":
//         return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
//       case "Medium":
//         return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20";
//       case "Low":
//         return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
//       default:
//         return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
//     }
//   };

//   // Extract file name, URL, and type from notes
//   const getDocumentDetails = (notes, fileType) => {
//     if (!notes) return { url: null, fileName: null, fileType: null };
//     const match = notes.match(/^Document: (.+?) \((.+)\)$/);
//     const fileName = match ? match[2] : "Document";
//     const url = match ? match[1] : notes.replace("Document: ", "");
//     const extension = fileName.match(/\.([a-zA-Z0-9]+)$/i)?.[1]?.toLowerCase();
//     const mimeType = fileType || "";
//     const fileTypeMap = {
//       "application/pdf": "PDF Document",
//       "application/msword": "Word Document",
//       "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word Document",
//       "text/plain": "Text Document",
//       "text/html": "HTML Document",
//     };
//     const displayFileType = fileTypeMap[mimeType] || "Document";
//     return { url, fileName, fileType: displayFileType, mimeType, extension };
//   };

//   const document = getDocumentDetails(task.notes, task.fileType);
//   const isPDF = document.mimeType === "application/pdf";
//   const isHTML = document.mimeType === "text/html";

//   // Modify Cloudinary URL to ensure correct rendering
//   const getDisplayUrl = (url, mimeType) => {
//     if (!url) return url;
//     // For PDFs and HTML, append ?_a=BAE6pY0 to ensure correct content type
//     if (mimeType === "application/pdf" || mimeType === "text/html") {
//       return `${url}?_a=BAE6pY0`;
//     }
//     return url;
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange} className="dialog-overlay">
//       <DialogContent className="dialog-content sm:max-w-[525px]">
//         <DialogHeader>
//           <div className="flex items-center justify-between">
//             <div>
//               <DialogTitle className="text-xl">{task.title}</DialogTitle>
//               <DialogDescription className="text-sm">
//                 {task.id} • {task.department?.name || "Unknown"}
//               </DialogDescription>
//             </div>
//             <Button size="sm" variant="outline">
//               <Edit className="mr-2 h-4 w-4" />
//               Edit
//             </Button>
//           </div>
//         </DialogHeader>

//         <div className="space-y-6">
//           <div className="flex flex-wrap gap-3">
//             <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
//             <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
//             <Badge variant="outline">Due: {task.dueDate || "Not set"}</Badge>
//           </div>

//           <div>
//             <h3 className="text-sm font-medium mb-2">Description</h3>
//             <p className="text-sm text-muted-foreground">
//               {task.description ||
//                 "This is a detailed description of the task. It includes all the necessary information about what needs to be done, the expected outcomes, and any specific requirements or constraints."}
//             </p>
//           </div>

//           <div>
//             <h3 className="text-sm font-medium mb-2">Assignee</h3>
//             <div className="flex items-center gap-2">
//               <Avatar className="h-8 w-8">
//                 <AvatarImage
//                   src={task.assignee?.avatar || "/placeholder.svg?height=32&width=32"}
//                   alt={task.assignee?.name || "Unassigned"}
//                 />
//                 <AvatarFallback>
//                   {task.assignee?.name
//                     ? task.assignee.name
//                         .split(" ")
//                         .map((n) => n[0])
//                         .join("")
//                     : "NA"}
//                 </AvatarFallback>
//               </Avatar>
//               <span className="text-sm">{task.assignee?.name || "Unassigned"}</span>
//             </div>
//           </div>

//           <div>
//             <h3 className="text-sm font-medium mb-2">Dependencies</h3>
//             <div className="space-y-2">
//               {task.dependencies && task.dependencies.length > 0 ? (
//                 task.dependencies.map((dep, index) => (
//                   <div key={index} className="flex items-center gap-2 text-sm">
//                     <LinkIcon className="h-4 w-4 text-muted-foreground" />
//                     <span>{dep.title}</span>
//                   </div>
//                 ))
//               ) : (
//                 <div className="text-sm text-muted-foreground">No dependencies</div>
//               )}
//             </div>
//           </div>

//           <div>
//             <h3 className="text-sm font-medium mb-2">Document</h3>
//             <div className="space-y-2">
//               {document.url ? (
//                 <div className="flex items-center gap-2 text-sm">
//                   <FileText className="h-4 w-4 text-muted-foreground" />
//                   <a
//                     href={getDisplayUrl(document.url, document.mimeType)}
//                     target={isPDF || isHTML ? "_blank" : "_self"}
//                     rel="noopener noreferrer"
//                     download={!isPDF && !isHTML} // Download for non-PDF, non-HTML files
//                     className="text-blue-500 hover:underline"
//                   >
//                     {document.fileName} ({document.fileType})
//                   </a>
//                 </div>
//               ) : (
//                 <div className="text-sm text-muted-foreground">No document attached</div>
//               )}
//             </div>
//           </div>

//           <Separator />

// {/*           <div>
//             <h3 className="text-sm font-medium mb-2">Comments</h3>
//             <div className="space-y-4">
//               <div className="flex gap-3">
//                 <Avatar className="h-8 w-8">
//                   <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Jane Smith" />
//                   <AvatarFallback>JS</AvatarFallback>
//                 </Avatar>
//                 <div className="space-y-1">
//                   <div className="flex items-center gap-2">
//                     <span className="text-sm font-medium">Jane Smith</span>
//                     <span className="text-xs text-muted-foreground">2 days ago</span>
//                   </div>
//                   <p className="text-sm">
//                     I've started working on this task. Will update progress tomorrow.
//                   </p>
//                 </div>
//               </div>
//             </div>

//             <div className="mt-4 flex items-center gap-2">
//               <Button variant="outline" className="w-full">
//                 <MessageSquare className="mr-2 h-4 w-4" />
//                 Add Comment
//               </Button>
//             </div>
//           </div> */}
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }



import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Separator } from "../ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Edit, MessageSquare, LinkIcon, FileText } from "lucide-react"

export function TaskDetailsDialog({ task, open, onOpenChange }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "In Progress":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
      case "Pending":
        return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      case "Medium":
        return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20";
      case "Low":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
    }
  };

  // Extract file name, URL, and type from notes
  const getDocumentDetails = (notes, fileType) => {
    if (!notes) return { url: null, fileName: null, fileType: null };
    const match = notes.match(/^Document: (.+?) \((.+)\)$/);
    const fileName = match ? match[2] : "Document";
    const url = match ? match[1] : notes.replace("Document: ", "");
    const extension = fileName.match(/\.([a-zA-Z0-9]+)$/i)?.[1]?.toLowerCase();
    const mimeType = fileType || "";
    const fileTypeMap = {
      "application/pdf": "PDF Document",
      "application/msword": "Word Document",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word Document",
      "text/plain": "Text Document",
      "text/html": "HTML Document",
    };
    const displayFileType = fileTypeMap[mimeType] || "Document";
    return { url, fileName, fileType: displayFileType, mimeType, extension };
  };

  const document = getDocumentDetails(task.notes, task.fileType);
  const isPDF = document.mimeType === "application/pdf";
  const isHTML = document.mimeType === "text/html";

  // Modify Cloudinary URL to ensure correct rendering
  const getDisplayUrl = (url, mimeType) => {
    if (!url) return url;
    // For PDFs and HTML, append ?_a=BAE6pY0 to ensure correct content type
    if (mimeType === "application/pdf" || mimeType === "text/html") {
      return `${url}?_a=BAE6pY0`;
    }
    return url;
  };

  console.log("task",task)

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="dialog-overlay">
      <DialogContent className="dialog-content sm:max-w-[525px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{task.title}</DialogTitle>
              <DialogDescription className="text-sm">
                {task.id} • {task.department?.name || "Unknown"}
              </DialogDescription>
            </div>
            <Button size="sm" variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
            <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
            <Badge variant="outline">Due: {task.dueDate || "Not set"}</Badge>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Description</h3>
            <p className="text-sm text-muted-foreground">
              {task.description ||
                "This is a detailed description of the task. It includes all the necessary information about what needs to be done, the expected outcomes, and any specific requirements or constraints."}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Assignee</h3>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={task.assignee?.avatar || "/placeholder.svg?height=32&width=32"}
                  alt={task.assignee?.name || "Unassigned"}
                />
                <AvatarFallback>
                  {task.assignee?.name
                    ? task.assignee.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                    : "NA"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{task.assignee?.name || "Unassigned"}</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Dependencies</h3>
            <div className="space-y-2">
              {task.dependencies && task.dependencies.length > 0 ? (
                task.dependencies.map((dep, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{dep.title}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No dependencies</div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Document</h3>
            <div className="space-y-2">
              {document.url ? (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={getDisplayUrl(document.url, document.mimeType)}
                    target={isPDF || isHTML ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    download={!isPDF && !isHTML} // Download for non-PDF, non-HTML files
                    className="text-blue-500 hover:underline"
                  >
                    {document.fileName} ({document.fileType})
                  </a>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No document attached</div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Links</h3>
            <div className="space-y-2">
              {task.links && task.links.length > 0 ? (
                task.links.map((link, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {link}
                    </a>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No links provided</div>
              )}
            </div>
          </div>

          <Separator />

{/*           <div>
            <h3 className="text-sm font-medium mb-2">Comments</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Jane Smith" />
                  <AvatarFallback>JS</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Jane Smith</span>
                    <span className="text-xs text-muted-foreground">2 days ago</span>
                  </div>
                  <p className="text-sm">
                    I've started working on this task. Will update progress tomorrow.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Button variant="outline" className="w-full">
                <MessageSquare className="mr-2 h-4 w-4" />
                Add Comment
              </Button>
            </div>
          </div> */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
