import { WorkflowDefinition } from "../types/workflow.types";

export const verificationWorkflow: WorkflowDefinition = {
  id: "tenant-verification",
  name: "Tenant / Helper Verification Form",
  steps: [
    {
      id: "tenant_personal",
      title: "Tenant Information",
      requiredFields: ["name", "mobile"],
      isReview: false,
    },
    {
      id: "tenant_address",
      title: "Tenant Address Details",
      requiredFields: ["address"],
      isReview: false,
    },
    {
      id: "property_details",
      title: "Property & Owner Verification",
      requiredFields: ["propertyDetails"],
      isReview: false,
    },
    {
      id: "review",
      title: "Review Details",
      requiredFields: [],
      isReview: true,
    },
  ],
};
