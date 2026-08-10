import {
  User,
  Subject,
  Note,
  DocumentItem,
  Assignment,
  StudySchedule,
  Quiz,
  FlashcardDeck,
  AppNotification,
  PomodoroSession,
  DailyStudyLog,
  TopicNode,
  TopicEdge,
  GroupStudySession,
  AIChatSession,
  AIChatMessage,
  RoadmapBadge,
} from "../types";

// Keys for local storage
const KEYS = {
  USER: "studymate_user",
  SUBJECTS: "studymate_subjects",
  NOTES: "studymate_notes",
  DOCUMENTS: "studymate_documents",
  ASSIGNMENTS: "studymate_assignments",
  SCHEDULES: "studymate_schedules",
  QUIZZES: "studymate_quizzes",
  FLASHCARD_DECKS: "studymate_flashcards",
  NOTIFICATIONS: "studymate_notifications",
  POMODORO_SESSIONS: "studymate_pomodoro",
  STUDY_LOGS: "studymate_logs",
  GROUP_SESSIONS: "studymate_group_sessions",
  TOPIC_NODES: "studymate_topic_nodes",
  TOPIC_EDGES: "studymate_topic_edges",
  CHAT_SESSIONS: "studymate_chat_sessions",
  ROADMAP_BADGES: "studymate_roadmap_badges",
  THEME: "studymate_theme",
  STREAK: "studymate_streak",
};

// Default User
export const DEFAULT_USER: User = {
  id: "u_student_1",
  name: "Alex Rivera",
  email: "alex.rivera@university.edu",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
  gradeLevel: "Undergraduate Junior",
  major: "Computer Science & Data Science",
  createdDate: new Date().toISOString(),
  dailyGoalHours: 3.0,
  notificationSound: true,
  reminderFrequency: "15m",
  quietHoursStart: "23:00",
  quietHoursEnd: "07:00",
  themePreference: "system",
};

// Default Subjects
export const DEFAULT_SUBJECTS: Subject[] = [
  { id: "s_cs101", name: "Computer Networks", color: "bg-blue-500 text-white", icon: "Network", description: "TCP/IP, OSI Layers, Routing Protocols, Routing Algorithms" },
  { id: "s_db202", name: "Database Systems", color: "bg-emerald-500 text-white", icon: "Database", description: "Relational Algebra, SQL Queries, Normalization, Transactions" },
  { id: "s_math301", name: "Calculus & Linear Algebra", color: "bg-purple-500 text-white", icon: "Calculator", description: "Eigenvectors, Differential Equations, Matrix Decompositions" },
  { id: "s_chem", name: "Organic Chemistry", color: "bg-amber-500 text-white", icon: "FlaskConical", description: "Reaction Mechanisms, Functional Groups, Spectroscopy" },
  { id: "s_hist", name: "Modern History", color: "bg-rose-500 text-white", icon: "BookOpen", description: "Industrial Revolution, Global Geopolitics, 20th Century Dynamics" },
];

// Default Initial Notes
export const DEFAULT_NOTES: Note[] = [
  {
    id: "n_1",
    userId: "u_student_1",
    subjectId: "s_cs101",
    title: "TCP 3-Way Handshake & Connection Teardown",
    content: `# TCP 3-Way Handshake
1. **SYN**: Client sends segment with SYN flag set and initial sequence number $ISN_c$.
2. **SYN-ACK**: Server responds with SYN and ACK flags set, acknowledging $ISN_c + 1$ and providing server sequence number $ISN_s$.
3. **ACK**: Client sends ACK segment acknowledging $ISN_s + 1$.

*Key Concept:* Ensures full-duplex connection reliability before payload byte transfer.`,
    isPinned: true,
    tags: ["TCP", "Handshake", "Networking", "Exam Prep"],
    createdDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedDate: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "n_2",
    userId: "u_student_1",
    subjectId: "s_db202",
    title: "ACID Properties in Transactions",
    content: `### ACID Principles:
- **Atomicity**: All operations execute successfully, or the entire transaction aborts.
- **Consistency**: Database state moves from one valid state to another.
- **Isolation**: Concurrent transactions execute as if sequential.
- **Durability**: Committed data persists even in hardware crash.`,
    isPinned: true,
    tags: ["SQL", "Transactions", "ACID", "Database"],
    createdDate: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedDate: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
];

// Default Initial Assignments
export const DEFAULT_ASSIGNMENTS: Assignment[] = [
  {
    id: "a_1",
    userId: "u_student_1",
    subjectId: "s_db202",
    title: "Database Relational Algebra & SQL Query Optimization",
    description: "Write optimized queries for 10 relational problems using JOINs, Subqueries, and Indexing.",
    dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0], // Tomorrow
    priority: "High",
    status: "In Progress",
  },
  {
    id: "a_2",
    userId: "u_student_1",
    subjectId: "s_cs101",
    title: "Wireshark Packet Analysis Lab Report",
    description: "Analyze pcap files for DNS resolution and TLS 1.3 key exchange handshakes.",
    dueDate: new Date(Date.now() + 86400000 * 4).toISOString().split("T")[0], // 4 days away
    priority: "Medium",
    status: "To Do",
  },
  {
    id: "a_3",
    userId: "u_student_1",
    subjectId: "s_math301",
    title: "Linear Algebra Problem Set 5: SVD Decomposition",
    description: "Solve singular value decomposition matrices and Applications to PCA.",
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0], // 7 days away
    priority: "High",
    status: "To Do",
  },
];

// Default Study Schedules
export const DEFAULT_SCHEDULES: StudySchedule[] = [
  {
    id: "sch_1",
    userId: "u_student_1",
    subjectId: "s_cs101",
    title: "Computer Networks Routing Algorithms Review",
    date: new Date().toISOString().split("T")[0],
    startTime: "16:00",
    endTime: "17:30",
    isCompleted: false,
    type: "session",
  },
  {
    id: "sch_2",
    userId: "u_student_1",
    subjectId: "s_db202",
    title: "SQL Indexing & B-Tree Practice",
    date: new Date().toISOString().split("T")[0],
    startTime: "18:30",
    endTime: "19:30",
    isCompleted: false,
    type: "revision",
  },
];

// Default Notifications
export const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif_1",
    userId: "u_student_1",
    title: "Upcoming Assignment Due",
    message: "Your Database Relational Algebra assignment is due tomorrow!",
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
    type: "assignment",
    isRead: false,
  },
  {
    id: "notif_2",
    userId: "u_student_1",
    title: "Study Session Reminder",
    message: "Your Computer Networks Routing Algorithms study session starts in 15 minutes.",
    date: new Date(Date.now() - 3600000 * 5).toISOString(),
    type: "session",
    isRead: true,
  },
  {
    id: "notif_3",
    userId: "u_student_1",
    title: "Daily Focus Goal Met!",
    message: "Awesome job! You've logged 2.5 hours of focus today.",
    date: new Date(Date.now() - 86400000).toISOString(),
    type: "daily_revision",
    isRead: true,
  },
];

// Default Flashcard Decks
export const DEFAULT_FLASHCARDS: FlashcardDeck[] = [
  {
    id: "deck_1",
    userId: "u_student_1",
    subjectId: "s_cs101",
    title: "OSI Layer 7 Models & Protocols",
    description: "Key concepts across Application, Transport, Network, Data Link, and Physical layers.",
    totalCards: 5,
    lastStudied: new Date(Date.now() - 86400000).toISOString(),
    cards: [
      { id: "fc_1", front: "Which layer of the OSI model does TCP operate on?", back: "Layer 4: Transport Layer", rating: "easy" },
      { id: "fc_2", front: "What is the difference between TCP and UDP?", back: "TCP is connection-oriented, reliable, and guarantees packet order. UDP is connectionless, fast, and does not guarantee delivery order.", rating: "medium" },
      { id: "fc_3", front: "What port does HTTPS operate on by default?", back: "Port 443 (HTTP runs on Port 80)", rating: "easy" },
      { id: "fc_4", front: "Explain CSMA/CD in Ethernet.", back: "Carrier Sense Multiple Access with Collision Detection. Nodes listen before transmitting and detect collisions to retransmit after backoff.", rating: "hard" },
      { id: "fc_5", front: "What is the purpose of BGP (Border Gateway Protocol)?", back: "Inter-autonomous system (AS) routing protocol used to exchange routing information between major internet service providers.", rating: "medium" },
    ],
  },
];

// Default Documents & Quizzes Defaults
export const DEFAULT_DOCUMENTS: DocumentItem[] = [];
export const DEFAULT_QUIZZES: Quiz[] = [];
export const DEFAULT_DECKS: FlashcardDeck[] = DEFAULT_FLASHCARDS;
export const DEFAULT_SESSIONS: PomodoroSession[] = [];

export const DEFAULT_GROUP_SESSIONS: GroupStudySession[] = [
  {
    id: "group_cs101_sync",
    code: "CS101-SYNC",
    title: "Computer Networks TCP/IP Group Study & Problem Solving",
    subjectId: "s_cs101",
    subjectName: "Computer Networks",
    description: "Collaborative focus room reviewing TCP 3-way handshake, OSI layers, and subnetting calculations.",
    hostId: "u_sarah",
    hostName: "Sarah Chen",
    hostAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    roomType: "pomodoro",
    maxParticipants: 8,
    currentParticipants: [
      {
        id: "u_sarah",
        name: "Sarah Chen",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
        role: "host",
        status: "studying",
        isMuted: false,
        joinedAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "u_marcus",
        name: "Marcus Vance",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        role: "member",
        status: "studying",
        isMuted: true,
        joinedAt: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: "u_elena",
        name: "Elena Rostova",
        avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
        role: "member",
        status: "online",
        isMuted: false,
        joinedAt: new Date(Date.now() - 900000).toISOString(),
      },
    ],
    isLive: true,
    createdDate: new Date(Date.now() - 3600000).toISOString(),
    sharedNotesPad: `# Computer Networks Study Notes
- TCP Handshake: SYN -> SYN-ACK -> ACK
- Subnetting tip: /24 gives 254 usable host addresses.
- Key port numbers: HTTP 80, HTTPS 443, DNS 53, SSH 22.`,
    timerState: {
      isRunning: true,
      mode: "focus",
      secondsLeft: 1240,
    },
    chatMessages: [
      {
        id: "m_1",
        senderId: "u_sarah",
        senderName: "Sarah Chen",
        senderAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
        text: "Welcome everyone! Let's focus on subnetting formulas during this 25m Pomodoro block.",
        timestamp: "10:15 AM",
        type: "chat",
      },
      {
        id: "m_2",
        senderId: "u_marcus",
        senderName: "Marcus Vance",
        senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        text: "Sounds great! I posted the subnetting cheatsheet in the shared note pad.",
        timestamp: "10:16 AM",
        type: "chat",
      },
      {
        id: "m_3",
        senderId: "system",
        senderName: "StudyMate Bot",
        text: "25-Minute Group Focus Timer started by Sarah Chen.",
        timestamp: "10:18 AM",
        type: "timer_alert",
      },
    ],
  },
  {
    id: "group_db202_sql",
    code: "SQL-8920",
    title: "Database Relational Algebra & SQL Query Arena",
    subjectId: "s_db202",
    subjectName: "Database Systems",
    description: "Live group discussion solving complex multi-table JOINs, GROUP BY HAVING queries, and B-Tree indexing.",
    hostId: "u_david",
    hostName: "David Kim",
    hostAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    roomType: "quiz_challenge",
    maxParticipants: 10,
    currentParticipants: [
      {
        id: "u_david",
        name: "David Kim",
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
        role: "host",
        status: "studying",
        isMuted: false,
        joinedAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: "u_maya",
        name: "Maya Patel",
        avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
        role: "member",
        status: "studying",
        isMuted: true,
        joinedAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
    isLive: true,
    createdDate: new Date(Date.now() - 7200000).toISOString(),
    sharedNotesPad: `# Database SQL Practice Notes
SELECT d.dept_name, COUNT(e.emp_id) AS total_staff
FROM departments d
LEFT JOIN employees e ON d.dept_id = e.dept_id
GROUP BY d.dept_name
HAVING COUNT(e.emp_id) > 5;`,
    chatMessages: [
      {
        id: "m_db1",
        senderId: "u_david",
        senderName: "David Kim",
        senderAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
        text: "Hey everyone! Join code is SQL-8920 if you want to share with classmates.",
        timestamp: "09:30 AM",
        type: "chat",
      },
    ],
  },
  {
    id: "group_chem_sprint",
    code: "CHEM-77X",
    title: "Organic Chemistry Mechanism Silent Study Room",
    subjectId: "s_chem",
    subjectName: "Organic Chemistry",
    description: "Silent background focus room for memorizing functional groups and reaction mechanisms.",
    hostId: "u_sam",
    hostName: "Sam Taylor",
    hostAvatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80",
    roomType: "silent_focus",
    maxParticipants: 6,
    currentParticipants: [
      {
        id: "u_sam",
        name: "Sam Taylor",
        avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80",
        role: "host",
        status: "studying",
        isMuted: true,
        joinedAt: new Date(Date.now() - 14400000).toISOString(),
      },
    ],
    isLive: true,
    createdDate: new Date(Date.now() - 14400000).toISOString(),
    sharedNotesPad: `# Organic Chemistry Review
- SN1 vs SN2 Mechanisms
- E1 vs E2 Elimination
- Electrophilic Addition to Alkenes`,
    chatMessages: [],
  },
];

// Default Topic Nodes for Subject Node Maps
export const DEFAULT_TOPIC_NODES: TopicNode[] = [
  // Computer Networks (s_cs101)
  {
    id: "tn_1",
    subjectId: "s_cs101",
    title: "OSI 7-Layer Model",
    description: "Physical, Data Link, Network, Transport, Session, Presentation, Application",
    status: "mastered",
    estimatedHours: 3,
    difficulty: "Beginner",
    x: 120,
    y: 140,
    tags: ["Fundamentals", "OSI", "Networking"],
    notes: "Core framework for understanding network communication protocols.",
    subTopics: [
      { id: "st_1_1", title: "Physical & Data Link Layers (MAC, Framing)", status: "completed" },
      { id: "st_1_2", title: "Network & Transport Layers (IP, TCP/UDP)", status: "completed" },
      { id: "st_1_3", title: "Session, Presentation & Application Layers", status: "completed" },
    ],
  },
  {
    id: "tn_2",
    subjectId: "s_cs101",
    title: "IP Addressing & Subnetting",
    description: "IPv4/IPv6, CIDR Notation, Subnet Masks, Network & Broadcast Addresses",
    status: "mastered",
    estimatedHours: 4,
    difficulty: "Beginner",
    x: 360,
    y: 140,
    tags: ["IP", "Subnetting", "CIDR"],
    notes: "Practice binary conversions and subnet mask calculation.",
    subTopics: [
      { id: "st_2_1", title: "IPv4 Binary to Dotted-Decimal Conversion", status: "completed" },
      { id: "st_2_2", title: "CIDR Prefix Calculations (/24, /28)", status: "completed" },
      { id: "st_2_3", title: "Subnetting Practice Problems", status: "completed" },
    ],
  },
  {
    id: "tn_3",
    subjectId: "s_cs101",
    title: "TCP 3-Way Handshake",
    description: "SYN, SYN-ACK, ACK seq & ack numbers and connection teardown (FIN)",
    status: "in_progress",
    estimatedHours: 3,
    difficulty: "Intermediate",
    x: 600,
    y: 80,
    tags: ["TCP", "Transport Layer", "Reliability"],
    notes: "SYN flag -> SYN-ACK -> ACK. Flow control and sliding window.",
    subTopics: [
      { id: "st_3_1", title: "SYN, SYN-ACK, and ACK Sequence Numbers", status: "completed" },
      { id: "st_3_2", title: "TCP Sliding Window & Flow Control", status: "in_progress" },
      { id: "st_3_3", title: "Connection Teardown (FIN/ACK Wave)", status: "not_started" },
    ],
  },
  {
    id: "tn_4",
    subjectId: "s_cs101",
    title: "UDP Socket Programming",
    description: "Connectionless datagram sockets, low latency streaming, multiplexing",
    status: "mastered",
    estimatedHours: 2,
    difficulty: "Intermediate",
    x: 600,
    y: 240,
    tags: ["UDP", "Sockets", "Streaming"],
    subTopics: [
      { id: "st_4_1", title: "Datagram Socket Initialization in Python/C", status: "completed" },
      { id: "st_4_2", title: "UDP Packet Header Analysis", status: "completed" },
    ],
  },
  {
    id: "tn_5",
    subjectId: "s_cs101",
    title: "BGP & OSPF Routing",
    description: "Border Gateway Protocol, Open Shortest Path First, Dijkstra link-state",
    status: "not_started",
    estimatedHours: 5,
    difficulty: "Advanced",
    x: 840,
    y: 140,
    tags: ["Routing", "BGP", "Network Layer"],
    subTopics: [
      { id: "st_5_1", title: "Interior Gateway vs Exterior Gateway Protocols", status: "not_started" },
      { id: "st_5_2", title: "Dijkstra's Link-State Algorithm in OSPF", status: "not_started" },
      { id: "st_5_3", title: "Path Vector Routing & BGP Autonomous Systems", status: "not_started" },
    ],
  },
  {
    id: "tn_6",
    subjectId: "s_cs101",
    title: "DNS & HTTP/3 Protocol",
    description: "Domain Name System resolution hierarchy, QUIC over UDP, HTTP/3 multiplexing",
    status: "in_progress",
    estimatedHours: 3,
    difficulty: "Intermediate",
    x: 360,
    y: 320,
    tags: ["DNS", "HTTP3", "Application Layer"],
    subTopics: [
      { id: "st_6_1", title: "DNS Recursive & Iterative Resolution", status: "completed" },
      { id: "st_6_2", title: "HTTP/1.1 vs HTTP/2 Multiplexing", status: "in_progress" },
      { id: "st_6_3", title: "HTTP/3 over QUIC UDP Transport", status: "not_started" },
    ],
  },

  // Database Systems (s_db202)
  {
    id: "tn_db_1",
    subjectId: "s_db202",
    title: "Relational Algebra",
    description: "Selection, Projection, Cartesian Product, Join, Union & Difference",
    status: "mastered",
    estimatedHours: 3,
    difficulty: "Beginner",
    x: 120,
    y: 120,
    tags: ["Theory", "Math", "Relational"],
    subTopics: [
      { id: "st_db1_1", title: "Selection (σ) and Projection (π) Operators", status: "completed" },
      { id: "st_db1_2", title: "Cartesian Product & Theta Joins", status: "completed" },
    ],
  },
  {
    id: "tn_db_2",
    subjectId: "s_db202",
    title: "SQL Queries & Aggregations",
    description: "SELECT, GROUP BY, HAVING, INNER/OUTER JOINs, Subqueries & CTEs",
    status: "mastered",
    estimatedHours: 5,
    difficulty: "Beginner",
    x: 360,
    y: 120,
    tags: ["SQL", "Queries"],
    subTopics: [
      { id: "st_db2_1", title: "JOIN Syntax (INNER, LEFT, RIGHT, FULL)", status: "completed" },
      { id: "st_db2_2", title: "GROUP BY, HAVING & Aggregation Functions", status: "completed" },
      { id: "st_db2_3", title: "Common Table Expressions (WITH CTE)", status: "completed" },
    ],
  },
  {
    id: "tn_db_3",
    subjectId: "s_db202",
    title: "Normal Forms (1NF to BCNF)",
    description: "Functional dependencies, candidate keys, anomaly elimination",
    status: "in_progress",
    estimatedHours: 4,
    difficulty: "Intermediate",
    x: 600,
    y: 80,
    tags: ["Normalization", "BCNF", "Database Design"],
    subTopics: [
      { id: "st_db3_1", title: "1NF & 2NF Functional Dependency Closures", status: "completed" },
      { id: "st_db3_2", title: "3NF & Boyce-Codd Normal Form (BCNF)", status: "in_progress" },
      { id: "st_db3_3", title: "Lossless Join & Dependency Preservation", status: "not_started" },
    ],
  },
  {
    id: "tn_db_4",
    subjectId: "s_db202",
    title: "B+ Tree Indexing",
    description: "Clustered vs Non-Clustered indexes, Range queries, Search trees",
    status: "in_progress",
    estimatedHours: 4,
    difficulty: "Intermediate",
    x: 600,
    y: 240,
    tags: ["Indexing", "B-Tree", "Performance"],
    subTopics: [
      { id: "st_db4_1", title: "B+ Tree Node Splitting & Insertion", status: "completed" },
      { id: "st_db4_2", title: "Clustered vs Secondary Indexes", status: "in_progress" },
    ],
  },
  {
    id: "tn_db_5",
    subjectId: "s_db202",
    title: "ACID & Concurrency Control",
    description: "Transactions, Two-Phase Locking (2PL), Deadlocks, Write-Ahead Logging",
    status: "not_started",
    estimatedHours: 6,
    difficulty: "Advanced",
    x: 840,
    y: 160,
    tags: ["ACID", "Transactions", "Locks"],
    subTopics: [
      { id: "st_db5_1", title: "Atomicity, Consistency, Isolation, Durability", status: "not_started" },
      { id: "st_db5_2", title: "Strict Two-Phase Locking (2PL)", status: "not_started" },
      { id: "st_db5_3", title: "ARIES Recovery & Write-Ahead Logging", status: "not_started" },
    ],
  },

  // Calculus & Linear Algebra (s_math301)
  {
    id: "tn_math_1",
    subjectId: "s_math301",
    title: "Limits & Continuity",
    description: "Epsilon-delta definition, L'Hopital's rule, Squeeze theorem",
    status: "mastered",
    estimatedHours: 3,
    difficulty: "Beginner",
    x: 120,
    y: 140,
    tags: ["Limits", "Calculus"],
    subTopics: [
      { id: "st_m1_1", title: "Epsilon-Delta Limit Proofs", status: "completed" },
      { id: "st_m1_2", title: "L'Hopital's Rule for Indeterminate Forms", status: "completed" },
    ],
  },
  {
    id: "tn_math_2",
    subjectId: "s_math301",
    title: "Derivatives & Chain Rule",
    description: "Product rule, quotient rule, implicit differentiation, optimization",
    status: "mastered",
    estimatedHours: 4,
    difficulty: "Beginner",
    x: 340,
    y: 140,
    tags: ["Derivatives", "Calculus"],
    subTopics: [
      { id: "st_m2_1", title: "Product & Quotient Differentiation Rules", status: "completed" },
      { id: "st_m2_2", title: "Composite Functions & Chain Rule", status: "completed" },
    ],
  },
  {
    id: "tn_math_3",
    subjectId: "s_math301",
    title: "Matrix Transformations",
    description: "Matrix multiplication, rank, nullity, determinants, invertibility",
    status: "mastered",
    estimatedHours: 4,
    difficulty: "Intermediate",
    x: 340,
    y: 300,
    tags: ["Linear Algebra", "Matrices"],
    subTopics: [
      { id: "st_m3_1", title: "Gaussian Elimination & Row Echelon Form", status: "completed" },
      { id: "st_m3_2", title: "Determinants & Invertibility Matrix Theorem", status: "completed" },
    ],
  },
  {
    id: "tn_math_4",
    subjectId: "s_math301",
    title: "Eigenvalues & Eigenvectors",
    description: "Characteristic polynomial, diagonalization, SVD decomposition",
    status: "in_progress",
    estimatedHours: 5,
    difficulty: "Advanced",
    x: 580,
    y: 300,
    tags: ["Linear Algebra", "Eigen"],
    subTopics: [
      { id: "st_m4_1", title: "Finding Characteristic Polynomials det(A - λI)", status: "completed" },
      { id: "st_m4_2", title: "Eigenspaces & Diagonalization", status: "in_progress" },
      { id: "st_m4_3", title: "Singular Value Decomposition (SVD)", status: "not_started" },
    ],
  },
  {
    id: "tn_math_5",
    subjectId: "s_math301",
    title: "Differential Equations",
    description: "First order separable, linear homogeneous ODEs, Laplace transforms",
    status: "not_started",
    estimatedHours: 6,
    difficulty: "Advanced",
    x: 600,
    y: 140,
    tags: ["ODEs", "Calculus"],
    subTopics: [
      { id: "st_m5_1", title: "First-Order Separable Differential Equations", status: "not_started" },
      { id: "st_m5_2", title: "Second-Order Constant Coefficient ODEs", status: "not_started" },
    ],
  },
];

export const DEFAULT_TOPIC_EDGES: TopicEdge[] = [
  // Computer Networks
  { id: "te_1", sourceId: "tn_1", targetId: "tn_2", label: "Prerequisite", type: "prerequisite" },
  { id: "te_2", sourceId: "tn_2", targetId: "tn_3", label: "Leads to", type: "prerequisite" },
  { id: "te_3", sourceId: "tn_2", targetId: "tn_4", label: "Alternative", type: "related" },
  { id: "te_4", sourceId: "tn_3", targetId: "tn_5", label: "Advanced Routing", type: "prerequisite" },
  { id: "te_5", sourceId: "tn_2", targetId: "tn_6", label: "Subtopic", type: "subtopic" },
  { id: "te_6", sourceId: "tn_4", targetId: "tn_6", label: "Transport for QUIC", type: "related" },

  // Database Systems
  { id: "te_db_1", sourceId: "tn_db_1", targetId: "tn_db_2", label: "Prerequisite", type: "prerequisite" },
  { id: "te_db_2", sourceId: "tn_db_2", targetId: "tn_db_3", label: "Schema Optimization", type: "prerequisite" },
  { id: "te_db_3", sourceId: "tn_db_2", targetId: "tn_db_4", label: "Performance Tuning", type: "subtopic" },
  { id: "te_db_4", sourceId: "tn_db_3", targetId: "tn_db_5", label: "Enterprise Scale", type: "prerequisite" },
  { id: "te_db_5", sourceId: "tn_db_4", targetId: "tn_db_5", label: "Locking & Storage", type: "related" },

  // Math
  { id: "te_math_1", sourceId: "tn_math_1", targetId: "tn_math_2", label: "Prerequisite", type: "prerequisite" },
  { id: "te_math_2", sourceId: "tn_math_2", targetId: "tn_math_5", label: "Foundation", type: "prerequisite" },
  { id: "te_math_3", sourceId: "tn_math_3", targetId: "tn_math_4", label: "Eigenspaces", type: "prerequisite" },
];

// Storage Helper Engine
export const storageService = {
  getUser: (): User => {
    const data = localStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : DEFAULT_USER;
  },
  saveUser: (user: User) => {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  },

  getSubjects: (): Subject[] => {
    const data = localStorage.getItem(KEYS.SUBJECTS);
    if (!data) {
      localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(DEFAULT_SUBJECTS));
      return DEFAULT_SUBJECTS;
    }
    return JSON.parse(data);
  },
  saveSubjects: (subjects: Subject[]) => {
    localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(subjects));
  },

  getNotes: (): Note[] => {
    const data = localStorage.getItem(KEYS.NOTES);
    if (!data) {
      localStorage.setItem(KEYS.NOTES, JSON.stringify(DEFAULT_NOTES));
      return DEFAULT_NOTES;
    }
    return JSON.parse(data);
  },
  saveNotes: (notes: Note[]) => {
    localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
  },

  getDocuments: (): DocumentItem[] => {
    const data = localStorage.getItem(KEYS.DOCUMENTS);
    return data ? JSON.parse(data) : [];
  },
  saveDocuments: (docs: DocumentItem[]) => {
    localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(docs));
  },

  getAssignments: (): Assignment[] => {
    const data = localStorage.getItem(KEYS.ASSIGNMENTS);
    if (!data) {
      localStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify(DEFAULT_ASSIGNMENTS));
      return DEFAULT_ASSIGNMENTS;
    }
    return JSON.parse(data);
  },
  saveAssignments: (assignments: Assignment[]) => {
    localStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  },

  getSchedules: (): StudySchedule[] => {
    const data = localStorage.getItem(KEYS.SCHEDULES);
    if (!data) {
      localStorage.setItem(KEYS.SCHEDULES, JSON.stringify(DEFAULT_SCHEDULES));
      return DEFAULT_SCHEDULES;
    }
    return JSON.parse(data);
  },
  saveSchedules: (schedules: StudySchedule[]) => {
    localStorage.setItem(KEYS.SCHEDULES, JSON.stringify(schedules));
  },

  getQuizzes: (): Quiz[] => {
    const data = localStorage.getItem(KEYS.QUIZZES);
    return data ? JSON.parse(data) : [];
  },
  saveQuizzes: (quizzes: Quiz[]) => {
    localStorage.setItem(KEYS.QUIZZES, JSON.stringify(quizzes));
  },

  getFlashcards: (): FlashcardDeck[] => {
    const data = localStorage.getItem(KEYS.FLASHCARD_DECKS);
    if (!data) {
      localStorage.setItem(KEYS.FLASHCARD_DECKS, JSON.stringify(DEFAULT_FLASHCARDS));
      return DEFAULT_FLASHCARDS;
    }
    return JSON.parse(data);
  },
  getDecks: (): FlashcardDeck[] => {
    const data = localStorage.getItem(KEYS.FLASHCARD_DECKS);
    if (!data) {
      localStorage.setItem(KEYS.FLASHCARD_DECKS, JSON.stringify(DEFAULT_FLASHCARDS));
      return DEFAULT_FLASHCARDS;
    }
    return JSON.parse(data);
  },
  saveFlashcards: (decks: FlashcardDeck[]) => {
    localStorage.setItem(KEYS.FLASHCARD_DECKS, JSON.stringify(decks));
  },
  saveDecks: (decks: FlashcardDeck[]) => {
    localStorage.setItem(KEYS.FLASHCARD_DECKS, JSON.stringify(decks));
  },

  getNotifications: (): AppNotification[] => {
    const data = localStorage.getItem(KEYS.NOTIFICATIONS);
    if (!data) {
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(DEFAULT_NOTIFICATIONS));
      return DEFAULT_NOTIFICATIONS;
    }
    return JSON.parse(data);
  },
  saveNotifications: (notifs: AppNotification[]) => {
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  },

  getPomodoroSessions: (): PomodoroSession[] => {
    const data = localStorage.getItem(KEYS.POMODORO_SESSIONS);
    return data ? JSON.parse(data) : [];
  },
  getSessions: (): PomodoroSession[] => {
    const data = localStorage.getItem(KEYS.POMODORO_SESSIONS);
    return data ? JSON.parse(data) : [];
  },
  savePomodoroSessions: (sessions: PomodoroSession[]) => {
    localStorage.setItem(KEYS.POMODORO_SESSIONS, JSON.stringify(sessions));
  },
  saveSessions: (sessions: PomodoroSession[]) => {
    localStorage.setItem(KEYS.POMODORO_SESSIONS, JSON.stringify(sessions));
  },

  getStudyLogs: (): DailyStudyLog[] => {
    const data = localStorage.getItem(KEYS.STUDY_LOGS);
    if (!data) {
      // Seed past 7 days logs
      const logs: DailyStudyLog[] = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        logs.push({
          date: dateStr,
          minutesFocused: Math.floor(Math.random() * 90) + 60, // 60-150m
          quizzesTaken: Math.floor(Math.random() * 3) + 1,
          notesCreated: Math.floor(Math.random() * 4) + 1,
          completedTasks: Math.floor(Math.random() * 3) + 1,
        });
      }
      localStorage.setItem(KEYS.STUDY_LOGS, JSON.stringify(logs));
      return logs;
    }
    return JSON.parse(data);
  },
  saveStudyLogs: (logs: DailyStudyLog[]) => {
    localStorage.setItem(KEYS.STUDY_LOGS, JSON.stringify(logs));
  },

  getGroupSessions: (): GroupStudySession[] => {
    const data = localStorage.getItem(KEYS.GROUP_SESSIONS);
    if (!data) {
      localStorage.setItem(KEYS.GROUP_SESSIONS, JSON.stringify(DEFAULT_GROUP_SESSIONS));
      return DEFAULT_GROUP_SESSIONS;
    }
    return JSON.parse(data);
  },
  saveGroupSessions: (sessions: GroupStudySession[]) => {
    localStorage.setItem(KEYS.GROUP_SESSIONS, JSON.stringify(sessions));
  },

  getTopicNodes: (): TopicNode[] => {
    const data = localStorage.getItem(KEYS.TOPIC_NODES);
    if (!data) {
      localStorage.setItem(KEYS.TOPIC_NODES, JSON.stringify(DEFAULT_TOPIC_NODES));
      return DEFAULT_TOPIC_NODES;
    }
    return JSON.parse(data);
  },
  saveTopicNodes: (nodes: TopicNode[]) => {
    localStorage.setItem(KEYS.TOPIC_NODES, JSON.stringify(nodes));
  },

  getTopicEdges: (): TopicEdge[] => {
    const data = localStorage.getItem(KEYS.TOPIC_EDGES);
    if (!data) {
      localStorage.setItem(KEYS.TOPIC_EDGES, JSON.stringify(DEFAULT_TOPIC_EDGES));
      return DEFAULT_TOPIC_EDGES;
    }
    return JSON.parse(data);
  },
  saveTopicEdges: (edges: TopicEdge[]) => {
    localStorage.setItem(KEYS.TOPIC_EDGES, JSON.stringify(edges));
  },

  getChatSessions: (): AIChatSession[] => {
    const data = localStorage.getItem(KEYS.CHAT_SESSIONS);
    if (!data) {
      localStorage.setItem(KEYS.CHAT_SESSIONS, JSON.stringify(DEFAULT_CHAT_SESSIONS));
      return DEFAULT_CHAT_SESSIONS;
    }
    return JSON.parse(data);
  },
  saveChatSessions: (sessions: AIChatSession[]) => {
    localStorage.setItem(KEYS.CHAT_SESSIONS, JSON.stringify(sessions));
  },

  getUnlockedBadges: (): RoadmapBadge[] => {
    const data = localStorage.getItem(KEYS.ROADMAP_BADGES);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  },
  saveUnlockedBadges: (badges: RoadmapBadge[]) => {
    localStorage.setItem(KEYS.ROADMAP_BADGES, JSON.stringify(badges));
  },
};

export const DEFAULT_CHAT_SESSIONS: AIChatSession[] = [
  {
    id: "session_welcome",
    title: "Computer Networks & TCP Handshake",
    subjectId: "s_cs101",
    mode: "standard",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    isPinned: true,
    messages: [
      {
        id: "msg_w1",
        role: "assistant",
        content: "Hello! I'm **StudyMate AI**, your 24/7 personal tutor. Ask me any question, paste code, request step-by-step problem solutions, or ask for simple analogies!",
        timestamp: "Yesterday at 10:00 AM",
      },
      {
        id: "msg_w2",
        role: "user",
        content: "Explain TCP 3-Way Handshake with an analogy",
        timestamp: "Yesterday at 10:01 AM",
        mode: "standard",
      },
      {
        id: "msg_w3",
        role: "assistant",
        content: `Imagine two people making a telephone call across a noisy room:

1. **SYN (Synchronize)**: Alice holds up a sign saying *"Can you hear me? My starting message number is 100."*
2. **SYN-ACK (Synchronize-Acknowledge)**: Bob sees it and holds up a sign *"Yes, I hear you! I acknowledged message 101. Can you hear me? My starting message number is 500."*
3. **ACK (Acknowledge)**: Alice holds up *"Yes! I acknowledged message 501. Connection established!"*

This 3-step sequence ensures both sides have verified two-way communication before transmitting actual payload data!`,
        timestamp: "Yesterday at 10:01 AM",
      },
    ],
  },
  {
    id: "session_db_norm",
    title: "Database Normalization (1NF to 3NF)",
    subjectId: "s_db202",
    mode: "eli5",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    messages: [
      {
        id: "msg_db1",
        role: "assistant",
        content: "Hello! What database concept would you like me to break down simply?",
        timestamp: "2 days ago",
      },
      {
        id: "msg_db2",
        role: "user",
        content: "How does Normalization (1NF to 3NF) work in Databases?",
        timestamp: "2 days ago",
        mode: "eli5",
      },
      {
        id: "msg_db3",
        role: "assistant",
        content: `Think of database normalization like organizing a messy bedroom:

* **1NF (First Normal Form)**: No messy piles inside a single box! Every cell must hold a single value (atomic), no list of items in one cell.
* **2NF (Second Normal Form)**: Put items in the right room! Every non-key column must depend on the *entire* primary key, not just half of it.
* **3NF (Third Normal Form)**: No middle-man dependencies! If Column A determines Column B, and Column B determines Column C, move B & C into their own separate table.

Result: No duplicate data, easy updates, and zero data corruption!`,
        timestamp: "2 days ago",
      },
    ],
  },
];
