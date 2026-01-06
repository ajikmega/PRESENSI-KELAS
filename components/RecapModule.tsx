
import React, { useState } from 'react';
import { FileDown, Printer, RefreshCw, FileSpreadsheet, Calendar, ArrowRight } from 'lucide-react';
import { ClassRoom, Student, Subject, AttendanceRecord, AttendanceStatus } from '../types';

interface RecapModuleProps {
  classes: ClassRoom[];
  students: Student[];
  subjects: Subject[];
  attendance: AttendanceRecord[];
}

const months = [
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

const RecapModule: React.FC<RecapModuleProps> = ({ classes, students, subjects, attendance }) => {
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [startMonth, setStartMonth] = useState('01');
  const [endMonth, setEndMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isExporting, setIsExporting] = useState(false);

  const classStudents = students.filter(s => s.classId === selectedClassId);
  const currentStudents = selectedClassId ? classStudents : students;

  const getStudentStats = (studentId: string) => {
    const start = parseInt(startMonth);
    const end = parseInt(endMonth);

    const studentRecords = attendance.filter(a => {
      const matchStudent = a.studentId === studentId;
      const matchSubject = selectedSubjectId ? a.subjectId === selectedSubjectId : true;
      const matchClass = selectedClassId ? a.classId === selectedClassId : true;
      
      const recordDate = new Date(a.date);
      const recordMonth = recordDate.getMonth() + 1;
      const matchYear = recordDate.getFullYear().toString() === selectedYear;
      
      // Filter Range Bulan
      const matchMonthRange = recordMonth >= start && recordMonth <= end;

      return matchStudent && matchSubject && matchClass && matchYear && matchMonthRange;
    });

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
      const rangeLabel = `${months.find(m => m.value === startMonth)?.label}-${months.find(m => m.value === endMonth)?.label}`;
      
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

      // @ts-ignore
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const wscols = [
        { wch: 5 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, 
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, 
        { wch: 12 }, { wch: 15 }
      ];
      worksheet['!cols'] = wscols;

      // @ts-ignore
      const workbook = XLSX.utils.book_new();
      // @ts-ignore
      XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Absensi");

      const fileName = `Rekap_${className}_${rangeLabel}_${selectedYear}.xlsx`.replace(/\s+/g, '_');
      
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
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-4">
             <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Mata Pelajaran</label>
              <select 
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
              >
                <option value="">Semua Mata Pelajaran</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Pilih Kelas</label>
              <select 
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <option value="">Semua Kelas</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="md:col-span-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-3 flex items-center">
              <Calendar size={14} className="mr-2" /> Rentang Periode Rekap
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div>
                <select 
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white shadow-sm"
                  value={startMonth}
                  onChange={(e) => {
                    setStartMonth(e.target.value);
                    if (parseInt(e.target.value) > parseInt(endMonth)) setEndMonth(e.target.value);
                  }}
                >
                  {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div className="flex justify-center text-slate-400">
                <ArrowRight size={20} />
              </div>
              <div>
                <select 
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white shadow-sm"
                  value={endMonth}
                  onChange={(e) => {
                    setEndMonth(e.target.value);
                    if (parseInt(e.target.value) < parseInt(startMonth)) setStartMonth(e.target.value);
                  }}
                >
                  {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Tahun Ajaran</label>
            <select 
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {[0, 1, 2].map(i => {
                const year = (new Date().getFullYear() - i).toString();
                return <option key={year} value={year}>{year}</option>
              })}
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-400">
            * Menampilkan akumulasi data dari <strong>{months.find(m => m.value === startMonth)?.label}</strong> sampai <strong>{months.find(m => m.value === endMonth)?.label}</strong>.
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={exportToExcel}
              disabled={isExporting}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0 ${
                isExporting ? 'bg-slate-100 text-slate-400' : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {isExporting ? <RefreshCw size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
              <span>{isExporting ? 'Proses...' : 'Ekspor Excel'}</span>
            </button>
            <button 
              onClick={() => window.print()}
              className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all border border-slate-200"
              title="Cetak Laporan"
            >
              <Printer size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-none">
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center print:bg-white">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
              <Calendar size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg uppercase tracking-tight">Rekapitulasi Kehadiran</h3>
              <p className="text-xs font-semibold text-slate-500">
                Periode: <span className="text-indigo-600">{months.find(m => m.value === startMonth)?.label}</span> s/d <span className="text-indigo-600">{months.find(m => m.value === endMonth)?.label}</span> {selectedYear}
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Klasifikasi Data</p>
            <p className="text-sm font-bold text-slate-700">{selectedClassId ? classes.find(c => c.id === selectedClassId)?.name : 'Semua Kelas'}</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th rowSpan={2} className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase border-r border-slate-200 w-16 text-center">No</th>
                <th rowSpan={2} className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase border-r border-slate-200 min-w-[250px]">Nama Lengkap</th>
                <th colSpan={4} className="px-6 py-2 text-[10px] font-black text-slate-500 uppercase text-center border-b border-slate-200 bg-slate-100/30">Total Status Kehadiran</th>
                <th rowSpan={2} className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase text-center border-l border-slate-200">% Hadir</th>
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
                  <td colSpan={7} className="p-20 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                        <FileDown size={32} className="opacity-20" />
                      </div>
                      <p className="font-bold text-slate-500">Belum ada data untuk ditampilkan.</p>
                      <p className="text-xs max-w-[200px] mx-auto opacity-70">Pilih kelas dan mapel untuk melihat akumulasi statistik kehadiran.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentStudents.map((student, idx) => {
                  const stats = getStudentStats(student.id);
                  const attendancePercentage = parseFloat(stats.percentage);
                  
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-6 py-4 text-xs font-bold text-slate-400 text-center border-r border-slate-100 group-hover:text-indigo-600">{idx + 1}</td>
                      <td className="px-6 py-4 border-r border-slate-100">
                        <div className="font-extrabold text-slate-800 text-sm uppercase tracking-tight">{student.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded mr-2">{student.nisn}</span>
                          <span>• {classes.find(c => c.id === student.classId)?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-sm font-black text-emerald-600 bg-emerald-50/10 border-r border-slate-50">{stats[AttendanceStatus.HADIR]}</td>
                      <td className="px-4 py-4 text-center text-sm font-black text-blue-600 bg-blue-50/10 border-r border-slate-50">{stats[AttendanceStatus.IZIN]}</td>
                      <td className="px-4 py-4 text-center text-sm font-black text-amber-600 bg-amber-50/10 border-r border-slate-50">{stats[AttendanceStatus.SAKIT]}</td>
                      <td className="px-4 py-4 text-center text-sm font-black text-red-600 bg-red-50/10">{stats[AttendanceStatus.ALPHA]}</td>
                      <td className="px-6 py-4 text-center border-l border-slate-100">
                        <div className="flex flex-col items-center">
                          <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center text-[11px] font-black shadow-inner transition-transform group-hover:scale-110 ${
                            attendancePercentage >= 90 ? 'border-emerald-500 text-emerald-600 bg-emerald-50' :
                            attendancePercentage >= 75 ? 'border-amber-400 text-amber-600 bg-amber-50' :
                            'border-red-500 text-red-600 bg-red-50'
                          }`}>
                            {Math.round(attendancePercentage)}%
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 italic print:hidden gap-4">
          <div className="flex items-center space-x-4 font-bold text-slate-500 not-italic uppercase tracking-widest">
            <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>Hadir</div>
            <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-600 mr-2"></span>Izin</div>
            <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>Sakit</div>
            <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>Alpha</div>
          </div>
          <span className="font-bold text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
            AbsensiPintar v2.1 • Engine Report System
          </span>
        </div>
      </div>
    </div>
  );
};

export default RecapModule;
