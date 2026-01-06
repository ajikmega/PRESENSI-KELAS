
import React, { useState } from 'react';
import { FileDown, Search, Filter, Printer } from 'lucide-react';
import { ClassRoom, Student, Subject, AttendanceRecord, AttendanceStatus } from '../types';

interface RecapModuleProps {
  classes: ClassRoom[];
  students: Student[];
  subjects: Subject[];
  attendance: AttendanceRecord[];
}

const RecapModule: React.FC<RecapModuleProps> = ({ classes, students, subjects, attendance }) => {
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  const classStudents = students.filter(s => s.classId === selectedClassId);

  const getStudentStats = (studentId: string) => {
    const studentRecords = attendance.filter(a => 
      a.studentId === studentId && 
      (selectedSubjectId ? a.subjectId === selectedSubjectId : true) &&
      (selectedClassId ? a.classId === selectedClassId : true)
    );

    const counts = {
      [AttendanceStatus.HADIR]: 0,
      [AttendanceStatus.IZIN]: 0,
      [AttendanceStatus.SAKIT]: 0,
      [AttendanceStatus.ALPHA]: 0,
    };

    studentRecords.forEach(r => counts[r.status]++);
    const total = studentRecords.length;
    const percentage = total > 0 ? (counts[AttendanceStatus.HADIR] / total * 100).toFixed(1) : '0';

    return { ...counts, total, percentage };
  };

  const exportToExcel = () => {
    // Basic export simulation
    alert('Fungsi Ekspor ke Excel diaktifkan. File rekap sedang disiapkan...');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-1.5">Pilih Kelas</label>
          <select 
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            <option value="">Semua Kelas</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-1.5">Mata Pelajaran</label>
          <select 
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
          >
            <option value="">Semua Mata Pelajaran</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={exportToExcel}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            <FileDown size={18} />
            <span>Ekspor Excel</span>
          </button>
          <button className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
            <Printer size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-semibold text-slate-700">Rekapitulasi Kehadiran Siswa</h3>
          <span className="text-xs font-bold px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full uppercase tracking-tighter">Semester Ganjil 2024/2025</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th rowSpan={2} className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase border-r border-slate-200 w-16">No</th>
                <th rowSpan={2} className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase border-r border-slate-200 min-w-[250px]">Nama Lengkap</th>
                <th colSpan={4} className="px-6 py-2 text-xs font-semibold text-slate-500 uppercase text-center border-b border-slate-200">Jumlah Status</th>
                <th rowSpan={2} className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center border-l border-slate-200">% Hadir</th>
              </tr>
              <tr>
                <th className="px-4 py-2 text-xs font-bold text-emerald-600 text-center uppercase bg-emerald-50">H</th>
                <th className="px-4 py-2 text-xs font-bold text-blue-600 text-center uppercase bg-blue-50">I</th>
                <th className="px-4 py-2 text-xs font-bold text-amber-600 text-center uppercase bg-amber-50">S</th>
                <th className="px-4 py-2 text-xs font-bold text-red-600 text-center uppercase bg-red-50">A</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(selectedClassId ? classStudents : students).length === 0 ? (
                <tr><td colSpan={7} className="p-12 text-center text-slate-400">Pilih kelas untuk melihat rekapitulasi</td></tr>
              ) : (
                (selectedClassId ? classStudents : students).map((student, idx) => {
                  const stats = getStudentStats(student.id);
                  return (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-500 text-center border-r border-slate-100">{idx + 1}</td>
                      <td className="px-6 py-4 border-r border-slate-100">
                        <div className="font-medium text-slate-800">{student.name}</div>
                        <div className="text-xs text-slate-400">{student.nisn} • {classes.find(c => c.id === student.classId)?.name}</div>
                      </td>
                      <td className="px-4 py-4 text-center text-sm font-semibold text-emerald-600 bg-emerald-50/30">{stats[AttendanceStatus.HADIR]}</td>
                      <td className="px-4 py-4 text-center text-sm font-semibold text-blue-600 bg-blue-50/30">{stats[AttendanceStatus.IZIN]}</td>
                      <td className="px-4 py-4 text-center text-sm font-semibold text-amber-600 bg-amber-50/30">{stats[AttendanceStatus.SAKIT]}</td>
                      <td className="px-4 py-4 text-center text-sm font-semibold text-red-600 bg-red-50/30">{stats[AttendanceStatus.ALPHA]}</td>
                      <td className="px-6 py-4 text-center border-l border-slate-100">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          parseFloat(stats.percentage) >= 90 ? 'bg-emerald-100 text-emerald-700' :
                          parseFloat(stats.percentage) >= 75 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {stats.percentage}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RecapModule;
