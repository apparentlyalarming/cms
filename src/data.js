export const studentData = {
  name: "Arjun Mehta",
  rollNo: "CS2024001",
  department: "Computer Science",
  semester: 4,
  gpa: 8.74,
  totalCredits: 142,
  email: "arjun.mehta@campus.edu",
  avatar: "AM",
};

export const facultyData = {
  name: "Dr. Priya Sharma",
  employeeId: "FAC2019042",
  department: "Computer Science",
  designation: "Associate Professor",
  coursesTeaching: 3,
  totalStudents: 156,
  email: "priya.sharma@campus.edu",
  avatar: "PS",
};

export const attendanceData = {
  subjects: [
    { name: "Data Structures", code: "CS301", attended: 38, total: 42, color: "#6366f1" },
    { name: "Operating Systems", code: "CS302", attended: 35, total: 40, color: "#8b5cf6" },
    { name: "Database Systems", code: "CS303", attended: 30, total: 38, color: "#a78bfa" },
    { name: "Computer Networks", code: "CS304", attended: 40, total: 42, color: "#22c55e" },
    { name: "Software Engineering", code: "CS305", attended: 33, total: 38, color: "#f59e0b" },
  ],
  overallPercentage: 88.5,
  totalAttended: 176,
  totalClasses: 200,
};

export const timetableData = {
  days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  periods: [
    { time: "09:00 - 09:50", label: "Period 1" },
    { time: "10:00 - 10:50", label: "Period 2" },
    { time: "11:00 - 11:50", label: "Period 3" },
    { time: "12:00 - 12:50", label: "Period 4" },
    { time: "14:00 - 14:50", label: "Period 5" },
    { time: "15:00 - 15:50", label: "Period 6" },
  ],
  schedule: {
    Monday: [
      { subject: "Data Structures", code: "CS301", room: "A-301", type: "lecture" },
      { subject: "Database Systems", code: "CS303", room: "B-201", type: "lecture" },
      { subject: "Data Structures Lab", code: "CS301L", room: "C-102", type: "lab" },
      null,
      { subject: "Operating Systems", code: "CS302", room: "A-301", type: "lecture" },
      null,
    ],
    Tuesday: [
      { subject: "Computer Networks", code: "CS304", room: "D-401", type: "lecture" },
      { subject: "Software Engineering", code: "CS305", room: "A-201", type: "lecture" },
      null,
      { subject: "Operating Systems Lab", code: "CS302L", room: "C-103", type: "lab" },
      { subject: "Data Structures", code: "CS301", room: "A-301", type: "tutorial" },
      null,
    ],
    Wednesday: [
      { subject: "Database Systems", code: "CS303", room: "B-201", type: "lecture" },
      null,
      { subject: "Computer Networks", code: "CS304", room: "D-401", type: "lecture" },
      { subject: "Software Engineering", code: "CS305", room: "A-201", type: "tutorial" },
      null,
      { subject: "Database Systems Lab", code: "CS303L", room: "C-101", type: "lab" },
    ],
    Thursday: [
      { subject: "Operating Systems", code: "CS302", room: "A-301", type: "lecture" },
      { subject: "Data Structures", code: "CS301", room: "A-301", type: "lecture" },
      { subject: "Software Engineering", code: "CS305", room: "A-201", type: "lecture" },
      null,
      { subject: "Computer Networks Lab", code: "CS304L", room: "C-104", type: "lab" },
      null,
    ],
    Friday: [
      null,
      { subject: "Data Structures", code: "CS301", room: "A-301", type: "tutorial" },
      { subject: "Operating Systems", code: "CS302", room: "A-301", type: "tutorial" },
      { subject: "Computer Networks", code: "CS304", room: "D-401", type: "lecture" },
      { subject: "Software Engineering", code: "CS305", room: "A-201", type: "lecture" },
      null,
    ],
  },
};

export const feeData = {
  totalFee: 125000,
  paid: 100000,
  due: 25000,
  dueDate: "2026-08-15",
  breakdown: [
    { item: "Tuition Fee", amount: 80000, paid: true },
    { item: "Hostel Fee", amount: 25000, paid: true },
    { item: "Lab Fee", amount: 10000, paid: true },
    { item: "Library Fee", amount: 5000, paid: false },
    { item: "Exam Fee", amount: 5000, paid: false },
  ],
  history: [
    { date: "2026-01-10", amount: 40000, ref: "PAY-2026-001", status: "paid" },
    { date: "2026-03-15", amount: 35000, ref: "PAY-2026-002", status: "paid" },
    { date: "2026-05-20", amount: 25000, ref: "PAY-2026-003", status: "paid" },
  ],
};

export const hostelData = {
  roomNumber: "B-204",
  block: "Block B - Phoenix",
  roomType: "Double Sharing",
  warden: "Dr. Ramesh Nair",
  messTimings: "Breakfast: 7:30-9:00 | Lunch: 12:00-13:30 | Dinner: 19:00-20:30",
  passRequests: [
    { id: 1, type: "Night Out", date: "2026-07-30", status: "pending" },
    { id: 2, type: "Home Leave", date: "2026-08-05", status: "approved" },
    { id: 3, type: "Late Entry", date: "2026-07-20", status: "approved" },
  ],
  amenities: ["Wi-Fi", "Laundry", "Common Room", "Gym", "Study Hall"],
};

export const eventsData = [
  {
    id: 1,
    title: "TechFest 2026: Hackathon",
    description: "36-hour hackathon with teams competing to build innovative solutions for campus problems.",
    date: "2026-08-10",
    time: "09:00 AM",
    venue: "Main Auditorium",
    category: "Technical",
    registered: true,
    seats: 200,
    filled: 148,
  },
  {
    id: 2,
    title: "Annual Cultural Fest",
    description: "Three days of music, dance, drama and art. Headliners include Prateek Kuhad and Divine.",
    date: "2026-09-15",
    time: "04:00 PM",
    venue: "Open Air Theatre",
    category: "Cultural",
    registered: false,
    seats: 1500,
    filled: 892,
  },
  {
    id: 3,
    title: "Industry Connect: FAANG Panel",
    description: "Alumni working at top tech companies share their journey and hiring insights.",
    date: "2026-08-02",
    time: "11:00 AM",
    venue: "Seminar Hall B",
    category: "Workshop",
    registered: false,
    seats: 100,
    filled: 76,
  },
  {
    id: 4,
    title: "Sports Week: Cricket Tournament",
    description: "Inter-department cricket tournament. Register your team of 11 players.",
    date: "2026-08-20",
    time: "07:00 AM",
    venue: "Sports Ground",
    category: "Sports",
    registered: false,
    seats: 64,
    filled: 48,
  },
  {
    id: 5,
    title: "AI/ML Workshop Series",
    description: "Hands-on workshop covering neural networks, transformers, and deploying models.",
    date: "2026-08-05",
    time: "02:00 PM",
    venue: "Lab C-101",
    category: "Workshop",
    registered: true,
    seats: 40,
    filled: 40,
  },
];

export const circularsData = [
  {
    id: 1,
    title: "Mid-Semester Exam Schedule Released",
    body: "The mid-semester examination schedule for all departments has been published. Exams begin from August 12, 2026. Students are advised to check their individual timetables on the portal.",
    date: "2026-07-20",
    priority: "high",
    category: "Academic",
    attachment: "exam_schedule.pdf",
  },
  {
    id: 2,
    title: "Hostel Mess Menu Update",
    body: "The mess committee has revised the weekly menu following student feedback. New menu includes more continental options on weekends and a dedicated Jain food counter.",
    date: "2026-07-18",
    priority: "low",
    category: "Hostel",
    attachment: null,
  },
  {
    id: 3,
    title: "Campus Placement Drive - TCS",
    body: "TCS will be conducting a campus placement drive for final year students on August 25, 2026. Eligible students must register on the placement portal by August 15.",
    date: "2026-07-15",
    priority: "high",
    category: "Placement",
    attachment: "tcs_job_description.pdf",
  },
  {
    id: 4,
    title: "Library Extended Hours During Exams",
    body: "The central library will remain open until midnight from August 10 to August 25 to support exam preparation. Book borrowing limits have also been increased.",
    date: "2026-07-12",
    priority: "medium",
    category: "General",
    attachment: null,
  },
  {
    id: 5,
    title: "Annual Sports Day Registration Open",
    body: "All students are encouraged to participate in the Annual Sports Day on September 5, 2026. Registration is open for individual and team events.",
    date: "2026-07-10",
    priority: "low",
    category: "Sports",
    attachment: "sports_registration.pdf",
  },
  {
    id: 6,
    title: "Anti-Ragging Committee Meeting",
    body: "Mandatory attendance for all first-year student representatives at the anti-ragging awareness session on August 1, 2026 at 3:00 PM in Seminar Hall A.",
    date: "2026-07-08",
    priority: "medium",
    category: "General",
    attachment: null,
  },
];

export const performanceData = {
  subjects: [
    {
      name: "Data Structures",
      quizzes: [85, 90, 78, 88],
      assignments: [92, 85, 88, 95, 80],
      midsem: 76,
    },
    {
      name: "Operating Systems",
      quizzes: [72, 80, 85, 70],
      assignments: [78, 82, 75, 88, 70],
      midsem: 68,
    },
    {
      name: "Database Systems",
      quizzes: [90, 88, 92, 85],
      assignments: [95, 90, 88, 92, 85],
      midsem: 82,
    },
    {
      name: "Computer Networks",
      quizzes: [80, 75, 88, 82],
      assignments: [85, 78, 90, 82, 75],
      midsem: 74,
    },
    {
      name: "Software Engineering",
      quizzes: [78, 82, 75, 80],
      assignments: [80, 85, 78, 82, 76],
      midsem: 70,
    },
  ],
};

export const chatbotFAQ = [
  { q: "When are mid-sem exams?", a: "Mid-semester exams begin on August 12, 2026. Check the exam schedule circular for your individual timetable." },
  { q: "How do I pay fees?", a: "Fees can be paid through the student portal under Fee Status > Pay Now, or via the college banking portal. UPI, net banking, and card payments are accepted." },
  { q: "What's the attendance requirement?", a: "A minimum of 75% attendance is required in each subject to be eligible for end-semester examinations. Falling below this may result in detention." },
  { q: "Hostel leave procedure?", a: "Submit a leave/pass request through the Hostel Management section. Night outs require warden approval 24 hours in advance. Home leave needs HOD and warden approval." },
  { q: "When does placement start?", a: "Placement season begins in August for final-year students. TCS is the first company visiting on August 25, 2026. Register on the placement portal." },
  { q: "Library timings?", a: "The library is open 8:00 AM - 8:00 PM on regular days, and extended to midnight during exam periods (Aug 10 - Aug 25)." },
  { q: "How to reset portal password?", a: "Click 'Forgot Password' on the login page and use your registered email. If issues persist, contact IT support at helpdesk@campus.edu." },
  { q: "Mess menu changes?", a: "The updated mess menu is available in the Circulars section. New continental options on weekends and a Jain food counter have been added." },
];
