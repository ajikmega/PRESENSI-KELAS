
import React, { useState } from 'react';
import { Search, Save, ClipboardCheck, Calendar, BookOpen, Users, RefreshCw, CheckCheck } from 'lucide-react';
import { ClassRoom, Student, Subject, AttendanceRecord, AttendanceStatus } from '../types';
import { supabase } from '../lib/supabase';

interface AttendanceEntryProps {
  classes: ClassRoom[];
  students: Student[];
  subjects: Subject[];
  attendance: AttendanceRecord[];
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
}

const AttendanceEntry: React.FC<AttendanceEntryProps> = ({ classes, students, subjects, attendance, setAttendance }) => {
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [localAttendance, setLocalAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleLoadAttendance = () => {
    if (!selectedClassId || !selectedSubjectId || !selectedDate) return;
    
    const existing = attendance.filter(a => 
      a.classId === selectedClassId && 
      a.subjectId === selectedSubjectId && 
      a.date === selectedDate
    );

    const mapped: Record<string, AttendanceStatus> = {};
    existing.forEach(a => mapped[a.studentId] = a.status);
    setLocalAttendance(mapped);
    setIsSaved(false);
  };

  const classStudents = students.filter(s => s.classId === selectedClassId);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setLocalAttendance(prev => ({ ...prev, [studentId]: status }));
    setIsSaved(false);
  };

  const saveAttendance = async () => {
    if (!selectedClassId || !selectedSubjectId || !selectedDate) return;
    setIsSaving(true);

    const newRecords: AttendanceRecord[] = classStudents.map(student => ({
      id: `${selectedClassId}-${selectedSubjectId}-${selectedDate}-${student.id}`,
      studentId: student.id,
      classId: selectedClassId,
      subjectId: selectedSubjectId,
      date: selectedDate,
      status: localAttendance[student.id] || AttendanceStatus.ALPHA,
    }));

    const { error } = await supabase.from('attendance').upsert(newRecords);

    if (!error) {
      setAttendance(prev => [
        ...prev.filter(a => !(a.classId === selectedClassId && a.subjectId === selectedSubjectId && a.date === selectedDate)),
        ...newRecords
      ]);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } else {
      alert('Gagal menyimpan ke database: ' + error.message);
    }

    setIsSaving(false);
  };

  const setAllHadir = () => {
    const bulk: Record<string, AttendanceStatus> = {};
    classStudents.forEach(s => bulk[s.id] = AttendanceStatus.HADIR);
    setLocalAttendance(bulk);
  };

  return (
    <div className="space-y-6 relative">
      {isSaving && (
        <div className="fixed inset-0 bg-white/20 z-[60] flex items-center justify-center backdrop-blur-[1px]">
          <RefreshCw className="animate-spin text-indigo-600" size={48} />
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-1.5 flex items-center">
            <Calendar size={14} className="mr-1.5" /> Tanggal
          </label>
          <input 
            type="date" 
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-1.5 flex items-center">
            <Users size={14} className="mr-1.5" /> Kelas
          </label>
          <select 
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            <option value="">Pilih Kelas</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-1.5 flex items-center">
            <BookOpen size={14} className="mr-1.5" /> Mata Pelajaran
          </label>
          <select 
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
          >
            <option value="">Pilih Mapel</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <button 
          onClick={handleLoadAttendance}
          disabled={!selectedClassId || !selectedSubjectId}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:bg-slate-300"
        >
          <ClipboardCheck size={18} />
          <span>Buka Absensi</span>
        </button>
      </div>

      {!selectedClassId || !selectedSubjectId ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-300 rounded-xl bg-slate-50">
          <ClipboardCheck size={48} className="opacity-10 mb-2" />
          <p>Pilih Parameter Absensi Terlebih Dahulu</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-semibold text-slate-700">Daftar Kehadiran Siswa</h3>
            <button 
              onClick={setAllHadir}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded hover:bg-emerald-100 transition-colors flex items-center"
            >
              <CheckCheck size={14} className="mr-1" />
              Set Semua Hadir
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase w-16">No</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Nama Siswa</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Status Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.length === 0 ? (
                  <tr><td colSpan={3} className="p-8 text-center text-slate-400">Tidak ada siswa di kelas ini</td></tr>
                ) : (
                  classStudents.map((student, idx) => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-500">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{student.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{student.nisn}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center space-x-2">
                          {[
                            { label: 'Hadir', value: AttendanceStatus.HADIR, color: 'emerald', initial: 'H' },
                            { label: 'Izin', value: AttendanceStatus.IZIN, color: 'blue', initial: 'I' },
                            { label: 'Sakit', value: AttendanceStatus.SAKIT, color: 'amber', initial: 'S' },
                            { label: 'Alpha', value: AttendanceStatus.ALPHA, color: 'red', initial: 'A' },
                          ].map(opt => {
                            const isSelected = localAttendance[student.id] === opt.value;
                            return (
                              <button
                                key={opt.value}
                                onClick={() => setStatus(student.id, opt.value)}
                                title={opt.label}
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all border-2 ${
                                  isSelected 
                                    ? `bg-${opt.color}-500 text-white border-${opt.color}-500 shadow-md transform scale-110` 
                                    : `bg-white text-${opt.color}-600 border-${opt.color}-100 hover:bg-${opt.color}-50`
                                }`}
                              >
                                {opt.initial}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
            <p className="text-sm text-slate-500">
              {Object.keys(localAttendance).length} dari {classStudents.length} siswa sudah diabsen
            </p>
            <button 
              onClick={saveAttendance}
              disabled={isSaving}
              className={`flex items-center space-x-2 px-8 py-3 rounded-lg font-bold transition-all ${
                isSaved 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg disabled:bg-slate-300'
              }`}
            >
              {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
              <span>{isSaved ? 'Berhasil Disimpan!' : isSaving ? 'Menyimpan...' : 'Simpan Absensi'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceEntry;
