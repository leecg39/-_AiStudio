import React, { useEffect, useRef } from 'react';
import { AgentLog } from '../types';

interface AgentChatProps {
  logs: AgentLog[];
}

export const AgentChat: React.FC<AgentChatProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getAgentColor = (agent: string) => {
    switch (agent) {
      case 'SCRIPT': return 'text-purple-400';
      case 'VISUAL': return 'text-studio-accent';
      case 'AUDIO': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="flex flex-col h-full bg-studio-800 bg-opacity-50 border-r border-studio-700 backdrop-blur-md">
      <div className="p-4 border-b border-studio-700">
        <h2 className="text-sm font-bold tracking-wider text-gray-300 uppercase">System Logs</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm">
        {logs.length === 0 && (
            <div className="text-gray-500 italic text-center mt-10">시스템 대기중...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2">
            <span className="text-gray-600 text-xs whitespace-nowrap pt-1">
              {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
            </span>
            <div>
              <span className={`font-bold mr-2 ${getAgentColor(log.agent)}`}>[{log.agent}]</span>
              <span className="text-gray-300">{log.message}</span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};