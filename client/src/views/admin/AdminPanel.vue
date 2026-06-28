<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';
import AnalyticsChart from '@/components/admin/AnalyticsChart.vue';
import authStore from '@/stores/auth';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const router = useRouter();
const currentTab = ref('analytics');
const isLoading = ref(true);

const stats = ref({ totalVoters: 0, currentVotes: 0, candidates: [] });
const turnoutData = ref({ s2: 0, s4: 0 });
const settings = ref({ election_start: '', election_end: '', maintenance_mode: false });

const rankedCandidates = computed(() => {
  return [...stats.value.candidates].sort((a, b) => (b.votes || 0) - (a.votes || 0));
});

const getRankDecoration = (index) => {
  if (index === 0) return {
    icon: 'ph-fill ph-crown text-yellow-400',
    bg: 'bg-yellow-50/50 dark:bg-yellow-900/10',
    border: 'border-yellow-200 dark:border-yellow-800'
  };
  if (index === 1) return {
    icon: 'ph-fill ph-medal text-slate-400',
    bg: 'bg-teal-50/50 dark:bg-teal-800/20',
    border: 'border-teal-200 dark:border-teal-900/30'
  };
  if (index === 2) return {
    icon: 'ph-fill ph-medal text-orange-400',
    bg: 'bg-orange-50/50 dark:bg-orange-900/10',
    border: 'border-orange-200 dark:border-orange-900/30'
  };
  return { icon: '', bg: '', border: '' };
};

const toLocalDateTimeLocal = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().slice(0, 16);
};

onMounted(async () => {
  if (authStore.user?.role !== 'admin') { router.push('/'); }
  await refreshData();
});

const refreshData = async () => {
  isLoading.value = true;
  const statRes = await api.getStats();
  if (statRes) stats.value = statRes;

  const turnoutRes = await api.getTurnout();
  if (turnoutRes) turnoutData.value = turnoutRes;

  const statusRes = await api.checkStatus();
  if (statusRes) {
      settings.value.maintenance_mode = statusRes.maintenance_mode;
      settings.value.election_start = toLocalDateTimeLocal(statusRes.election_start);
      settings.value.election_end = toLocalDateTimeLocal(statusRes.election_end);
  }

  if (currentTab.value === 'nonVoters') {
    await fetchNonVoters();
  }

  isLoading.value = false;
};

const saveSettings = async () => {
  const result = await Swal.fire({
    title: 'Save Changes?',
    text: "Apply these system configuration changes?",
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#10B981',
    confirmButtonText: 'Yes, Save it!'
  });

  if (result.isConfirmed) {
    const payload = {
      ...settings.value,
      election_start: new Date(settings.value.election_start).toISOString(),
      election_end: new Date(settings.value.election_end).toISOString()
    };
    await api.updateSettings(payload);
    Swal.fire({ icon: 'success', title: 'Saved!', timer: 1500, showConfirmButton: false });
  }
};

const handleReset = async () => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: "DANGER: This will WIPE ALL VOTES. This action cannot be undone!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Yes, RESET EVERYTHING!'
  });

  if (result.isConfirmed) {
    await api.resetSystem();
    Swal.fire('Reset!', 'System has been reset.', 'success');
    refreshData();
  }
};

const handleFactoryReset = async () => {
  const result = await Swal.fire({
    title: 'Factory Reset System?',
    text: "CRITICAL DANGER: This will permanently delete ALL candidates list and voter student registries! This action cannot be undone.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Yes, Factory Reset!',
    cancelButtonText: 'Cancel'
  });

  if (!result.isConfirmed) return;

  const doubleCheck = await Swal.fire({
    title: 'Are you absolutely sure?',
    text: "Type 'FACTORY RESET' to confirm global database wipe:",
    input: 'text',
    inputPlaceholder: 'FACTORY RESET',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Wipe All Data',
    preConfirm: (value) => {
      if (value !== 'FACTORY RESET') {
        Swal.showValidationMessage("Please type exactly 'FACTORY RESET' to confirm.");
      }
    }
  });

  if (doubleCheck.isConfirmed) {
    isLoading.value = true;
    try {
      const res = await api.factoryResetSystem();
      if (res.success) {
        Swal.fire('Factory Reset Complete!', res.message, 'success');
        refreshData();
      } else {
        Swal.fire('Reset Failed', res.message, 'error');
      }
    } catch (e) {
      Swal.fire('System Error', 'Failed to execute database factory reset.', 'error');
    } finally {
      isLoading.value = false;
    }
  }
};

const selectedSemester = ref(null);
const studentList = ref([]);

const openStudentList = async (semKey) => {
  const semester = semKey.replace('s', '');
  selectedSemester.value = semester;
  const students = await api.getStudents(semester);
  studentList.value = students || [];
};

const themeMap = {
  s2: { hover: 'hover:border-amber-400', ring: 'ring-amber-500', text: 'text-amber-600', bar: 'bg-amber-500', icon: 'group-hover:text-amber-500' },
  s3: { hover: 'hover:border-cyan-400', ring: 'ring-cyan-500', text: 'text-cyan-600', bar: 'bg-cyan-500', icon: 'group-hover:text-cyan-500' },
  s4: { hover: 'hover:border-purple-400', ring: 'ring-purple-500', text: 'text-purple-600', bar: 'bg-purple-500', icon: 'group-hover:text-purple-500' }
};
const getTheme = (key) => themeMap[key] || themeMap.s4;

const isExportingPDF = ref(false);
const isExportingExcel = ref(false);

const exportResultsPDF = async () => {
  isExportingPDF.value = true;
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    doc.setFont("helvetica", "normal");

    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 210, 6, 'F');

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("DiSK Election Results", 15, 22);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text("OFFICIAL ELECTION RESULTS & STATISTICAL REPORT", 15, 28);

    const now = new Date();
    const timestamp = `Report Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()} | Status: Finalized`;
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text(timestamp, 15, 33);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 38, 195, 38);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, 45, 54, 22, 2, 2, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text("ELIGIBLE VOTERS", 20, 52);

    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(String(stats.value.totalVoters), 20, 61);

    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(78, 45, 54, 22, 2, 2, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(22, 101, 52);
    doc.text("TOTAL VOTES CAST", 83, 52);

    doc.setFontSize(16);
    doc.setTextColor(22, 163, 74);
    doc.text(String(stats.value.currentVotes), 83, 61);

    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(254, 243, 199);
    doc.roundedRect(141, 45, 54, 22, 2, 2, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(146, 64, 14);
    doc.text("VOTER TURNOUT", 146, 52);

    doc.setFontSize(16);
    doc.setTextColor(217, 119, 6);
    const pct = stats.value.totalVoters ? ((stats.value.currentVotes / stats.value.totalVoters) * 100).toFixed(1) : '0';
    doc.text(`${pct}%`, 146, 61);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Official Election Standings", 15, 80);

    const tableRows = rankedCandidates.value.map((c, i) => [
      `#${i + 1}`,
      c.name,
      c.votes || 0,
      `${stats.value.currentVotes ? ((c.votes / stats.value.currentVotes) * 100).toFixed(1) : 0}%`
    ]);

    doc.autoTable({
      startY: 85,
      head: [['Rank', 'Candidate Name', 'Votes Obtained', 'Vote Share (%)']],
      body: tableRows,
      theme: 'striped',
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9.5,
        font: 'helvetica'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [51, 65, 85],
        font: 'helvetica'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 20 },
        2: { halign: 'right' },
        3: { halign: 'right' }
      },
      margin: { left: 15, right: 15 }
    });

    const finalY = doc.previousAutoTable.finalY + 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Voter Turnout by Academic Semester", 15, finalY);

    const semRows = [
      ['Semester 2', turnoutData.value.s2?.voted || 0, turnoutData.value.s2?.total || 0, `${turnoutData.value.s2?.percentage || 0}%`],
      ['Semester 4', turnoutData.value.s4?.voted || 0, turnoutData.value.s4?.total || 0, `${turnoutData.value.s4?.percentage || 0}%`]
    ];

    doc.autoTable({
      startY: finalY + 5,
      head: [['Academic Semester', 'Voted Turnout', 'Total Registered', 'Turnout (%)']],
      body: semRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9.5,
        font: 'helvetica'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [51, 65, 85],
        font: 'helvetica'
      },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      },
      margin: { left: 15, right: 15 }
    });

    const lastY = doc.previousAutoTable.finalY + 22;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text("This report is securely compiled and confidential from public.", 15, lastY + 6);
    doc.text("Authorized official results published by the DiSK Club Committee Secretariat.", 15, lastY + 11);

    doc.setDrawColor(241, 245, 249);
    doc.line(15, lastY + 18, 195, lastY + 18);

    doc.save("DiSK_Election_Result.pdf");
    Swal.fire({ icon: 'success', title: 'PDF Exported!', text: 'Results report downloaded successfully.', timer: 1500, showConfirmButton: false });
  } catch (error) {
    console.error("PDF generation failed:", error);
    Swal.fire('Export Failed', 'An error occurred during PDF generation.', 'error');
  } finally {
    isExportingPDF.value = false;
  }
};

const exportResultsExcel = () => {
  isExportingExcel.value = true;
  try {
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();

    const summaryData = [
      ["DiSK ELECTION OFFICIAL RESULTS"],
      [`Report Generated: ${dateStr} ${timeStr}`],
      [],
      ["ELECTION METRICS SUMMARY"],
      ["Total Eligible Voters", stats.value.totalVoters],
      ["Total Votes Cast", stats.value.currentVotes],
      ["Voter Turnout (%)", stats.value.totalVoters ? ((stats.value.currentVotes / stats.value.totalVoters) * 100).toFixed(1) + "%" : "0%"],
      [],
      ["OFFICIAL CANDIDATE STANDINGS"],
      ["Rank", "Candidate Name", "Votes Obtained", "Vote Share (%)"]
    ];

    rankedCandidates.value.forEach((c, idx) => {
      const share = stats.value.currentVotes ? ((c.votes / stats.value.currentVotes) * 100).toFixed(1) + "%" : "0%";
      summaryData.push([
        `#${idx + 1}`,
        c.name,
        c.votes || 0,
        share
      ]);
    });

    const wsStandings = XLSX.utils.aoa_to_sheet(summaryData);

    const turnoutRows = [
      ["VOTER TURNOUT BY ACADEMIC SEMESTER"],
      [`Report Generated: ${dateStr} ${timeStr}`],
      [],
      ["Academic Semester", "Voted Turnout", "Total Registered", "Turnout (%)"]
    ];

    const semesters = ['s2', 's4'];
    semesters.forEach(key => {
      const label = `Semester ${key.replace('s', '')}`;
      const data = turnoutData.value[key] || { voted: 0, total: 0, percentage: 0 };
      turnoutRows.push([
        label,
        data.voted || 0,
        data.total || 0,
        `${data.percentage || 0}%`
      ]);
    });

    const wsTurnout = XLSX.utils.aoa_to_sheet(turnoutRows);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsStandings, "Election Standings");
    XLSX.utils.book_append_sheet(wb, wsTurnout, "Turnout by Semester");

    XLSX.writeFile(wb, "disk_election_official_results.xlsx");

    Swal.fire({
      icon: 'success',
      title: 'Excel Exported!',
      text: 'Election results spreadsheet downloaded successfully.',
      timer: 1500,
      showConfirmButton: false
    });
  } catch (err) {
    console.error("Excel export failed:", err);
    Swal.fire('Export Failed', 'An error occurred during Excel generation.', 'error');
  } finally {
    isExportingExcel.value = false;
  }
};

const nonVoters = ref([]);
const nonVoterSearch = ref('');
const nonVoterSemesterFilter = ref('all');
const isFetchingNonVoters = ref(false);

const fetchNonVoters = async () => {
  isFetchingNonVoters.value = true;
  try {
    const res = await api.getStudents(null, false);
    nonVoters.value = res || [];
  } catch (error) {
    console.error("Failed to fetch non-voters", error);
  } finally {
    isFetchingNonVoters.value = false;
  }
};

const filteredNonVoters = computed(() => {
  return nonVoters.value.filter(student => {
    const matchesSemester = nonVoterSemesterFilter.value === 'all' ||
      String(student.semester) === String(nonVoterSemesterFilter.value);

    const query = nonVoterSearch.value.toLowerCase().trim();
    const matchesSearch = !query ||
      student.name.toLowerCase().includes(query) ||
      student.studentId.toLowerCase().includes(query);

    return matchesSemester && matchesSearch;
  });
});

const copyNonVoterIds = () => {
  const ids = filteredNonVoters.value.map(s => s.studentId).join(', ');
  navigator.clipboard.writeText(ids);
  Swal.fire({
    icon: 'success',
    title: 'Copied!',
    text: `${filteredNonVoters.value.length} Student IDs copied to clipboard.`,
    timer: 1500,
    showConfirmButton: false
  });
};

const exportNonVotersExcel = () => {
  try {
    const formatted = filteredNonVoters.value.map(s => ({
      'Student ID': s.studentId,
      'Name': s.name,
      'Semester': s.semester,
      'Pledge Status': s.acceptPledge ? 'Pending Vote' : 'Not Visited Yet'
    }));

    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Non-Voters");
    XLSX.writeFile(wb, "disk_election_non_voters.xlsx");

    Swal.fire({
      icon: 'success',
      title: 'Exported!',
      text: 'Non-voters spreadsheet downloaded successfully.',
      timer: 1500,
      showConfirmButton: false
    });
  } catch (err) {
    console.error("Excel export failed:", err);
    Swal.fire('Export Failed', 'An error occurred during Excel generation.', 'error');
  }
};

watch(currentTab, async (newTab) => {
  if (newTab === 'nonVoters') {
    await fetchNonVoters();
  }
});

const importType = ref('voters');
const parsedStudents = ref([]);
const isDragging = ref(false);
const isUploading = ref(false);
const fileInput = ref(null);

watch(importType, () => {
  clearImport();
});

const handleDragOver = (e) => {
  e.preventDefault();
  isDragging.value = true;
};

const handleDragLeave = () => {
  isDragging.value = false;
};

const handleDrop = (e) => {
  e.preventDefault();
  isDragging.value = false;
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    parseExcel(files[0]);
  }
};

const triggerFileSelect = () => {
  fileInput.value.click();
};

const handleFileSelect = (e) => {
  const files = e.target.files;
  if (files.length > 0) {
    parseExcel(files[0]);
  }
};

const parseExcel = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      if (json.length === 0) {
        Swal.fire('Empty File', 'The uploaded Excel file contains no data.', 'warning');
        return;
      }

      if (importType.value === 'voters') {
        const normalized = json.map(row => {
          const keys = Object.keys(row);
          const idKey = keys.find(k => k.toLowerCase().replace(/[^a-z]/g, '') === 'studentid');
          const nameKey = keys.find(k => k.toLowerCase() === 'name');
          const semKey = keys.find(k => k.toLowerCase() === 'semester');

          return {
            studentId: idKey ? String(row[idKey]).trim().toUpperCase() : '',
            name: nameKey ? String(row[nameKey]).trim() : '',
            semester: semKey ? parseInt(row[semKey]) || 1 : 1
          };
        }).filter(s => s.studentId && s.name);

        if (normalized.length === 0) {
          Swal.fire('Invalid Format', 'Excel file columns must include: "Student ID", "Name", and "Semester".', 'error');
          return;
        }

        parsedStudents.value = normalized;
        Swal.fire({
          icon: 'success',
          title: 'Excel Parsed!',
          text: `Found ${normalized.length} valid voter student records. Preview them below before importing.`,
          timer: 3000
        });
      } else {
        const normalized = json.map(row => {
          const keys = Object.keys(row);
          const idKey = keys.find(k => k.toLowerCase().replace(/[^a-z]/g, '') === 'studentid');
          const nameKey = keys.find(k => k.toLowerCase() === 'name');
          const photoKey = keys.find(k => k.toLowerCase().replace(/[^a-z]/g, '') === 'photourl');
          const manifestoKey = keys.find(k => k.toLowerCase() === 'manifesto');
          const videoKey = keys.find(k => k.toLowerCase().replace(/[^a-z]/g, '') === 'videourl');

          return {
            studentId: idKey ? String(row[idKey]).trim().toUpperCase() : '',
            name: nameKey ? String(row[nameKey]).trim() : '',
            photoUrl: photoKey ? String(row[photoKey]).trim() : 'image1.jpg',
            manifesto: manifestoKey ? String(row[manifestoKey]).trim() : '',
            videoUrl: videoKey ? String(row[videoKey]).trim() : ''
          };
        }).filter(c => c.studentId && c.name);

        if (normalized.length === 0) {
          Swal.fire('Invalid Format', 'Excel file columns must include at least: "Student ID" and "Name".', 'error');
          return;
        }

        parsedStudents.value = normalized;
        Swal.fire({
          icon: 'success',
          title: 'Excel Parsed!',
          text: `Found ${normalized.length} valid candidate records. Preview them below before importing.`,
          timer: 3000
        });
      }
    } catch (err) {
      console.error("Excel parse error:", err);
      Swal.fire('Parse Error', 'Failed to read the Excel file. Make sure it is a valid spreadsheet.', 'error');
    }
  };
  reader.readAsArrayBuffer(file);
};

const clearImport = () => {
  parsedStudents.value = [];
  if (fileInput.value) fileInput.value.value = '';
};

const confirmImport = async () => {
  if (parsedStudents.value.length === 0) return;

  const isVoter = importType.value === 'voters';
  const typeText = isVoter ? 'student voters' : 'candidate profiles';

  const result = await Swal.fire({
    title: 'Confirm Bulk Import?',
    text: `Are you sure you want to import ${parsedStudents.value.length} ${typeText} into the database? Existing profiles with matching IDs will be updated.`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#10B981',
    confirmButtonText: 'Yes, Import Data!'
  });

  if (!result.isConfirmed) return;

  isUploading.value = true;
  try {
    const apiRes = isVoter
      ? await api.importStudentsBulk(parsedStudents.value)
      : await api.importCandidatesBulk(parsedStudents.value);

    if (apiRes.success) {
      Swal.fire('Import Complete!', apiRes.message || 'Data successfully saved.', 'success');
      clearImport();
      refreshData();
    } else {
      Swal.fire('Import Failed', apiRes.message || 'Error occurred while saving to database.', 'error');
    }
  } catch (e) {
    Swal.fire('System Error', 'Database transaction failed.', 'error');
  } finally {
    isUploading.value = false;
  }
};
</script>

<template>
  <div class="pb-10 bg-slate-50 dark:bg-slate-900 flex-1 w-full transition-colors duration-300">

    <div class="bg-white dark:bg-slate-900 pt-8 pb-24 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Atmin Command Center</h1>
          <p class="text-slate-400 text-sm">Status: <span class="text-emerald-400 font-bold">Online</span></p>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">

      <div class="flex space-x-1 rounded-xl bg-white dark:bg-slate-800 p-1 shadow-sm mb-6 w-fit border border-slate-200 dark:border-slate-700">
        <button v-for="tab in ['analytics', 'settings', 'turnout', 'nonVoters', 'import']" :key="tab" @click="currentTab = tab" class="px-6 py-2.5 text-sm font-bold rounded-lg transition-all" :class="currentTab === tab ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'">
          {{ tab === 'import' ? 'Import Center' : tab === 'nonVoters' ? 'Non-Voters' : tab }}
        </button>
      </div>

      <div v-if="currentTab === 'analytics'" class="animate-fadeIn space-y-6">

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            <p class="text-sm text-slate-500">Total Eligible</p>
            <p class="text-3xl font-black text-slate-900 dark:text-white">{{ stats.totalVoters }}</p>
          </div>
          <div class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            <p class="text-sm text-slate-500">Votes Cast</p>
            <p class="text-3xl font-black text-emerald-500">{{ stats.currentVotes }}</p>
          </div>
          <div class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            <p class="text-sm text-slate-500">Participation</p>
            <p class="text-3xl font-black text-amber-500">{{ stats.totalVoters ? ((stats.currentVotes / stats.totalVoters) * 100).toFixed(1) : 0 }}%</p>
          </div>
        </div>

        <AnalyticsChart :candidates="stats.candidates" />

        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div class="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <h3 class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i class="ph-bold ph-chart-bar text-emerald-500"></i> Live Standings
            </h3>

            <div class="flex items-center gap-2">
              <button @click="exportResultsPDF" :disabled="isExportingPDF || !stats.totalVoters" class="rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-600 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                <span v-if="isExportingPDF" class="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
                <i v-else class="ph-bold ph-file-pdf text-base"></i>
                Export Results (PDF)
              </button>

              <button @click="exportResultsExcel" :disabled="isExportingExcel || !stats.totalVoters" class="rounded-full bg-blue-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-600 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                <span v-if="isExportingExcel" class="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
                <i v-else class="ph-bold ph-file-xls text-base"></i>
                Export Results (Excel)
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead class="bg-slate-50 dark:bg-slate-900/50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th class="px-6 py-4">Rank</th>
                  <th class="px-6 py-4">Candidate</th>
                  <th class="px-6 py-4 text-right">Votes</th>
                  <th class="px-6 py-4 text-right">Progress</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                <tr v-for="(candidate, index) in rankedCandidates" :key="candidate.id" class="transition-all group" :class="getRankDecoration(index).bg">
                  <td class="px-6 py-5">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-black" :class="index < 3 ? 'text-slate-900 dark:text-white' : 'text-slate-400'">#{{ index + 1 }}</span>
                      <i v-if="index < 3" :class="getRankDecoration(index).icon" class="text-xl"></i>
                    </div>
                  </td>
                  <td class="px-6 py-5">
                    <div class="flex items-center gap-3">
                      <div class="h-9 w-9 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-sm shadow-sm border-2 transition-transform group-hover:scale-110" :class="getRankDecoration(index).border || 'border-slate-200 dark:border-slate-600'">
                        {{ candidate.name.charAt(0) }}
                      </div>
                      <span class="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-emerald-500 transition-colors">{{ candidate.name }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-5 text-right font-mono font-bold text-slate-600 dark:text-slate-400">{{ candidate.votes || 0 }}</td>
                  <td class="px-6 py-5 text-right">
                    <div class="flex flex-col items-end gap-1.5">
                      <span class="text-xs font-black text-emerald-500">
                        {{ stats.currentVotes ? ((candidate.votes / stats.currentVotes) * 100).toFixed(1) : 0 }}%
                      </span>
                      <div class="w-32 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden shadow-inner">
                        <div class="bg-emerald-500 h-full rounded-full transition-all duration-1000" :style="{ width: (stats.currentVotes ? (candidate.votes / stats.currentVotes) * 100 : 0) + '%' }">
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <div v-if="currentTab === 'settings'" class="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 animate-fadeIn">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-6">System Configuration</h3>
        <div class="space-y-6 max-w-lg">
           <div>
             <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Election Start</label>
             <input v-model="settings.election_start" type="datetime-local" class="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white" />
           </div>
           <div>
             <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Election End</label>
             <input v-model="settings.election_end" type="datetime-local" class="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white" />
           </div>
           <div class="flex items-center justify-between py-4 border-t border-b border-slate-100 dark:border-slate-700">
             <div><h4 class="font-bold text-slate-900 dark:text-white">Maintenance Mode</h4></div>
             <button @click="settings.maintenance_mode = !settings.maintenance_mode" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors" :class="settings.maintenance_mode ? 'bg-amber-500' : 'bg-slate-200'">
               <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="settings.maintenance_mode ? 'translate-x-6' : 'translate-x-1'"></span>
             </button>
           </div>
           <button @click="saveSettings" class="w-full py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600">Save Changes</button>

           <div class="pt-6 mt-6 border-t border-slate-100 dark:border-slate-700">
             <h4 class="text-red-500 font-bold mb-2">Danger Zone</h4>
             <div class="flex flex-col gap-4">
               <button @click="handleReset" class="w-full border-3 border-red-500 py-3 bg-red-50 dark:bg-red-600/20 text-red-600 dark:text-red-400 font-bold rounded-lg hover:bg-red-500 hover:text-white transition-colors cursor-pointer">Reset Election Database</button>
               <button @click="handleFactoryReset" class="w-full border-3 border-rose-600 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-bold rounded-lg hover:bg-rose-600 hover:text-white transition-colors cursor-pointer">Factory Reset System (Delete All Voters & Candidates)</button>
             </div>
           </div>
        </div>
      </div>

      <div v-if="currentTab === 'turnout'" class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 animate-fadeIn p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div v-for="(val, key) in turnoutData" :key="key" @click="openStudentList(key)" class="group cursor-pointer relative p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all" :class="[getTheme(key).hover, selectedSemester === key.replace('s', '') ? 'ring-2 ' + getTheme(key).ring : '']">
            <div class="flex justify-between items-center mb-2">
              <span class="text-xs font-bold text-slate-500 uppercase">Semester {{ key.replace('s', '') }}</span>
              <i class="ph-bold ph-caret-down text-slate-400" :class="getTheme(key).icon"></i>
            </div>
            <div class="flex items-end gap-3 mb-2">
              <div class="text-3xl font-black text-slate-900 dark:text-white leading-none">{{ val.percentage || 0 }}%</div>
              <div class="flex-1">
                <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div class="h-full transition-all duration-1000" :class="getTheme(key).bar" :style="{ width: (val.percentage || 0) + '%' }"></div>
                </div>
              </div>
            </div>
            <p class="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              <span class="font-bold" :class="getTheme(key).text">{{ val.voted }}</span> / {{ val.total }} Voted
            </p>
          </div>
        </div>

        <div v-if="selectedSemester" class="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fadeIn">
          <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between bg-white dark:bg-slate-800">
             <span class="text-sm font-bold text-slate-700 dark:text-slate-300">Semester {{ selectedSemester }} Students</span>
             <button @click="selectedSemester = null" class="text-xs font-bold text-slate-400 hover:text-red-500 uppercase">Close</button>
          </div>
          <div class="overflow-x-auto max-h-[400px]">
             <table class="w-full text-left">
                <thead class="bg-slate-50 dark:bg-slate-900 sticky top-0">
                  <tr>
                    <th class="py-2 px-4 text-[10px] font-bold uppercase text-slate-400">Student ID</th>
                    <th class="py-2 px-4 text-[10px] font-bold uppercase text-slate-400">Name</th>
                    <th class="py-2 px-4 text-[10px] font-bold uppercase text-slate-400 text-right">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr v-for="student in studentList" :key="student.studentId" class="hover:bg-white dark:hover:bg-slate-800">
                    <td class="py-3 px-4 text-xs font-mono">{{ student.studentId }}</td>
                    <td class="py-3 px-4 text-xs font-bold">{{ student.name }}</td>
                    <td class="py-3 px-4 text-right">
                      <span v-if="student.hasVoted" class="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded">Voted</span>
                      <span v-else-if="!student.acceptPledge" class="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded">Not Visit Yet</span>
                      <span v-else class="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded">Pending</span>
                    </td>
                  </tr>
                </tbody>
             </table>
          </div>
        </div>
      </div>

      <div v-if="currentTab === 'nonVoters'" class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 animate-fadeIn p-6">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">Non-Voters Directory</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400">List of students who have not yet cast their votes.</p>
          </div>
          <div class="flex flex-wrap gap-2 w-full sm:w-auto">
            <button @click="copyNonVoterIds" :disabled="!filteredNonVoters.length" class="flex-1 sm:flex-initial rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              <i class="ph-bold ph-copy text-base"></i>
              Copy IDs
            </button>
            <button @click="exportNonVotersExcel" :disabled="!filteredNonVoters.length" class="flex-1 sm:flex-initial rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              <i class="ph-bold ph-file-xls text-base"></i>
              Export Excel
            </button>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-4 mb-6">
          <div class="relative flex-1">
            <i class="ph-bold ph-magnifying-glass absolute left-3 top-3 text-slate-400"></i>
            <input v-model="nonVoterSearch" type="text" placeholder="Search by ID or name..." class="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div class="w-full sm:w-48">
            <select v-model="nonVoterSemesterFilter" class="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="all">All Semesters</option>
              <option value="2">Semester 2</option>
              <option value="4">Semester 4</option>
            </select>
          </div>
        </div>

        <div class="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div v-if="isFetchingNonVoters" class="p-12 text-center flex flex-col items-center justify-center gap-3">
            <span class="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full"></span>
            <span class="text-sm font-bold text-slate-500">Loading directory...</span>
          </div>

          <div v-else-if="!filteredNonVoters.length" class="p-12 text-center flex flex-col items-center justify-center gap-2">
            <div class="h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center mb-2">
              <i class="ph-bold ph-check text-3xl"></i>
            </div>
            <h4 class="text-base font-bold text-slate-800 dark:text-white">All Voters Participated!</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400">There are no outstanding non-voters matching the criteria.</p>
          </div>

          <div v-else class="overflow-x-auto max-h-[500px]">
            <table class="w-full text-left border-collapse">
              <thead class="bg-slate-50 dark:bg-slate-900 sticky top-0 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800 z-10">
                <tr>
                  <th class="py-3.5 px-6">Student ID</th>
                  <th class="py-3.5 px-6">Name</th>
                  <th class="py-3.5 px-6">Semester</th>
                  <th class="py-3.5 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-800/20">
                <tr v-for="student in filteredNonVoters" :key="student.studentId" class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td class="py-3.5 px-6 font-mono text-xs font-bold text-emerald-500">{{ student.studentId }}</td>
                  <td class="py-3.5 px-6 text-xs font-bold text-slate-800 dark:text-slate-100">{{ student.name }}</td>
                  <td class="py-3.5 px-6 text-xs text-slate-500 dark:text-slate-400">Semester {{ student.semester }}</td>
                  <td class="py-3.5 px-6 text-right">
                    <span v-if="!student.acceptPledge" class="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-2.5 py-1 rounded">Not Visited Yet</span>
                    <span v-else class="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded">Pending Vote</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="mt-4 text-xs text-slate-400 flex justify-between items-center px-2">
          <span>Showing {{ filteredNonVoters.length }} of {{ nonVoters.length }} non-voters</span>
          <span class="italic">Select "Copy IDs" to copy a comma-separated list of IDs to your clipboard.</span>
        </div>
      </div>

      <div v-if="currentTab === 'import'" class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 animate-fadeIn p-8">

        <div class="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl w-fit mb-8 border border-slate-200 dark:border-slate-700">
          <button @click="importType = 'voters'" class="px-5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer" :class="importType === 'voters' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'">
            <i class="ph-bold ph-users text-sm"></i>
            Voters Registry
          </button>
          <button @click="importType = 'candidates'" class="px-5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer" :class="importType === 'candidates' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'">
            <i class="ph-bold ph-crown text-sm"></i>
            Candidates list
          </button>
        </div>

        <div class="flex justify-between items-center mb-6">
          <div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">
              Import {{ importType === 'voters' ? 'Voters Registry' : 'Candidates Profiles' }}
            </h3>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              Load {{ importType === 'voters' ? 'voter rosters' : 'candidate profiles' }} via Excel spreadsheet (.xlsx, .xls) uploads.
            </p>
          </div>
          <button v-if="parsedStudents.length" @click="clearImport" class="text-xs font-bold text-red-500 hover:text-red-600 uppercase border border-red-500/20 hover:border-red-500/50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
            Clear Upload
          </button>
        </div>

        <div v-if="!parsedStudents.length" @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop" @click="triggerFileSelect" class="border-3 border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center cursor-pointer transition-all duration-300 select-none group" :class="isDragging ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500/50 bg-slate-50/50 dark:bg-slate-900/50'">
          <input type="file" ref="fileInput" class="hidden" accept=".xlsx, .xls" @change="handleFileSelect" />
          <div class="h-20 w-20 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform mb-6 ring-4 ring-emerald-500/10">
            <i class="ph-bold ph-file-xls text-4xl"></i>
          </div>
          <h4 class="text-base font-bold text-slate-700 dark:text-white mb-2">
            Drag and drop your {{ importType === 'voters' ? 'voter roster' : 'candidates sheet' }} here
          </h4>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Only Microsoft Excel spreadsheets (.xlsx, .xls) are supported.</p>
          <span class="text-[10px] uppercase font-bold text-slate-400 mt-2 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded">
            Required Columns:
            <span class="text-emerald-500" v-if="importType === 'voters'">Student ID, Name, Semester</span>
            <span class="text-emerald-500" v-else>Student ID, Name, Photo URL, Manifesto, Video URL</span>
          </span>
        </div>

        <div v-else class="space-y-6">
          <div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span class="text-xs text-slate-500 font-bold uppercase tracking-wider">Spreadsheet Parsed Successfully</span>
              <h4 class="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                Found {{ parsedStudents.length }} valid {{ importType === 'voters' ? 'student' : 'candidate' }} records
              </h4>
            </div>
            <button @click="confirmImport" :disabled="isUploading" class="w-full sm:w-auto px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
              <span v-if="isUploading" class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
              <i v-else class="ph-bold ph-cloud-arrow-up text-lg"></i>
              Confirm Bulk Import
            </button>
          </div>

          <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div class="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Registry Preview (Showing First 10 Records)</span>
            </div>
            <div class="overflow-x-auto max-h-[400px]">

              <table v-if="importType === 'voters'" class="w-full text-left">
                <thead class="bg-slate-50 dark:bg-slate-900 sticky top-0 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th class="py-3 px-6">Row</th>
                    <th class="py-3 px-6">Student ID</th>
                    <th class="py-3 px-6">Voter Full Name</th>
                    <th class="py-3 px-6 text-right">Academic Semester</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr v-for="(student, index) in parsedStudents.slice(0, 10)" :key="index" class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td class="py-3 px-6 font-mono text-slate-400 text-xs">#{{ index + 1 }}</td>
                    <td class="py-3 px-6 font-mono text-xs font-bold text-emerald-500">{{ student.studentId }}</td>
                    <td class="py-3 px-6 text-xs text-slate-800 dark:text-slate-100">{{ student.name }}</td>
                    <td class="py-3 px-6 text-right font-bold text-xs text-slate-600 dark:text-slate-400">Semester {{ student.semester }}</td>
                  </tr>
                </tbody>
              </table>

              <table v-else class="w-full text-left border-collapse">
                <thead class="bg-slate-50 dark:bg-slate-900 sticky top-0 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th class="py-3 px-6">Row</th>
                    <th class="py-3 px-6">Candidate ID</th>
                    <th class="py-3 px-6">Full Name</th>
                    <th class="py-3 px-6">Photo URL</th>
                    <th class="py-3 px-6">Manifesto Preview</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr v-for="(cand, index) in parsedStudents.slice(0, 10)" :key="index" class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td class="py-3 px-6 font-mono text-slate-400 text-xs">#{{ index + 1 }}</td>
                    <td class="py-3 px-6 font-mono text-xs font-bold text-emerald-500">{{ cand.studentId }}</td>
                    <td class="py-3 px-6 text-xs font-bold text-slate-800 dark:text-slate-100">{{ cand.name }}</td>
                    <td class="py-3 px-6 font-mono text-xs text-slate-500 truncate max-w-[120px]" :title="cand.photoUrl">{{ cand.photoUrl }}</td>
                    <td class="py-3 px-6 text-xs text-slate-500 truncate max-w-[200px]" :title="cand.manifesto">{{ cand.manifesto || 'No manifesto' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="parsedStudents.length > 10" class="p-3 text-center bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800">
              <span class="text-xs text-slate-400 italic">... and {{ parsedStudents.length - 10 }} more records.</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>
