
import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, BookOpen, CheckCircle, Clock, ClipboardCheck, ChevronRight, Save } from 'lucide-react';
import { Student, ClassRoom, Subject, AttendanceRecord, AttendanceStatus } from '../types';
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
  
  // State for Quick Attendance
  const [qClassId, setQClassId] = useState('');
  const [qSubjectId, setQSubjectId] = useState('');
  const [localAbsence, setLocalAbsence] = useState<Record<string, AttendanceStatus>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Stats
  const stats = [
    { label: 'Total Siswa', value: students.length, icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Total Kelas', value: classes.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Total Mapel', value: subjects.length, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Absen Hari Ini', value: attendance.filter(a => a.date === today).length, icon: CheckCircle, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  // Sync local attendance when selection changes
  useEffect(() => {
    if (qClassId && qSubjectId) {
      const existing = attendance.filter(a => 
        a.classId === qClassId && a.subjectId === qSubjectId && a.date === today
      );
      const mapped: Record<string, AttendanceStatus> = {};
      existing.forEach(a => mapped[a.studentId] = a.status);
      setLocalAbsence(mapped);
    }
  }, [qClassId, qSubjectId, attendance, today]);

  const qStudents = students.filter(s => s.classId === qClassId);

  const updateStatus = (studentId: string, status: AttendanceStatus) => {
    setLocalAbsence(prev => ({ ...prev, [studentId]: status }));
  };

  const handleQuickSave = () => {
    if (!qClassId || !qSubjectId) return;
    setIsSaving(true);

    const newRecords: AttendanceRecord[] = qStudents.map(s => ({
      id: `${qClassId}-${qSubjectId}-${today}-${s.id}`,
      studentId: s.id,
      classId: qClassId,
      subjectId: qSubjectId,
      date: today,
      status: localAbsence[s.id] || AttendanceStatus.HADIR // Default Hadir for quick action
    }));

    setAttendance(prev => [
      ...prev.filter(a => !(a.classId === qClassId && a.subjectId === qSubjectId && a.date === today)),
      ...newRecords
    ]);

    setTimeout(() => {
      setIsSaving(false);
      alert('Presensi berhasil disimpan!');
    }, 500);
  };

  // Distribution Chart Data
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
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Attendance Card */}
        <div className="lg:col-span-1 flex flex-col space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <ClipboardCheck className="mr-2 text-indigo-600" size={20} />
                Presensi Cepat
              </h3>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded uppercase">Hari Ini</span>
            </div>

            <div className="space-y-4 mb-6">
              <select 
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={qClassId}
                onChange={(e) => setQClassId(e.target.value)}
              >
                <option value="">Pilih Kelas</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select 
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={qSubjectId}
                onChange={(e) => setQSubjectId(e.target.value)}
              >
                <option value="">Pilih Mata Pelajaran</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 space-y-3 custom-scrollbar">
              {!qClassId || !qSubjectId ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-4">
                  <Clock size={32} className="opacity-20 mb-2" />
                  <p className="text-xs">Pilih kelas & mapel untuk memulai presensi cepat</p>
                </div>
              ) : qStudents.length === 0 ? (
                <p className="text-center text-xs text-slate-400">Kelas ini tidak memiliki siswa</p>
              ) : (
                qStudents.map(student => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="overflow-hidden mr-2">
                      <p className="text-sm font-medium text-slate-800 truncate">{student.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{student.nisn}</p>
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
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all border ${
                            localAbsence[student.id] === opt.v
                              ? `bg-${opt.c}-500 border-${opt.c}-500 text-white shadow-sm`
                              : `bg-white border-slate-200 text-slate-400 hover:bg-${opt.c}-50 hover:text-${opt.c}-600`
                          }`}
                        >
                          {opt.i}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {qClassId && qSubjectId && qStudents.length > 0 && (
              <button 
                onClick={handleQuickSave}
                disabled={isSaving}
                className="w-full mt-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center justify-center space-x-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:bg-slate-300"
              >
                {isSaving ? <Clock size={18} className="animate-spin" /> : <Save size={18} />}
                <span>Simpan Presensi</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Chart */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold mb-6 text-slate-800">Tren Kehadiran 7 Hari Terakhir</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="hadir" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="izin" stackId="a" fill="#3B82F6" />
                  <Bar dataKey="sakit" stackId="a" fill="#F59E0B" />
                  <Bar dataKey="alpha" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold mb-6 text-slate-800 text-center">Distribusi Status Keseluruhan</h3>
            {attendance.length > 0 ? (
              <div className="flex flex-col md:flex-row items-center justify-center space-y-6 md:space-y-0 md:space-x-12">
                <div className="h-64 w-64 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 max-w-xs space-y-4">
                  {pieData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-md mr-3 shadow-sm" style={{ backgroundColor: d.color }}></div>
                        <span className="text-slate-600 font-medium">{d.name}</span>
                      </div>
                      <span className="font-bold text-slate-800">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                <Clock size={48} className="mb-2 opacity-20" />
                <p>Belum ada data absensi untuk dianalisis</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
