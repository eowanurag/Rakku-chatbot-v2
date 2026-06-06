import type { Metadata } from "next";
import "./globals.css";
import ThemeToggle from "./components/ThemeToggle";

export const metadata: Metadata = {
  title: "Rakku - Your Digital Raksak | Uttar Pradesh Police Citizen Services",
  description: "AI-powered digital assistant for Uttar Pradesh Police Citizen Services. Get guidance on Complaints, Tenant Verification, Character Certificates, and Event Permissions.",
  keywords: "UP Police, Digital Raksak, UPCOP, Citizen Services, Tenant Verification, Character Certificate, Complaint, Uttar Pradesh, Rakku",
  authors: [{ name: "UP Police Tech Division" }],
  viewport: "width=device-width, initial-scale=1.0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          body {
            font-family: 'Outfit', sans-serif;
          }
        `}</style>
      </head>
      <body className="h-full bg-gradient-mesh flex flex-col">
        {/* Header */}
        <header className="border-b border-slate-800 bg-police-navy/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/up_police_logo.png" alt="UP Police Logo" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-lg font-bold text-white tracking-wider flex items-center space-x-2">
                  <span>RAKKU</span>
                  <span className="text-xs px-2 py-0.5 bg-police-red text-white rounded font-normal tracking-normal">PROTOTYPE</span>
                </h1>
                <p className="text-[10px] text-police-gold font-medium uppercase tracking-widest">Your Digital Raksak</p>
              </div>
            </div>
            
            <nav className="hidden md:flex space-x-6">
              <a href="/" className="text-slate-300 hover:text-police-gold text-sm font-medium transition-colors">Home</a>
              <a href="/chat" className="text-slate-300 hover:text-police-gold text-sm font-medium transition-colors">Chat Assistant</a>
              <a href="/track" className="text-slate-300 hover:text-police-gold text-sm font-medium transition-colors">Track Application</a>
            </nav>

            <div className="flex items-center space-x-3">
              <div className="flex flex-col text-right hidden sm:block">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">UP Police Emergency</span>
                <span className="text-xs text-police-red-light font-bold flex items-center justify-end space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-police-red-light animate-ping"></span>
                  <span>Dial 112</span>
                </span>
              </div>
              <ThemeToggle />
              <a 
                href="/chat" 
                className="btn-primary px-4 py-2 text-white text-xs font-semibold rounded shadow transition-all duration-200 border transform hover:-translate-y-0.5"
              >
                Launch Chat
              </a>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-police-navy-dark py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4">
            <p>© {new Date().getFullYear()} Uttar Pradesh Police Citizen Services Support Portal.</p>
            <p className="mt-1 text-[10px] text-slate-600">This is a concept prototype named Rakku, designed for architectural demonstration. No real legal data or police records are processed.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
