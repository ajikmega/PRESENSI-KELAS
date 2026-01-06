
import React, { useState } from 'react';
import { FileDown, Printer, RefreshCw, FileSpreadsheet } from 'lucide-react';
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
  const [isExporting, setIsExporting] = useState(false);

  const classStudents = students.filter(s => s.classId === selectedClassId);
  const currentStudents = selectedClassId ? classStudents : students;

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
    if (currentStudents.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    setIsExporting(true);

    try {
      const className = classes.find(c => c.id === selectedClassId)?.name || 'Semua Kelas';
      const subjectName = subjects.find(s => s.id === selectedSubjectId)?.name || 'Semua Mapel';
      
      // Menyiapkan data untuk Excel
      const excelData = currentStudents.map((student, index) => {
        const stats = getStudentStats(student.id);
        return {
          'No': index + 1,
          'Nama Lengkap': student.name,
          'NISN': student.nisn,
          'Kelas': classes.find(c => c.id === student.classId)?.name || '-',
          'Hadir (H)': stats[AttendanceStatus.HADIR],
          'Izin (I)': stats[AttendanceStatus.IZIN],
          'Sakit (S)': stats[AttendanceStatus.SAKIT],
          'Alpha (A)': stats[AttendanceStatus.ALPHA],
          'Total Sesi': stats.total,
          '% Kehadiran': `${stats.percentage}%`
        };
      });

      // Membuat Workbook menggunakan library XLSX (tersedia secara global dari index.html)
      // @ts-ignore
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Mengatur lebar kolom agar rapi
      const wscols = [
        { wch: 5 },  // No
        { wch: 30 }, // Nama
        { wch: 15 }, // NISN
        { wch: 15 }, // Kelas
        { wch: 10 }, // H
        { wch: 10 }, // I
        { wch: 10 }, // S
        { wch: 10 }, // A
        { wch: 12 }, // Total
        { wch: 15 }, // %
      ];
      worksheet['!cols'] = wscols;

      // @ts-ignore
      const workbook = XLSX.utils.book_new();
      // @ts-ignore
      XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Absensi");

      // Nama file yang deskriptif
      const fileName = `Rekap_Absensi_${className.replace(/\s+/g, '_')}_${subjectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Menjalankan perintah download
      // @ts-ignore
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Export Error:', error);
      alert('Gagal mengekspor data ke Excel.');
    } finally {
      setTimeout(() => setIsExporting(false), 500);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-1.5">Filter Kelas</label>
          <select 
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            <option value="">Semua Kelas</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-1.5">Filter Mata Pelajaran</label>
          <select 
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
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
            disabled={isExporting}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-bold transition-all shadow-sm ${
              isExporting ? 'bg-slate-100 text-slate-400' : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
            }`}
          >
            {isExporting ? <RefreshCw size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
            <span>{isExporting ? 'Menyiapkan...' : 'Ekspor Excel'}</span>
          </button>
          <button 
            onClick={() => window.print()}
            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors shadow-sm"
            title="Cetak Halaman"
          >
            <Printer size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-none">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center print:bg-white">
          <div>
            <h3 className="font-bold text-slate-700">Rekapitulasi Kehadiran Siswa</h3>
            <p className="text-xs text-slate-500">
              {selectedClassId ? classes.find(c => c.id === selectedClassId)?.name : 'Semua Kelas'} • 
              {selectedSubjectId ? subjects.find(s => s.id === selectedSubjectId)?.name : 'Semua Mapel'}
            </p>
          </div>
          <span className="text-[10px] font-bold px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full uppercase tracking-tighter">
            Periode: {new Date().getFullYear()}
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th rowSpan={2} className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase border-r border-slate-200 w-16 text-center">No</th>
                <th rowSpan={2} className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase border-r border-slate-200 min-w-[250px]">Nama Lengkap</th>
                <th colSpan={4} className="px-6 py-2 text-xs font-semibold text-slate-500 uppercase text-center border-b border-slate-200">Jumlah Status</th>
                <th rowSpan={2} className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center border-l border-slate-200">% Hadir</th>
              </tr>
              <tr className="bg-slate-50/50">
                <th className="px-4 py-2 text-[10px] font-bold text-emerald-600 text-center uppercase bg-emerald-50 w-14 border-r border-slate-100">H</th>
                <th className="px-4 py-2 text-[10px] font-bold text-blue-600 text-center uppercase bg-blue-50 w-14 border-r border-slate-100">I</th>
                <th className="px-4 py-2 text-[10px] font-bold text-amber-600 text-center uppercase bg-amber-50 w-14 border-r border-slate-100">S</th>
                <th className="px-4 py-2 text-[10px] font-bold text-red-600 text-center uppercase bg-red-50 w-14">A</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileDown size={40} className="opacity-10" />
                      <p>Tidak ada data siswa ditemukan untuk kriteria ini.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentStudents.map((student, idx) => {
                  const stats = getStudentStats(student.id);
                  const attendancePercentage = parseFloat(stats.percentage);
                  
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-500 text-center border-r border-slate-100">{idx + 1}</td>
                      <td className="px-6 py-4 border-r border-slate-100">
                        <div className="font-bold text-slate-800 text-sm">{student.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {student.nisn} • {classes.find(c => c.id === student.classId)?.name}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-sm font-bold text-emerald-600 bg-emerald-50/20 border-r border-slate-50">{stats[AttendanceStatus.HADIR]}</td>
                      <td className="px-4 py-4 text-center text-sm font-bold text-blue-600 bg-blue-50/20 border-r border-slate-50">{stats[AttendanceStatus.IZIN]}</td>
                      <td className="px-4 py-4 text-center text-sm font-bold text-amber-600 bg-amber-50/20 border-r border-slate-50">{stats[AttendanceStatus.SAKIT]}</td>
                      <td className="px-4 py-4 text-center text-sm font-bold text-red-600 bg-red-50/20">{stats[AttendanceStatus.ALPHA]}</td>
                      <td className="px-6 py-4 text-center border-l border-slate-100">
                        <div className="flex flex-col items-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm ${
                            attendancePercentage >= 90 ? 'bg-emerald-500 text-white' :
                            attendancePercentage >= 75 ? 'bg-amber-400 text-white' :
                            'bg-red-500 text-white'
                          }`}>
                            {stats.percentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-400 italic print:hidden">
          * H = Hadir, I = Izin, S = Sakit, A = Alpha. Persentase dihitung berdasarkan jumlah kehadiran dibandingkan total sesi yang ada.
        </div>
      </div>
    </div>
  );
};

export default RecapModule;
