"use client";

import React, { useState } from "react";
import axios from "axios";
import { 
  Sparkles, Copy, Check, Terminal, Code2, 
  Briefcase, RefreshCw, FileText, Download, 
  Cpu, Layers, CheckCircle2, ShieldCheck, Lightbulb, Activity, UploadCloud, FileType, Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MatchResult {
  score: number;
  strong_matches: string[];
  missing_skills: string[];
  suggestions: string[];
  extracted_cv_text?: string;
}

export default function Home() {
  const [mode, setMode] = useState<"proposal" | "cv" | "ats">("proposal");
  
  // Proposal Matrix States
  const [proposalInput, setProposalInput] = useState("");
  const [proposalOutput, setProposalOutput] = useState("");
  
  // AI CV PDF Engine States
  const [cvInput, setCvInput] = useState("");
  const [cvTextPreview, setCvTextPreview] = useState("");
  const [base64Pdf, setBase64Pdf] = useState("");

  // ATS Profiler Match States
  const [atsCvInput, setAtsCvInput] = useState("");
  const [atsJobInput, setAtsJobInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [useUploadMode, setUseUploadMode] = useState(true); 
  const [matchData, setMatchData] = useState<MatchResult | null>(null);
  
  // System State Indicators
  const [loading, setLoading] = useState(false);
  const [compilingAtsPdf, setCompilingAtsPdf] = useState(false);
  const [copied, setCopied] = useState(false);
  const [injectedSkills, setInjectedSkills] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        setSelectedFile(file);
      } else {
        alert("Please select a valid PDF document layout asset.");
      }
    }
  };

  const copyToClipboard = () => {
    const textToCopy = mode === "proposal" ? proposalOutput : cvTextPreview;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handles injection into current working configurations
  const injectSkillIntoCvBuffer = (skill: string) => {
    if (injectedSkills.includes(skill)) return;
    setInjectedSkills(prev => [...prev, skill]);
  };

  // Compile modified document directly from the ATS stream
  const downloadAtsUpdatedPdf = async () => {
    // 1. Validation checks
    const baselineText = matchData?.extracted_cv_text || atsCvInput || cvInput;
    if (!baselineText) {
        alert("No baseline CV layout text found to optimize.");
        return;
    }
    if (injectedSkills.length === 0) {
        alert("Please select and inject missing skills first.");
        return;
    }

    // 2. Set backend URL
    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://127.0.0.1:8000";
    setCompilingAtsPdf(true);

    try {
        // 3. API Request to the corrected backend URL
        const res = await axios.post(`${API_BASE}/inject-skills-to-cv`, {
            cv_text: baselineText,
            skills_to_add: injectedSkills
        });
        
        console.log("Backend Response:", res.data); // Helpful for debugging

        // 4. Safely extract PDF data
        const targetedPdfData = res.data?.pdf_data;
        
        if (targetedPdfData) {
            const byteCharacters = atob(targetedPdfData);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) { 
                byteNumbers[i] = byteCharacters.charCodeAt(i); 
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: "application/pdf" });
            
            // 5. Trigger browser download
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "Optimized_RaahimZia_CV.pdf");
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url); // Clean up memory
        } else {
            console.error("No PDF data found in response:", res.data);
            alert("Compilation failed: No PDF data returned from server.");
        }
    } catch (err: any) {
        console.error("Download Error:", err);
        // This will now show the actual error if the backend 404s or crashes
        const errorMsg = err.response?.data?.error || "Error building download stream from the source file.";
        alert(errorMsg);
    } finally {
        setCompilingAtsPdf(false);
    }
};

  // Main system engine execution mapping router
  const handleGenerate = async () => {
    setLoading(true);
    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://127.0.0.1:8000";

    try {
        if (mode === "proposal") {
            if (!proposalInput.trim()) return;
            const res = await axios.post(`${API_BASE}/generate`, { job_description: proposalInput });
            setProposalOutput(res.data.proposal);
        } else if (mode === "cv") {
            if (!cvInput.trim()) return;
            const res = await axios.post(`${API_BASE}/generate-cv`, { personal_details: cvInput });
            if (res.data.error) setCvTextPreview(res.data.error);
            else { setCvTextPreview(res.data.text_preview); setBase64Pdf(res.data.pdf_data); }
        } else {
            setMatchData(null);
            if (useUploadMode) {
                if (!selectedFile || !atsJobInput.trim()) return;
                const formData = new FormData();
                formData.append("file", selectedFile);
                formData.append("job_description", atsJobInput);
                const res = await axios.post(`${API_BASE}/match-upload`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                setMatchData(res.data);
            } else {
                const res = await axios.post(`${API_BASE}/match-score`, { cv_text: atsCvInput, job_description: atsJobInput });
                setMatchData(res.data);
            }
        }
    } catch (err) {
        console.error(err);
        alert("Connection Error: Check if your FastAPI backend is active at " + API_BASE);
    } finally {
        setLoading(false);
    }
};

  const downloadPdfFile = () => {
    if (!base64Pdf) return;
    const byteCharacters = atob(base64Pdf);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) { byteNumbers[i] = byteCharacters.charCodeAt(i); }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Professional_CV.pdf");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const radius = 52;
  const strokeDashoffset = matchData ? ((100 - matchData.score) / 100) * (2 * Math.PI * radius) : 2 * Math.PI * radius;

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex font-sans relative overflow-hidden">
      
      {/* Background Ambience Layer */}
      <div className="absolute top-[-10%] left-[-10%] w-[50rem] h-[50rem] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45rem] h-[45rem] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Unified Master Sidebar Mapping */}
      <aside className="w-80 border-r border-slate-800/40 bg-[#0b1120]/70 backdrop-blur-xl p-6 flex flex-col justify-between hidden lg:flex z-20">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)]">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent block">RAAHIM CORE</span>
              <span className="text-[10px] font-mono tracking-widest text-indigo-400/80 uppercase block">Agent v2.7.0</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase block px-1 mb-3">System Modules</span>
            
            <button onClick={() => setMode("proposal")} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all ${mode === "proposal" ? "bg-gradient-to-r from-indigo-600/15 to-violet-600/5 border-indigo-500/30 text-white" : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"}`}>
              <Briefcase className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium tracking-wide">Proposal Matrix</span>
            </button>

            <button onClick={() => setMode("cv")} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all ${mode === "cv" ? "bg-gradient-to-r from-indigo-600/15 to-violet-600/5 border-indigo-500/30 text-white" : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"}`}>
              <FileText className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium tracking-wide">AI CV PDF Engine</span>
            </button>

            <button onClick={() => setMode("ats")} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all ${mode === "ats" ? "bg-gradient-to-r from-indigo-600/15 to-violet-600/5 border-indigo-500/30 text-white" : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"}`}>
              <Activity className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium tracking-wide">ATS Profiler Match</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Working Framework Canvas Layout */}
      <main className="flex-1 flex flex-col p-6 lg:p-10 max-w-7xl mx-auto w-full z-10 relative overflow-y-auto">
        <header className="mb-8 border-b border-slate-900 pb-6">
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white mb-2 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            {mode === "proposal" ? "High-Conversion Proposal Suite" : mode === "cv" ? "Executive Blueprint Document Compiler" : "Semantic ATS Diagnostic Profiler"}
          </h1>
          <p className="text-xs text-slate-400 tracking-wide">
            {mode === "proposal" && "Transform messy raw client specifications into custom high-converting Upwork bids."}
            {mode === "cv" && "Compile markdown details into standard structured enterprise technical portfolios."}
            {mode === "ats" && "Drop your original resume asset file, track missing stacks, and output calibrated versions instantly."}
          </p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start flex-1 w-full">
          
          {/* LEFT INTERACTIVE DYNAMIC CONFIGURATION FORM */}
          <div className="h-full flex flex-col">
            <div className="bg-[#0b1120]/50 border border-slate-800/50 rounded-2xl p-5 backdrop-blur-md flex-1 flex flex-col relative">
              <div className="flex items-center justify-between mb-3.5 border-b border-slate-900 pb-2">
                <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" /> System Workspace Inputs
                </label>
                {mode === "ats" && (
                  <div className="flex bg-slate-950/80 rounded-lg p-0.5 border border-slate-800 text-[10px] font-mono">
                    <button onClick={() => setUseUploadMode(true)} className={`px-2 py-1 rounded-md transition-colors ${useUploadMode ? "bg-indigo-600 text-white" : "text-slate-400"}`}>Upload PDF</button>
                    <button onClick={() => setUseUploadMode(false)} className={`px-2 py-1 rounded-md transition-colors ${!useUploadMode ? "bg-indigo-600 text-white" : "text-slate-400"}`}>Raw Text</button>
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col gap-4 min-h-[360px]">
                <AnimatePresence mode="wait">
                  {mode === "proposal" && (
                    <motion.textarea key="pIn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} value={proposalInput} onChange={(e) => setProposalInput(e.target.value)} placeholder="Paste job descriptions or client parameters here..." className="w-full flex-1 bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 text-slate-200 text-sm resize-none focus:outline-none focus:border-indigo-500/30" />
                  )}
                  {mode === "cv" && (
                    <motion.textarea key="cIn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} value={cvInput} onChange={(e) => setCvInput(e.target.value)} placeholder="Type background stats like profile name, frameworks, history benchmarks, metrics..." className="w-full flex-1 bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 text-slate-200 text-sm resize-none focus:outline-none focus:border-indigo-500/30" />
                  )}
                  {mode === "ats" && (
                    <motion.div key="atsIn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col gap-4">
                      {useUploadMode ? (
                        <div className="h-2/5 relative border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/20 p-4 flex flex-col items-center justify-center text-center">
                          <input type="file" accept=".pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                          {selectedFile ? (
                            <div className="flex flex-col items-center gap-1.5">
                              <FileType className="w-8 h-8 text-indigo-400" />
                              <p className="text-xs text-slate-200 font-medium font-mono truncate max-w-[240px]">{selectedFile.name}</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <UploadCloud className="w-8 h-8 text-slate-600" />
                              <p className="text-xs text-slate-300 font-medium">Select original RaahimZia_CV.pdf asset copy</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <textarea value={atsCvInput} onChange={(e) => setAtsCvInput(e.target.value)} placeholder="Paste full baseline text here..." className="w-full h-2/5 bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 text-slate-200 text-xs resize-none focus:outline-none" />
                      )}
                      <textarea value={atsJobInput} onChange={(e) => setAtsJobInput(e.target.value)} placeholder="Paste targeting enterprise metrics description parameters..." className="w-full h-3/5 bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 text-slate-200 text-xs resize-none focus:outline-none" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={handleGenerate} 
                disabled={loading || (mode === "proposal" ? !proposalInput.trim() : mode === "cv" ? !cvInput.trim() : (useUploadMode ? (!selectedFile || !atsJobInput.trim()) : (!atsCvInput.trim() || !atsJobInput.trim())))}
                className="w-full mt-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 text-white font-semibold text-sm py-3.5 rounded-xl transition-all"
              >
                {loading ? "PROCESSING CRITERIA CHANNELS..." : mode === "proposal" ? "Compile System Proposals" : mode === "cv" ? "Build Digital Resume PDF" : "Execute System Optimization Scan"}
              </button>
            </div>
          </div>

          {/* RIGHT TERMINAL VIEWPORT SCREEN LAYER */}
          <div className="h-full flex flex-col">
            <div className="bg-[#0b1120]/50 border border-slate-800/50 rounded-2xl p-5 backdrop-blur-md flex-1 flex flex-col min-h-[420px] relative">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800/40 pb-3.5">
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" /> Terminal Monitor Output
                </span>
                
                {/* Proposal / Text copy actions */}
                {((mode === "proposal" && proposalOutput) || (mode === "cv" && cvTextPreview)) && !loading && (
                  <button onClick={copyToClipboard} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied!" : "Copy"}</span>
                  </button>
                )}

                {/* CV PDF Download Action */}
                {mode === "cv" && base64Pdf && !loading && (
                  <button onClick={downloadPdfFile} className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 py-1.5 px-3 rounded-xl ml-2 hover:bg-emerald-500/20">
                    <Download className="w-3.5 h-3.5" /> Download Core CV PDF
                  </button>
                )}
                
                {/* ATS Real-time direct compilation file trigger */}
                {mode === "ats" && matchData && injectedSkills.length > 0 && !loading && (
                  <button onClick={downloadAtsUpdatedPdf} disabled={compilingAtsPdf} className="flex items-center gap-1.5 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 py-1.5 px-3 rounded-xl hover:bg-indigo-500/20 transition-all">
                    {compilingAtsPdf ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>Compile & Download New CV</span>
                  </button>
                )}
              </div>

              <div className="flex-1 flex flex-col bg-[#05070f]/70 border border-slate-900 rounded-xl p-4 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {loading && (
                    <div className="space-y-4 w-full mt-2">
                      <div className="h-3.5 bg-slate-900 rounded-md animate-pulse w-3/4" />
                      <div className="h-3.5 bg-slate-900 rounded-md animate-pulse w-5/6" />
                    </div>
                  )}

                  {!loading && mode === "proposal" && proposalOutput && (
                    <div className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">{proposalOutput}</div>
                  )}

                  {!loading && mode === "cv" && cvTextPreview && (
                    <div className="text-indigo-300 text-xs whitespace-pre-wrap font-mono leading-relaxed">{cvTextPreview}</div>
                  )}
                  
                  {!loading && mode === "ats" && matchData && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full text-left">
                      <div className="flex items-center gap-6 p-4 bg-slate-950/60 border border-slate-900 rounded-2xl">
                        <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="56" cy="56" r={radius} className="stroke-slate-800" strokeWidth="8" fill="transparent" />
                            <circle cx="56" cy="56" r={radius} className="stroke-indigo-500" strokeWidth="8" fill="transparent" strokeDasharray={2 * Math.PI * radius} strokeDashoffset={strokeDashoffset} />
                          </svg>
                          <span className="absolute text-xl font-black text-white">{matchData.score}%</span>
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-sm flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-indigo-400" /> Diagnostic Profile Match</h4>
                          <p className="text-[11px] text-slate-400 mt-1">Select missing tools beneath to directly append keywords into your active file structure layer parameters.</p>
                        </div>
                      </div>

                      <div className="space-y-3.5">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 tracking-wider block mb-2 uppercase">Verified Target Tools Detected</span>
                          <div className="flex flex-wrap gap-1.5">
                            {matchData.strong_matches.map((s, i) => (
                              <span key={i} className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg">✓ {s}</span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-slate-500 tracking-wider block mb-2 uppercase">Missing Framework Demands</span>
                          <div className="flex flex-wrap gap-1.5">
                            {matchData.missing_skills.map((m, i) => {
                              const added = injectedSkills.includes(m);
                              return (
                                <button key={i} onClick={() => injectSkillIntoCvBuffer(m)} disabled={added} className={`text-xs border px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${added ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300" : "bg-rose-500/10 border-rose-500/20 text-rose-450 text-rose-400 hover:bg-rose-500/20"}`}>
                                  <span>{added ? "✓ Added to Queue" : `+ Inject ${m}`}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-slate-900 pt-4">
                        <span className="text-[10px] font-bold text-slate-500 tracking-wider block mb-2 uppercase">ATS Diagnostic Improvements</span>
                        {matchData.suggestions.map((item, index) => (
                          <div key={index} className="flex gap-3 p-3 bg-slate-950/40 border border-slate-900 rounded-xl items-start">
                            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-300 leading-relaxed font-sans">{item}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {!loading && ((mode === "proposal" && !proposalOutput) || (mode === "cv" && !cvTextPreview) || (mode === "ats" && !matchData)) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none">
                      <Terminal className="w-5 h-5 text-slate-800 mb-2" />
                      <p className="text-xs text-slate-600">Awaiting parameter criteria submissions to calculate output values.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}