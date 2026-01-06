
import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, BookOpen, CheckCircle, Clock, ClipboardCheck, Save, CheckCheck, AlertCircle, RefreshCw, Edit3 } from 'lucide-react';
import { Student, ClassRoom, Subject, AttendanceRecord, AttendanceStatus } from '../types';
import { supabase } from '../lib/supabase';

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
  const [hasExistingData, setHasExistingData] = useState(false);

  useEffect(() => {
    if (qClassId && qSubjectId) {
      const existing = attendance.filter(a => 
        a.classId === qClassId && a.subjectId === qSubjectId && a.date === today
      );
      
      if (existing.length > 0) {
        const mapped: Record<string, AttendanceStatus> = {};
        existing.forEach(a => mapped[a.studentId] = a.status);
        setLocalAbsence(mapped);
        setHasExistingData(true);
      } else {
        setLocalAbsence({});
        setHasExistingData(false);
      }
    } else {
      setLocalAbsence({});
      setHasExistingData(false);
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

    // KUNCI UTAMA: ID yang deterministik mencegah duplikasi di level Database
    const newRecords: AttendanceRecord[] = qStudents.map(s => ({
      id: `${qClassId}-${qSubjectId}-${today}-${s.id}`,
      studentId: s.id,
      classId: qClassId,
      subjectId: qSubjectId,
      date: today,
      status: localAbsence[s.id] || AttendanceStatus.ALPHA
    }));

    const { error } = await supabase.from('attendance').upsert(newRecords);

    if (!error) {
      // KUNCI KEDUA: Filter state sebelum update mencegah duplikasi di level UI
      setAttendance(prev => [
        ...prev.filter(a => !(a.classId === qClassId && a.subjectId === qSubjectId && a.date === today)),
        ...newRecords
      ]);
      alert(hasExistingData ? 'Presensi berhasil diperbarui!' : 'Presensi berhasil disimpan!');
    } else {
      alert('Gagal menyimpan: ' + error.message);
    }

    setIsSaving(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Siswa', value: students.length, icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Kelas', value: classes.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Total Mapel', value: subjects.length, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Sesi Hari Ini', value: new Set(attendance.filter(a => a.date === today).map(a => `${a.classId}-${a.subjectId}`)).size, icon: CheckCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 transition-transform hover:scale-[1.02]">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={22} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-xl font-bold text-slate-800">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Presensi Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col min-h-[500px]">
        {/* Header Section */}
        <div className="p-6 border-b border-slate-50 bg-slate-50/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-xl shadow-lg ${hasExistingData ? 'bg-emerald-600 shadow-emerald-200' : 'bg-indigo-600 shadow-indigo-200'}`}>
                {hasExistingData ? <Edit3 size={24} className="text-white" /> : <ClipboardCheck size={24} className="text-white" />}
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">
                  {hasExistingData ? 'Update Presensi' : 'Presensi Cepat'}
                </h3>
                <p className="text-sm text-slate-500 font-medium">
                  {hasExistingData ? 'Sesi ini sudah memiliki data. Anda dalam mode edit.' : 'Input kehadiran hari ini dengan mudah'}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select 
                className="px-4 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl outline-none bg-white focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all min-w-[160px]" 
                value={qClassId} 
                onChange={(e) => setQClassId(e.target.value)}
              >
                <option value="">Pilih Kelas</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select 
                className="px-4 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl outline-none bg-white focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all min-w-[160px]" 
                value={qSubjectId} 
                onChange={(e) => setQSubjectId(e.target.value)}
              >
                <option value="">Pilih Mapel</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {qClassId && qSubjectId && qStudents.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex-1 w-full">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Progres Pengisian</span>
                  <span className={`text-sm font-extrabold ${hasExistingData ? 'text-emerald-600' : 'text-indigo-600'}`}>
                    {markedCount} / {qStudents.length} Siswa {hasExistingData && '(Sudah Terisi)'}
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm ${hasExistingData ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
              <button 
                onClick={setAllHadir} 
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-bold flex items-center justify-center hover:bg-emerald-100 transition-colors shrink-0"
              >
                <CheckCheck size={18} className="mr-2" /> Tandai Semua Hadir
              </button>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col p-6">
          {!qClassId || !qSubjectId ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                <Clock size={40} className="opacity-20" />
              </div>
              <h4 className="text-lg font-bold text-slate-600">Mulai Presensi</h4>
              <p className="text-sm max-w-[250px] mx-auto mt-1">Silakan pilih kelas dan mata pelajaran pada pilihan di atas.</p>
            </div>
          ) : qStudents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 text-center">
              <AlertCircle size={48} className="opacity-10 mb-4 text-red-500" />
              <p className="text-sm font-bold text-slate-600">Kelas ini belum memiliki siswa.</p>
              <p className="text-xs mt-1">Tambahkan siswa di menu Manajemen Kelas.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 content-start mb-6">
                {qStudents.map(student => (
                  <div key={student.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between hover:border-indigo-100 hover:shadow-md transition-all group">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-[13px] font-bold text-slate-800 truncate group-hover:text-indigo-700 transition-colors uppercase">{student.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono tracking-wider mt-0.5">NISN: {student.nisn}</p>
                    </div>
                    <div className="flex space-x-1.5 shrink-0">
                      {[
                        { v: AttendanceStatus.HADIR, i: 'H', c: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-600', active: 'bg-emerald-500 border-emerald-500 text-white' },
                        { v: AttendanceStatus.IZIN, i: 'I', c: 'blue', bg: 'bg-blue-50', text: 'text-blue-600', active: 'bg-blue-600 border-blue-600 text-white' },
                        { v: AttendanceStatus.SAKIT, i: 'S', c: 'amber', bg: 'bg-amber-50', text: 'text-amber-600', active: 'bg-amber-500 border-amber-500 text-white' },
                        { v: AttendanceStatus.ALPHA, i: 'A', c: 'red', bg: 'bg-red-50', text: 'text-red-600', active: 'bg-red-500 border-red-500 text-white' },
                      ].map(opt => (
                        <button
                          key={opt.v}
                          onClick={() => updateStatus(student.id, opt.v)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-extrabold transition-all border shadow-sm ${
                            localAbsence[student.id] === opt.v 
                              ? opt.active + ' scale-105' 
                              : `bg-white border-slate-100 text-slate-400 hover:${opt.bg} hover:${opt.text} hover:border-indigo-200`
                          }`}
                        >
                          {opt.i}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Action Bar */}
              <div className="sticky bottom-0 pt-6 mt-auto bg-white border-t border-slate-50 flex items-center justify-between">
                <div className="hidden sm:block">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status:</span>
                  <span className={`ml-2 text-xs font-extrabold ${hasExistingData ? 'text-emerald-600' : 'text-indigo-600'}`}>
                    {hasExistingData ? 'Sudah Ada di Database (Update)' : markedCount === qStudents.length ? 'Semua Terisi' : 'Belum Selesai'}
                  </span>
                </div>
                <button 
                  onClick={handleQuickSave} 
                  disabled={isSaving || markedCount === 0} 
                  className={`w-full sm:w-auto px-10 py-4 text-white rounded-2xl font-black text-sm tracking-wide flex items-center justify-center space-x-3 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:bg-slate-200 disabled:text-slate-400 shadow-xl ${
                    hasExistingData 
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200/50' 
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200/50'
                  }`}
                >
                  {isSaving ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
                  <span>{isSaving ? 'MENYIMPAN...' : hasExistingData ? 'UPDATE DATA PRESENSI' : 'SIMPAN PRESENSI'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Helper Legend */}
      <div className="flex justify-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100/50 p-4 rounded-2xl border border-slate-200/50">
        <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>H = Hadir</div>
        <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-600 mr-2"></span>I = Izin</div>
        <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>S = Sakit</div>
        <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>A = Alpha</div>
      </div>
    </div>
  );
};

export default Dashboard;
