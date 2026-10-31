/**
 * Sushi Đi Học Ngoan - Attendance & Timetable PWA
 * Designed for iPhone 13 (Safari / Home Screen Web App)
 */

const STORAGE_KEY = 'sushi_attendance_app_v1';

// Default Real Teacher Photos (Smiling with Green Border & Pouting/Sad with Red Border)
const DEFAULT_HAPPY_TEACHER_SVG = 'images/teacher-happy.png';
const DEFAULT_SAD_TEACHER_SVG = 'images/teacher-sad.png';

const DEFAULT_SUBJECT_TEACHER_SVG = `data:image/svg+xml;utf8,` + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="58" fill="#FFE4EA" stroke="#FF6B8B" stroke-width="3"/>
  <circle cx="60" cy="52" r="22" fill="#FFE4D6"/>
  <path d="M38 50 Q60 28 82 50 Q78 26 60 26 Q42 26 38 50Z" fill="#5C3A21"/>
  <circle cx="53" cy="52" r="2.8" fill="#2D232E"/>
  <circle cx="67" cy="52" r="2.8" fill="#2D232E"/>
  <path d="M53 60 Q60 66 67 60" fill="none" stroke="#E11D48" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M30 104 C32 82, 88 82, 90 104" fill="#FF6B8B"/>
</svg>`);

const DEFAULT_CHILD_SVG = `data:image/svg+xml;utf8,` + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
  <defs>
    <linearGradient id="cbg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFE4E6"/>
      <stop offset="100%" stop-color="#FECDD3"/>
    </linearGradient>
  </defs>
  <circle cx="80" cy="80" r="78" fill="url(#cbg)" stroke="#FB7185" stroke-width="4"/>
  <!-- Cute twin pigtails -->
  <circle cx="30" cy="68" r="18" fill="#3B2322"/>
  <circle cx="130" cy="68" r="18" fill="#3B2322"/>
  <!-- Hair bows -->
  <circle cx="42" cy="62" r="7" fill="#FF3B6B"/>
  <circle cx="118" cy="62" r="7" fill="#FF3B6B"/>
  <!-- Face -->
  <circle cx="80" cy="86" r="40" fill="#FFE8DC"/>
  <!-- Bangs -->
  <path d="M40 78 Q58 50 80 64 Q102 50 120 78 Q115 42 80 42 Q45 42 40 78Z" fill="#3B2322"/>
  <!-- Big sparkling eyes -->
  <circle cx="64" cy="86" r="6" fill="#2D232E"/>
  <circle cx="96" cy="86" r="6" fill="#2D232E"/>
  <circle cx="62" cy="84" r="2.2" fill="#FFF"/>
  <circle cx="94" cy="84" r="2.2" fill="#FFF"/>
  <!-- Cute blush -->
  <ellipse cx="52" cy="96" rx="8" ry="4.5" fill="#FB7185" opacity="0.6"/>
  <ellipse cx="108" cy="96" rx="8" ry="4.5" fill="#FB7185" opacity="0.6"/>
  <!-- Sweet smile -->
  <path d="M70 98 Q80 109 90 98" fill="none" stroke="#E11D48" stroke-width="3.5" stroke-linecap="round"/>
</svg>`);

const WEEKDAY_NAMES = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy'
];

const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

// Application State
let state = {
  childName: 'Sushi',
  childPhoto: '', // Empty uses DEFAULT_CHILD_SVG
  schoolName: 'Trường của Sushi',
  schoolPhone: '',
  teacherPhotos: {
    happy: '', // Empty uses DEFAULT_HAPPY_TEACHER_SVG
    sad: ''    // Empty uses DEFAULT_SAD_TEACHER_SVG
  },
  // records: { "YYYY-MM-DD": { status: 'early'|'late'|'sick'|'off', note: '', extraClasses: [] } }
  records: {},
  // subjects: [ { id, name, teacherName, phone, teacherPhoto, color, schedules: [{ dayOfWeek: 3, startTime: '07:00', endTime: '08:00' }] } ]
  subjects: [
    {
      id: 'subj-piano-default',
      name: 'Piano 🎹',
      teacherName: 'Cô giáo Piano',
      phone: '',
      teacherPhoto: '',
      color: '#FF5E7E',
      schedules: [
        { dayOfWeek: 3, startTime: '07:00', endTime: '08:00' }, // Thứ 4 (7h-8h)
        { dayOfWeek: 6, startTime: '06:00', endTime: '07:00' }  // Thứ 7 (6h-7h)
      ]
    }
  ]
};

// UI Runtime Variables
const todayDateObj = new Date();
const todayStr = formatDateKey(todayDateObj);
let currentMonthYear = {
  year: todayDateObj.getFullYear(),
  month: todayDateObj.getMonth() // 0-indexed
};
let selectedDateStr = todayStr;
let activeWeekdayFilter = 'all';
let tempSubjectPhotoDataUrl = '';
let tempExtraClassPhotoDataUrl = '';

// Computed Streak Map Cache
let streakComputation = {
  currentStreak: 0,
  totalStars: 0,
  maxStreak: 0,
  milestoneDates: new Set(), // Set of 'YYYY-MM-DD' where 10th, 20th, 30th consecutive early occurred
  streakCountByDate: {}      // 'YYYY-MM-DD' -> streak number on that date
};

// ==========================================
// UTILITY & DATE HELPERS
// ==========================================
function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDateKey(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatReadableViDate(dateStr) {
  const d = parseDateKey(dateStr);
  const wName = WEEKDAY_NAMES[d.getDay()];
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${wName}, ${day}/${month}/${year}`;
}

function formatTelHref(phoneStr) {
  const cleaned = String(phoneStr || '').replace(/[^\d+]/g, '');
  return cleaned ? `tel:${cleaned}` : '#';
}

function getChildPhotoSrc() {
  return state.childPhoto || DEFAULT_CHILD_SVG;
}

function getHappyPhotoSrc() {
  return state.teacherPhotos.happy || DEFAULT_HAPPY_TEACHER_SVG;
}

function getSadPhotoSrc() {
  return state.teacherPhotos.sad || DEFAULT_SAD_TEACHER_SVG;
}

function showToast(message) {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.hidden = true;
  }, 2600);
}

// ==========================================
// IMAGE COMPRESSION FOR LOCAL STORAGE
// ==========================================
function compressImageFile(file, maxSize = 360, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function compressTeacherMoodFile(file, mood = 'happy', size = 380, quality = 0.88) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Center-crop square
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        ctx.restore();

        // Inner soft glow ring + outer solid green/red ring
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 14, 0, Math.PI * 2);
        ctx.lineWidth = 16;
        ctx.strokeStyle = mood === 'happy' ? 'rgba(74, 222, 128, 0.45)' : 'rgba(248, 113, 113, 0.45)';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 8, 0, Math.PI * 2);
        ctx.lineWidth = 16;
        ctx.strokeStyle = mood === 'happy' ? '#16A34A' : '#DC2626';
        ctx.stroke();

        resolve(canvas.toDataURL('image/png', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ==========================================
// STORAGE LOAD & SAVE
// ==========================================
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = {
        ...state,
        ...parsed,
        teacherPhotos: {
          ...state.teacherPhotos,
          ...(parsed.teacherPhotos || {})
        },
        records: parsed.records || {},
        subjects: Array.isArray(parsed.subjects) ? parsed.subjects : state.subjects
      };
      // One-time migration to edited teacher photos v2 (with clear smile/pout & green/red borders)
      if (!state.teacherPhotosMigratedV2) {
        state.teacherPhotos = { happy: '', sad: '' };
        state.teacherPhotosMigratedV2 = true;
        saveState();
      }
    }
  } catch (err) {
    console.error('Không thể đọc dữ liệu:', err);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    showToast('⚠️ Bộ nhớ đầy, vui lòng giảm kích thước ảnh!');
    console.error(err);
  }
}

// ==========================================
// 10-DAY CONSECUTIVE EARLY STREAK ENGINE
// ==========================================
/**
 * Rules specified by User:
 * - Baby goes to school Monday to Saturday.
 * - Days with no school (Sunday, or unrecorded days, or off days) do NOT break the streak and do NOT increment it.
 * - Sick days ('sick') are excused and do NOT break the streak.
 * - Early days ('early') increment consecutive count by +1.
 * - Every 10 consecutive 'early' sessions (10, 20, 30...) earns a Big Milestone Star on that date!
 * - Late days ('late') reset the consecutive count to 0.
 */
function recomputeStreaks() {
  const sortedDates = Object.keys(state.records).sort();
  let runningStreak = 0;
  let maxStreak = 0;
  let totalStars = 0;
  const milestoneDates = new Set();
  const streakCountByDate = {};

  for (const dateStr of sortedDates) {
    const rec = state.records[dateStr];
    if (!rec || !rec.status || rec.status === 'none') continue;

    if (rec.status === 'early') {
      runningStreak += 1;
      streakCountByDate[dateStr] = runningStreak;
      if (runningStreak > maxStreak) {
        maxStreak = runningStreak;
      }
      if (runningStreak > 0 && runningStreak % 10 === 0) {
        milestoneDates.add(dateStr);
        totalStars += 1;
      }
    } else if (rec.status === 'late') {
      runningStreak = 0;
      streakCountByDate[dateStr] = 0;
    } else if (rec.status === 'sick' || rec.status === 'off') {
      // Sick or Off day: preserves current runningStreak without resetting
      streakCountByDate[dateStr] = runningStreak;
    }
  }

  streakComputation = {
    currentStreak: runningStreak,
    totalStars,
    maxStreak,
    milestoneDates,
    streakCountByDate
  };
}

// ==========================================
// SCHEDULE & SUBJECT STATUS HELPERS
// ==========================================
function isSubjectEnded(subj, refDateStr = todayStr) {
  if (!subj.endDate) return false;
  return subj.endDate < refDateStr;
}

function isSubjectActiveOnDate(subj, dateStr) {
  if (subj.startDate && dateStr < subj.startDate) return false;
  if (subj.endDate && dateStr > subj.endDate) return false;
  return true;
}

function formatShortViDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getAbsentBadgeHtml(attendanceStatus) {
  if (attendanceStatus === 'teacher_off') {
    return `<span class="class-absent-badge">🚫 Vắng: Giáo viên nghỉ dạy</span>`;
  }
  if (attendanceStatus === 'child_sick') {
    return `<span class="class-absent-badge">🤒 Vắng: Bé ốm / nghỉ học</span>`;
  }
  return '';
}

function getClassesForDate(dateStr) {
  const dateObj = parseDateKey(dateStr);
  const dayOfWeek = dateObj.getDay(); // 0 (Sun) - 6 (Sat)
  const list = [];
  const rec = state.records[dateStr] || {};
  const classAttendance = rec.classAttendance || {};

  // 1. Recurring subject schedules matching dayOfWeek and within [startDate, endDate]
  for (const subj of state.subjects) {
    if (!isSubjectActiveOnDate(subj, dateStr)) continue;
    if (!Array.isArray(subj.schedules)) continue;
    for (const slot of subj.schedules) {
      if (Number(slot.dayOfWeek) === dayOfWeek) {
        const classKey = `rec_${subj.id}_${slot.startTime}`;
        const attendance = classAttendance[classKey] || 'attended';
        list.push({
          type: 'recurring',
          classKey,
          subjectId: subj.id,
          name: subj.name,
          teacherName: subj.teacherName || 'Giáo viên bộ môn',
          phone: subj.phone || '',
          teacherPhoto: subj.teacherPhoto || DEFAULT_SUBJECT_TEACHER_SVG,
          color: subj.color || '#FF5E7E',
          timeText: `${slot.startTime} - ${slot.endTime}`,
          startTime: slot.startTime,
          attendance
        });
      }
    }
  }

  // 2. Extra one-off classes added specifically to this date
  if (rec && Array.isArray(rec.extraClasses)) {
    rec.extraClasses.forEach((extra, idx) => {
      const classKey = `extra_${idx}`;
      const attendance = extra.attendance || classAttendance[classKey] || 'attended';
      list.push({
        type: 'extra',
        classKey,
        extraIndex: idx,
        name: extra.name,
        teacherName: extra.teacherName || 'Buổi học riêng',
        phone: extra.phone || '',
        teacherPhoto: extra.teacherPhoto || DEFAULT_SUBJECT_TEACHER_SVG,
        color: '#8B5CF6',
        timeText: extra.time || 'Trong ngày',
        startTime: extra.time || '99:99',
        attendance
      });
    });
  }

  list.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  return list;
}

function setClassAttendanceOnDate(dateStr, classItem, newAttendance) {
  if (!state.records[dateStr]) {
    state.records[dateStr] = { status: 'none', note: '', extraClasses: [], classAttendance: {} };
  }
  if (!state.records[dateStr].classAttendance) {
    state.records[dateStr].classAttendance = {};
  }

  if (classItem.type === 'extra' && Array.isArray(state.records[dateStr].extraClasses)) {
    const targetExtra = state.records[dateStr].extraClasses[classItem.extraIndex];
    if (targetExtra) {
      targetExtra.attendance = newAttendance;
    }
  }
  state.records[dateStr].classAttendance[classItem.classKey] = newAttendance;

  saveState();
  renderAll();
  renderModalDayClasses(dateStr);

  if (newAttendance === 'teacher_off') {
    showToast(`🚫 Đã đánh dấu "${classItem.name}": Giáo viên nghỉ dạy hôm nay`);
  } else if (newAttendance === 'child_sick') {
    showToast(`🤒 Đã đánh dấu "${classItem.name}": Bé ốm / nghỉ học môn này`);
  } else {
    showToast(`✅ Đã đánh dấu "${classItem.name}": Có học bình thường`);
  }
}

// ==========================================
// RENDER ALL UI SECTIONS
// ==========================================
function renderAll() {
  recomputeStreaks();
  syncAllTeacherImages();
  renderHeader();
  renderStreakBanner();
  renderQuickActionCard();
  renderCalendar();
  renderSubjectsAndTimetable();
  renderStats();
}

function syncAllTeacherImages() {
  const childSrc = getChildPhotoSrc();
  const happySrc = getHappyPhotoSrc();
  const sadSrc = getSadPhotoSrc();

  document.querySelectorAll('.child-avatar-img').forEach((img) => {
    img.src = childSrc;
  });
  document.querySelectorAll('.teacher-happy-img').forEach((img) => {
    img.src = happySrc;
  });
  document.querySelectorAll('.teacher-sad-img').forEach((img) => {
    img.src = sadSrc;
  });
}

function renderHeader() {
  const titleEl = document.getElementById('appTitleText');
  const subtitleEl = document.getElementById('todaySubtitle');
  const name = (state.childName || 'Sushi').trim();
  const schoolName = (state.schoolName || '').trim();
  const schoolPhone = (state.schoolPhone || '').trim();

  if (titleEl) {
    titleEl.textContent = `Nhật Ký Đi Học Của ${name}`;
  }
  if (subtitleEl) {
    if (schoolName && schoolPhone) {
      subtitleEl.textContent = `🏫 ${schoolName} • 📞 ${schoolPhone}`;
    } else if (schoolName) {
      subtitleEl.textContent = `🏫 ${schoolName} (Thứ 2 - Thứ 7)`;
    } else {
      subtitleEl.textContent = 'Thứ Hai đến Thứ Bảy hằng tuần';
    }
  }

  const inputChildName = document.getElementById('inputChildName');
  if (inputChildName && document.activeElement !== inputChildName) {
    inputChildName.value = name;
  }

  const inputSchoolName = document.getElementById('inputSchoolName');
  if (inputSchoolName && document.activeElement !== inputSchoolName) {
    inputSchoolName.value = state.schoolName || '';
  }

  const inputSchoolPhone = document.getElementById('inputSchoolPhone');
  if (inputSchoolPhone && document.activeElement !== inputSchoolPhone) {
    inputSchoolPhone.value = state.schoolPhone || '';
  }

  const callWrap = document.getElementById('settingsSchoolCallWrap');
  const callLink = document.getElementById('settingsSchoolCallLink');
  if (callWrap && callLink) {
    if (schoolPhone) {
      callWrap.hidden = false;
      callLink.href = formatTelHref(schoolPhone);
      callLink.textContent = `📞 Gọi trường (${schoolPhone})`;
    } else {
      callWrap.hidden = true;
    }
  }
}

function renderStreakBanner() {
  const { currentStreak, totalStars } = streakComputation;
  const cycleProgress = currentStreak === 0 ? 0 : (currentStreak % 10 === 0 ? 10 : currentStreak % 10);

  document.getElementById('currentStreakCount').textContent = cycleProgress;
  document.getElementById('totalStarsCount').textContent = totalStars;

  const trackEl = document.getElementById('streakTrack');
  trackEl.innerHTML = '';

  for (let i = 1; i <= 10; i++) {
    const slot = document.createElement('div');
    const isFilled = i <= cycleProgress;
    const isTenth = i === 10;
    slot.className = `streak-slot${isFilled ? ' filled' : ''}${isTenth ? ' milestone-tenth' : ''}`;
    slot.textContent = isTenth ? '⭐' : i;
    trackEl.appendChild(slot);
  }

  const hintEl = document.getElementById('streakHintText');
  if (cycleProgress === 10 && currentStreak > 0) {
    hintEl.innerHTML = `🎉 <strong>Tuyệt vời!</strong> Con vừa hoàn thành mốc <strong>${currentStreak} buổi đi sớm liên tiếp</strong> và nhận Ngôi Sao To!`;
  } else if (cycleProgress > 0) {
    const remaining = 10 - cycleProgress;
    hintEl.innerHTML = `Cố lên! Chỉ còn <strong>${remaining} buổi đi sớm</strong> nữa là nhận thêm 1 Ngôi Sao To ⭐`;
  } else {
    hintEl.textContent = 'Chủ nhật, ngày nghỉ và ngày ốm được giữ nguyên chuỗi không bị mất!';
  }
}

function renderQuickActionCard() {
  const tagEl = document.getElementById('quickDateTag');
  const displayEl = document.getElementById('quickDateDisplay');
  const dObj = parseDateKey(selectedDateStr);
  const isToday = selectedDateStr === todayStr;
  const isSunday = dObj.getDay() === 0;

  tagEl.textContent = isToday
    ? 'Hôm nay'
    : isSunday
      ? 'Chủ Nhật (Nghỉ cuối tuần)'
      : 'Ngày đang chọn';

  displayEl.textContent = formatReadableViDate(selectedDateStr);

  const rec = state.records[selectedDateStr] || {};
  const status = rec.status || 'none';

  document.getElementById('btnQuickEarly').classList.toggle('selected', status === 'early');
  document.getElementById('btnQuickLate').classList.toggle('selected', status === 'late');
  document.getElementById('btnQuickSick').classList.toggle('selected', status === 'sick');
  document.getElementById('btnQuickOff').classList.toggle('selected', status === 'off');

  const btnClear = document.getElementById('btnQuickClear');
  btnClear.hidden = status === 'none';

  // Render scheduled classes for selectedDateStr with quick absence toggle
  const classesContainer = document.getElementById('quickClassesList');
  const classes = getClassesForDate(selectedDateStr);
  if (classes.length === 0) {
    classesContainer.innerHTML = '';
  } else {
    classesContainer.innerHTML = classes
      .map((c, idx) => {
        const isAbsent = c.attendance !== 'attended';
        const callBtn = c.phone
          ? `<a href="${formatTelHref(c.phone)}" class="btn-call-pill" title="Gọi ${escapeHtml(c.phone)}">📞 ${escapeHtml(c.phone)}</a>`
          : '';
        const absentBadge = getAbsentBadgeHtml(c.attendance);
        return `
      <div class="mini-class-item${isAbsent ? ' is-absent' : ''}" style="border-left-color: ${c.color}">
        <img src="${c.teacherPhoto}" alt="${escapeHtml(c.teacherName)}">
        <div class="mini-class-info">
          <strong>${escapeHtml(c.name)} (${escapeHtml(c.timeText)})</strong>
          <span>👩‍🏫 ${escapeHtml(c.teacherName)}</span>
          ${absentBadge ? `<div>${absentBadge}</div>` : ''}
        </div>
        ${callBtn}
        <div class="class-attendance-actions">
          <button type="button" class="btn-class-att${c.attendance === 'attended' ? ' active-attended' : ''}" data-qclass-idx="${idx}" data-qatt="attended">✅ Có học</button>
          <button type="button" class="btn-class-att${c.attendance === 'teacher_off' ? ' active-teacher-off' : ''}" data-qclass-idx="${idx}" data-qatt="teacher_off">🚫 GV nghỉ</button>
          <button type="button" class="btn-class-att${c.attendance === 'child_sick' ? ' active-child-sick' : ''}" data-qclass-idx="${idx}" data-qatt="child_sick">🤒 Bé ốm/nghỉ</button>
        </div>
      </div>
    `;
      })
      .join('');

    classesContainer.querySelectorAll('[data-qclass-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-qclass-idx'));
        const newAtt = btn.getAttribute('data-qatt');
        if (classes[idx]) {
          setClassAttendanceOnDate(selectedDateStr, classes[idx], newAtt);
        }
      });
    });
  }

  // Render Main School Quick Contact Bar
  const mainSchoolBar = document.getElementById('quickMainSchoolBar');
  if (mainSchoolBar) {
    const sName = (state.schoolName || 'Trường học chính').trim();
    const sPhone = (state.schoolPhone || '').trim();
    if (sPhone) {
      mainSchoolBar.innerHTML = `
        <div class="main-school-banner-inner">
          <div class="school-contact-info">
            <strong>🏫 ${escapeHtml(sName)}</strong>
            <span>SĐT trường chính: ${escapeHtml(sPhone)}</span>
          </div>
          <a href="${formatTelHref(sPhone)}" class="btn-call-pill">📞 Gọi trường</a>
        </div>
      `;
    } else {
      mainSchoolBar.innerHTML = '';
    }
  }
}

function renderCalendar() {
  const { year, month } = currentMonthYear;
  const monthLabel = document.getElementById('calendarMonthLabel');
  monthLabel.textContent = `Tháng ${month + 1}, ${year}`;

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Convert JS getDay (0=Sun..6=Sat) to Monday-first index (0=Mon..6=Sun)
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;

  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  let monthEarly = 0;
  let monthLate = 0;
  let monthStars = 0;

  // Empty leading cells
  for (let i = 0; i < startOffset; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'cal-day empty';
    grid.appendChild(emptyCell);
  }

  const happySrc = getHappyPhotoSrc();
  const sadSrc = getSadPhotoSrc();

  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(year, month, day);
    const dateKey = formatDateKey(cellDate);
    const isSunday = cellDate.getDay() === 0;
    const isToday = dateKey === todayStr;
    const isSelected = dateKey === selectedDateStr;

    const rec = state.records[dateKey] || {};
    const status = rec.status || 'none';
    const isMilestone = streakComputation.milestoneDates.has(dateKey);
    const dayClasses = getClassesForDate(dateKey);
    const activeDayClasses = dayClasses.filter((c) => c.attendance === 'attended');

    if (status === 'early') monthEarly++;
    if (status === 'late') monthLate++;
    if (isMilestone) monthStars++;

    const cell = document.createElement('div');
    cell.className = [
      'cal-day',
      isSunday ? 'sunday' : '',
      isToday ? 'today' : '',
      isSelected ? 'selected' : '',
      status !== 'none' ? `status-${status}` : ''
    ]
      .filter(Boolean)
      .join(' ');

    // Top Milestone Star if 10th consecutive early achieved on this day
    let milestoneHtml = '';
    if (isMilestone) {
      milestoneHtml = `<span class="cal-milestone-star" title="Đạt mốc 10 buổi đi sớm liên tiếp!">⭐</span>`;
    }

    // Center visual: Teacher face photo or sick/off icon
    let centerVisualHtml = '';
    if (status === 'early') {
      centerVisualHtml = `<img class="cal-face-avatar" src="${happySrc}" alt="Đi sớm">`;
    } else if (status === 'late') {
      centerVisualHtml = `<img class="cal-face-avatar" src="${sadSrc}" alt="Đi trễ">`;
    } else if (status === 'sick') {
      centerVisualHtml = `<span class="cal-status-emoji" title="Nghỉ ốm">🤒</span>`;
    } else if (status === 'off') {
      centerVisualHtml = `<span class="cal-status-emoji" title="Nghỉ phép">🏖️</span>`;
    } else if (activeDayClasses.length > 0) {
      // Show miniature teacher avatar of the first scheduled active subject that day
      centerVisualHtml = `<img class="cal-face-avatar" style="opacity:0.45; width:24px; height:24px" src="${activeDayClasses[0].teacherPhoto}" alt="${escapeHtml(activeDayClasses[0].name)}">`;
    }

    // Class dots at bottom (grayed out if absent)
    const dotsHtml =
      dayClasses.length > 0
        ? `<div class="cal-class-dots">${dayClasses
            .slice(0, 3)
            .map((c) => `<span class="cal-class-dot" style="background:${c.attendance === 'attended' ? c.color : '#D1D5DB'}"></span>`)
            .join('')}</div>`
        : `<div class="cal-class-dots"></div>`;

    cell.innerHTML = `
      ${milestoneHtml}
      <span class="cal-day-num">${day}</span>
      ${centerVisualHtml}
      ${dotsHtml}
    `;

    cell.addEventListener('click', () => {
      selectedDateStr = dateKey;
      renderQuickActionCard();
      renderCalendar();
      openDayDetailModal(dateKey);
    });

    grid.appendChild(cell);
  }

  const miniStats = document.getElementById('calendarMonthMiniStats');
  miniStats.textContent = `${monthEarly} buổi sớm • ${monthLate} buổi trễ${monthStars > 0 ? ` • ${monthStars} ⭐` : ''}`;
}

// ==========================================
// QUICK STATUS RECORDING & CELEBRATION
// ==========================================
function setDayStatus(dateStr, newStatus) {
  const prevWasMilestone = streakComputation.milestoneDates.has(dateStr);

  if (!state.records[dateStr]) {
    state.records[dateStr] = { status: 'none', note: '', extraClasses: [], classAttendance: {} };
  }
  state.records[dateStr].status = newStatus;

  // Clean up empty record if needed
  const r = state.records[dateStr];
  const hasClassAtt = r.classAttendance && Object.keys(r.classAttendance).length > 0;
  if (r.status === 'none' && !r.note && (!r.extraClasses || r.extraClasses.length === 0) && !hasClassAtt) {
    delete state.records[dateStr];
  }

  saveState();
  renderAll();

  const nowIsMilestone = streakComputation.milestoneDates.has(dateStr);
  if (newStatus === 'early') {
    if (nowIsMilestone && !prevWasMilestone) {
      showToast('🌟 CHÚC MỪNG! Bé đạt mốc 10 buổi đi sớm liên tiếp và nhận 1 NGÔI SAO TO! ⭐');
    } else {
      const countOnDay = streakComputation.streakCountByDate[dateStr] || 1;
      showToast(`😊 Đã chấm Đi Học Sớm! (Chuỗi liên tiếp: ${countOnDay} buổi)`);
    }
  } else if (newStatus === 'late') {
    showToast('😢 Đã đánh dấu Đi Học Trễ. Ngày mai cố gắng đi sớm nhé!');
  } else if (newStatus === 'sick') {
    showToast('🤒 Đã đánh dấu Nghỉ Ốm (Được bảo lưu chuỗi đi sớm)');
  } else if (newStatus === 'off') {
    showToast('🏖️ Đã đánh dấu Nghỉ Học (Được bảo lưu chuỗi đi sớm)');
  } else {
    showToast('↺ Đã xóa trạng thái điểm danh của ngày này');
  }
}

// ==========================================
// DAY DETAIL MODAL
// ==========================================
function openDayDetailModal(dateStr) {
  selectedDateStr = dateStr;
  const dialog = document.getElementById('dayDetailDialog');
  const dObj = parseDateKey(dateStr);

  document.getElementById('modalDayWeekdayBadge').textContent = WEEKDAY_NAMES[dObj.getDay()];
  document.getElementById('modalDayTitle').textContent = `Ngày ${String(dObj.getDate()).padStart(2, '0')}/${String(dObj.getMonth() + 1).padStart(2, '0')}/${dObj.getFullYear()}`;

  const rec = state.records[dateStr] || { status: 'none', note: '', extraClasses: [] };
  document.getElementById('modalDayNote').value = rec.note || '';

  // Hide extra class form initially
  document.getElementById('extraClassFormBox').hidden = true;

  refreshDayModalStatusButtons(dateStr);
  renderModalDayClasses(dateStr);

  if (!dialog.open) {
    dialog.showModal();
  }
}

function refreshDayModalStatusButtons(dateStr) {
  const rec = state.records[dateStr] || {};
  const status = rec.status || 'none';
  const isMilestone = streakComputation.milestoneDates.has(dateStr);

  document.getElementById('modalMilestoneBanner').hidden = !isMilestone;

  document.querySelectorAll('#dayDetailDialog [data-status]').forEach((btn) => {
    const s = btn.getAttribute('data-status');
    btn.classList.toggle('active', s === status && status !== 'none');
  });
}

function renderModalDayClasses(dateStr) {
  const container = document.getElementById('modalDayClassesList');
  const classes = getClassesForDate(dateStr);

  if (classes.length === 0) {
    container.innerHTML = `<p class="helper-text">Chưa có môn học nào vào ngày này. Bạn có thể thêm môn định kỳ ở mục "Lịch Môn Học" hoặc nhấn "+ Thêm buổi học riêng".</p>`;
    return;
  }

  container.innerHTML = classes
    .map((c, idx) => {
      const isAbsent = c.attendance !== 'attended';
      const absentBadge = getAbsentBadgeHtml(c.attendance);
      const callBtn = c.phone
        ? `<a href="${formatTelHref(c.phone)}" class="btn-call-pill" title="Gọi ${escapeHtml(c.phone)}">📞 ${escapeHtml(c.phone)}</a>`
        : '';
      const actionBtn =
        c.type === 'extra'
          ? `<button type="button" class="btn-remove-slot" data-remove-extra="${c.extraIndex}" title="Xóa buổi học riêng">✕</button>`
          : `<span class="slot-badge">Lịch cố định</span>`;

      return `
      <div class="mini-class-item${isAbsent ? ' is-absent' : ''}" style="border-left-color: ${c.color}">
        <img src="${c.teacherPhoto}" alt="${escapeHtml(c.teacherName)}">
        <div class="mini-class-info">
          <strong>${escapeHtml(c.name)} • ${escapeHtml(c.timeText)}</strong>
          <span>👩‍🏫 ${escapeHtml(c.teacherName)}</span>
          ${absentBadge ? `<div>${absentBadge}</div>` : ''}
        </div>
        ${callBtn}
        ${actionBtn}
        <div class="class-attendance-actions">
          <button type="button" class="btn-class-att${c.attendance === 'attended' ? ' active-attended' : ''}" data-mclass-idx="${idx}" data-matt="attended">✅ Có học</button>
          <button type="button" class="btn-class-att${c.attendance === 'teacher_off' ? ' active-teacher-off' : ''}" data-mclass-idx="${idx}" data-matt="teacher_off">🚫 Giáo viên nghỉ</button>
          <button type="button" class="btn-class-att${c.attendance === 'child_sick' ? ' active-child-sick' : ''}" data-mclass-idx="${idx}" data-matt="child_sick">🤒 Bé ốm / vắng</button>
        </div>
      </div>
    `;
    })
    .join('');

  container.querySelectorAll('[data-mclass-idx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-mclass-idx'));
      const newAtt = btn.getAttribute('data-matt');
      if (classes[idx]) {
        setClassAttendanceOnDate(dateStr, classes[idx], newAtt);
      }
    });
  });

  container.querySelectorAll('[data-remove-extra]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-remove-extra'));
      const rec = state.records[dateStr];
      if (rec && Array.isArray(rec.extraClasses)) {
        rec.extraClasses.splice(idx, 1);
        saveState();
        renderModalDayClasses(dateStr);
        renderAll();
      }
    });
  });
}

// ==========================================
// TAB 2: SUBJECTS & WEEKLY SCHEDULE
// ==========================================
function renderSubjectsAndTimetable() {
  renderMainSchoolContactCard();
  renderWeeklyTimetableOverview();
  renderSubjectsList();
}

function renderMainSchoolContactCard() {
  const card = document.getElementById('subjectsSchoolContactCard');
  if (!card) return;
  const sName = (state.schoolName || 'Trường học chính của bé').trim();
  const sPhone = (state.schoolPhone || '').trim();

  if (sPhone) {
    card.innerHTML = `
      <div class="school-contact-info">
        <strong>🏫 ${escapeHtml(sName)}</strong>
        <span>📞 SĐT trường chính: <strong>${escapeHtml(sPhone)}</strong></span>
      </div>
      <a href="${formatTelHref(sPhone)}" class="btn-call-pill">📞 Gọi ngay</a>
    `;
  } else {
    card.innerHTML = `
      <div class="school-contact-info">
        <strong>🏫 ${escapeHtml(sName)}</strong>
        <span>Chưa nhập số điện thoại trường học chính</span>
      </div>
      <button type="button" class="btn-outline-sm" id="btnJumpToSchoolPhone">Nhập SĐT</button>
    `;
    const btnJump = document.getElementById('btnJumpToSchoolPhone');
    if (btnJump) {
      btnJump.addEventListener('click', () => {
        document.querySelector('.bottom-tabbar .tab-item[data-target="tab-settings"]').click();
        setTimeout(() => {
          const inp = document.getElementById('inputSchoolPhone');
          if (inp) inp.focus();
        }, 150);
      });
    }
  }
}

function renderWeeklyTimetableOverview() {
  const container = document.getElementById('weeklyScheduleContainer');
  const daysOrder = [1, 2, 3, 4, 5, 6, 0]; // Thứ 2 -> Chủ Nhật

  const filteredDays =
    activeWeekdayFilter === 'all'
      ? daysOrder
      : [Number(activeWeekdayFilter)];

  const groupsHtml = [];

  for (const dayNum of filteredDays) {
    const slotsForDay = [];
    // Only show currently active (not ended) subjects in the weekly active overview
    for (const subj of state.subjects) {
      if (isSubjectEnded(subj, todayStr)) continue;
      for (const s of subj.schedules || []) {
        if (Number(s.dayOfWeek) === dayNum) {
          slotsForDay.push({
            subjectId: subj.id,
            name: subj.name,
            teacherName: subj.teacherName || 'Giáo viên',
            phone: subj.phone || '',
            teacherPhoto: subj.teacherPhoto || DEFAULT_SUBJECT_TEACHER_SVG,
            color: subj.color || '#FF5E7E',
            startTime: s.startTime,
            endTime: s.endTime
          });
        }
      }
    }

    slotsForDay.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

    if (slotsForDay.length > 0 || activeWeekdayFilter !== 'all') {
      const itemsHtml =
        slotsForDay.length > 0
          ? slotsForDay
              .map((item) => {
                const callBtn = item.phone
                  ? `<a href="${formatTelHref(item.phone)}" class="btn-call-pill">📞 ${escapeHtml(item.phone)}</a>`
                  : '';
                return `
            <div class="mini-class-item" style="border-left-color: ${item.color}; margin-top:6px;">
              <img src="${item.teacherPhoto}" alt="${escapeHtml(item.teacherName)}">
              <div class="mini-class-info">
                <strong>${escapeHtml(item.name)} (${escapeHtml(item.startTime)} - ${escapeHtml(item.endTime)})</strong>
                <span>👩‍🏫 ${escapeHtml(item.teacherName)}</span>
              </div>
              ${callBtn}
            </div>
          `;
              })
              .join('')
          : `<p class="helper-text">Không có lịch học cố định đang hoạt động vào ${WEEKDAY_NAMES[dayNum]}.</p>`;

      groupsHtml.push(`
        <div class="day-schedule-group">
          <h4>📅 ${WEEKDAY_NAMES[dayNum]}</h4>
          ${itemsHtml}
        </div>
      `);
    }
  }

  if (groupsHtml.length === 0) {
    container.innerHTML = `<p class="helper-text">Chưa có lịch học nào đang diễn ra. Hãy nhấn "+ Thêm môn học" để tạo lịch nhé!</p>`;
  } else {
    container.innerHTML = groupsHtml.join('');
  }
}

function renderSubjectsList() {
  const container = document.getElementById('subjectsListContainer');
  if (state.subjects.length === 0) {
    container.innerHTML = `<p class="helper-text">Danh sách môn học đang trống.</p>`;
    return;
  }

  // Sort: Active subjects on top, Ended subjects at the bottom
  const activeSubjects = state.subjects.filter((s) => !isSubjectEnded(s, todayStr));
  const endedSubjects = state.subjects.filter((s) => isSubjectEnded(s, todayStr));

  const renderCard = (subj, ended) => {
    const avatar = subj.teacherPhoto || DEFAULT_SUBJECT_TEACHER_SVG;
    const slotsBadges = (subj.schedules || [])
      .map(
        (s) =>
          `<span class="slot-badge">${WEEKDAY_SHORT[s.dayOfWeek]}: ${escapeHtml(s.startTime)}-${escapeHtml(s.endTime)}</span>`
      )
      .join('');

    const phoneHtml = subj.phone
      ? `<div style="margin-top:5px;"><a href="${formatTelHref(subj.phone)}" class="btn-call-pill">📞 Gọi: ${escapeHtml(subj.phone)}</a></div>`
      : `<div class="subject-teacher-label">📞 Chưa nhập SĐT môn học</div>`;

    const startText = subj.startDate ? `Từ ${formatShortViDate(subj.startDate)}` : 'Từ đầu';
    const endText = subj.endDate ? `đến ${formatShortViDate(subj.endDate)}` : 'Chưa có ngày kết thúc';
    const statusPill = ended
      ? `<span class="subject-status-pill ended">Đã kết thúc</span>`
      : `<span class="subject-status-pill active">Đang học</span>`;

    return `
      <div class="subject-card${ended ? ' is-ended' : ''}" data-subject-id="${subj.id}">
        <img class="subject-card-avatar" style="border-color: ${ended ? '#9CA3AF' : subj.color || '#FF5E7E'}" src="${avatar}" alt="${escapeHtml(subj.name)}">
        <div class="subject-card-body">
          <div class="subject-card-title">
            <span class="subject-color-dot" style="background: ${ended ? '#9CA3AF' : subj.color || '#FF5E7E'}"></span>
            <h4>${escapeHtml(subj.name)}</h4>
            ${statusPill}
          </div>
          <div class="subject-teacher-label">👩‍🏫 ${escapeHtml(subj.teacherName || 'Chưa nhập tên giáo viên')}</div>
          <div class="subject-teacher-label">📅 ${startText} • ${endText}</div>
          ${phoneHtml}
          <div class="subject-slots-badges">${slotsBadges}</div>
        </div>
        <button type="button" class="btn-outline-sm" data-edit-subject="${subj.id}">Sửa</button>
      </div>
    `;
  };

  let html = '';
  if (activeSubjects.length > 0) {
    html += `<div class="subject-group-divider">🟢 Các môn đang học (${activeSubjects.length})</div>`;
    html += activeSubjects.map((s) => renderCard(s, false)).join('');
  }
  if (endedSubjects.length > 0) {
    html += `<div class="subject-group-divider" style="margin-top:12px;">⚪ Các môn đã kết thúc (${endedSubjects.length})</div>`;
    html += endedSubjects.map((s) => renderCard(s, true)).join('');
  }

  container.innerHTML = html;

  container.querySelectorAll('[data-edit-subject]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-edit-subject');
      openSubjectModal(id);
    });
  });
}

// ==========================================
// SUBJECT MODAL (ADD / EDIT)
// ==========================================
function openSubjectModal(subjectId = null) {
  const dialog = document.getElementById('subjectDialog');
  const titleEl = document.getElementById('subjectModalTitle');
  const idInput = document.getElementById('subjectIdInput');
  const nameInput = document.getElementById('subjectNameInput');
  const teacherInput = document.getElementById('subjectTeacherNameInput');
  const phoneInput = document.getElementById('subjectPhoneInput');
  const startDateInput = document.getElementById('subjectStartDateInput');
  const endDateInput = document.getElementById('subjectEndDateInput');
  const colorInput = document.getElementById('subjectColorInput');
  const previewImg = document.getElementById('subjectTeacherPreview');
  const deleteBtn = document.getElementById('btnDeleteSubject');
  const slotsContainer = document.getElementById('scheduleSlotsContainer');

  slotsContainer.innerHTML = '';

  if (subjectId) {
    const subj = state.subjects.find((s) => s.id === subjectId);
    if (!subj) return;
    titleEl.textContent = 'Chỉnh Sửa Môn Học';
    idInput.value = subj.id;
    nameInput.value = subj.name;
    teacherInput.value = subj.teacherName || '';
    if (phoneInput) phoneInput.value = subj.phone || '';
    if (startDateInput) startDateInput.value = subj.startDate || '';
    if (endDateInput) endDateInput.value = subj.endDate || '';
    colorInput.value = subj.color || '#FF5E7E';
    tempSubjectPhotoDataUrl = subj.teacherPhoto || '';
    previewImg.src = tempSubjectPhotoDataUrl || DEFAULT_SUBJECT_TEACHER_SVG;
    deleteBtn.hidden = false;

    (subj.schedules || []).forEach((slot) => {
      appendScheduleSlotRow(slot.dayOfWeek, slot.startTime, slot.endTime);
    });
  } else {
    titleEl.textContent = 'Thêm Môn Học Mới';
    idInput.value = '';
    nameInput.value = '';
    teacherInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (startDateInput) startDateInput.value = todayStr;
    if (endDateInput) endDateInput.value = '';
    colorInput.value = '#FF5E7E';
    tempSubjectPhotoDataUrl = '';
    previewImg.src = DEFAULT_SUBJECT_TEACHER_SVG;
    deleteBtn.hidden = true;

    // Default 1 slot example
    appendScheduleSlotRow(3, '07:00', '08:00');
  }

  dialog.showModal();
}

function appendScheduleSlotRow(dayOfWeek = 3, startTime = '07:00', endTime = '08:00') {
  const container = document.getElementById('scheduleSlotsContainer');
  const row = document.createElement('div');
  row.className = 'schedule-slot-row';

  const optionsHtml = [1, 2, 3, 4, 5, 6, 0]
    .map(
      (d) =>
        `<option value="${d}" ${Number(dayOfWeek) === d ? 'selected' : ''}>${WEEKDAY_NAMES[d]}</option>`
    )
    .join('');

  row.innerHTML = `
    <select class="slot-day-select" aria-label="Chọn thứ">${optionsHtml}</select>
    <input type="time" class="slot-start-input" value="${startTime}" aria-label="Giờ bắt đầu">
    <input type="time" class="slot-end-input" value="${endTime}" aria-label="Giờ kết thúc">
    <button type="button" class="btn-remove-slot" title="Xóa khung giờ">✕</button>
  `;

  row.querySelector('.btn-remove-slot').addEventListener('click', () => {
    row.remove();
  });

  container.appendChild(row);
}

// ==========================================
// TAB 3: DATE RANGE STATISTICS
// ==========================================
function setStatsDatePreset(preset) {
  const startInput = document.getElementById('statsStartDate');
  const endInput = document.getElementById('statsEndDate');
  const now = new Date();

  if (preset === 'this_week') {
    const day = now.getDay();
    const diffToMon = (day + 6) % 7;
    const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMon);
    const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
    startInput.value = formatDateKey(mon);
    endInput.value = formatDateKey(sun);
  } else if (preset === 'this_month') {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    startInput.value = formatDateKey(first);
    endInput.value = formatDateKey(last);
  } else if (preset === 'last_month') {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    startInput.value = formatDateKey(first);
    endInput.value = formatDateKey(last);
  } else if (preset === 'all_time') {
    const allKeys = Object.keys(state.records).sort();
    if (allKeys.length > 0) {
      startInput.value = allKeys[0];
      endInput.value = allKeys[allKeys.length - 1] > todayStr ? allKeys[allKeys.length - 1] : todayStr;
    } else {
      const first = new Date(now.getFullYear(), 0, 1);
      startInput.value = formatDateKey(first);
      endInput.value = todayStr;
    }
  }
  renderStats();
}

function renderStats() {
  const startStr = document.getElementById('statsStartDate').value || '2000-01-01';
  const endStr = document.getElementById('statsEndDate').value || '2099-12-31';

  const keysInRange = Object.keys(state.records)
    .filter((k) => k >= startStr && k <= endStr)
    .sort();

  let earlyCount = 0;
  let lateCount = 0;
  let excusedCount = 0;
  let milestoneStarsInRange = 0;
  let bestStreakInRange = 0;
  let runningInRange = 0;

  const historyRows = [];

  for (const dateKey of keysInRange) {
    const rec = state.records[dateKey];
    if (!rec || !rec.status || rec.status === 'none') continue;

    const isMilestone = streakComputation.milestoneDates.has(dateKey);
    if (isMilestone) milestoneStarsInRange++;

    if (rec.status === 'early') {
      earlyCount++;
      runningInRange++;
      if (runningInRange > bestStreakInRange) bestStreakInRange = runningInRange;
    } else if (rec.status === 'late') {
      lateCount++;
      runningInRange = 0;
    } else if (rec.status === 'sick' || rec.status === 'off') {
      excusedCount++;
    }

    historyRows.push({
      dateKey,
      status: rec.status,
      note: rec.note || '',
      isMilestone
    });
  }

  const totalAttended = earlyCount + lateCount;
  const earlyPct = totalAttended > 0 ? Math.round((earlyCount / totalAttended) * 100) : 0;
  const latePct = totalAttended > 0 ? 100 - earlyPct : 0;

  document.getElementById('statEarlyCount').textContent = earlyCount;
  document.getElementById('statEarlyPercent').textContent = `${earlyPct}% số buổi đi học`;

  document.getElementById('statLateCount').textContent = lateCount;
  document.getElementById('statLatePercent').textContent = `${latePct}% số buổi đi học`;

  document.getElementById('statMilestoneStars').textContent = milestoneStarsInRange;
  document.getElementById('statBestStreak').textContent = `Chuỗi cao nhất: ${bestStreakInRange} buổi`;
  document.getElementById('statExcusedCount').textContent = excusedCount;

  document.getElementById('statTotalSchoolDays').textContent = `Tổng: ${totalAttended} buổi đi học`;

  const barEarly = document.getElementById('ratioBarEarly');
  const barLate = document.getElementById('ratioBarLate');
  if (totalAttended === 0) {
    barEarly.style.width = '50%';
    barLate.style.width = '50%';
  } else {
    barEarly.style.width = `${earlyPct}%`;
    barLate.style.width = `${latePct}%`;
  }

  // Render History List (Newest first)
  const historyListEl = document.getElementById('statsHistoryList');
  if (historyRows.length === 0) {
    historyListEl.innerHTML = `<p class="helper-text">Chưa có dữ liệu điểm danh nào trong khoảng thời gian này.</p>`;
  } else {
    const happySrc = getHappyPhotoSrc();
    const sadSrc = getSadPhotoSrc();

    historyListEl.innerHTML = historyRows
      .slice()
      .reverse()
      .map((item) => {
        let badgeHtml = '';
        let thumbHtml = '';
        if (item.status === 'early') {
          thumbHtml = `<img src="${happySrc}" alt="Đi sớm">`;
          badgeHtml = `<span class="mood-pill happy">Đi sớm 😊${item.isMilestone ? ' ⭐' : ''}</span>`;
        } else if (item.status === 'late') {
          thumbHtml = `<img src="${sadSrc}" alt="Đi trễ">`;
          badgeHtml = `<span class="mood-pill sad">Đi trễ 😢</span>`;
        } else if (item.status === 'sick') {
          thumbHtml = `<span class="cal-status-emoji">🤒</span>`;
          badgeHtml = `<span class="slot-badge">Nghỉ ốm</span>`;
        } else {
          thumbHtml = `<span class="cal-status-emoji">🏖️</span>`;
          badgeHtml = `<span class="slot-badge">Nghỉ phép</span>`;
        }

        return `
        <div class="history-row" data-history-date="${item.dateKey}">
          <div class="history-row-left">
            ${thumbHtml}
            <div>
              <strong style="font-size:13.5px">${formatReadableViDate(item.dateKey)}</strong>
              ${item.note ? `<p style="font-size:12px; color:var(--text-muted)">📝 ${escapeHtml(item.note)}</p>` : ''}
            </div>
          </div>
          ${badgeHtml}
        </div>
      `;
      })
      .join('');

    historyListEl.querySelectorAll('[data-history-date]').forEach((row) => {
      row.addEventListener('click', () => {
        openDayDetailModal(row.getAttribute('data-history-date'));
      });
    });
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ==========================================
// EVENT LISTENERS & INITIALIZATION
// ==========================================
function initEventListeners() {
  // Bottom Tab Navigation
  document.querySelectorAll('.bottom-tabbar .tab-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      document.querySelectorAll('.bottom-tabbar .tab-item').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.tab-panel').forEach((panel) => {
        panel.hidden = panel.id !== targetId;
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Header brand avatar -> jump to Teacher Photos tab
  document.getElementById('headerBrandAvatar').addEventListener('click', () => {
    document.querySelector('.bottom-tabbar .tab-item[data-target="tab-settings"]').click();
  });

  // Today button
  document.getElementById('btnGoToday').addEventListener('click', () => {
    const now = new Date();
    currentMonthYear = { year: now.getFullYear(), month: now.getMonth() };
    selectedDateStr = formatDateKey(now);
    document.querySelector('.bottom-tabbar .tab-item[data-target="tab-calendar"]').click();
    renderAll();
  });

  // Quick Card Buttons
  document.getElementById('btnQuickEarly').addEventListener('click', () => setDayStatus(selectedDateStr, 'early'));
  document.getElementById('btnQuickLate').addEventListener('click', () => setDayStatus(selectedDateStr, 'late'));
  document.getElementById('btnQuickSick').addEventListener('click', () => setDayStatus(selectedDateStr, 'sick'));
  document.getElementById('btnQuickOff').addEventListener('click', () => setDayStatus(selectedDateStr, 'off'));
  document.getElementById('btnQuickClear').addEventListener('click', () => setDayStatus(selectedDateStr, 'none'));
  document.getElementById('btnOpenDayModalFromQuick').addEventListener('click', () => openDayDetailModal(selectedDateStr));

  // Calendar Month Prev / Next
  document.getElementById('btnPrevMonth').addEventListener('click', () => {
    currentMonthYear.month -= 1;
    if (currentMonthYear.month < 0) {
      currentMonthYear.month = 11;
      currentMonthYear.year -= 1;
    }
    renderCalendar();
  });

  document.getElementById('btnNextMonth').addEventListener('click', () => {
    currentMonthYear.month += 1;
    if (currentMonthYear.month > 11) {
      currentMonthYear.month = 0;
      currentMonthYear.year += 1;
    }
    renderCalendar();
  });

  // Day Detail Modal interactions
  const dayDialog = document.getElementById('dayDetailDialog');
  document.getElementById('btnCloseDayModal').addEventListener('click', () => dayDialog.close());

  document.querySelectorAll('#dayDetailDialog [data-status]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const status = btn.getAttribute('data-status');
      setDayStatus(selectedDateStr, status);
      refreshDayModalStatusButtons(selectedDateStr);
    });
  });

  document.getElementById('btnSaveDayDetail').addEventListener('click', () => {
    const noteVal = document.getElementById('modalDayNote').value.trim();
    if (!state.records[selectedDateStr]) {
      state.records[selectedDateStr] = { status: 'none', note: '', extraClasses: [] };
    }
    state.records[selectedDateStr].note = noteVal;
    saveState();
    renderAll();
    dayDialog.close();
    showToast('✅ Đã lưu thông tin ngày học!');
  });

  // Extra One-off Class inside Day Modal
  document.getElementById('btnAddExtraClassForDay').addEventListener('click', () => {
    const box = document.getElementById('extraClassFormBox');
    box.hidden = !box.hidden;
    tempExtraClassPhotoDataUrl = '';
    document.getElementById('extraClassName').value = '';
    document.getElementById('extraClassTime').value = '';
    document.getElementById('extraClassTeacher').value = '';
    const extraPhoneEl = document.getElementById('extraClassPhone');
    if (extraPhoneEl) extraPhoneEl.value = '';
    document.getElementById('extraClassPhoto').value = '';
  });

  document.getElementById('btnCancelExtraClass').addEventListener('click', () => {
    document.getElementById('extraClassFormBox').hidden = true;
  });

  document.getElementById('extraClassPhoto').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      tempExtraClassPhotoDataUrl = await compressImageFile(file, 300, 0.8);
    }
  });

  document.getElementById('btnSaveExtraClass').addEventListener('click', () => {
    const name = document.getElementById('extraClassName').value.trim();
    const time = document.getElementById('extraClassTime').value.trim();
    const teacherName = document.getElementById('extraClassTeacher').value.trim();
    const phoneEl = document.getElementById('extraClassPhone');
    const phone = phoneEl ? phoneEl.value.trim() : '';
    if (!name) {
      showToast('⚠️ Vui lòng nhập tên môn hoặc hoạt động!');
      return;
    }
    if (!state.records[selectedDateStr]) {
      state.records[selectedDateStr] = { status: 'none', note: '', extraClasses: [] };
    }
    if (!Array.isArray(state.records[selectedDateStr].extraClasses)) {
      state.records[selectedDateStr].extraClasses = [];
    }
    state.records[selectedDateStr].extraClasses.push({
      name,
      time: time || 'Trong ngày',
      teacherName: teacherName || 'Giáo viên',
      phone,
      teacherPhoto: tempExtraClassPhotoDataUrl
    });
    saveState();
    document.getElementById('extraClassFormBox').hidden = true;
    renderModalDayClasses(selectedDateStr);
    renderAll();
    showToast('📚 Đã thêm buổi học riêng cho ngày này!');
  });

  // Tab 2: Weekday Filter Bar
  document.querySelectorAll('#weekdayFilterBar .day-filter-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#weekdayFilterBar .day-filter-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      activeWeekdayFilter = pill.getAttribute('data-day');
      renderWeeklyTimetableOverview();
    });
  });

  // Tab 2: Subject Modal Open / Save / Delete
  const subjectDialog = document.getElementById('subjectDialog');
  document.getElementById('btnOpenAddSubject').addEventListener('click', () => openSubjectModal(null));
  document.getElementById('btnCloseSubjectModal').addEventListener('click', () => subjectDialog.close());
  document.getElementById('btnAddScheduleSlot').addEventListener('click', () => appendScheduleSlotRow(3, '07:00', '08:00'));

  document.getElementById('subjectTeacherPhotoInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      tempSubjectPhotoDataUrl = await compressImageFile(file, 320, 0.82);
      document.getElementById('subjectTeacherPreview').src = tempSubjectPhotoDataUrl;
    }
  });

  const btnClearEndDate = document.getElementById('btnClearSubjectEndDate');
  if (btnClearEndDate) {
    btnClearEndDate.addEventListener('click', () => {
      const endDateInput = document.getElementById('subjectEndDateInput');
      if (endDateInput) endDateInput.value = '';
    });
  }

  document.getElementById('subjectForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('subjectIdInput').value;
    const name = document.getElementById('subjectNameInput').value.trim();
    const teacherName = document.getElementById('subjectTeacherNameInput').value.trim();
    const phoneInput = document.getElementById('subjectPhoneInput');
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const startDateInput = document.getElementById('subjectStartDateInput');
    const endDateInput = document.getElementById('subjectEndDateInput');
    const startDate = startDateInput ? startDateInput.value : '';
    const endDate = endDateInput ? endDateInput.value : '';
    const color = document.getElementById('subjectColorInput').value;

    if (startDate && endDate && endDate < startDate) {
      showToast('⚠️ Ngày kết thúc không được nhỏ hơn ngày bắt đầu!');
      return;
    }

    const schedules = [];
    document.querySelectorAll('#scheduleSlotsContainer .schedule-slot-row').forEach((row) => {
      const dayOfWeek = Number(row.querySelector('.slot-day-select').value);
      const startTime = row.querySelector('.slot-start-input').value || '07:00';
      const endTime = row.querySelector('.slot-end-input').value || '08:00';
      schedules.push({ dayOfWeek, startTime, endTime });
    });

    if (schedules.length === 0) {
      showToast('⚠️ Vui lòng thêm ít nhất 1 khung giờ học trong tuần!');
      return;
    }

    if (id) {
      const idx = state.subjects.findIndex((s) => s.id === id);
      if (idx !== -1) {
        state.subjects[idx] = {
          ...state.subjects[idx],
          name,
          teacherName,
          phone,
          startDate,
          endDate,
          color,
          teacherPhoto: tempSubjectPhotoDataUrl,
          schedules
        };
      }
    } else {
      state.subjects.push({
        id: 'subj-' + Date.now(),
        name,
        teacherName,
        phone,
        startDate,
        endDate,
        color,
        teacherPhoto: tempSubjectPhotoDataUrl,
        schedules
      });
    }

    saveState();
    renderAll();
    subjectDialog.close();
    showToast('✅ Đã lưu lịch môn học!');
  });

  document.getElementById('btnDeleteSubject').addEventListener('click', () => {
    const id = document.getElementById('subjectIdInput').value;
    if (!id) return;
    state.subjects = state.subjects.filter((s) => s.id !== id);
    saveState();
    renderAll();
    subjectDialog.close();
    showToast('🗑️ Đã xóa môn học');
  });

  // Tab 3: Stats Date Range & Presets
  document.querySelectorAll('#statsPresetGroup .preset-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#statsPresetGroup .preset-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      setStatsDatePreset(chip.getAttribute('data-preset'));
    });
  });

  document.getElementById('statsStartDate').addEventListener('change', () => {
    document.querySelectorAll('#statsPresetGroup .preset-chip').forEach((c) => c.classList.remove('active'));
    renderStats();
  });

  document.getElementById('statsEndDate').addEventListener('change', () => {
    document.querySelectorAll('#statsPresetGroup .preset-chip').forEach((c) => c.classList.remove('active'));
    renderStats();
  });

  // Tab 4: Settings & Real Child / Teacher Photos Upload
  document.getElementById('inputChildPhoto').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      state.childPhoto = await compressImageFile(file, 380, 0.85);
      saveState();
      renderAll();
      showToast('👧 Đã cập nhật ảnh khuôn mặt của bé!');
    }
  });

  document.getElementById('btnResetChildPhoto').addEventListener('click', () => {
    state.childPhoto = '';
    saveState();
    renderAll();
    showToast('Đã khôi phục hình bé mặc định');
  });

  document.getElementById('inputHappyPhoto').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      state.teacherPhotos.happy = await compressTeacherMoodFile(file, 'happy', 380, 0.88);
      saveState();
      renderAll();
      showToast('😊 Đã cập nhật ảnh Thầy/Cô Cười (viền xanh lá)!');
    }
  });

  document.getElementById('inputSadPhoto').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      state.teacherPhotos.sad = await compressTeacherMoodFile(file, 'sad', 380, 0.88);
      saveState();
      renderAll();
      showToast('😢 Đã cập nhật ảnh Thầy/Cô Mếu (viền đỏ)!');
    }
  });

  document.getElementById('btnResetHappyPhoto').addEventListener('click', () => {
    state.teacherPhotos.happy = '';
    saveState();
    renderAll();
    showToast('Đã khôi phục hình Thầy/Cô cười mặc định');
  });

  document.getElementById('btnResetSadPhoto').addEventListener('click', () => {
    state.teacherPhotos.sad = '';
    saveState();
    renderAll();
    showToast('Đã khôi phục hình Thầy/Cô mếu mặc định');
  });

  document.getElementById('inputChildName').addEventListener('input', (e) => {
    state.childName = e.target.value || 'Sushi';
    saveState();
    renderHeader();
  });

  document.getElementById('inputSchoolName').addEventListener('input', (e) => {
    state.schoolName = e.target.value;
    saveState();
    renderHeader();
    renderQuickActionCard();
    renderMainSchoolContactCard();
  });

  document.getElementById('inputSchoolPhone').addEventListener('input', (e) => {
    state.schoolPhone = e.target.value;
    saveState();
    renderHeader();
    renderQuickActionCard();
    renderMainSchoolContactCard();
  });

  // Backup Export & Import
  document.getElementById('btnExportData').addEventListener('click', () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sushi-di-hoc-backup-${todayStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('⬇️ Đã tải xuống file sao lưu!');
  });

  document.getElementById('inputImportData').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (imported && typeof imported === 'object') {
          state = {
            ...state,
            ...imported
          };
          saveState();
          renderAll();
          showToast('✅ Đã khôi phục dữ liệu thành công!');
        }
      } catch (err) {
        showToast('⚠️ File sao lưu không hợp lệ!');
      }
    };
    reader.readAsText(file);
  });

  // Light-dismiss polyfill for <dialog closedby="any"> on older iOS Safari versions
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    const isOutsideDialog = (e, dialog) => {
      const content = dialog.querySelector('.sheet-content');
      if (!content) return false;
      const r = content.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    document.querySelectorAll('dialog[closedby="any"]').forEach((dialog) => {
      let pressedOutside = false;
      dialog.addEventListener('pointerdown', (e) => {
        pressedOutside = isOutsideDialog(e, dialog);
      });
      dialog.addEventListener('pointerup', (e) => {
        if (pressedOutside && isOutsideDialog(e, dialog)) {
          dialog.close();
        }
      });
    });
  }
}

// ==========================================
// OFFLINE STATUS INDICATOR MONITOR
// ==========================================
function initOfflineStatusMonitor() {
  const badge = document.getElementById('offlineStatusBadge');
  if (!badge) return;

  const setOfflineUI = (isOffline) => {
    badge.hidden = !isOffline;
  };

  const checkConnection = async () => {
    if (!navigator.onLine) {
      setOfflineUI(true);
      return;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      await fetch('./manifest.json?_ping=' + Date.now(), {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      setOfflineUI(false);
    } catch {
      setOfflineUI(true);
    }
  };

  window.addEventListener('online', () => checkConnection());
  window.addEventListener('offline', () => setOfflineUI(true));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkConnection();
    }
  });

  checkConnection();
  setInterval(checkConnection, 15000);
}

// Register Service Worker for offline PWA use on iPhone
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// Bootstrap Application
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initEventListeners();
  initOfflineStatusMonitor();
  setStatsDatePreset('this_month');
  renderAll();
});
