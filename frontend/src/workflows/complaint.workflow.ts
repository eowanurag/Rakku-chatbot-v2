import { WorkflowDefinition } from "../types/workflow.types";

export const complaintWorkflow: WorkflowDefinition = {
  id: "complaint-registration",
  name: "Complaint Registration Workflow",
  steps: [
    {
      id: "complaint_type",
      title: "Complaint Type Selection",
      requiredFields: ["type"],
      isReview: false,
    },
    {
      id: "complaint_details",
      title: "Incident Description",
      requiredFields: ["details"],
      isReview: false,
    },
    {
      id: "citizen_info",
      title: "Citizen Contacts",
      requiredFields: ["name", "mobile"],
      isReview: false,
    },
    {
      id: "review",
      title: "Verify & Submit",
      requiredFields: [],
      isReview: true,
    },
  ],
};
