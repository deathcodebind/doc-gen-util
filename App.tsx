
import React, { useState, useEffect } from 'react';
import Editor from './components/Editor';
import Preview from './components/Preview';
import { ApiDoc } from './types';
import { enhanceDescription } from './services/geminiService';
import { generateStandaloneHtml } from './utils/exporter';
import { Sparkles, Download, Copy, Check, FileCode } from 'lucide-react';

const DEFAULT_DOC: ApiDoc = {
  title: "Aether Chat Protocol",
  description: "- Advanced real-time communication framework.\n-- Support for ephemeral messaging.\n-- Contextual object permissions.\n1. Distributed architecture for global scale.\n1.1. High-availability clusters.\n1.2. Low-latency edge nodes.\n2. End-to-end encryption by default.",
  descriptionFormat: "docgenie",
  customTypes: [
    { 
      name: "Room", 
      definition: "{ id: string, name: string, config?(Owner): object, logs(Moderator): string[] }",
      roles: ["Owner", "Moderator", "Member"]
    },
    { 
      name: "Message", 
      definition: "{ id: string, body: string, sender: User, flags?(Moderator): string[] }",
      roles: ["Moderator"]
    },
    { 
      name: "User", 
      definition: "{ id: string, handle: string, profile_pic?: string }",
      roles: []
    }
  ],
  endpoints: [
    {
      id: "1",
      method: "POST",
      path: "/v1/rooms/:id/messages",
      description: "Send a message to a room. Identity requirements vary by role.",
      arguments: "{ body: string }",
      response: "Message",
      authRules: [
        { role: "Guest", method: "Cookie", details: "Requires session cookie from gateway" },
        { role: "Member", method: "Token", details: "JWT required in Authorization header" },
        { role: "Owner", method: "Token", details: "Full administrative token required" }
      ]
    },
    {
      id: "2",
      method: "GET",
      path: "/v1/rooms/:id/messages",
      description: "Retrieve a paginated history of messages. Standard users have limited visibility.",
      arguments: "null",
      response: "Message[]",
      authRules: [
        { role: "Standard", method: "None" },
        { role: "Moderator", method: "Token", details: "Elevated token for history access" }
      ]
    }
  ]
};

const App: React.FC = () => {
  const [doc, setDoc] = useState<ApiDoc>(DEFAULT_DOC);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('api-doc-current');
    if (saved) {
      try {
        setDoc(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved doc", e);
      }
    }
  }, []);

  const handleDocChange = (newDoc: ApiDoc) => {
    setDoc(newDoc);
    localStorage.setItem('api-doc-current', JSON.stringify(newDoc));
  };

  const handleEnhance = async () => {
    setIsEnhancing(true);
    const newDesc = await enhanceDescription(doc.description);
    handleDocChange({ ...doc, description: newDesc });
    setIsEnhancing(false);
  };

  const handleDownloadJson = () => {
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(doc, null, 2)], {type: 'application/json'});
    element.href = URL.createObjectURL(file);
    element.download = `${doc.title.replace(/\s+/g, '-').toLowerCase()}-api.json`;
    document.body.appendChild(element);
    element.click();
  };

  const handleExportHtml = () => {
    const html = generateStandaloneHtml(doc);
    const element = document.createElement("a");
    const file = new Blob([html], {type: 'text/html'});
    element.href = URL.createObjectURL(file);
    element.download = `${doc.title.replace(/\s+/g, '-').toLowerCase()}-docs.html`;
    document.body.appendChild(element);
    element.click();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(doc, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <div className="w-1/2 min-w-[500px] max-w-[800px] h-full flex flex-col relative z-20 shadow-2xl">
        <Editor 
          doc={doc} 
          onChange={handleDocChange} 
          onEnhance={handleEnhance}
        />
        {isEnhancing && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center space-y-4">
              <Sparkles className="w-12 h-12 text-indigo-600 animate-pulse" />
              <p className="text-indigo-900 font-bold">Optimizing descriptions...</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 h-full flex flex-col bg-slate-50 overflow-hidden">
        <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between z-10 shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="px-2 py-1 bg-indigo-600 text-white rounded text-[10px] font-bold uppercase tracking-wider">DocGenie Preview</div>
            <span className="text-slate-400 text-[10px] font-medium tracking-tight">Interactive Mode</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center space-x-2 px-3 py-1.5 text-slate-500 hover:text-indigo-600 transition-colors text-xs font-semibold rounded-md"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'JSON'}</span>
            </button>
            <button
              onClick={handleDownloadJson}
              className="flex items-center space-x-2 px-3 py-1.5 text-slate-500 hover:text-indigo-600 transition-colors text-xs font-semibold rounded-md border border-slate-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Bundle</span>
            </button>
            <button
              onClick={handleExportHtml}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-all text-xs font-bold"
            >
              <FileCode className="w-4 h-4" />
              <span>Export HTML</span>
            </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-hidden">
          <Preview doc={doc} />
        </div>
      </div>
    </div>
  );
};

export default App;
