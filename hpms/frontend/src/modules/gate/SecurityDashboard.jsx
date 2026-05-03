import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';

export default function SecurityDashboard() {
  const navigate = useNavigate();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
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
      setTotal(res.data.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch scans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScans(); }, [selectedDate]);

  const formatTime = (dt) => {
    if (!dt) return 'N/A';
    return new Date(dt).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const exitCount = scans.filter(s => s.scanType === 'EXIT').length;
  const entryCount = scans.filter(s => s.scanType === 'ENTRY').length;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      
      {/* Header */}
      <div className="bg-slate-800 px-6 py-4 flex items-center 
        justify-between border-b border-slate-700">
        <div>
          <h1 className="text-white font-bold text-xl">
            Gate Activity Log
          </h1>
          <p className="text-slate-400 text-sm">
            MITE Hostel — Security Dashboard
          </p>
        </div>
        <button
          onClick={() => navigate('/gate/scan')}
          className="bg-blue-500 hover:bg-blue-600 text-white 
            px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          📷 Open Scanner
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">

        {/* Date Filter + Stats */}
        <div className="flex items-center justify-between mb-6 
          flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <label className="text-slate-400 text-sm">Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-700 border border-slate-600 
                text-white rounded-lg px-3 py-1.5 text-sm
                focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={fetchScans}
              className="bg-slate-700 hover:bg-slate-600 text-white 
                px-3 py-1.5 rounded-lg text-sm transition-colors"
            >
              Refresh
            </button>
          </div>
          
          {/* Summary badges */}
          <div className="flex gap-3">
            <div className="bg-slate-800 border border-slate-700 
              rounded-lg px-4 py-2 text-center shadow-lg">
              <p className="text-2xl font-bold text-white">
                {total}
              </p>
              <p className="text-slate-400 text-xs uppercase tracking-wider">Total</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 
              rounded-lg px-4 py-2 text-center shadow-lg">
              <p className="text-2xl font-bold text-amber-400">
                {exitCount}
              </p>
              <p className="text-amber-400 text-xs uppercase tracking-wider">Exits</p>
            </div>
            <div className="bg-emerald-500/10 border 
              border-emerald-500/30 rounded-lg px-4 py-2 text-center shadow-lg">
              <p className="text-2xl font-bold text-emerald-400">
                {entryCount}
              </p>
              <p className="text-emerald-400 text-xs uppercase tracking-wider">Returns</p>
            </div>
          </div>
        </div>

        {/* Scan List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Loading activity...</p>
          </div>
        ) : scans.length === 0 ? (
          <div className="text-center text-slate-500 py-16 bg-slate-800/50 rounded-2xl border border-dashed border-slate-700">
            <p className="text-lg">No scans recorded for this date.</p>
            <p className="text-sm mt-2">
              Scans will appear here as students pass through the gate.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {scans.map((scan) => {
              const student = scan.certificate?.request?.student;
              const room = student?.room;
              const block = room?.floor?.block;
              const isExit = scan.scanType === 'EXIT';
              
              return (
                <div
                  key={scan.id}
                  className={`bg-slate-800 rounded-2xl border transition-all hover:translate-x-1
                    flex items-center gap-4 p-4
                    ${isExit 
                      ? 'border-amber-500/20 hover:border-amber-500/40' 
                      : 'border-emerald-500/20 hover:border-emerald-500/40'
                    }`}
                >
                  {/* Scan type indicator */}
                  <div className={`w-14 h-14 rounded-2xl flex 
                    flex-col items-center justify-center flex-shrink-0
                    ${isExit 
                      ? 'bg-amber-500/20 text-amber-400' 
                      : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                    <span className="text-xl">
                      {isExit ? '🚶' : '🏠'}
                    </span>
                    <span className="text-[10px] font-black mt-0.5">
                      {isExit ? 'EXIT' : 'ENTRY'}
                    </span>
                  </div>

                  {/* Student info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-lg leading-none mb-1">
                      {student?.fullName || 'Unknown Student'}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {student?.usn} 
                      {room ? ` • Room ${room.displayName}` : ''}
                      {block ? ` (${block.name})` : ''}
                    </p>
                    <p className="text-slate-500 text-xs mt-1 italic">
                      Scanned by: {scan.scannedBy?.fullName || 'Security'}
                    </p>
                  </div>

                  {/* Time */}
                  <div className="text-right flex-shrink-0">
                    <p className={`font-black text-xl
                      ${isExit 
                        ? 'text-amber-400' 
                        : 'text-emerald-400'
                      }`}>
                      {formatTime(scan.scannedAt)}
                    </p>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-tighter">
                      {new Date(scan.scannedAt)
                        .toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
