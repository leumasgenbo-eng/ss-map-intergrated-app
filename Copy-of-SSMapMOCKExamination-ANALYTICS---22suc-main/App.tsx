import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { calculateClassStatistics, processStudentData, generateFullDemoSuite } from './utils';
import { GlobalSettings, StudentData, StaffAssignment, SchoolRegistryEntry, ProcessedStudent } from './types';

// Organized Imports by Portal
import MasterSheet from './components/reports/MasterSheet';
import ReportCard from './components/reports/ReportCard';
import SeriesBroadSheet from './components/reports/SeriesBroadSheet';
import ManagementDesk from './components/management/ManagementDesk';
import SuperAdminPortal from './components/hq/SuperAdminPortal';
import PupilDashboard from './components/pupil/PupilDashboard';

import { RAW_STUDENTS, FACILITATORS, SUBJECT_LIST, DEFAULT_THRESHOLDS, DEFAULT_NORMALIZATION, DEFAULT_CATEGORY_THRESHOLDS } from './constants';

const MOCK_SERIES = Array.from({ length: 10 }, (_, i) => `MOCK ${i + 1}`);

const DEFAULT_SETTINGS: GlobalSettings = {
  schoolName: "UNITED BAYLOR ACADEMY",
  schoolAddress: "ACCRA DIGITAL CENTRE, GHANA",
  schoolNumber: "UBA-2025-001", 
  schoolLogo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AMXDA0YOT8bkgAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmhuAAAAsklEQVR42u3XQQqAMAxE0X9P7n8pLhRBaS3idGbgvYVAKX0mSZI0SZIU47X2vPcZay1rrfV+S6XUt9ba9621pLXWfP9PkiRJkiRpqgB7/X/f53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le53le578HAAB//6B+n9VvAAAAAElFTkSuQmCC", 
  examTitle: "2ND MOCK 2025 BROAD SHEET EXAMINATION",
  termInfo: "TERM 2",
  academicYear: "2024/2025",
  nextTermBegin: "2025-05-12",
  attendanceTotal: "60",
  startDate: "10-02-2025",
  endDate: "15-02-2025",
  headTeacherName: "ACADEMY DIRECTOR",
  reportDate: new Date().toLocaleDateString(),
  schoolContact: "+233 24 350 4091",
  schoolEmail: "leumasgenbo@gmail.com",
  registrantName: "ADMINISTRATOR",
  registrantEmail: "admin@ubacademy.edu.gh",
  accessCode: "SSMAP-HQ-SECURE", 
  gradingThresholds: DEFAULT_THRESHOLDS,
  categoryThresholds: DEFAULT_CATEGORY_THRESHOLDS,
  normalizationConfig: DEFAULT_NORMALIZATION,
  sbaConfig: { enabled: true, isLocked: false, sbaWeight: 30, examWeight: 70 },
  isConductLocked: false,
  scoreEntryMetadata: { mockSeries: "MOCK 2", entryDate: new Date().toISOString().split('T')[0] },
  committedMocks: MOCK_SERIES,
  activeMock: "MOCK 3",
  resourcePortal: {},
  maxSectionA: 40,
  maxSectionB: 60,
  sortOrder: 'aggregate-asc',
  useTDistribution: true,
  reportTemplate: 'standard'
};

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'master' | 'reports' | 'management' | 'series' | 'pupil_hub' | 'hq'>('management');
  const [reportSearchTerm, setReportSearchTerm] = useState('');
  
  // State: Direct access enabled
  const [isFacilitator, setIsFacilitator] = useState(false);
  const [activeFacilitator, setActiveFacilitator] = useState<{ name: string; subject: string } | null>(null);
  const [activePupil, setActivePupil] = useState<ProcessedStudent | null>(null);
  const [isRemoteViewing, setIsRemoteViewing] = useState(false);
  const [isHostConnected, setIsHostConnected] = useState(false);
  const [showSyncOverlay, setShowSyncOverlay] = useState(false);
  
  const [globalRegistry, setGlobalRegistry] = useState<SchoolRegistryEntry[]>(() => {
    const saved = localStorage.getItem('uba_global_registry');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<GlobalSettings>(() => {
    const saved = localStorage.getItem('uba_app_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [students, setStudents] = useState<StudentData[]>(() => {
    const saved = localStorage.getItem('uba_students');
    return saved ? JSON.parse(saved) : RAW_STUDENTS;
  });

  const [facilitators, setFacilitators] = useState<Record<string, StaffAssignment>>(() => {
    const saved = localStorage.getItem('uba_facilitators');
    if (saved) return JSON.parse(saved);
    const initial: Record<string, StaffAssignment> = {};
    Object.keys(FACILITATORS).forEach((key, idx) => {
      initial[key] = {
        name: FACILITATORS[key], 
        role: 'FACILITATOR', 
        enrolledId: `FAC-${(idx + 1).toString().padStart(3, '0')}`,
        taughtSubject: key,
        invigilations: Array.from({ length: 9 }, () => ({ dutyDate: '', timeSlot: '', subject: '' })),
        marking: { dateTaken: '', dateReturned: '', inProgress: false }
      };
    });
    return initial;
  });

  // --- EXTERNAL HOST DATA SYNC PROTOCOL ---
  useEffect(() => {
    const handleHostMessage = (event: MessageEvent) => {
      // Validate that this is a recognized SS-Map Sync Signal
      if (event.data && event.data.type === 'SSMAP_REMOTE_SYNC') {
        const { payload } = event.data;
        if (!payload) return;

        setIsHostConnected(true);
        setShowSyncOverlay(true);

        // Sync Data Layers
        if (payload.settings) setSettings(prev => ({ ...prev, ...payload.settings }));
        if (payload.students) setStudents(payload.students);
        if (payload.facilitators) setFacilitators(payload.facilitators);

        // Persistence Handshake
        setTimeout(() => {
          localStorage.setItem('uba_app_settings', JSON.stringify({ ...settings, ...payload.settings }));
          localStorage.setItem('uba_students', JSON.stringify(payload.students));
          localStorage.setItem('uba_facilitators', JSON.stringify(payload.facilitators));
          setShowSyncOverlay(false);
          console.log("SS-MAP: Institutional Data Sync from Host successful.");
        }, 1000);
      }
    };

    window.addEventListener('message', handleHostMessage);
    
    // Signal to parent that we are ready for data injection
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'SSMAP_READY' }, '*');
    }

    return () => window.removeEventListener('message', handleHostMessage);
  }, [settings]);

  useEffect(() => { if (!isRemoteViewing) localStorage.setItem('uba_app_settings', JSON.stringify(settings)); }, [settings, isRemoteViewing]);
  useEffect(() => { if (!isRemoteViewing) localStorage.setItem('uba_students', JSON.stringify(students)); }, [students, isRemoteViewing]);
  useEffect(() => { if (!isRemoteViewing) localStorage.setItem('uba_facilitators', JSON.stringify(facilitators)); }, [facilitators, isRemoteViewing]);

  const handleSettingChange = (key: keyof GlobalSettings, value: any) => { setSettings(prev => ({ ...prev, [key]: value })); };
  const bulkUpdateSettings = useCallback((updates: Partial<GlobalSettings>) => { setSettings(prev => ({ ...prev, ...updates })); }, []);

  const { stats, processedStudents, classAvgAggregate } = useMemo(() => {
    const s = calculateClassStatistics(students, settings);
    const staffNames: Record<string, string> = {};
    Object.keys(facilitators).forEach(k => { staffNames[k] = facilitators[k].name; });
    const processed = processStudentData(s, students, staffNames, settings);
    const avgAgg = processed.length > 0 ? processed.reduce((sum, st) => sum + st.bestSixAggregate, 0) / processed.length : 0;
    return { stats: s, processedStudents: processed, classAvgAggregate: avgAgg };
  }, [students, facilitators, settings]);

  const handleStudentOverallRemarkUpdate = useCallback((studentId: number, remark: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      const mockSet = s.mockData?.[settings.activeMock] || {
        scores: {}, sbaScores: {}, examSubScores: {}, facilitatorRemarks: {},
        observations: { facilitator: "", invigilator: "", examiner: "" },
        attendance: 0, conductRemark: ""
      };
      const newFacRemarks = { ...(mockSet.facilitatorRemarks || {}), overall: remark };
      return { ...s, mockData: { ...(s.mockData || {}), [settings.activeMock]: { ...mockSet, facilitatorRemarks: newFacRemarks } } };
    }));
  }, [settings.activeMock]);

  const handleSave = useCallback(() => {
    if (isRemoteViewing) return;
    localStorage.setItem('uba_app_settings', JSON.stringify(settings));
    localStorage.setItem('uba_students', JSON.stringify(students));
    localStorage.setItem('uba_facilitators', JSON.stringify(facilitators));
    
    // Sync back to host web if connected
    if (window.parent !== window) {
      window.parent.postMessage({ 
        type: 'SSMAP_DATA_UPDATE', 
        payload: { settings, students, facilitators } 
      }, '*');
    }

    if (settings.schoolNumber) {
      const registry: SchoolRegistryEntry[] = JSON.parse(localStorage.getItem('uba_global_registry') || '[]');
      const entryIdx = registry.findIndex(r => r.id === settings.schoolNumber);
      if (entryIdx > -1) {
        registry[entryIdx].fullData = { settings, students, facilitators };
        registry[entryIdx].studentCount = students.length;
        registry[entryIdx].lastActivity = new Date().toISOString();
        localStorage.setItem('uba_global_registry', JSON.stringify(registry));
        setGlobalRegistry(registry);
      }
    }
  }, [settings, students, facilitators, isRemoteViewing]);

  const handleRemoteView = (schoolId: string) => {
    const registry: SchoolRegistryEntry[] = JSON.parse(localStorage.getItem('uba_global_registry') || '[]');
    const school = registry.find(r => r.id === schoolId);
    if (school && school.fullData) {
      setSettings(school.fullData.settings); setStudents(school.fullData.students); setFacilitators(school.fullData.facilitators);
      setIsRemoteViewing(true); setViewMode('master');
    }
  };

  const handleExitToDrive = () => {
    const driveUrl = 'https://ai.studio/apps/drive/12_hFsiSfEl86pBuqsuoH-RBtgvymEJ-p';
    if (window.confirm("Return to AI Studio Drive? Unsaved changes may be lost.")) {
      try {
        // Attempt aggressive top-level redirect for iframe breakout
        window.top!.location.href = driveUrl;
      } catch (e) {
        // Fallback for sandboxed or strict cross-origin environments
        window.location.href = driveUrl;
        window.open(driveUrl, '_top');
      }
    }
  };

  const isLandscapeView = viewMode === 'master' || viewMode === 'series';

  // Fix: Removed early return for 'hq' viewMode.
  // When an early return is present, TypeScript narrows the type of 'viewMode' in the remaining code.
  // This narrowing excluded 'hq' from the possible values of 'viewMode', causing errors on line 261 
  // where 'viewMode === hq' was checked for conditional button styling.
  // The 'hq' view is now handled as an overlay/exclusive section within the main return.

  return (
    <div className={`min-h-screen bg-gray-100 font-sans flex flex-col ${isLandscapeView ? 'print-landscape' : 'print-portrait'}`}>
      
      {/* Network HQ Overlay View */}
      {viewMode === 'hq' && (
        <div className="fixed inset-0 z-[100] bg-slate-950 overflow-auto no-print">
          <SuperAdminPortal onExit={() => setViewMode('management')} onRemoteView={handleRemoteView} />
        </div>
      )}

      {/* Synchronization Overlay */}
      {showSyncOverlay && (
        <div className="fixed inset-0 z-[1000] bg-blue-900/80 backdrop-blur-md flex flex-col items-center justify-center text-white space-y-4">
           <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
           <p className="text-xl font-black uppercase tracking-[0.4em] animate-pulse">Host Data Syncing...</p>
        </div>
      )}

      {isRemoteViewing && (
        <div className="no-print bg-red-600 text-white px-4 py-2 flex justify-between items-center text-[10px] font-black uppercase tracking-widest animate-pulse z-[60]">
          <div>HQ REMOTE COMMAND: {settings.schoolName}</div>
          <button onClick={() => setIsRemoteViewing(false)} className="bg-white text-red-600 px-4 py-1.5 rounded-lg font-black uppercase text-[8px]">Exit Command</button>
        </div>
      )}

      {/* SEGREGATED NAVIGATION: ADMIN vs SUPERADMIN */}
      <div className="no-print bg-blue-950 text-white p-3 sticky top-0 z-50 shadow-2xl flex flex-wrap justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-6">
          {/* Institutional Admin Segment */}
          <div className="flex flex-col gap-1">
             <div className="flex items-center justify-between px-1">
                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Academy Admin Hub</span>
                <div className="flex items-center gap-1">
                   <div className={`w-1.5 h-1.5 rounded-full ${isHostConnected ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
                   <span className="text-[7px] font-black uppercase text-slate-500">{isHostConnected ? 'Host Linked' : 'Standalone'}</span>
                </div>
             </div>
             <div className="flex bg-blue-900 rounded-xl p-1 text-[10px] md:text-xs shadow-inner">
               <button onClick={() => setViewMode('management')} className={`px-4 py-1.5 rounded-lg transition-all ${viewMode === 'management' ? 'bg-white text-blue-900 font-black shadow-lg' : 'text-blue-200 hover:text-white'}`}>Admin Desk</button>
               <button onClick={() => setViewMode('master')} className={`px-4 py-1.5 rounded-lg transition-all ${viewMode === 'master' ? 'bg-white text-blue-900 font-black shadow-lg' : 'text-blue-200 hover:text-white'}`}>Broad Sheets</button>
               <button onClick={() => setViewMode('series')} className={`px-4 py-1.5 rounded-lg transition-all ${viewMode === 'series' ? 'bg-white text-blue-900 font-black shadow-lg' : 'text-blue-200 hover:text-white'}`}>Series Tracker</button>
               <button onClick={() => setViewMode('reports')} className={`px-4 py-1.5 rounded-lg transition-all ${viewMode === 'reports' ? 'bg-white text-blue-900 font-black shadow-lg' : 'text-blue-200 hover:text-white'}`}>Pupil Reports</button>
             </div>
          </div>

          <div className="h-8 w-px bg-white/10 hidden md:block"></div>

          {/* Network HQ Segment */}
          <div className="flex flex-col gap-1">
             <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest ml-1">Network Oversight</span>
             <div className="flex bg-slate-900 rounded-xl p-1 text-[10px] md:text-xs border border-white/5">
               {/* Fix: Comparison now works because viewMode type is not narrowed to exclude 'hq' */}
               <button onClick={() => setViewMode('hq')} className={`px-5 py-1.5 rounded-lg transition-all flex items-center gap-2 ${viewMode === 'hq' ? 'bg-indigo-600 text-white font-black shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  Global HQ Portal
               </button>
             </div>
          </div>
        </div>

        <div className="flex gap-2">
           {!isRemoteViewing && <button onClick={() => { handleSave(); alert("Institutional records synchronized with network."); }} className="bg-yellow-500 hover:bg-yellow-600 text-blue-950 px-5 py-2 rounded-xl font-black shadow-xl transition-all active:scale-95 text-[10px] uppercase tracking-widest">Sync Registry</button>}
           <button onClick={() => window.print()} className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-xl font-black shadow transition-all text-[10px] uppercase tracking-widest border border-white/10">Print View</button>
           <button onClick={handleExitToDrive} className="bg-slate-900 hover:bg-black text-white px-5 py-2 rounded-xl font-black shadow-xl transition-all active:scale-95 text-[10px] uppercase tracking-widest flex items-center gap-2 border border-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              Exit to Drive
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-100 p-4 md:p-8">
        {viewMode === 'master' && <MasterSheet students={processedStudents} stats={stats} settings={settings} onSettingChange={handleSettingChange} facilitators={facilitators} isFacilitator={isFacilitator} />}
        {viewMode === 'series' && <SeriesBroadSheet students={students} settings={settings} onSettingChange={handleSettingChange} currentProcessed={processedStudents.map(p => ({ id: p.id, aggregate: p.bestSixAggregate, rank: p.rank, totalScore: p.totalScore, category: p.category }))} />}
        {viewMode === 'reports' && (
          <div className="space-y-8">
            <div className="no-print mb-4 max-w-xl mx-auto"><input type="text" placeholder="Filter pupils..." value={reportSearchTerm} onChange={(e) => setReportSearchTerm(e.target.value)} className="w-full p-5 rounded-2xl border border-gray-200 shadow-xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold" /></div>
            {processedStudents.filter(s => s.name.toLowerCase().includes(reportSearchTerm.toLowerCase())).map(student => (
              <ReportCard key={student.id} student={student} stats={stats} settings={settings} onSettingChange={handleSettingChange} onStudentUpdate={handleStudentOverallRemarkUpdate} classAverageAggregate={classAvgAggregate} totalEnrolled={processedStudents.length} isFacilitator={isFacilitator} />
            ))}
          </div>
        )}
        {viewMode === 'management' && (
          <ManagementDesk 
            students={students} setStudents={setStudents} facilitators={facilitators} setFacilitators={setFacilitators} 
            subjects={SUBJECT_LIST} settings={settings} onSettingChange={handleSettingChange} 
            onBulkUpdate={bulkUpdateSettings} onSave={handleSave} processedSnapshot={processedStudents} 
            onLoadDummyData={() => alert("Demo data can be provided via Host Web Mock Button.")} onClearData={() => setStudents([])} isFacilitator={isFacilitator} activeFacilitator={activeFacilitator}
          />
        )}
        {viewMode === 'pupil_hub' && activePupil && (
          <PupilDashboard 
            student={activePupil} 
            stats={stats} 
            settings={settings} 
            classAverageAggregate={classAvgAggregate} 
            totalEnrolled={processedStudents.length} 
            onSettingChange={handleSettingChange}
            globalRegistry={globalRegistry}
          />
        )}
      </div>
    </div>
  );
};

export default App;