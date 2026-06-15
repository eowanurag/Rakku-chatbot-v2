import { request, ApiError } from "../../../lib/api/apiClient";
import { EngineResponse } from "../../../types/workflow.types";
import { EngineResponseSchema } from "../../../lib/validation/workflow.schema";
import { ROUTES } from "../../../config/routes";

export class WorkflowDispatcher {
  /**
   * Sends user message to the workflow backend engine and normalizes the response.
   * If FastAPI AI engine fails or is offline, re-routes requests through the NestJS gateway fallback.
   */
  static async dispatchMessage(
    message: string,
    sessionId: string,
    options?: {
      latitude?: number;
      longitude?: number;
      language?: string;
    }
  ): Promise<EngineResponse> {
    const payload = {
      message,
      sessionId,
      latitude: options?.latitude,
      longitude: options?.longitude,
      language: options?.language,
    };

    try {
      // 1. Try FastAPI AI Workflow engine via the routing gateway
      const rawResponse = await request<any>(ROUTES.API.CHAT, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      return this.normalizeResponse(rawResponse, "FastAPI");
    } catch (error: any) {
      console.warn("Primary AI Workflow Engine (FastAPI) failed. Attempting NestJS fallback routing...", error);
      
      try {
        // 2. Try Fallback Routing via NestJS Engine gateway
        const rawResponse = await request<any>("/fallback/chat", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        return this.normalizeResponse(rawResponse, "NestJS");
      } catch (fallbackError: any) {
        console.error("All backend workflow engines are currently offline. Running client-side standalone simulation.");
        return this.runClientSimulation(message, sessionId);
      }
    }
  }

  /**
   * Normalizes FastAPI or NestJS raw responses to match the EngineResponse contract.
   */
  private static normalizeResponse(raw: any, source: "FastAPI" | "NestJS"): EngineResponse {
    // Adapter mapping to support divergent key formats between FastAPI/NestJS
    const normalized: EngineResponse = {
      sessionId: raw.sessionId || raw.session_id || "",
      workflowId: raw.workflowId || raw.workflow_id || undefined,
      textResponse: raw.textResponse || raw.response || raw.message || "",
      suggestions: raw.suggestions || raw.quickReplies || undefined,
      formTemplate: raw.formTemplate || raw.form_template || raw.fields || undefined,
      nextStep: raw.nextStep || raw.next_step || undefined,
      workflowStatus: (raw.workflowStatus || raw.workflow_status || "ACTIVE").toUpperCase() as any,
      isUrgent: !!(raw.isUrgent || raw.is_urgent),
    };

    // Validate using Zod at runtime
    const parsed = EngineResponseSchema.safeParse(normalized);
    if (!parsed.success) {
      console.error("EngineResponse validation mismatch:", parsed.error.format());
      return normalized; // Fallback to raw normalized if parsing validation yields errors
    }

    return parsed.data;
  }

  /**
   * Handles local fallback simulation for offline/demo operations.
   */
  private static runClientSimulation(message: string, sessionId: string): EngineResponse {
    const cleanMsg = message.toLowerCase();

    if (cleanMsg.includes("danger") || cleanMsg.includes("assault") || cleanMsg.includes("emergency") || cleanMsg.includes("stolen")) {
      return {
        sessionId,
        textResponse: "⚠️ **EMERGENCY NOTICE:** This appears to be an emergency. Please contact UP Police emergency services immediately by dialing **112**.",
        suggestions: ["File Complaint", "Main Dashboard"],
        isUrgent: true,
        workflowStatus: "ACTIVE",
      };
    }

    if (cleanMsg.includes("tenant") || cleanMsg.includes("kiraye")) {
      return {
        sessionId,
        workflowId: "tenant-verification",
        textResponse: "📋 **[Verification Form]** Let's start Tenant Verification.\n👉 Please enter the **Full Name** of the tenant:",
        suggestions: [],
        workflowStatus: "ACTIVE",
        nextStep: "tenant_name",
      };
    }

    if (cleanMsg.includes("character") || cleanMsg.includes("charitra")) {
      return {
        sessionId,
        workflowId: "character-certificate",
        textResponse: "📋 **[Character Certificate]** Let's start the application.\n👉 Please enter your **Full Name**:",
        suggestions: [],
        workflowStatus: "ACTIVE",
        nextStep: "citizen_name",
      };
    }

    return {
      sessionId,
      textResponse: "👮 **Rakku (Client Standalone):** I am running in local offline demo mode. I can help you guide through services. Type 'File Complaint' or 'Tenant Verification' to start simulated workflows.\n\n📱 *For full official assistance, please download the official **UPCOP Mobile App** from the [Google Play Store](https://play.google.com/store/apps/details?id=com.up.uppolice).*",
      suggestions: ["File Complaint", "Tenant Verification", "Character Certificate", "Track Application"],
      workflowStatus: "ACTIVE",
    };
  }
}
