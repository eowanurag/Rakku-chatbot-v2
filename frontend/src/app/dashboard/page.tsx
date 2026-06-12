"use client";

import React, { useEffect, useState } from "react";
import PageContainer from "@/components/ui/PageContainer";
import { ServiceCard, ApplicationCard } from "@/components/dashboard";
import LoadingCard from "@/components/ui/LoadingCard";
import EmptyState from "@/components/ui/EmptyState";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [recentApplications, setRecentApplications] = useState<any[]>([]);

  useEffect(() => {
    // Mock fetching recent applications
    setTimeout(() => {
      setRecentApplications([
        { id: "APP-2026-001", type: "Complaint", status: "Submitted", submittedAt: "2026-06-10T10:00:00Z" },
        { id: "APP-2026-002", type: "Verification", status: "Under Review", submittedAt: "2026-06-09T14:30:00Z" }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleServiceClick = (serviceType: string) => {
    // In a real app, this would route to a specific service flow
    console.log(`Starting ${serviceType} flow...`);
    window.location.href = `/chat?trigger=Start ${serviceType}`;
  };

  return (
    <PageContainer>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back. Manage your applications and requests here.</p>
      </div>

      <div className="mb-10">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <ServiceCard title="File Complaint" type="Complaint" onClick={() => handleServiceClick("Complaint")} />
          <ServiceCard title="Tenant Verification" type="Verification" onClick={() => handleServiceClick("Verification")} />
          <ServiceCard title="Character Certificate" type="Certificate" onClick={() => handleServiceClick("Certificate")} />
          <ServiceCard title="Event Permission" type="Permission" onClick={() => handleServiceClick("Permission")} />
          <ServiceCard title="Emergency Assist" type="Emergency" onClick={() => handleServiceClick("Emergency")} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Applications</h2>
        {loading ? (
          <LoadingCard message="Loading applications..." />
        ) : recentApplications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentApplications.map((app) => (
              <ApplicationCard 
                key={app.id} 
                application={app} 
                onClick={() => window.location.href = `/track?id=${app.id}`} 
              />
            ))}
          </div>
        ) : (
          <EmptyState 
            title="No applications found" 
            description="You haven't submitted any applications or requests yet." 
          />
        )}
      </div>
    </PageContainer>
  );
}
