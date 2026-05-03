import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';

export default function SecurityDashboard() {
  const navigate = useNavigate();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const fetchScans = async () => {
    try {
      setLoading(true);
      const res = await client.get('/gate/scans', {
        params: { date: selectedDate }
      });
      setScans(res.data.data.scans || []);
    } catch (err) {
      console.error('Failed to fetch scans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScans(); }, [selectedDate]);

  // Group scans by certificateId to show a single entry per outing
  const groupedScans = useMemo(() => {
    const groups = {};
    
    scans.forEach(scan => {
      const certId = scan.certificateId;
      if (!groups[certId]) {
        groups[certId] = {
          id: certId,
          student: scan.certificate?.request?.student,
          certificate: scan.certificate,
          exitScan: null,
          entryScan: null
        };
      }
      
      if (scan.scanType === 'EXIT') {
        groups[certId].exitScan = scan;
      } else if (scan.scanType === 'ENTRY') {
        groups[certId].entryScan = scan;
      }
    });
    
    return Object.values(groups).sort((a, b) => {
      const timeA = new Date(a.entryScan?.scannedAt || a.exitScan?.scannedAt);
      const timeB = new Date(b.entryScan?.scannedAt || b.exitScan?.scannedAt);
      return timeB - timeA;
    });
  }, [scans]);

  const formatTime = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const exitCount = scans.filter(s => s.scanType === 'EXIT').length;
  const entryCount = scans.filter(s => s.scanType === 'ENTRY').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 px-6 py-6 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Gate Activity Log
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Real-time monitoring of student entry and exit
            </p>
          </div>
          <button
            onClick={() => navigate('/gate/scan')}
            className="bg-blue-600 hover:bg-blue-700 text-white 
              px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <span>📷</span> Open Scanner
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Filters and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Stats Bar */}
          <div className="lg:col-span-2 flex gap-4">
            <div className="flex-1 themed-card rounded-2xl p-4 text-center shadow-sm">
              <p className="text-3xl font-black text-blue-600">{exitCount + entryCount}</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest font-bold mt-1">Total Scans</p>
            </div>
            <div className="flex-1 themed-card rounded-2xl p-4 text-center shadow-sm border-l-4 border-l-amber-500">
              <p className="text-3xl font-black text-amber-500">{exitCount}</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest font-bold mt-1">Exits</p>
            </div>
            <div className="flex-1 themed-card rounded-2xl p-4 text-center shadow-sm border-l-4 border-l-emerald-500">
              <p className="text-3xl font-black text-emerald-500">{entryCount}</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest font-bold mt-1">Returns</p>
            </div>
          </div>

          {/* Date Filter */}
          <div className="themed-card rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className="flex-1">
              <label className="block text-[10px] uppercase tracking-tighter font-black text-slate-400 mb-1">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="themed-input w-full rounded-lg px-3 py-1.5 text-sm outline-none"
              />
            </div>
            <button
              onClick={fetchScans}
              className="mt-5 p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
              title="Refresh Data"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Scan List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 px-1">Daily Activity Feed</h2>
          
          {loading ? (
            <div className="text-center py-20 themed-card rounded-2xl">
              <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Fetching records...</p>
            </div>
          ) : groupedScans.length === 0 ? (
            <div className="text-center py-16 themed-card rounded-2xl border-dashed">
              <p className="text-slate-400 dark:text-slate-500 text-lg">No activity recorded for this date.</p>
              <p className="text-sm text-slate-400 mt-1">Once students start scanning their QRs, they will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groupedScans.map((group) => {
                const { student, exitScan, entryScan, certificate } = group;
                const room = student?.room;
                const block = room?.floor?.block;
                
                return (
                  <div
                    key={group.id}
                    className="themed-card rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6"
                  >
                    {/* Student Avatar/Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-black flex-shrink-0">
                        {student?.fullName?.[0] || 'S'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg font-bold truncate leading-tight text-slate-800 dark:text-white">
                          {student?.fullName || 'Unknown Student'}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                          <span className="font-mono">{student?.usn}</span>
                          {room ? ` • Room ${room.displayName}` : ''}
                          {block ? ` (${block.name})` : ''}
                        </p>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">
                          #{certificate?.request?.approvalNumber}
                        </p>
                      </div>
                    </div>

                    {/* Scan Times */}
                    <div className="flex items-center gap-2 md:gap-8 flex-shrink-0 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      
                      {/* Exit Status */}
                      <div className="text-center min-w-[80px]">
                        <p className="text-[10px] uppercase font-black text-amber-500 mb-1">Exit</p>
                        <p className={`text-lg font-black ${exitScan ? 'text-slate-700 dark:text-white' : 'text-slate-300 dark:text-slate-700'}`}>
                          {formatTime(exitScan?.scannedAt)}
                        </p>
                      </div>

                      {/* Timeline Arrow */}
                      <div className="text-slate-300 dark:text-slate-700 text-xl hidden sm:block">→</div>

                      {/* Entry Status */}
                      <div className="text-center min-w-[80px]">
                        <p className="text-[10px] uppercase font-black text-emerald-500 mb-1">Return</p>
                        <p className={`text-lg font-black ${entryScan ? 'text-slate-700 dark:text-white' : 'text-slate-300 dark:text-slate-700'}`}>
                          {formatTime(entryScan?.scannedAt)}
                        </p>
                      </div>

                    </div>

                    {/* Status Badge */}
                    <div className="hidden xl:block min-w-[120px] text-right">
                      {entryScan ? (
                        <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-4 py-1.5 rounded-full text-xs font-black uppercase">
                          Completed
                        </span>
                      ) : exitScan ? (
                        <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-4 py-1.5 rounded-full text-xs font-black uppercase animate-pulse">
                          Outside
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-400 px-4 py-1.5 rounded-full text-xs font-black uppercase">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
