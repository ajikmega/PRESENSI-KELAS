
import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, BookOpen, CheckCircle, Clock, ClipboardCheck, Save, CheckCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { Student, ClassRoom, Subject, AttendanceRecord, AttendanceStatus } from '../types';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
  students: Student[];
  classes: ClassRoom[];
  subjects: Subject[];
  attendance: AttendanceRecord[];
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
}

const Dashboard: React.FC<DashboardProps> = ({ students, classes, subjects, attendance, setAttendance }) => {
  const today = new Date().toISOString().split('T')[0];
  
  const [qClassId, setQClassId] = useState('');
  const [qSubjectId, setQSubjectId] = useState('');
  const [localAbsence, setLocalAbsence] = useState<Record<string, AttendanceStatus>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (qClassId && qSubjectId) {
      const existing = attendance.filter(a => 
        a.classId === qClassId && a.subjectId === qSubjectId && a.date === today
      );
      const mapped: Record<string, AttendanceStatus> = {};
      existing.forEach(a => mapped[a.studentId] = a.status);
      setLocalAbsence(mapped);
    } else {
      setLocalAbsence({});
    }
  }, [qClassId, qSubjectId, attendance, today]);

  const qStudents = students.filter(s => s.classId === qClassId);
  const markedCount = Object.keys(localAbsence).length;
  const progressPercent = qStudents.length > 0 ? (markedCount / qStudents.length) * 100 : 0;

  const updateStatus = (studentId: string, status: AttendanceStatus) => {
    setLocalAbsence(prev => ({ ...prev, [studentId]: status }));
  };

  const setAllHadir = () => {
    const bulk: Record<string, AttendanceStatus> = {};
    qStudents.forEach(s => bulk[s.id] = AttendanceStatus.HADIR);
    setLocalAbsence(bulk);
  };

  const handleQuickSave = async () => {
    if (!qClassId || !qSubjectId) return;
    setIsSaving(true);

    const newRecords: AttendanceRecord[] = qStudents.map(s => ({
      id: `${qClassId}-${qSubjectId}-${today}-${s.id}`,
      studentId: s.id,
      classId: qClassId,
      subjectId: qSubjectId,
      date: today,
      status: localAbsence[s.id] || AttendanceStatus.ALPHA
    }));

    // Gunakan upsert untuk Supabase agar tidak duplikat
    const { error } = await supabase.from('attendance').upsert(newRecords);

    if (!error) {
      setAttendance(prev => [
        ...prev.filter(a => !(a.classId === qClassId && a.subjectId === qSubjectId && a.date === today)),
        ...newRecords
      ]);
      alert('Presensi berhasil disinkronkan ke Supabase!');
    } else {
      alert('Gagal menyimpan ke Supabase: ' + error.message);
    }

    setIsSaving(false);
  };

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const chartData = last7Days.map(date => {
    const daily = attendance.filter(a => a.date === date);
    return {
      name: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      hadir: daily.filter(a => a.status === AttendanceStatus.HADIR).length,
      izin: daily.filter(a => a.status === AttendanceStatus.IZIN).length,
      sakit: daily.filter(a => a.status === AttendanceStatus.SAKIT).length,
      alpha: daily.filter(a => a.status === AttendanceStatus.ALPHA).length,
    };
  });

  const pieData = [
    { name: 'Hadir', value: attendance.filter(a => a.status === AttendanceStatus.HADIR).length, color: '#10B981' },
    { name: 'Izin', value: attendance.filter(a => a.status === AttendanceStatus.IZIN).length, color: '#3B82F6' },
    { name: 'Sakit', value: attendance.filter(a => a.status === AttendanceStatus.SAKIT).length, color: '#F59E0B' },
    { name: 'Alpha', value: attendance.filter(a => a.status === AttendanceStatus.ALPHA).length, color: '#EF4444' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Siswa', value: students.length, icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Total Kelas', value: classes.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100' },
          { label: 'Total Mapel', value: subjects.length, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { label: 'Sesi Absen Hari Ini', value: new Set(attendance.filter(a => a.date === today).map(a => `${a.classId}-${a.subjectId}`)).size, icon: CheckCircle, color: 'text-amber-600', bg: 'bg-amber-100' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                  <ClipboardCheck className="mr-2 text-indigo-600" size={20} />
                  Presensi Dashboard
                </h3>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded uppercase">Real-time DB</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none bg-white transition-all shadow-sm" value={qClassId} onChange={(e) => setQClassId(e.target.value)}>
                  <option value="">Pilih Kelas</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none bg-white transition-all shadow-sm" value={qSubjectId} onChange={(e) => setQSubjectId(e.target.value)}>
                  <option value="">Pilih Mapel</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {!qClassId || !qSubjectId ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 text-center">
                  <Clock size={32} className="opacity-20 mb-2" />
                  <p className="text-sm">Pilih kelas & mapel untuk memulai.</p>
                </div>
              ) : qStudents.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 text-center">
                  <AlertCircle size={48} className="opacity-10 mb-4" />
                  <p className="text-sm">Kelas ini kosong.</p>
                </div>
              ) : (
                <>
                  <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex-1">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-xs font-semibold text-slate-500">Progres</span>
                        <span className="text-xs font-bold text-indigo-600">{markedCount} / {qStudents.length}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                      </div>
                    </div>
                    <button onClick={setAllHadir} className="ml-4 px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs font-bold flex items-center">
                      <CheckCheck size={14} className="mr-1" /> Semua Hadir
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-slate-50/30 custom-scrollbar">
                    {qStudents.map(student => (
                      <div key={student.id} className="bg-white border border-slate-100 rounded-lg shadow-sm p-3 flex items-center justify-between">
                        <div className="max-w-[150px]">
                          <p className="text-sm font-bold text-slate-700 truncate">{student.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">NISN: {student.nisn}</p>
                        </div>
                        <div className="flex space-x-1 shrink-0">
                          {[
                            { v: AttendanceStatus.HADIR, i: 'H', c: 'emerald' },
                            { v: AttendanceStatus.IZIN, i: 'I', c: 'blue' },
                            { v: AttendanceStatus.SAKIT, i: 'S', c: 'amber' },
                            { v: AttendanceStatus.ALPHA, i: 'A', c: 'red' },
                          ].map(opt => (
                            <button
                              key={opt.v}
                              onClick={() => updateStatus(student.id, opt.v)}
                              className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold transition-all border ${localAbsence[student.id] === opt.v ? `bg-${opt.c}-500 border-${opt.c}-500 text-white scale-110` : `bg-white border-slate-100 text-slate-400`}`}
                            >
                              {opt.i}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-white border-t border-slate-100">
                    <button onClick={handleQuickSave} disabled={isSaving || markedCount === 0} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center justify-center space-x-2 hover:bg-indigo-700 disabled:bg-slate-300">
                      {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                      <span>{isSaving ? 'Sinkronisasi...' : 'Simpan ke Supabase'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[400px]">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Tren Kehadiran (Supabase)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="hadir" stackId="a" fill="#10B981" />
                <Bar dataKey="izin" stackId="a" fill="#3B82F6" />
                <Bar dataKey="sakit" stackId="a" fill="#F59E0B" />
                <Bar dataKey="alpha" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[300px]">
              <h3 className="text-lg font-bold mb-4 text-slate-800">Distribusi Status</h3>
              {attendance.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-300 italic text-sm">Belum ada data</div>
              )}
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <h3 className="text-lg font-bold mb-4 text-slate-800">Log Supabase Terbaru</h3>
              <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                {attendance.length > 0 ? (
                  [...attendance].reverse().slice(0, 5).map((log, i) => (
                    <div key={i} className="flex items-start space-x-3 pb-2 border-b border-slate-50 last:border-0">
                      <div className={`mt-1 w-2 h-2 rounded-full ${log.status === 'HADIR' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-bold text-slate-800 truncate">{students.find(s => s.id === log.studentId)?.name || 'Siswa'}</p>
                        <p className="text-[10px] text-slate-500">{subjects.find(s => s.id === log.subjectId)?.name}</p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{log.status[0]}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-slate-400 my-auto italic">Database kosong.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
