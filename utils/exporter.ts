
import { ApiDoc } from '../types';

/**
 * Generates a full standalone HTML string for the documentation.
 * Faithfully ports all Preview logic including structured type rendering.
 */
export const generateStandaloneHtml = (doc: ApiDoc): string => {
  const jsonData = JSON.stringify(doc);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${doc.title} - API Documentation</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; scroll-behavior: smooth; }
        .font-mono { font-family: 'Fira Code', monospace; }
        .persona-active { background-color: #4f46e5; color: white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .tooltip-box { display: none; pointer-events: none; }
        .group:hover .tooltip-box { display: block; }
    </style>
</head>
<body class="bg-white text-slate-900">
    <div id="app-data" style="display:none">${jsonData}</div>
    <div class="flex h-screen overflow-hidden">
        <aside class="w-72 border-r border-slate-100 bg-slate-50/50 flex flex-col hidden lg:flex">
            <div class="p-6 border-b border-slate-100 flex items-center">
                 <div class="flex items-center text-indigo-600 font-bold text-lg">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                    <span>DocGenie</span>
                </div>
            </div>
            <div class="flex-1 overflow-y-auto p-4 space-y-8" id="sidebar-nav"></div>
        </aside>

        <main class="flex-1 overflow-y-auto bg-white" id="main-content">
            <div class="max-w-4xl mx-auto px-8 py-12 space-y-24 pb-40" id="doc-container"></div>
        </main>
    </div>

    <script>
        const doc = JSON.parse(document.getElementById('app-data').textContent);
        let activePersona = 'Standard';
        let localPerspectives = {};

        // Core Parser Logic (JS Port)
        function parseTypeDefinition(definition) {
            let inner = definition.trim();
            if (inner.startsWith('{')) inner = inner.substring(1);
            if (inner.endsWith('}')) inner = inner.substring(0, inner.length - 1);
            const lines = inner.split(',').map(s => s.trim()).filter(Boolean);
            return lines.map(line => {
                const match = line.match(/^([\\w\\d_]+)(\\??)(?:\\(([^)]+)\\))?\\s*:\\s*(.+)$/);
                if (match) {
                    return {
                        name: match[1],
                        isOptional: match[2] === '?',
                        requiredRole: match[3] || null,
                        type: match[4].trim()
                    };
                }
                return { name: line, type: 'unknown', isOptional: false, requiredRole: null };
            });
        }

        function renderMarkdown(text) {
            if (!text) return '';
            return text.split('\\n').map(line => {
                let content = line
                    .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
                    .replace(/\\*(.*?)\\*/g, '<em>$1</em>')
                    .replace(/\\\`(.*?)\\\`/g, '<code class="bg-slate-100 px-1 rounded text-pink-600 font-mono text-[0.9em]">$1</code>');
                return \`<p>\${content}</p>\`;
            }).join('');
        }

        function renderLists(text) {
             const lines = text.split('\\n').map(l => l.trim());
             let html = '<div class="space-y-2">';
             lines.forEach(line => {
                const dashMatch = line.match(/^(\\-+)\\s*(.*)$/);
                if (dashMatch) {
                    const level = dashMatch[1].length;
                    const bullet = level === 1 ? '•' : level === 2 ? '○' : '▪';
                    html += \`<div class="flex items-baseline" style="margin-left: \${(level-1)*1.5}rem">
                        <span class="text-indigo-400 mr-2 font-bold">\${bullet}</span>
                        <span class="text-slate-600">\${dashMatch[2]}</span>
                    </div>\`;
                } else {
                    html += \`<p class="text-slate-700">\${line}</p>\`;
                }
             });
             return html + '</div>';
        }

        function renderDescription(text) {
            return doc.descriptionFormat === 'markdown' ? renderMarkdown(text) : renderLists(text);
        }

        function renderWithLinks(text) {
            if (!text || text === 'null') return '<span class="text-slate-400 italic font-medium">None</span>';
            const parts = text.split(/(\\b[\\w\\d_]+\\b)/g);
            return parts.map(part => {
                const typeDef = doc.customTypes.find(t => t.name === part);
                if (typeDef) {
                    return \`
                        <span class="relative group inline-block">
                            <a href="#type-\${part}" class="text-indigo-600 hover:text-indigo-800 font-bold underline decoration-indigo-200 decoration-2 underline-offset-2 transition-all cursor-pointer">\${part}</a>
                            <div class="tooltip-box absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64">
                                <div class="bg-slate-900 text-white text-[10px] p-3 rounded-xl shadow-2xl border border-slate-700 font-mono text-left">
                                    <div class="text-indigo-400 font-bold mb-1 uppercase tracking-tighter border-b border-slate-700 pb-1">Definition: \${part}</div>
                                    <div class="whitespace-pre-wrap opacity-90 leading-relaxed">\${typeDef.definition}</div>
                                </div>
                                <div class="w-3 h-3 bg-slate-900 rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-r border-b border-slate-700"></div>
                            </div>
                        </span>
                    \`;
                }
                return part;
            }).join('');
        }

        function setPersona(p) {
            activePersona = p;
            render();
        }

        function setLocalPerspective(typeName, role) {
            localPerspectives[typeName] = role;
            render();
        }

        function render() {
            renderSidebar();
            renderContent();
        }

        function renderSidebar() {
            const roles = Array.from(new Set(['Standard', 'Guest', ...doc.customTypes.flatMap(t => t.roles), ...doc.endpoints.flatMap(e => e.authRules.map(r => r.role))]));
            
            let html = \`
                <div class="space-y-3">
                    <h4 class="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Viewing Persona</h4>
                    <div class="bg-white border border-slate-200 rounded-xl p-2 shadow-sm space-y-1">
                        \${roles.map(role => \`
                            <button onclick="setPersona('\${role}')" class="w-full flex items-center px-3 py-2 rounded-lg text-xs font-semibold transition-all \${activePersona === role ? 'persona-active' : 'text-slate-600 hover:bg-slate-100'}">
                                \${role}
                            </button>
                        \`).join('')}
                    </div>
                </div>
                <div class="space-y-1 pt-4">
                    <h4 class="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Introduction</h4>
                    <a href="#intro" class="flex items-center px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded transition-colors group">Overview</a>
                </div>
                <div class="space-y-1 pt-4">
                    <h4 class="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Endpoints</h4>
                    \${doc.endpoints.map(ep => \`
                        <a href="#endpoint-\${ep.id}" class="block px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded transition-colors truncate">
                            <span class="w-8 text-[8px] font-bold mr-2 text-indigo-600">\${ep.method}</span>
                            \${ep.path}
                        </a>
                    \`).join('')}
                </div>
                <div class="space-y-1 pt-4">
                    <h4 class="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Types</h4>
                    \${doc.customTypes.map(t => \`
                        <a href="#type-\${t.name}" class="block px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded transition-colors truncate">\${t.name}</a>
                    \`).join('')}
                </div>
            \`;
            document.getElementById('sidebar-nav').innerHTML = html;
        }

        function renderContent() {
            let html = \`
                <section id="intro" class="space-y-6">
                    <div class="space-y-2">
                        <h1 class="text-5xl font-extrabold text-slate-900 tracking-tight">\${doc.title}</h1>
                        <div class="h-2 w-24 bg-indigo-600 rounded-full"></div>
                    </div>
                    <div class="text-lg text-slate-600 leading-relaxed border-l-4 border-slate-100 pl-6 italic">
                        \${renderDescription(doc.description)}
                    </div>
                </section>

                <section class="space-y-16">
                    <h2 class="text-3xl font-bold text-slate-900 border-b border-slate-100 pb-4">API Endpoints</h2>
                    <div class="space-y-20">
                        \${doc.endpoints.map(ep => renderEndpoint(ep)).join('')}
                    </div>
                </section>

                <section class="space-y-16 pt-16 border-t border-slate-100">
                    <div class="space-y-2">
                      <h2 class="text-3xl font-bold text-slate-900">Type Registry</h2>
                      <p class="text-slate-500 text-sm">Definitions for custom objects and reusable structures.</p>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-20">
                        \${doc.customTypes.map(t => renderType(t)).join('')}
                    </div>
                </section>
            \`;
            document.getElementById('doc-container').innerHTML = html;
        }

        function renderEndpoint(ep) {
            const activeRule = ep.authRules.find(r => r.role === activePersona);
            return \`
                <div id="endpoint-\${ep.id}" class="space-y-8">
                    <div class="space-y-4">
                        <div class="flex items-center space-x-3">
                            <span class="px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase bg-indigo-100 text-indigo-700">\${ep.method}</span>
                            <h3 class="text-2xl font-mono text-slate-800 tracking-tight font-medium">\${ep.path}</h3>
                        </div>
                        <p class="text-slate-600 text-lg max-w-2xl leading-relaxed">\${ep.description}</p>
                    </div>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div class="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="p-5 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm">
                                <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Input Arguments</h4>
                                <div class="font-mono text-sm leading-loose">\${renderWithLinks(ep.arguments)}</div>
                            </div>
                            <div class="p-5 bg-indigo-50/40 border border-indigo-100/30 rounded-2xl shadow-sm">
                                <h4 class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3">Expected Response</h4>
                                <div class="font-mono text-sm text-indigo-900 leading-loose">\${renderWithLinks(ep.response)}</div>
                            </div>
                        </div>
                        <div class="lg:col-span-1 space-y-3">
                             <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">Authentication</h4>
                             \${activeRule ? \`
                                <div class="p-4 bg-indigo-600 text-white rounded-xl shadow-lg flex items-center">
                                    <div class="flex flex-col">
                                        <div class="text-[10px] font-bold opacity-70 uppercase tracking-tighter">Role: \${activeRule.role}</div>
                                        <div class="text-sm font-bold mt-0.5">Method: \${activeRule.method}</div>
                                        \${activeRule.details ? \`<div class="text-[10px] mt-2 opacity-80 border-t border-indigo-400/30 pt-2">\${activeRule.details}</div>\` : ''}
                                    </div>
                                </div>
                             \` : \`
                                <div class="p-4 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl italic text-xs">Access undefined for \${activePersona}</div>
                             \`}
                        </div>
                    </div>
                </div>
            \`;
        }

        function renderType(type) {
            const role = localPerspectives[type.name] || activePersona;
            const roles = Array.from(new Set(['Standard', 'Guest', ...type.roles]));
            const props = parseTypeDefinition(type.definition);
            
            let propsHtml = props.map(p => {
                const isVisible = !p.requiredRole || p.requiredRole === role;
                if (!isVisible) {
                    return \`
                        <div class="px-4 py-2.5 flex items-center justify-between bg-slate-50/50 italic text-[10px] text-slate-300 select-none">
                            <span class="flex items-center">Restricted for \${role}</span>
                        </div>
                    \`;
                }
                return \`
                    <div class="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-white transition-colors group">
                        <div class="col-span-5 flex items-baseline truncate">
                            <span class="font-mono text-sm text-slate-800 font-medium">\${p.name}</span>
                            \${p.isOptional ? '<span class="text-indigo-400 font-bold ml-0.5">?</span>' : ''}
                        </div>
                        <div class="col-span-4 font-mono text-xs text-indigo-600 truncate">
                            \${renderWithLinks(p.type)}
                        </div>
                        <div class="col-span-3 text-right">
                            \${p.requiredRole ? \`
                                <span class="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-[8px] font-bold uppercase border border-amber-100">
                                    \${p.requiredRole}
                                </span>
                            \` : \`
                                <span class="text-[8px] text-slate-300 font-medium uppercase tracking-tight opacity-0 group-hover:opacity-100 transition-opacity">Public</span>
                            \`}
                        </div>
                    </div>
                \`;
            }).join('');

            return \`
                <div id="type-\${type.name}" class="space-y-6">
                    <h3 class="text-xl font-bold border-l-4 border-indigo-500 pl-4 text-slate-800">\${type.name}</h3>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between px-1 text-[9px]">
                             <span class="font-bold text-slate-400 uppercase tracking-widest">Perspective:</span>
                             <select onchange="setLocalPerspective('\${type.name}', this.value)" class="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 font-bold text-indigo-600 outline-none">
                                \${roles.map(r => \`<option value="\${r}" \${role === r ? 'selected' : ''}>\${r}</option>\`).join('')}
                             </select>
                        </div>
                        <div class="bg-slate-50 border border-slate-100 rounded-lg overflow-hidden shadow-sm">
                            <div class="grid grid-cols-12 gap-2 px-4 py-2 bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                                <div class="col-span-5">Field</div>
                                <div class="col-span-4">Type</div>
                                <div class="col-span-3 text-right">Access</div>
                            </div>
                            <div class="divide-y divide-slate-100">
                                \${propsHtml}
                            </div>
                        </div>
                    </div>
                </div>
            \`;
        }

        render();
    </script>
</body>
</html>`;
};
