import { WorkflowDefinition } from "../types/workflow.types";

export const certificateWorkflow: WorkflowDefinition = {
  id: "character-certificate",
  name: "Character Certificate Application",
  steps: [
    {
      id: "personal_details",
      title: "Personal Information",
      requiredFields: ["name", "address"],
      isReview: false,
    },
    {
      id: "district_purpose",
      title: "District & Purpose",
      requiredFields: ["district", "purpose"],
      isReview: false,
    },
    {
      id: "review",
      title: "Review Application",
      requiredFields: [],
      isReview: true,
    },
  ],
};
