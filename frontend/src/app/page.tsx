"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, 
  ShieldCheck, 
  UserCheck, 
  CalendarDays, 
  Search, 
  HelpCircle,
  TrendingUp,
  Clock,
  CheckCircle2,
  Users
} from "lucide-react";
import { PortalService } from "../services/api";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    complaintsFiled: 14205,
    verificationsCleared: 95480,
    certificatesIssued: 48512,
    responseTimeMins: 12.5
  });

  useEffect(() => {
    PortalService.getQuickStats().then(setStats);
  }, []);

  const quickActions = [
    {
      title: "File Complaint",
      desc: "Report theft, lost items (mobiles/documents) or simple harassment online.",
      icon: <FileText className="w-6 h-6 text-police-red" />,
      query: "I want to file a complaint",
      color: "border-l-4 border-police-red"
    },
    {
      title: "Tenant Verification",
      desc: "Register and verify details of tenants, PG guests, and domestic helpers.",
      icon: <ShieldCheck className="w-6 h-6 text-police-gold" />,
      query: "Tenant verification karna hai",
      color: "border-l-4 border-police-gold"
    },
    {
      title: "Character Certificate",
      desc: "Apply for official character certificates for jobs or visa requirements.",
      icon: <UserCheck className="w-6 h-6 text-blue-400" />,
      query: "I need a character certificate for a job",
      color: "border-l-4 border-blue-400"
    },
    {
      title: "Event Permission",
      desc: "Request NOC/permissions for events, processions, protests, or film shooting.",
      icon: <CalendarDays className="w-6 h-6 text-emerald-400" />,
      query: "Request event permission",
      color: "border-l-4 border-emerald-400"
    },
    {
      title: "Track Application",
      desc: "Check real-time processing status of your registered request or FIR.",
      icon: <Search className="w-6 h-6 text-purple-400" />,
      color: "border-l-4 border-purple-400",
      href: "/track"
    },
    {
      title: "Ask a Question",
      desc: "Consult Rakku regarding police procedures, postmortem reports, and FAQs.",
      icon: <HelpCircle className="w-6 h-6 text-cyan-400" />,
      query: "What are the police services available?",
      color: "border-l-4 border-cyan-400"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col justify-center">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12 animate-fade-in-up">
        {/* Left text column */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
            <span className="inline-block px-3 py-1 bg-police-navy-light text-police-gold border border-police-gold/20 text-xs font-semibold rounded-full uppercase tracking-widest glow-gold">
              Uttar Pradesh Police Citizen Initiative
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight flex items-center justify-center md:justify-start space-x-3">
            <img src="/up_police_logo.png" alt="UP Police" className="w-12 h-12 object-contain" />
            <span>Rakku Digital Assistant</span>
          </h2>
          <p className="mt-3 text-lg text-slate-400 font-light">
            &ldquo;Rakku, Your Digital Raksak&rdquo;
          </p>
          <p className="mt-4 text-sm text-slate-500 max-w-xl">
            An AI-powered interface helping citizens file complaints, verify tenants, request character checks, track status, and understand legal procedures easily in English, Hindi, and Hinglish.
          </p>
          <div className="mt-8 flex flex-col items-center md:items-start gap-3">
            <span className="inline-block px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20 text-xs font-bold rounded-full uppercase tracking-wide w-fit">
              🤝 May I Help You?
            </span>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <a
                href="/chat"
                className="btn-primary px-6 py-3 text-white text-sm font-semibold rounded-lg shadow-md border transition-all duration-200 transform hover:-translate-y-0.5"
              >
                Start Chatting with Rakku
              </a>
              <a
                href="/track"
                className="px-6 py-3 bg-police-navy-light hover:bg-police-navy border border-slate-700 text-slate-300 text-sm font-semibold rounded-lg shadow-md transition-all duration-200"
              >
                Track Status
              </a>
            </div>
          </div>
        </div>

        {/* Right Officer image column */}
        <div className="flex-shrink-0 w-72 md:w-80 glass-panel rounded-2xl p-4 border-slate-800 flex flex-col items-center shadow-lg border relative">
          {/* Speech Bubble */}
          <div className="speech-bubble-welcome absolute -top-4 -left-4 text-xs font-extrabold px-3.5 py-1.5 rounded-xl border shadow-lg animate-bounce z-10">
            💬 "May I Help You?"
          </div>
          <img src="/rakku_officer.png" alt="Officer Rakku" className="w-full h-80 object-cover object-top rounded-xl shadow border border-police-gold/15" />
          <div className="mt-3 text-center">
            <span className="text-sm font-bold text-white block">Inspector Rakku</span>
            <span className="text-[10px] text-police-gold font-semibold uppercase tracking-wider block">Your Digital Police Assistant</span>
          </div>
        </div>
      </div>

      {/* Stats Counter Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <div className="glass-panel rounded-xl p-5 border-slate-800 text-center">
          <div className="flex justify-center mb-2">
            <div className="p-2 bg-police-red/10 rounded-lg">
              <FileText className="w-5 h-5 text-police-red-light" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{stats.complaintsFiled.toLocaleString()}+</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Complaints Lodged</p>
        </div>
        <div className="glass-panel rounded-xl p-5 border-slate-800 text-center">
          <div className="flex justify-center mb-2">
            <div className="p-2 bg-police-gold/10 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-police-gold" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{stats.verificationsCleared.toLocaleString()}+</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Tenant Verifications</p>
        </div>
        <div className="glass-panel rounded-xl p-5 border-slate-800 text-center">
          <div className="flex justify-center mb-2">
            <div className="p-2 bg-blue-400/10 rounded-lg">
              <UserCheck className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{stats.certificatesIssued.toLocaleString()}+</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Certificates Issued</p>
        </div>
        <div className="glass-panel rounded-xl p-5 border-slate-800 text-center">
          <div className="flex justify-center mb-2">
            <div className="p-2 bg-emerald-400/10 rounded-lg">
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{stats.responseTimeMins}m</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Avg Dispatch Time</p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-2">
          Citizen Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, idx) => (
            <div 
              key={idx}
              className={`glass-panel glass-panel-hover rounded-xl p-6 transition-all duration-300 flex flex-col justify-between ${action.color} group`}
            >
              <div>
                <div className="p-3 bg-slate-800/50 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform">
                  {action.icon}
                </div>
                <h4 className="text-base font-semibold text-white group-hover:text-police-gold transition-colors">{action.title}</h4>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed font-light">{action.desc}</p>
              </div>
              
              <div className="mt-6">
                {action.href ? (
                  <a
                    href={action.href}
                    className="text-xs font-semibold text-slate-300 hover:text-white flex items-center space-x-1 transition-colors"
                  >
                    <span>Open Module</span>
                    <span>→</span>
                  </a>
                ) : (
                  <a
                    href={`/chat?trigger=${encodeURIComponent(action.query || "")}`}
                    className="text-xs font-semibold text-slate-300 hover:text-white flex items-center space-x-1 transition-colors"
                  >
                    <span>Start Guided Workflow</span>
                    <span>→</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Badge Footer Info */}
      <div className="mt-16 border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between text-slate-500 text-xs">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <div className="flex items-center space-x-1.5 text-police-gold">
            <ShieldCheck className="w-4 h-4" />
            <span className="font-semibold">CCTNS Integrated</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-semibold">SSL Encrypted</span>
          </div>
        </div>
        <p className="text-center md:text-right font-light">
          For emergency dial 112 directly. Do not report active crimes here.
        </p>
      </div>
    </div>
  );
}
