
import React from 'react';
import { ListItem, TypeProperty, CustomType } from '../types';

/**
 * Parses a string with dash markers (- item, -- sub-item) 
 * OR numbered markers (1. item, 1.1. sub-item) into a nested structure.
 */
export const parseDashList = (text: string): ListItem[] => {
  const lines = text.split('\n').map(line => line.trim());
  const result: ListItem[] = [];
  const stack: ListItem[] = [];

  lines.forEach(line => {
    if (line.length === 0) {
      result.push({ level: 0, text: '', children: [], isList: false });
      stack.length = 0;
      return;
    }

    const dashMatch = line.match(/^(\-+)\s*(.*)$/);
    const numMatch = line.match(/^(\d+(?:\.\d+)*)\.\s*(.*)$/);

    if (dashMatch || numMatch) {
      let level: number;
      let content: string;
      let isOrdered = false;
      let listNumber = '';

      if (dashMatch) {
        level = dashMatch[1].length;
        content = dashMatch[2];
      } else {
        const fullNum = numMatch![1] + ".";
        level = (fullNum.match(/\./g) || []).length;
        content = numMatch![2];
        isOrdered = true;
        listNumber = fullNum;
      }

      const newItem: ListItem = { 
        level, 
        text: content, 
        children: [], 
        isList: true, 
        isOrdered, 
        listNumber 
      };

      while (stack.length > 0 && (stack[stack.length - 1].level >= level || !stack[stack.length - 1].isList)) {
        stack.pop();
      }

      if (stack.length === 0) {
        result.push(newItem);
      } else {
        stack[stack.length - 1].children.push(newItem);
      }
      stack.push(newItem);
    } else {
      const newItem: ListItem = { level: 0, text: line, children: [], isList: false };
      result.push(newItem);
      stack.length = 0;
    }
  });

  return result;
};

/**
 * Simple Regex-based Markdown renderer for basic formatting
 */
export const renderMarkdown = (text: string): React.ReactNode => {
  if (!text) return null;
  
  const lines = text.split('\n');
  return (
    <div className="space-y-2">
      {lines.map((line, idx) => {
        let content = line;
        
        // Bold: **text**
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Italic: *text*
        content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
        // Inline code: `text`
        content = content.replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1 rounded text-pink-600 font-mono text-[0.9em]">$1</code>');
        
        const listMatch = line.match(/^(\s*)([*+-]|\d+\.)\s+(.*)$/);
        if (listMatch) {
          const indent = listMatch[1].length;
          return (
            <div key={idx} style={{ marginLeft: `${indent * 0.5}rem` }} className="flex items-start">
              <span className="mr-2 text-slate-400 font-bold">•</span>
              <span dangerouslySetInnerHTML={{ __html: content.replace(/^(\s*)([*+-]|\d+\.)\s+/, '') }} />
            </div>
          );
        }

        return <p key={idx} dangerouslySetInnerHTML={{ __html: content }} />;
      })}
    </div>
  );
};

export const parseTypeDefinition = (definition: string): TypeProperty[] => {
  let inner = definition.trim();
  if (inner.startsWith('{')) inner = inner.substring(1);
  if (inner.endsWith('}')) inner = inner.substring(0, inner.length - 1);

  const lines = inner.split(',').map(s => s.trim()).filter(Boolean);
  
  return lines.map(line => {
    // Regex matches: fieldName, optional?, role (optional), and the type string
    const match = line.match(/^([\w\d_]+)(\??)(?:\(([^)]+)\))?\s*:\s*(.+)$/);
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
};

export const renderWithLinks = (
  text: string | null, 
  customTypes: CustomType[],
  onTypeClick: (name: string) => void
): React.ReactNode => {
  if (!text || text === 'null') return <span className="text-slate-400 italic">None</span>;
  
  const customTypeNames = customTypes.map(t => t.name);
  // Improved split regex to correctly identify tokens that might be type names
  const parts = text.split(/(\b[\w\d_]+\b)/g);

  return parts.map((part, i) => {
    const typeDef = customTypes.find(t => t.name === part);
    if (typeDef) {
      return (
        <span key={i} className="relative group inline-block">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onTypeClick(part);
            }}
            className="text-indigo-600 hover:text-indigo-800 font-semibold underline decoration-indigo-200 decoration-2 underline-offset-2 transition-all cursor-pointer"
          >
            {part}
          </button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-64 pointer-events-none">
            <div className="bg-slate-900 text-white text-[11px] p-3 rounded-xl shadow-2xl border border-slate-700 font-mono ring-4 ring-black/5">
              <div className="text-indigo-400 font-bold mb-1.5 uppercase tracking-tighter border-b border-slate-700 pb-1">Definition: {part}</div>
              <div className="whitespace-pre-wrap opacity-90 leading-relaxed">{typeDef.definition}</div>
            </div>
            <div className="w-3 h-3 bg-slate-900 rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-r border-b border-slate-700"></div>
          </div>
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
};
