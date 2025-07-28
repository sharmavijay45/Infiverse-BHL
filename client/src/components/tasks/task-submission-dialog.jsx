

// "use client"

// import { useState } from "react"
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
// import { Button } from "../ui/button"
// import { Input } from "../ui/input"
// import { Label } from "../ui/label"
// import { Textarea } from "../ui/textarea"
// import { Github, Link2, FileText } from "lucide-react"
// import { useToast } from "../../hooks/use-toast"

// export function TaskSubmissionDialog({ open, onOpenChange, onSubmit, existingSubmission }) {
//   const { toast } = useToast()
//   const [formData, setFormData] = useState({
//     githubLink: existingSubmission?.githubLink || "",
//     notes: existingSubmission?.notes || "",
//   })
//   const [documentFile, setDocumentFile] = useState(null)
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [errors, setErrors] = useState({})

//   const handleChange = (e) => {
//     const { name, value } = e.target
//     setFormData((prev) => ({ ...prev, [name]: value }))
//     if (errors[name]) {
//       setErrors((prev) => ({ ...prev, [name]: "" }))
//     }
//   }

//   const handleFileChange = (e) => {
//     const file = e.target.files[0]
//     if (file) {
//       const validTypes = [
//         "application/pdf",
//         "application/msword",
//         "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//         "image/png",
//         "image/jpeg",
//       ]
//       if (!validTypes.includes(file.type)) {
//         toast({
//           title: "Invalid File",
//           description: "Only PDF, DOC, DOCX, PNG, and JPEG files are allowed.",
//           variant: "destructive",
//         })
//         return
//       }
//       if (file.size > 10 * 1024 * 1024) {
//         toast({
//           title: "File Too Large",
//           description: "File size must be less than 10MB.",
//           variant: "destructive",
//         })
//         return
//       }
//       setDocumentFile(file)
//     }
//   }

//   const validateForm = () => {
//     const newErrors = {}
//     if (formData.githubLink && !isValidGithubUrl(formData.githubLink)) {
//       newErrors.githubLink = "Please enter a valid GitHub repository URL"
//     }
//     setErrors(newErrors)
//     return Object.keys(newErrors).length === 0
//   }

//   const isValidGithubUrl = (string) => {
//     try {
//       const url = new URL(string)
//       return url.hostname === "github.com" && url.pathname.split("/").filter(Boolean).length >= 2
//     } catch (_) {
//       return false
//     }
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     if (!validateForm()) {
//       return
//     }

//     try {
//       const userId = JSON.parse(localStorage.getItem("WorkflowUser")).id
//       setIsSubmitting(true)
//       const submissionData = new FormData()
//       submissionData.append("githubLink", formData.githubLink)
//       submissionData.append("notes", formData.notes)
//       submissionData.append("userId", userId)
//       if (documentFile) {
//         submissionData.append("document", documentFile)
//       }

//       await onSubmit(submissionData)
//     } catch (error) {
//       console.error("Error submitting task:", error)
//       toast({
//         title: "Error",
//         description: "Failed to submit task",
//         variant: "destructive",
//       })
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange} className="dialog-overlay">
//       <DialogContent className="dialog-content sm:max-w-[525px]">
//         <DialogHeader>
//           <DialogTitle>{existingSubmission ? "Edit Submission" : "Submit Task"}</DialogTitle>
//           <DialogDescription>
//             {existingSubmission
//               ? "Update your task submission details below."
//               : "Provide your submission details. All fields are optional."}
//           </DialogDescription>
//         </DialogHeader>
//         <form onSubmit={handleSubmit} className="space-y-4 py-2">
//           <div className="space-y-2">
//             <Label htmlFor="githubLink" className="flex items-center gap-1">
//               <Github className="h-4 w-4" />
//               Repository Link
//             </Label>
//             <Input
//               id="githubLink"
//               name="githubLink"
//               placeholder="https://github.com/username/repository or other repository URL"
//               value={formData.githubLink}
//               onChange={handleChange}
//               className={errors.githubLink ? "border-red-500" : ""}
//             />
//             {errors.githubLink && <p className="text-xs text-red-500">{errors.githubLink}</p>}
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="document" className="flex items-center gap-1">
//               <FileText className="h-4 w-4" />
//               Document or Photo
//             </Label>
//             <Input
//               id="document"
//               name="document"
//               type="file"
//               accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
//               onChange={handleFileChange}
//             />
//             {documentFile && (
//               <p className="text-sm text-muted-foreground">Selected: {documentFile.name}</p>
//             )}
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="notes">Notes</Label>
//             <Textarea
//               id="notes"
//               name="notes"
//               placeholder="Any additional information about your submission..."
//               value={formData.notes}
//               onChange={handleChange}
//               rows={4}
//             />
//           </div>

//           <DialogFooter>
//             <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
//               Cancel
//             </Button>
//             <Button type="submit" disabled={isSubmitting}>
//               {isSubmitting ? "Submitting..." : existingSubmission ? "Update Submission" : "Submit Task"}
//             </Button>
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   )
// }




import { toast } from "react-toastify";

"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Github, Link2, FileText } from "lucide-react"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

export function TaskSubmissionDialog({ open, onOpenChange, onSubmit, existingSubmission }) {

  const [formData, setFormData] = useState({
    githubLink: existingSubmission?.githubLink || "",
    notes: existingSubmission?.notes || "",
  })
  const [documentFile, setDocumentFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/png",
        "image/jpeg",
      ]
      if (!validTypes.includes(file.type)) {
        toast.error("Only PDF, DOC, DOCX, PNG, and JPEG files are allowed.")
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB.")
        return
      }
      setDocumentFile(file)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (formData.githubLink && !isValidGithubUrl(formData.githubLink)) {
      newErrors.githubLink = "Please enter a valid GitHub repository URL"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidGithubUrl = (string) => {
    try {
      const url = new URL(string)
      return url.hostname === "github.com" && url.pathname.split("/").filter(Boolean).length >= 2
    } catch (_) {
      return false
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }

    try {
      const userId = JSON.parse(localStorage.getItem("WorkflowUser")).id
      setIsSubmitting(true)
      const submissionData = new FormData()
      submissionData.append("githubLink", formData.githubLink)
      submissionData.append("notes", formData.notes)
      submissionData.append("userId", userId)
      if (documentFile) {
        submissionData.append("document", documentFile)
      }

      await onSubmit(submissionData);
      toast.success("Task submitted successfully");
    } catch (error) {
      console.error("Error submitting task:", error)
      toast.error("Failed to submit task")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="dialog-overlay">
      <DialogContent className="dialog-content sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{existingSubmission ? "Edit Submission" : "Submit Task"}</DialogTitle>
          <DialogDescription>
            {existingSubmission
              ? "Update your task submission details below."
              : "Provide your submission details. All fields are optional."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="githubLink" className="flex items-center gap-1">
              <Github className="h-4 w-4" />
              Repository Link
            </Label>
            <Input
              id="githubLink"
              name="githubLink"
              placeholder="https://github.com/username/repository or other repository URL"
              value={formData.githubLink}
              onChange={handleChange}
              className={errors.githubLink ? "border-red-500" : ""}
            />
            {errors.githubLink && <p className="text-xs text-red-500">{errors.githubLink}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="document" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Document or Photo
            </Label>
            <Input
              id="document"
              name="document"
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={handleFileChange}
            />
            {documentFile && (
              <p className="text-sm text-muted-foreground">Selected: {documentFile.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any additional information about your submission..."
              value={formData.notes}
              onChange={handleChange}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : existingSubmission ? "Update Submission" : "Submit Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


















