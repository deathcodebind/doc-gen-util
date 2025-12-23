
import React, { useRef, useState, useMemo } from 'react';
import { ApiDoc, ListItem, CustomType, Endpoint } from '../types';
import { parseDashList, renderWithLinks, parseTypeDefinition, renderMarkdown } from '../utils/parser';
import { Search, Hash, Globe, BookOpen, ShieldCheck, ShieldAlert, Eye, Lock, Unlock, Key, ChevronDown, UserCircle, Target } from 'lucide-react';

interface PreviewProps {
  doc: ApiDoc;
}

const Preview: React.FC<PreviewProps> = ({ doc }) => {
  const typeRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const endpointRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  const [localPerspectives, setLocalPerspectives] = useState<{ [typeName: string]: string }>({});
  const [activePersona, setActivePersona] = useState<string>('Standard');

  const scrollToType = (name: string) => {
    const el = typeRefs.current[name];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const scrollToEndpoint = (id: string) => {
    const el = endpointRefs.current[id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const setTypePerspective = (typeName: string, role: string) => {
    setLocalPerspectives(prev => ({ ...prev, [typeName]: role }));
  };

  const allKnownRoles = useMemo(() => 
    Array.from(new Set(['Standard', 'Guest', ...doc.customTypes.flatMap(t => t.roles), ...doc.endpoints.flatMap(e => e.authRules.map(r => r.role))]))
  , [doc]);

  const renderNestedList = (items: ListItem[]): React.ReactNode => {
    if (items.length === 0) return null;

    const getBulletSymbol = (item: ListItem) => {
      if (item.isOrdered) {
        return <span className="text-indigo-600 font-mono text-[0.75em] mr-2 shrink-0 font-bold">{item.listNumber}</span>;
      }
      const bulletClasses = "text-indigo-400 mr-2 font-bold select-none leading-none shrink-0";
      switch (item.level) {
        case 1: return <span className={`${bulletClasses} text-[1.1em]`}>•</span>;
        case 2: return <span className={`${bulletClasses} text-[0.9em]`}>○</span>;
        case 3: return <span className={`${bulletClasses} text-[0.7em]`}>▪</span>;
        default: return <span className={`${bulletClasses} text-[1em]`}>‣</span>;
      }
    };

    return (
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className={`${item.level > 1 ? 'ml-6' : item.level === 1 ? 'ml-4' : ''}`}>
            <div className={`flex items-baseline ${!item.isList && item.text === '' ? 'h-4' : ''}`}>
              {item.isList && getBulletSymbol(item)}
              <span className={`flex-1 leading-relaxed ${!item.isList ? 'text-slate-700' : 'text-slate-600'}`}>
                {item.text}
              </span>
            </div>
            {renderNestedList(item.children)}
          </div>
        ))}
      </div>
    );
  };

  const renderStructuredType = (type: CustomType) => {
    const props = parseTypeDefinition(type.definition);
    const activeRole = localPerspectives[type.name] || activePersona;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            <Eye className="w-3 h-3 mr-1.5" />
            Perspective:
          </div>
          <div className="relative group">
            <select
              value={activeRole}
              onChange={(e) => setTypePerspective(type.name, e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-md px-2 pr-6 py-0.5 text-[9px] font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer transition-all hover:bg-white"
            >
              {allKnownRoles.filter(r => type.roles.includes(r) || r === 'Standard' || r === 'Guest').map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-lg overflow-hidden shadow-sm">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
            <div className="col-span-5">Field</div>
            <div className="col-span-4">Type</div>
            <div className="col-span-3 text-right">Access</div>
          </div>
          <div className="divide-y divide-slate-100">
            {props.map((p, idx) => {
              const isVisible = !p.requiredRole || p.requiredRole === activeRole;
              
              if (!isVisible) {
                return (
                  <div key={idx} className="px-4 py-2.5 flex items-center justify-between bg-slate-50/50 italic text-[10px] text-slate-300 select-none">
                    <span className="flex items-center"><ShieldAlert className="w-3 h-3 mr-2" /> Hidden for {activeRole}</span>
                  </div>
                );
              }

              return (
                <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-white transition-colors group">
                  <div className="col-span-5 flex items-baseline truncate">
                    <span className="font-mono text-sm text-slate-800 font-medium">{p.name}</span>
                    {p.isOptional && <span className="text-indigo-400 font-bold ml-0.5" title="Optional field">?</span>}
                  </div>
                  <div className="col-span-4 font-mono text-xs text-indigo-600 truncate">
                    {renderWithLinks(p.type, doc.customTypes, scrollToType)}
                  </div>
                  <div className="col-span-3 text-right">
                    {p.requiredRole ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-[8px] font-bold uppercase border border-amber-100">
                        {p.requiredRole}
                      </span>
                    ) : (
                      <span className="text-[8px] text-slate-300 font-medium uppercase tracking-tight opacity-0 group-hover:opacity-100 transition-opacity">Public</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderAuthRequirements = (ep: Endpoint) => {
    if (!ep.authRules || ep.authRules.length === 0) return null;

    return (
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
          <Lock className="w-3 h-3 mr-1" /> Authentication Context
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {ep.authRules.map((rule, idx) => {
            const isActive = activePersona === rule.role;
            return (
              <div 
                key={idx} 
                className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all duration-300 ${
                  isActive 
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg translate-x-1' 
                    : 'bg-white text-slate-500 border-slate-100 opacity-60'
                }`}
              >
                <div className="flex items-center">
                  <div className={`p-1 rounded mr-3 ${isActive ? 'bg-indigo-500' : 'bg-slate-100'}`}>
                    {rule.method === 'None' ? <Unlock className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-bold ${isActive ? 'text-indigo-100' : 'text-slate-400'} uppercase tracking-tighter`}>Role</span>
                    <span className="text-xs font-bold leading-none">{rule.role}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold ${isActive ? 'text-indigo-100' : 'text-slate-400'} uppercase tracking-tighter block`}>Method</span>
                  <span className="text-xs font-mono font-bold leading-none">{rule.method}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDescription = (text: string) => {
    if (doc.descriptionFormat === 'markdown') {
      return renderMarkdown(text);
    }
    return renderNestedList(parseDashList(text));
  };

  return (
    <div className="flex h-full bg-white relative">
      <aside className="w-72 border-r border-slate-100 flex-shrink-0 hidden lg:flex flex-col bg-slate-50/50">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center text-indigo-600 font-bold text-lg">
            <BookOpen className="w-5 h-5 mr-2" />
            <span>DocGenie</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          <div className="space-y-3">
            <h4 className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
              <UserCircle className="w-3.5 h-3.5 mr-2" /> 
              Viewing Persona
            </h4>
            <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm space-y-1">
              {allKnownRoles.map(role => (
                <button
                  key={role}
                  onClick={() => setActivePersona(role)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activePersona === role 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Target className={`w-3 h-3 mr-2 ${activePersona === role ? 'text-indigo-200' : 'text-slate-300'}`} />
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Introduction</h4>
            <a href="#intro" className="flex items-center px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded transition-colors group">
              <Globe className="w-4 h-4 mr-2 text-slate-400 group-hover:text-indigo-500" />
              Overview
            </a>
          </div>

          <div className="space-y-1">
            <h4 className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Endpoints</h4>
            {doc.endpoints.map(ep => (
              <button key={ep.id} onClick={() => scrollToEndpoint(ep.id)} className="w-full text-left flex items-center px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded transition-colors group">
                <span className={`w-8 text-[8px] font-bold mr-2 ${ep.method === 'GET' ? 'text-green-600' : 'text-blue-600'}`}>{ep.method}</span>
                <span className="truncate group-hover:text-indigo-600">{ep.path}</span>
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <h4 className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Type Definitions</h4>
            {doc.customTypes.map(type => (
              <button key={type.name} onClick={() => scrollToType(type.name)} className="w-full text-left flex items-center px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded transition-colors group">
                <Hash className="w-4 h-4 mr-2 text-slate-400 group-hover:text-indigo-500" />
                <span className="truncate group-hover:text-indigo-600">{type.name}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto scroll-smooth bg-white">
        <div className="max-w-4xl mx-auto px-8 py-12 space-y-24 pb-40">
          <section id="intro" className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">{doc.title || 'API Documentation'}</h1>
              <div className="h-2 w-24 bg-indigo-600 rounded-full"></div>
            </div>
            <div className="text-lg text-slate-600 leading-relaxed border-l-4 border-slate-100 pl-6 italic">
              {renderDescription(doc.description)}
            </div>
          </section>

          <section className="space-y-16">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
              <h2 className="text-3xl font-bold text-slate-900">API Endpoints</h2>
            </div>
            <div className="space-y-20">
              {doc.endpoints.map((ep) => (
                <div key={ep.id} ref={el => { endpointRefs.current[ep.id] = el; }} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase ${ep.method === 'GET' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{ep.method}</span>
                      <h3 className="text-2xl font-mono font-medium text-slate-800 tracking-tight">{ep.path}</h3>
                    </div>
                    <p className="text-slate-600 text-lg leading-relaxed max-w-2xl">{ep.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm hover:border-indigo-100 transition-colors">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center">
                            Input Arguments
                          </h4>
                          <div className="font-mono text-sm leading-loose">{renderWithLinks(ep.arguments, doc.customTypes, scrollToType)}</div>
                        </div>
                        <div className="p-5 bg-indigo-50/40 border border-indigo-100/30 rounded-2xl shadow-sm hover:border-indigo-200 transition-colors">
                          <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center">
                            Expected Response
                          </h4>
                          <div className="font-mono text-sm text-indigo-900 leading-loose">{renderWithLinks(ep.response, doc.customTypes, scrollToType)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="lg:col-span-1">
                      {renderAuthRequirements(ep)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-12 pt-16 border-t border-slate-100">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-slate-900">Type Registry</h2>
              <p className="text-slate-500 text-sm">Definitions for custom objects and reusable structures.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-20">
              {doc.customTypes.map((type) => (
                <div key={type.name} ref={el => { typeRefs.current[type.name] = el; }} className="space-y-6">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center border-l-4 border-indigo-500 pl-4">
                    {type.name}
                  </h3>
                  {renderStructuredType(type)}
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Preview;
