
import React, { useState } from 'react';
import { ApiDoc, CustomType, Endpoint, HttpMethod, AuthRule, AuthMethod, DescriptionFormat } from '../types';
import { Sparkles, Plus, Trash2, Code, FileText, Layout, UserCog, Info, X, Check, Shield, Lock, Type } from 'lucide-react';

interface EditorProps {
  doc: ApiDoc;
  onChange: (doc: ApiDoc) => void;
  onEnhance: () => void;
}

const AUTH_METHODS: AuthMethod[] = ['None', 'Token', 'Cookie', 'OAuth2', 'API Key', 'Signature'];

const Editor: React.FC<EditorProps> = ({ doc, onChange, onEnhance }) => {
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form');
  const [newRoleInputs, setNewRoleInputs] = useState<{ [key: number]: string }>({});

  const updateField = (field: keyof ApiDoc, value: any) => {
    onChange({ ...doc, [field]: value });
  };

  const addCustomType = () => {
    const newType: CustomType = { 
      name: 'NewType', 
      definition: '{ id: string, name: string }',
      roles: [] 
    };
    updateField('customTypes', [newType, ...doc.customTypes]);
  };

  const removeCustomType = (index: number) => {
    const newTypes = doc.customTypes.filter((_, i) => i !== index);
    updateField('customTypes', newTypes);
  };

  const updateCustomType = (index: number, field: keyof CustomType, value: any) => {
    const newTypes = [...doc.customTypes];
    newTypes[index] = { ...newTypes[index], [field]: value };
    updateField('customTypes', newTypes);
  };

  const handleAddRoleToType = (typeIndex: number) => {
    const roleName = newRoleInputs[typeIndex]?.trim();
    if (roleName && !doc.customTypes[typeIndex].roles.includes(roleName)) {
      const updatedRoles = [...doc.customTypes[typeIndex].roles, roleName];
      updateCustomType(typeIndex, 'roles', updatedRoles);
      setNewRoleInputs({ ...newRoleInputs, [typeIndex]: '' });
    }
  };

  const removeRoleFromType = (typeIndex: number, roleName: string) => {
    const updatedRoles = doc.customTypes[typeIndex].roles.filter(r => r !== roleName);
    updateCustomType(typeIndex, 'roles', updatedRoles);
  };

  const addEndpoint = () => {
    const newEndpoint: Endpoint = {
      id: crypto.randomUUID(),
      method: 'GET',
      path: '/v1/resource',
      description: 'Describe this endpoint...',
      arguments: 'null',
      response: 'null',
      authRules: []
    };
    updateField('endpoints', [newEndpoint, ...doc.endpoints]);
  };

  const removeEndpoint = (id: string) => {
    updateField('endpoints', doc.endpoints.filter(e => e.id !== id));
  };

  const updateEndpoint = (id: string, field: keyof Endpoint, value: any) => {
    const newEndpoints = doc.endpoints.map(e => e.id === id ? { ...e, [field]: value } : e);
    updateField('endpoints', newEndpoints);
  };

  const addAuthRule = (epId: string) => {
    const ep = doc.endpoints.find(e => e.id === epId);
    if (!ep) return;
    const newRule: AuthRule = { role: 'Standard', method: 'None' };
    updateEndpoint(epId, 'authRules', [...ep.authRules, newRule]);
  };

  const removeAuthRule = (epId: string, ruleIdx: number) => {
    const ep = doc.endpoints.find(e => e.id === epId);
    if (!ep) return;
    const newRules = ep.authRules.filter((_, i) => i !== ruleIdx);
    updateEndpoint(epId, 'authRules', newRules);
  };

  const updateAuthRule = (epId: string, ruleIdx: number, field: keyof AuthRule, value: any) => {
    const ep = doc.endpoints.find(e => e.id === epId);
    if (!ep) return;
    const newRules = [...ep.authRules];
    newRules[ruleIdx] = { ...newRules[ruleIdx], [field]: value };
    updateEndpoint(epId, 'authRules', newRules);
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const parsed = JSON.parse(e.target.value);
      onChange(parsed);
    } catch (err) {}
  };

  const allKnownRoles = Array.from(new Set(doc.customTypes.flatMap(t => t.roles)));

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex space-x-1 p-1 bg-slate-200 rounded-lg">
          <button
            onClick={() => setActiveTab('form')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'form' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Layout className="w-4 h-4 inline-block mr-1" />
            Designer
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'json' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Code className="w-4 h-4 inline-block mr-1" />
            Raw JSON
          </button>
        </div>
        <button
          onClick={onEnhance}
          className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span>Magic Polish</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
        {activeTab === 'form' ? (
          <>
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  API Basics
                </h3>
                <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                   <button 
                    onClick={() => updateField('descriptionFormat', 'docgenie')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${doc.descriptionFormat === 'docgenie' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                   >DocGenie</button>
                   <button 
                    onClick={() => updateField('descriptionFormat', 'markdown')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${doc.descriptionFormat === 'markdown' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                   >Markdown</button>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">PROJECT TITLE</label>
                  <input
                    type="text"
                    value={doc.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="E.g. Chat System API"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    SUMMARY ({doc.descriptionFormat === 'markdown' ? 'Markdown' : 'DocGenie Lists'})
                  </label>
                  <textarea
                    value={doc.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono text-sm"
                    placeholder={doc.descriptionFormat === 'docgenie' ? "- Item\n-- Sub-item" : "**Bold text** and `code`..."}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    <Code className="w-4 h-4 mr-2" />
                    Custom Types
                  </h3>
                </div>
                <button
                  onClick={addCustomType}
                  className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                {doc.customTypes.map((type, idx) => (
                  <div key={idx} className="p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-4 relative group">
                    <button
                      onClick={() => removeCustomType(idx)}
                      className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={type.name}
                        onChange={(e) => updateCustomType(idx, 'name', e.target.value)}
                        className="w-full bg-transparent font-bold text-slate-800 focus:outline-none text-lg"
                        placeholder="Type Name"
                      />
                      
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                          <UserCog className="w-3 h-3 mr-1" /> Contextual Roles
                        </label>
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {type.roles.map(role => (
                            <span key={role} className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                              {role}
                              <button onClick={() => removeRoleFromType(idx, role)} className="ml-1 hover:text-indigo-900"><X className="w-3 h-3" /></button>
                            </span>
                          ))}
                          <div className="flex items-center ml-1">
                            <input
                              type="text"
                              value={newRoleInputs[idx] || ''}
                              onChange={(e) => setNewRoleInputs({ ...newRoleInputs, [idx]: e.target.value })}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddRoleToType(idx)}
                              className="w-20 px-1.5 py-0.5 text-[10px] border border-slate-200 rounded outline-none focus:ring-1 focus:ring-indigo-300"
                              placeholder="Add role..."
                            />
                            <button onClick={() => handleAddRoleToType(idx)} className="ml-1 p-0.5 text-indigo-600 hover:bg-indigo-50 rounded"><Plus className="w-3 h-3" /></button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Definition</label>
                        <textarea
                          value={type.definition}
                          onChange={(e) => updateCustomType(idx, 'definition', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white rounded border border-slate-200 text-sm font-mono focus:ring-1 focus:ring-indigo-300 outline-none"
                          rows={2}
                          placeholder="{ id: string, secret(Owner): string }"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center">
                  <Layout className="w-4 h-4 mr-2" />
                  Endpoints
                </h3>
                <button
                  onClick={addEndpoint}
                  className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-6 pb-20">
                {doc.endpoints.map((ep) => (
                  <div key={ep.id} className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm space-y-4 relative group hover:border-indigo-200 transition-all">
                    <button
                      onClick={() => removeEndpoint(ep.id)}
                      className="absolute top-4 right-4 p-1 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex space-x-2">
                      <select
                        value={ep.method}
                        onChange={(e) => updateEndpoint(ep.id, 'method', e.target.value as HttpMethod)}
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          ep.method === 'GET' ? 'bg-green-100 text-green-700' :
                          ep.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <input
                        type="text"
                        value={ep.path}
                        onChange={(e) => updateEndpoint(ep.id, 'path', e.target.value)}
                        className="flex-1 font-mono text-sm border-b border-transparent focus:border-indigo-300 outline-none"
                      />
                    </div>
                    <textarea
                      value={ep.description}
                      onChange={(e) => updateEndpoint(ep.id, 'description', e.target.value)}
                      className="w-full text-sm text-slate-600 outline-none font-sans"
                      rows={2}
                      placeholder="Describe this endpoint..."
                    />

                    <div className="space-y-2 border-t border-slate-100 pt-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                          <Shield className="w-3 h-3 mr-1" /> Auth Rules
                        </label>
                        <button
                          onClick={() => addAuthRule(ep.id)}
                          className="text-[10px] text-indigo-600 font-bold flex items-center hover:underline"
                        >
                          <Plus className="w-2.5 h-2.5 mr-0.5" /> Add Rule
                        </button>
                      </div>
                      <div className="space-y-2">
                        {ep.authRules?.map((rule, rIdx) => (
                          <div key={rIdx} className="flex items-center space-x-2 bg-slate-50 p-2 rounded border border-slate-100 group/rule">
                            <select
                              value={rule.role}
                              onChange={(e) => updateAuthRule(ep.id, rIdx, 'role', e.target.value)}
                              className="text-[10px] font-bold bg-white border border-slate-200 rounded px-1.5 py-0.5"
                            >
                              <option value="Standard">Standard</option>
                              <option value="Guest">Guest</option>
                              {allKnownRoles.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <span className="text-slate-300 text-[10px]">needs</span>
                            <select
                              value={rule.method}
                              onChange={(e) => updateAuthRule(ep.id, rIdx, 'method', e.target.value)}
                              className="text-[10px] font-bold bg-white border border-slate-200 rounded px-1.5 py-0.5"
                            >
                              {AUTH_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <button 
                              onClick={() => removeAuthRule(ep.id, rIdx)}
                              className="ml-auto text-slate-300 hover:text-red-500 opacity-0 group-rule-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Args</label>
                        <input
                          type="text"
                          value={ep.arguments || ''}
                          onChange={(e) => updateEndpoint(ep.id, 'arguments', e.target.value || 'null')}
                          className="w-full px-2 py-1 text-xs font-mono bg-slate-50 border border-slate-200 rounded"
                          placeholder="null"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Response</label>
                        <input
                          type="text"
                          value={ep.response || ''}
                          onChange={(e) => updateEndpoint(ep.id, 'response', e.target.value || 'null')}
                          className="w-full px-2 py-1 text-xs font-mono bg-slate-50 border border-slate-200 rounded"
                          placeholder="null"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <div className="h-full">
            <textarea
              className="w-full h-full p-4 font-mono text-sm bg-slate-900 text-emerald-400 rounded-lg resize-none outline-none"
              value={JSON.stringify(doc, null, 2)}
              onChange={handleJsonChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Editor;
