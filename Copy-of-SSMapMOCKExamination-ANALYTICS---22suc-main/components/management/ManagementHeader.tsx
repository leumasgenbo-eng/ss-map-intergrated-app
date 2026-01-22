import React from 'react';

interface ManagementHeaderProps {
  schoolName: string;
  isHubActive: boolean;
  onLoadDummyData: () => void;
  onClearData: () => void;
  hasData: boolean;
}

const ManagementHeader: React.FC<ManagementHeaderProps> = ({ schoolName, isHubActive, onClearData, hasData }) => {
  return (
    <div className="bg-blue-900 text-white p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center justify-center sm:justify-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6M9 20v-10M15 20V4M3 20h18"></path></svg>
            Management Hub
          </h2>
          <div className="flex items-center justify-center sm:justify-start gap-3 mt-1">
             <p className="text-blue-300 text-[9px] sm:text-xs uppercase tracking-widest font-bold">
               Academy: {schoolName}
             </p>
             <div className="h-3 w-px bg-white/20"></div>
             <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isHubActive ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`}></div>
                <span className="text-[8px] font-black uppercase text-blue-200">{isHubActive ? 'Host Synchronized' : 'Standalone Mode'}</span>
             </div>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          {hasData && (
             <button 
               onClick={onClearData} 
               className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase border border-red-500 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
               Purge Data
             </button>
          )}
          {!hasData && (
            <div className="bg-white/10 px-6 py-2.5 rounded-xl border border-white/20 text-white font-black text-[10px] uppercase italic">
               Awaiting Incoming Node Data...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagementHeader;