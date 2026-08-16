/**
 * Comprehensive Multi-Language Translation Engine & Real-Time DOM Translator
 * Translates all application text into French (or any selected language) seamlessly.
 */

export interface LanguageDef {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  dir: "ltr" | "rtl";
}

export const SUPPORTED_LANGUAGES: LanguageDef[] = [
  { code: "en", name: "English (US)", nativeName: "English (US)", flag: "🇺🇸", dir: "ltr" },
  { code: "en-GB", name: "British English", nativeName: "English (UK)", flag: "🇬🇧", dir: "ltr" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", dir: "ltr" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", dir: "ltr" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", dir: "ltr" },
  { code: "zh", name: "Chinese (Simplified)", nativeName: "中文 (简体)", flag: "🇨🇳", dir: "ltr" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷", dir: "ltr" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", dir: "ltr" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी", flag: "🇮🇳", dir: "ltr" },
];

/**
 * Universal phrase translation dictionary mapping English phrases to target languages.
 */
export const PHRASE_DICTIONARY: Record<string, Record<string, string>> = {
  // Navigation & Core Tabs
  "Home Dashboard": {
    fr: "Tableau de bord",
    es: "Panel Principal",
    de: "Übersicht",
    zh: "主页仪表板",
    ar: "لوحة القيادة",
    pt: "Painel Principal",
    ja: "ホームダッシュボード",
    hi: "होम डैशबोर्ड",
    "en-GB": "Home Dashboard",
  },
  "Curriculum Mind Map": {
    fr: "Carte mentale du programme",
    es: "Mapa Mental del Plan de Estudios",
    de: "Lehrplan-Mindmap",
    zh: "课程思维导图",
    ar: "خريطة المنهج الذهنية",
    pt: "Mapa Mental do Currículo",
    ja: "カリキュラムマインドマップ",
    hi: "पाठ्यक्रम माइंड मैप",
    "en-GB": "Curriculum Mind Map",
  },
  "Group Study & Live Rooms": {
    fr: "Étude en groupe et salles en direct",
    es: "Estudio en Grupo y Salas en Vivo",
    de: "Gruppenlernen & Live-Räume",
    zh: "小组学习与直播自习室",
    ar: "الدراسة الجماعية والغرف المباشرة",
    pt: "Estudo em Grupo e Salas ao Vivo",
    ja: "グループ学習＆ライブルーム",
    hi: "समूह अध्ययन और लाइव रूम",
    "en-GB": "Group Revision & Live Rooms",
  },
  "Group Study": {
    fr: "Étude en groupe",
    es: "Estudio en Grupo",
    de: "Gruppenstudium",
    zh: "小组学习",
    ar: "دراسة جماعية",
    pt: "Estudo em Grupo",
    ja: "グループ学習",
    hi: "समूह अध्ययन",
    "en-GB": "Group Revision",
  },
  "AI Tutor Chat": {
    fr: "Discussion avec le tuteur IA",
    es: "Chat con Tutor IA",
    de: "KI-Tutor Chat",
    zh: "AI 导师对话",
    ar: "محادثة المعلم الذكي",
    pt: "Chat com Tutor IA",
    ja: "AIチューターチャット",
    hi: "एआई ट्यूटर चैट",
    "en-GB": "AI Tutor Chat",
  },
  "AI Tutor": {
    fr: "Tuteur IA",
    es: "Tutor IA",
    de: "KI-Tutor",
    zh: "AI 导师",
    ar: "المعلم الذكي",
    pt: "Tutor IA",
    ja: "AIチューター",
    hi: "एआई ट्यूटर",
    "en-GB": "AI Tutor",
  },
  "Upload & Summarize Files": {
    fr: "Téléverser et résumer des fichiers",
    es: "Subir y Resumir Archivos",
    de: "Dateien hochladen & zusammenfassen",
    zh: "上传并总结文件",
    ar: "تحميل وتلخيص الملفات",
    pt: "Carregar e Resumir Arquivos",
    ja: "ファイルのアップロードと要約",
    hi: "फ़ाइलें अपलोड और सारांशित करें",
    "en-GB": "Upload & Summarise Files",
  },
  "Smart Notes & Summarizer": {
    fr: "Notes intelligentes et résumés",
    es: "Notas Inteligentes y Resúmenes",
    de: "Smarte Notizen & Zusammenfassungen",
    zh: "智能笔记与摘要",
    ar: "ملاحظات ذكية والملخص",
    pt: "Notas Inteligentes e Resumos",
    ja: "スマートノート＆要約",
    hi: "स्मार्ट नोट्स और सारांश",
    "en-GB": "Smart Notes & Summariser",
  },
  "Smart Notes": {
    fr: "Notes intelligentes",
    es: "Notas Inteligentes",
    de: "Smarte Notizen",
    zh: "智能笔记",
    ar: "ملاحظات ذكية",
    pt: "Notas Inteligentes",
    ja: "スマートノート",
    hi: "स्मार्ट नोट्स",
    "en-GB": "Smart Notes",
  },
  "AI Quiz Arena": {
    fr: "Arène de quiz IA",
    es: "Área de Cuestionarios IA",
    de: "KI-Quiz-Arena",
    zh: "AI 测验竞技场",
    ar: "ساحة الاختبارات الذكية",
    pt: "Arena de Quizzes IA",
    ja: "AIクイズアリーナ",
    hi: "एआई क्विज एरिना",
    "en-GB": "AI Quiz Arena",
  },
  "Quiz Arena": {
    fr: "Arène de quiz",
    es: "Área de Cuestionarios",
    de: "Quiz-Arena",
    zh: "测验竞技场",
    ar: "ساحة الاختبارات",
    pt: "Arena de Quizzes",
    ja: "クイズアリーナ",
    hi: "क्विज एरिना",
    "en-GB": "Quiz Arena",
  },
  "Spaced Flashcard Decks": {
    fr: "Paquets de cartes mémoire espacées",
    es: "Mazos de Tarjetas de Repaso",
    de: "Karteikarten-Decks",
    zh: "间隔重复抽认卡",
    ar: "مجموعات البطاقات التعليمية المتباعدة",
    pt: "Baralhos de Flashcards Espaçados",
    ja: "間隔反復フラッシュカード",
    hi: "फ्लैशकार्ड डेक",
    "en-GB": "Spaced Flashcard Decks",
  },
  "Flashcards": {
    fr: "Cartes mémoire",
    es: "Tarjetas",
    de: "Karteikarten",
    zh: "抽认卡",
    ar: "بطاقات تعليمية",
    pt: "Flashcards",
    ja: "フラッシュカード",
    hi: "फ्लैशकार्ड",
    "en-GB": "Flashcards",
  },
  "Study Planner & Deadlines": {
    fr: "Planificateur d'étude et échéances",
    es: "Planificador de Estudio y Fechas",
    de: "Studienplaner & Fristen",
    zh: "学习计划与截止日期",
    ar: "مخطط الدراسة والمواعيد النهائية",
    pt: "Planejador de Estudos e Prazos",
    ja: "学習プランナー＆締切",
    hi: "स्टडी प्लानर और समय सीमा",
    "en-GB": "Study Timetable & Deadlines",
  },
  "Study Planner": {
    fr: "Planificateur d'étude",
    es: "Planificador de Estudio",
    de: "Studienplaner",
    zh: "学习计划",
    ar: "مخطط الدراسة",
    pt: "Planejador de Estudos",
    ja: "学習プランナー",
    hi: "स्टडी प्लानर",
    "en-GB": "Study Timetable",
  },
  "Snap & Solve Homework": {
    fr: "Scanner et résoudre les devoirs",
    es: "Escanear y Resolver Tareas",
    de: "Hausaufgaben scannen & lösen",
    zh: "拍照答疑搜题",
    ar: "مسح وحل الواجبات المدرسية",
    pt: "Escanear e Resolver Deveres",
    ja: "宿題スキャン＆解答",
    hi: "होमवर्क स्कैन और समाधान",
    "en-GB": "Snap & Solve Homework",
  },
  "Snap & Solve": {
    fr: "Scanner & Résoudre",
    es: "Escanear y Resolver",
    de: "Scannen & Lösen",
    zh: "拍照答疑",
    ar: "مسح وحل",
    pt: "Escanear e Resolver",
    ja: "スキャン＆解答",
    hi: "स्कैन और समाधान",
    "en-GB": "Snap & Solve",
  },
  "Voice AI Assistant": {
    fr: "Assistant vocal IA",
    es: "Asistente de Voz IA",
    de: "KI-Sprachassistent",
    zh: "语音 AI 助手",
    ar: "المساعد الصوتي الذكي",
    pt: "Assistente de Voz IA",
    ja: "音声AIアシスタント",
    hi: "वॉइस एआई सहायक",
    "en-GB": "Voice AI Assistant",
  },
  "Voice Assistant": {
    fr: "Assistant vocal",
    es: "Asistente de Voz",
    de: "Sprachassistent",
    zh: "语音助手",
    ar: "مساعد صوتي",
    pt: "Assistente de Voz",
    ja: "音声アシスタント",
    hi: "वॉइस सहायक",
    "en-GB": "Voice Assistant",
  },
  "Pomodoro Focus Timer": {
    fr: "Minuteur de concentration Pomodoro",
    es: "Temporizador Pomodoro",
    de: "Pomodoro-Fokustimer",
    zh: "番茄专注计时器",
    ar: "مؤقت بومودورو للتركيز",
    pt: "Temporizador Pomodoro",
    ja: "ポモドーロ集中タイマー",
    hi: "पोमोडोरो फोकस टाइमर",
    "en-GB": "Pomodoro Focus Timer",
  },
  "Pomodoro Timer": {
    fr: "Minuteur Pomodoro",
    es: "Temporizador Pomodoro",
    de: "Pomodoro-Timer",
    zh: "番茄计时器",
    ar: "مؤقت بومودورو",
    pt: "Temporizador Pomodoro",
    ja: "ポモドーロタイマー",
    hi: "पोमोडोरो टाइमर",
    "en-GB": "Pomodoro Timer",
  },
  "Analytics & Progress": {
    fr: "Analytique et progression",
    es: "Análisis y Progreso",
    de: "Analysen & Fortschritt",
    zh: "学习分析与进度",
    ar: "التحليلات والتقدم",
    pt: "Análises e Progresso",
    ja: "分析と進捗状況",
    hi: "विश्लेषण और प्रगति",
    "en-GB": "Analytics & Progress",
  },
  "Reminders & Alerts": {
    fr: "Rappels et alertes",
    es: "Recordatorios y Alertas",
    de: "Erinnerungen & Alarme",
    zh: "提醒与通知",
    ar: "التذكيرات والتنبيهات",
    pt: "Lembretes e Alertas",
    ja: "リマインダー＆アラート",
    hi: "अनुस्मारक और सूचनाएं",
    "en-GB": "Reminders & Alerts",
  },
  "Menu & Tools": {
    fr: "Menu et outils",
    es: "Menú y Herramientas",
    de: "Menü & Werkzeuge",
    zh: "菜单与工具",
    ar: "القائمة والأدوات",
    pt: "Menu e Ferramentas",
    ja: "メニュー＆ツール",
    hi: "मेनू और उपकरण",
    "en-GB": "Menu & Tools",
  },
  "Navigation": {
    fr: "Navigation",
    es: "Navegación",
    de: "Navigation",
    zh: "导航",
    ar: "التنقل",
    pt: "Navegação",
    ja: "ナビゲーション",
    hi: "नेविगेशन",
    "en-GB": "Navigation",
  },
  "My Courses": {
    fr: "Mes cours",
    es: "Mis Cursos",
    de: "Meine Kurse",
    zh: "我的课程",
    ar: "دوراتي التعليمية",
    pt: "Meus Cursos",
    ja: "マイコース",
    hi: "मेरे पाठ्यक्रम",
    "en-GB": "My Courses",
  },
  "Active Course": {
    fr: "Cours actif",
    es: "Curso Activo",
    de: "Aktiver Kurs",
    zh: "当前课程",
    ar: "المقرر النشط",
    pt: "Curso Ativo",
    ja: "受講中のコース",
    hi: "सक्रिय पाठ्यक्रम",
    "en-GB": "Active Course",
  },
  "Add Course": {
    fr: "Ajouter un cours",
    es: "Añadir Curso",
    de: "Kurs hinzufügen",
    zh: "添加课程",
    ar: "إضافة مقرر",
    pt: "Adicionar Curso",
    ja: "コースを追加",
    hi: "पाठ्यक्रम जोड़ें",
    "en-GB": "Add Course",
  },
  "Set Up Your Courses": {
    fr: "Configurer vos cours",
    es: "Configurar tus Cursos",
    de: "Kurse einrichten",
    zh: "设置您的课程",
    ar: "إعداد دوراتك الدراسية",
    pt: "Configurar seus Cursos",
    ja: "コースを設定する",
    hi: "अपने पाठ्यक्रम सेट करें",
    "en-GB": "Set Up Your Courses",
  },
  "No courses added yet": {
    fr: "Aucun cours ajouté pour l'instant",
    es: "Aún no has añadido cursos",
    de: "Noch keine Kurse hinzugefügt",
    zh: "尚未添加任何课程",
    ar: "لم تتم إضافة أي دورات بعد",
    pt: "Nenhum curso adicionado ainda",
    ja: "まだコースが追加されていません",
    hi: "अभी तक कोई पाठ्यक्रम नहीं जोड़ा गया",
    "en-GB": "No courses added yet",
  },
  "Clear": {
    fr: "Effacer",
    es: "Borrar",
    de: "Löschen",
    zh: "清除",
    ar: "مسح",
    pt: "Limpar",
    ja: "クリア",
    hi: "साफ़ करें",
    "en-GB": "Clear",
  },
  "Back": {
    fr: "Retour",
    es: "Volver",
    de: "Zurück",
    zh: "返回",
    ar: "رجوع",
    pt: "Voltar",
    ja: "戻る",
    hi: "वापस",
    "en-GB": "Back",
  },
  "Home": {
    fr: "Accueil",
    es: "Inicio",
    de: "Startseite",
    zh: "首页",
    ar: "الرئيسية",
    pt: "Início",
    ja: "ホーム",
    hi: "होम",
    "en-GB": "Home",
  },
  "Current View": {
    fr: "Vue actuelle",
    es: "Vista Actual",
    de: "Aktuelle Ansicht",
    zh: "当前视图",
    ar: "العرض الحالي",
    pt: "Visualização Atual",
    ja: "現在の画面",
    hi: "वर्तमान दृश्य",
    "en-GB": "Current View",
  },

  // Dashboard Greetings & Metrics
  "Welcome back": {
    fr: "Bon retour",
    es: "Bienvenido de nuevo",
    de: "Willkommen zurück",
    zh: "欢迎回来",
    ar: "مرحبًا بعودتك",
    pt: "Bem-vindo de volta",
    ja: "お帰りなさい",
    hi: "वापसी पर स्वागत है",
    "en-GB": "Welcome back",
  },
  "Smart AI Study & Revision Companion": {
    fr: "Compagnon d'étude et de révision intelligent propulsé par l'IA",
    es: "Compañero inteligente de estudio y revisión con IA",
    de: "Intelligenter KI-Lern- und Wiederholungsbegleiter",
    zh: "智能 AI 学习与复习助手",
    ar: "رفيق الدراسة والمراجعة الذكي المدعوم بالذكاء الاصطناعي",
    pt: "Companheiro Inteligente de Estudos e Revisão por IA",
    ja: "スマートAI学習＆復習コンパニオン",
    hi: "स्मार्ट एआई अध्ययन और पुनरीक्षण साथी",
    "en-GB": "Smart AI Study & Revision Companion",
  },
  "Personalized daily goals, scheduled tasks, and adaptive revision recommendations": {
    fr: "Objectifs quotidiens personnalisés, tâches planifiées et recommandations de révision adaptatives",
    es: "Objetivos diarios personalizados, tareas programadas y recomendaciones de revisión adaptativas",
    de: "Personalisierte Tagesziele, geplante Aufgaben und adaptive Wiederholungsempfehlungen",
    zh: "个性化每日目标、计划任务与自适应复习建议",
    ar: "أهداف يومية مخصصة، مهام مجدولة وتوصيات مراجعة تكيفية",
    pt: "Metas diárias personalizadas, tarefas agendadas e recomendações de revisão adaptativas",
    ja: "パーソナライズされた毎日の目標、スケジュールされたタスク、適応型復習の推奨事項",
    hi: "व्यक्तिगत दैनिक लक्ष्य, निर्धारित कार्य और अनुकूली पुनरीक्षण सुझाव",
    "en-GB": "Personalised daily goals, scheduled tasks, and adaptive revision recommendations",
  },
  "Study Streak": {
    fr: "Série de révision",
    es: "Racha de Estudio",
    de: "Lernserie",
    zh: "连续学习天数",
    ar: "أيام الدراسة المتتالية",
    pt: "Sequência de Estudos",
    ja: "連続学習日数",
    hi: "अध्ययन निरंतरता",
    "en-GB": "Study Streak",
  },
  "Focus Time": {
    fr: "Temps de concentration",
    es: "Tiempo de Enfoque",
    de: "Fokuszeit",
    zh: "专注时长",
    ar: "وقت التركيز",
    pt: "Tempo de Foco",
    ja: "集中時間",
    hi: "फोकस समय",
    "en-GB": "Focus Time",
  },
  "Tasks Due": {
    fr: "Tâches à rendre",
    es: "Tareas Pendientes",
    de: "Fällige Aufgaben",
    zh: "待办任务",
    ar: "المهام المستحقة",
    pt: "Tarefas Pendentes",
    ja: "期日の近いタスク",
    hi: "बकाया कार्य",
    "en-GB": "Tasks Due",
  },
  "Mastered Topics": {
    fr: "Sujets maîtrisés",
    es: "Temas Dominados",
    de: "Gemeisterte Themen",
    zh: "已掌握主题",
    ar: "المواضيع المتقنة",
    pt: "Tópicos Dominados",
    ja: "マスターしたトピック",
    hi: "कंठस्थ विषय",
    "en-GB": "Mastered Topics",
  },
  "Hours Studied": {
    fr: "Heures étudiées",
    es: "Horas Estudiadas",
    de: "Gelernte Stunden",
    zh: "学习时长 (小时)",
    ar: "ساعات الدراسة",
    pt: "Horas Estudadas",
    ja: "学習時間（時間）",
    hi: "अध्ययन के घंटे",
    "en-GB": "Hours Studied",
  },
  "Daily Goal": {
    fr: "Objectif quotidien",
    es: "Objetivo Diario",
    de: "Tagesziel",
    zh: "每日目标",
    ar: "الهدف اليومي",
    pt: "Meta Diária",
    ja: "毎日の目標",
    hi: "दैनिक लक्ष्य",
    "en-GB": "Daily Goal",
  },
  "Customize Layout": {
    fr: "Personnaliser l'affichage",
    es: "Personalizar Diseño",
    de: "Layout anpassen",
    zh: "自定义布局",
    ar: "تخصيص المظهر",
    pt: "Personalizar Layout",
    ja: "レイアウトのカスタマイズ",
    hi: "लेआउट अनुकूलित करें",
    "en-GB": "Customise Layout",
  },
  "Today's Study Plan": {
    fr: "Programme d'étude d'aujourd'hui",
    es: "Plan de Estudio de Hoy",
    de: "Heutiger Lernplan",
    zh: "今日学习计划",
    ar: "خطة دراسة اليوم",
    pt: "Plano de Estudos de Hoje",
    ja: "今日の学習計画",
    hi: "आज की अध्ययन योजना",
    "en-GB": "Today's Study Plan",
  },
  "Quick Study Actions": {
    fr: "Actions rapides d'étude",
    es: "Acciones Rápidas",
    de: "Schnellaktionen",
    zh: "快捷学习操作",
    ar: "إجراءات دراسية سريعة",
    pt: "Ações Rápidas de Estudo",
    ja: "クイック学習アクション",
    hi: "त्वरित अध्ययन क्रियाएं",
    "en-GB": "Quick Study Actions",
  },
  "Active Deadlines & Assignments": {
    fr: "Échéances et devoirs actifs",
    es: "Fechas Límite y Tareas Activas",
    de: "Aktuelle Fristen & Aufgaben",
    zh: "进行中的截止日期与作业",
    ar: "المواعيد النهائية والواجبات النشطة",
    pt: "Prazos e Tarefas Ativas",
    ja: "進行中の締切＆課題",
    hi: "सक्रिय समय सीमा और असाइनमेंट",
    "en-GB": "Active Deadlines & Assignments",
  },
  "Study Insights & AI Tips": {
    fr: "Conseils et astuces IA",
    es: "Perspectivas y Consejos IA",
    de: "Lerneinblicke & KI-Tipps",
    zh: "学习见解与 AI 建议",
    ar: "رؤى ونصائح الذكاء الاصطناعي",
    pt: "Dicas de Estudo e Recomendações IA",
    ja: "学習の洞察＆AIアドバイス",
    hi: "अध्ययन सुझाव और एआई टिप्स",
    "en-GB": "Study Insights & AI Tips",
  },
  "Live Study Rooms & Peer Focus": {
    fr: "Salles d'étude en direct et entraide",
    es: "Salas de Estudio en Vivo y Enfoque Compartido",
    de: "Live-Lernräume & Peer-Fokus",
    zh: "直播自习室与学伴互助",
    ar: "غرف الدراسة المباشرة والتركيز الجماعي",
    pt: "Salas de Estudo ao Vivo e Foco Compartilhado",
    ja: "ライブルーム＆ピアフォーカス",
    hi: "लाइव स्टडी रूम और सहकर्मी फोकस",
    "en-GB": "Live Study Rooms & Peer Focus",
  },
  "No pending deadlines. Great job staying ahead!": {
    fr: "Aucune échéance en attente. Bravo pour votre avance !",
    es: "¡No hay fechas límite pendientes. Buen trabajo manteniéndote al día!",
    de: "Keine anstehenden Fristen. Großartige Vorbereitung!",
    zh: "暂无待办截止日期。保持领先，继续加油！",
    ar: "لا توجد مواعيد نهائية معلقة. أحسنت العمل الاستباقي!",
    pt: "Nenhum prazo pendente. Excelente trabalho adiantando suas tarefas!",
    ja: "保留中の締切はありません。順調に進んでいます！",
    hi: "कोई लंबित समय सीमा नहीं है। आगे रहने के लिए बहुत बढ़िया काम!",
    "en-GB": "No pending deadlines. Great job staying ahead!",
  },
  "Set Your First Deadline": {
    fr: "Ajouter une première échéance",
    es: "Establecer tu primera fecha límite",
    de: "Erste Frist festlegen",
    zh: "设置您的第一个截止日期",
    ar: "حدد أول موعد نهائي لك",
    pt: "Definir seu primeiro prazo",
    ja: "最初の締切を設定する",
    hi: "अपनी पहली समय सीमा निर्धारित करें",
    "en-GB": "Set Your First Deadline",
  },
  "Set Up Live Room": {
    fr: "Créer une salle d'étude",
    es: "Crear Sala en Vivo",
    de: "Live-Raum erstellen",
    zh: "创建直播自习室",
    ar: "إنشاء غرفة مباشرة",
    pt: "Criar Sala ao Vivo",
    ja: "ライブルームを作成",
    hi: "लाइव रूम सेट करें",
    "en-GB": "Set Up Live Room",
  },
  "Enter Study Rooms": {
    fr: "Entrer dans les salles",
    es: "Entrar a las Salas",
    de: "Lernräume betreten",
    zh: "进入自习室",
    ar: "دخول غرف الدراسة",
    pt: "Entrar nas Salas",
    ja: "自習室に入る",
    hi: "स्टडी रूम में प्रवेश करें",
    "en-GB": "Enter Study Rooms",
  },
  "Start Focus Session": {
    fr: "Démarrer la session de concentration",
    es: "Iniciar Sesión de Enfoque",
    de: "Fokussitzung starten",
    zh: "开始专注时段",
    ar: "بدء جلسة التركيز",
    pt: "Iniciar Sessão de Foco",
    ja: "集中セッションを開始",
    hi: "फोकस सत्र शुरू करें",
    "en-GB": "Start Focus Session",
  },
  "Ask AI Tutor": {
    fr: "Demander au tuteur IA",
    es: "Preguntar al Tutor IA",
    de: "KI-Tutor fragen",
    zh: "向 AI 导师提问",
    ar: "اسأل المعلم الذكي",
    pt: "Perguntar ao Tutor IA",
    ja: "AIチューターに質問",
    hi: "एआई ट्यूटर से पूछें",
    "en-GB": "Ask AI Tutor",
  },
  "Generate Quiz": {
    fr: "Générer un quiz",
    es: "Generar Cuestionario",
    de: "Quiz generieren",
    zh: "生成测试题",
    ar: "إنشاء اختبار",
    pt: "Gerar Quiz",
    ja: "クイズを生成",
    hi: "क्विज बनाएं",
    "en-GB": "Generate Quiz",
  },
  "Review Flashcards": {
    fr: "Réviser les flashcards",
    es: "Repasar Tarjetas",
    de: "Karteikarten wiederholen",
    zh: "复习抽认卡",
    ar: "مراجعة البطاقات التعليمية",
    pt: "Revisar Flashcards",
    ja: "フラッシュカードを復習",
    hi: "फ्लैशकार्ड की समीक्षा करें",
    "en-GB": "Review Flashcards",
  },
  "Create New Note": {
    fr: "Créer une nouvelle note",
    es: "Crear Nueva Nota",
    de: "Neue Notiz erstellen",
    zh: "新建笔记",
    ar: "إنشاء ملاحظة جديدة",
    pt: "Criar Nova Nota",
    ja: "新しいノートを作成",
    hi: "नया नोट बनाएं",
    "en-GB": "Create New Note",
  },
  "Upload PDF / Doc": {
    fr: "Téléverser PDF / Doc",
    es: "Subir PDF / Doc",
    de: "PDF / Dokument hochladen",
    zh: "上传 PDF / 文档",
    ar: "تحميل PDF / مستند",
    pt: "Carregar PDF / Doc",
    ja: "PDF / 文書をアップロード",
    hi: "पीडीएफ / दस्तावेज़ अपलोड करें",
    "en-GB": "Upload PDF / Doc",
  },

  // Common Action Buttons & Labels
  "Save": { fr: "Enregistrer", es: "Guardar", de: "Speichern", zh: "保存", ar: "حفظ", pt: "Salvar", ja: "保存", hi: "सहेजें", "en-GB": "Save" },
  "Cancel": { fr: "Annuler", es: "Cancelar", de: "Abbrechen", zh: "取消", ar: "إلغاء", pt: "Cancelar", ja: "キャンセル", hi: "रद्द करें", "en-GB": "Cancel" },
  "Close": { fr: "Fermer", es: "Cerrar", de: "Schließen", zh: "关闭", ar: "إغلاق", pt: "Fechar", ja: "閉じる", hi: "बंद करें", "en-GB": "Close" },
  "Delete": { fr: "Supprimer", es: "Eliminar", de: "Löschen", zh: "删除", ar: "حذف", pt: "Excluir", ja: "削除", hi: "हटाएं", "en-GB": "Delete" },
  "Edit": { fr: "Modifier", es: "Editar", de: "Bearbeiten", zh: "编辑", ar: "تعديل", pt: "Editar", ja: "編集", hi: "संपादित करें", "en-GB": "Edit" },
  "Add": { fr: "Ajouter", es: "Añadir", de: "Hinzufügen", zh: "添加", ar: "إضافة", pt: "Adicionar", ja: "追加", hi: "जोड़ें", "en-GB": "Add" },
  "Create": { fr: "Créer", es: "Crear", de: "Erstellen", zh: "创建", ar: "إنشاء", pt: "Criar", ja: "作成", hi: "बनाएं", "en-GB": "Create" },
  "Submit": { fr: "Soumettre", es: "Enviar", de: "Absenden", zh: "提交", ar: "إرسال", pt: "Enviar", ja: "送信", hi: "जमा करें", "en-GB": "Submit" },
  "Start": { fr: "Démarrer", es: "Iniciar", de: "Starten", zh: "开始", ar: "بدء", pt: "Iniciar", ja: "スタート", hi: "शुरू करें", "en-GB": "Start" },
  "Pause": { fr: "Pause", es: "Pausa", de: "Pause", zh: "暂停", ar: "إيقاف مؤقت", pt: "Pausar", ja: "一時停止", hi: "रोकें", "en-GB": "Pause" },
  "Resume": { fr: "Reprendre", es: "Reanudar", de: "Fortsetzen", zh: "继续", ar: "استئناف", pt: "Retomar", ja: "再開", hi: "जारी रखें", "en-GB": "Resume" },
  "Reset": { fr: "Réinitialiser", es: "Restablecer", de: "Zurücksetzen", zh: "重置", ar: "إعادة ضبط", pt: "Redefinir", ja: "リセット", hi: "रीसेट करें", "en-GB": "Reset" },
  "Complete": { fr: "Terminer", es: "Completar", de: "Abschließen", zh: "完成", ar: "إكمال", pt: "Concluir", ja: "完了", hi: "पूर्ण करें", "en-GB": "Complete" },
  "Completed": { fr: "Terminé", es: "Completado", de: "Abgeschlossen", zh: "已完成", ar: "مكتمل", pt: "Concluído", ja: "完了済み", hi: "पूर्ण", "en-GB": "Completed" },
  "In Progress": { fr: "En cours", es: "En Progreso", de: "In Bearbeitung", zh: "进行中", ar: "قيد التنفيذ", pt: "Em Progresso", ja: "進行中", hi: "प्रगति में", "en-GB": "In Progress" },
  "To Do": { fr: "À faire", es: "Por Hacer", de: "Zu erledigen", zh: "待办", ar: "للإنجاز", pt: "A Fazer", ja: "未着手", hi: "करने योग्य", "en-GB": "To Do" },
  "Search...": { fr: "Rechercher...", es: "Buscar...", de: "Suchen...", zh: "搜索...", ar: "بحث...", pt: "Pesquisar...", ja: "検索...", hi: "खोजें...", "en-GB": "Search..." },
  "Search notes, subjects, revision quizzes...": {
    fr: "Rechercher notes, matières, quiz de révision...",
    es: "Buscar notas, asignaturas, cuestionarios...",
    de: "Notizen, Fächer, Quizze durchsuchen...",
    zh: "搜索笔记、科目、复习测验...",
    ar: "ابحث في الملاحظات، المواد، الاختبارات...",
    pt: "Pesquisar notas, matérias, questionários...",
    ja: "ノート、科目、復習クイズを検索...",
    hi: "नोट्स, विषय, पुनरीक्षण क्विज खोजें...",
    "en-GB": "Search notes, subjects, revision quizzes...",
  },
  "Day Streak": { fr: "Série de jours", es: "Racha de Días", de: "Tages-Serie", zh: "连续天数", ar: "أيام متتالية", pt: "Sequência de Dias", ja: "連続日数", hi: "दिनों की निरंतरता", "en-GB": "Day Streak" },
  "Active Streak": { fr: "Série active", es: "Racha Activa", de: "Aktive Serie", zh: "当前连续", ar: "السلسلة النشطة", pt: "Sequência Ativa", ja: "アクティブな連続日数", hi: "सक्रिय निरंतरता", "en-GB": "Active Streak" },
  "Courses": { fr: "Cours", es: "Cursos", de: "Kurse", zh: "课程", ar: "المقررات", pt: "Cursos", ja: "コース", hi: "पाठ्यक्रम", "en-GB": "Courses" },
  "+ Set Courses": { fr: "+ Définir Cours", es: "+ Añadir Cursos", de: "+ Kurse festlegen", zh: "+ 设置课程", ar: "+ تحديد المقررات", pt: "+ Definir Cursos", ja: "+ コースを設定", hi: "+ पाठ्यक्रम सेट करें", "en-GB": "+ Set Courses" },
  "Manage Course Subjects": { fr: "Gérer les matières de cours", es: "Gestionar Asignaturas", de: "Kursfächer verwalten", zh: "管理课程科目", ar: "إدارة مواد المقرر", pt: "Gerenciar Disciplinas", ja: "科目の管理", hi: "पाठ्यक्रम विषयों का प्रबंधन", "en-GB": "Manage Course Subjects" },
  "Theme Mode": { fr: "Mode de thème", es: "Modo de Tema", de: "Theme-Modus", zh: "主题模式", ar: "نمط المظهر", pt: "Modo de Tema", ja: "テーマモード", hi: "थीम मोड", "en-GB": "Theme Mode" },
  "Light Mode": { fr: "Mode clair", es: "Modo Claro", de: "Heller Modus", zh: "浅色模式", ar: "الوضع الفاتح", pt: "Modo Claro", ja: "ライトモード", hi: "लाइट मोड", "en-GB": "Light Mode" },
  "Dark Mode": { fr: "Mode sombre", es: "Modo Oscuro", de: "Dunkler Modus", zh: "深色模式", ar: "الوضع الداكن", pt: "Modo Escuro", ja: "ダークモード", hi: "डार्क मोड", "en-GB": "Dark Mode" },
  "System Mode": { fr: "Mode système", es: "Modo del Sistema", de: "Systemstandard", zh: "跟随系统", ar: "وضع النظام", pt: "Modo do Sistema", ja: "システム設定に従う", hi: "सिस्टम मोड", "en-GB": "System Mode" },
  "Language": { fr: "Langue", es: "Idioma", de: "Sprache", zh: "语言", ar: "اللغة", pt: "Idioma", ja: "言語", hi: "भाषा", "en-GB": "Language" },
  "Choose Language": { fr: "Choisir la langue", es: "Elegir Idioma", de: "Sprache wählen", zh: "选择语言", ar: "اختر اللغة", pt: "Escolher Idioma", ja: "言語を選択", hi: "भाषा चुनें", "en-GB": "Choose Language" },
  "Mark all as read": { fr: "Tout marquer comme lu", es: "Marcar todo como leído", de: "Alle als gelesen markieren", zh: "全部标为已读", ar: "تحديد الكل كمقروء", pt: "Marcar tudo como lido", ja: "すべて既読にする", hi: "सभी को पढ़ा हुआ चिह्नित करें", "en-GB": "Mark all as read" },
  "Clear all": { fr: "Tout effacer", es: "Borrar todo", de: "Alles löschen", zh: "清空全部", ar: "مسح الكل", pt: "Limpar tudo", ja: "すべてクリア", hi: "सभी साफ़ करें", "en-GB": "Clear all" },
  "No notifications yet.": { fr: "Aucune notification pour l'instant.", es: "Aún no tienes notificaciones.", de: "Noch keine Benachrichtigungen.", zh: "暂无新通知。", ar: "لا توجد إشعارات حتى الآن.", pt: "Nenhuma notificação ainda.", ja: "まだ通知はありません。", hi: "अभी तक कोई सूचना नहीं है।", "en-GB": "No notifications yet." },

  // AI Tutor & Chat
  "Ask anything about your courses, homework, or exam preparation.": {
    fr: "Posez vos questions sur vos cours, devoirs ou préparation aux examens.",
    es: "Pregunta cualquier duda sobre tus cursos, tareas o preparación de exámenes.",
    de: "Frage alles zu deinen Kursen, Hausaufgaben oder Prüfungsvorbereitung.",
    zh: "随时询问有关您的课程、作业或备考的任何问题。",
    ar: "اسأل عن أي شيء يخص دوراتك الدراسية أو واجباتك أو استعدادك للاختبارات.",
    pt: "Tire dúvidas sobre seus cursos, tarefas ou preparação para exames.",
    ja: "コース、宿題、試験対策について何でも質問してください。",
    hi: "अपने पाठ्यक्रमों, गृहकार्य या परीक्षा की तैयारी के बारे में कुछ भी पूछें।",
    "en-GB": "Ask anything about your courses, homework, or exam preparation.",
  },
  "Ask a concept, homework problem, or explanation...": {
    fr: "Demandez une explication, un concept ou un problème de devoir...",
    es: "Pregunta un concepto, problema o pide una explicación...",
    de: "Frage nach einem Konzept, einer Aufgabe oder einer Erklärung...",
    zh: "输入概念、作业题目或寻求详细解释...",
    ar: "اسأل عن مفهوم، مسألة واجب، أو اطلب شرحًا...",
    pt: "Digite um conceito, problema de dever ou explicação...",
    ja: "概念、宿題の問題、または説明を入力してください...",
    hi: "कोई अवधारणा, होमवर्क समस्या या स्पष्टीकरण पूछें...",
    "en-GB": "Ask a concept, homework problem, or explanation...",
  },
  "Send": { fr: "Envoyer", es: "Enviar", de: "Senden", zh: "发送", ar: "إرسال", pt: "Enviar", ja: "送信", hi: "भेजें", "en-GB": "Send" },
  "AI Tutor is analyzing...": { fr: "Le tuteur IA analyse votre question...", es: "El Tutor IA está analizando...", de: "KI-Tutor analysiert...", zh: "AI 导师正在分析解答...", ar: "المعلم الذكي يقوم بالتحليل...", pt: "O Tutor IA está analisando...", ja: "AIチューターが分析中...", hi: "एआई ट्यूटर विश्लेषण कर रहा है...", "en-GB": "AI Tutor is analysing..." },
  "Suggested Prompts": { fr: "Questions suggérées", es: "Preguntas Sugeridas", de: "Vorgeschlagene Fragen", zh: "推荐问题", ar: "أسئلة مقترحة", pt: "Perguntas Sugeridas", ja: "おすすめの質問", hi: "सुझाए गए प्रश्न", "en-GB": "Suggested Prompts" },
  "Clear Chat": { fr: "Effacer la discussion", es: "Limpiar Chat", de: "Chat leeren", zh: "清空对话", ar: "مسح المحادثة", pt: "Limpar Conversa", ja: "チャットを消去", hi: "बातचीत साफ़ करें", "en-GB": "Clear Chat" },

  // Smart Notes
  "All Notes": { fr: "Toutes les notes", es: "Todas las Notas", de: "Alle Notizen", zh: "所有笔记", ar: "جميع الملاحظات", pt: "Todas as Notas", ja: "すべてのノート", hi: "सभी नोट्स", "en-GB": "All Notes" },
  "New Note": { fr: "Nouvelle note", es: "Nueva Nota", de: "Neue Notiz", zh: "新建笔记", ar: "ملاحظة جديدة", pt: "Nova Nota", ja: "新しいノート", hi: "नया नोट", "en-GB": "New Note" },
  "Note Title": { fr: "Titre de la note", es: "Título de la Nota", de: "Notiztitel", zh: "笔记标题", ar: "عنوان الملاحظة", pt: "Título da Nota", ja: "ノートのタイトル", hi: "नोट का शीर्षक", "en-GB": "Note Title" },
  "Write or paste notes here...": { fr: "Écrivez ou collez vos notes ici...", es: "Escribe o pega tus notas aquí...", de: "Schreibe oder füge Notizen hier ein...", zh: "在此输入或粘贴您的笔记内容...", ar: "اكتب أو الصق الملاحظات هنا...", pt: "Escreva ou cole notas aqui...", ja: "ここにノートを入力または貼り付け...", hi: "यहाँ नोट्स लिखें या पेस्ट करें...", "en-GB": "Write or paste notes here..." },
  "AI Summarize": { fr: "Résumer avec l'IA", es: "Resumir con IA", de: "Mit KI zusammenfassen", zh: "AI 智能摘要", ar: "تلخيص بالذكاء الاصطناعي", pt: "Resumir com IA", ja: "AIで要約", hi: "एआई से सारांश बनाएं", "en-GB": "AI Summarise" },
  "Generate Quiz from Note": { fr: "Générer un quiz à partir de la note", es: "Generar Test desde la Nota", de: "Quiz aus Notiz erstellen", zh: "从笔记生成测验", ar: "إنشاء اختبار من الملاحظة", pt: "Gerar Quiz a partir da Nota", ja: "ノートからクイズを生成", hi: "नोट से क्विज बनाएं", "en-GB": "Generate Quiz from Note" },
  "Generate Flashcards": { fr: "Générer des flashcards", es: "Generar Tarjetas", de: "Karteikarten erstellen", zh: "生成抽认卡", ar: "إنشاء بطاقات تعليمية", pt: "Gerar Flashcards", ja: "フラッシュカードを生成", hi: "फ्लैशकार्ड बनाएं", "en-GB": "Generate Flashcards" },
  "Export as PDF": { fr: "Exporter en PDF", es: "Exportar como PDF", de: "Als PDF exportieren", zh: "导出为 PDF", ar: "تصدير كـ PDF", pt: "Exportar como PDF", ja: "PDFとしてエクスポート", hi: "पीडीएफ के रूप में निर्यात करें", "en-GB": "Export as PDF" },
  "No notes found. Create your first smart note!": { fr: "Aucune note trouvée. Créez votre première note intelligente !", es: "No se encontraron notas. ¡Crea tu primera nota!", de: "Keine Notizen gefunden. Erstelle deine erste Notiz!", zh: "未找到笔记。立即创建您的第一条智能笔记！", ar: "لم يتم العثور على ملاحظات. أنشئ ملاحظتك الذكية الأولى!", pt: "Nenhuma nota encontrada. Crie sua primeira nota inteligente!", ja: "ノートが見つかりません。最初のスマートノートを作成しましょう！", hi: "कोई नोट नहीं मिला। अपना पहला स्मार्ट नोट बनाएं!", "en-GB": "No notes found. Create your first smart note!" },

  // Documents
  "Drag & drop PDF, Word documents or images here": {
    fr: "Glissez-déposez des PDF, documents Word ou images ici",
    es: "Arrastra y suelta archivos PDF, Word o imágenes aquí",
    de: "PDF-, Word-Dokumente oder Bilder hierher ziehen",
    zh: "拖拽 PDF、Word 文档或图片至此处",
    ar: "اسحب وأفلت ملفات PDF أو Word أو الصور هنا",
    pt: "Arraste e solte arquivos PDF, Word ou imagens aqui",
    ja: "PDF、Word文書、または画像をここにドラッグ＆ドロップ",
    hi: "यहाँ पीडीएफ, वर्ड दस्तावेज़ या चित्र खींचें और छोड़ें",
    "en-GB": "Drag & drop PDF, Word documents or images here",
  },
  "Browse Files": { fr: "Parcourir les fichiers", es: "Examinar Archivos", de: "Dateien durchsuchen", zh: "浏览文件", ar: "تصفح الملفات", pt: "Procurar Arquivos", ja: "ファイルを参照", hi: "फ़ाइलें ब्राउज़ करें", "en-GB": "Browse Files" },
  "Document Summary & Insights": { fr: "Résumé et points clés du document", es: "Resumen y Puntos Clave", de: "Zusammenfassung & Erkenntnisse", zh: "文档摘要与核心见解", ar: "ملخص المستند والأفكار الرئيسية", pt: "Resumo do Documento e Insights", ja: "文書の要約とポイント", hi: "दस्तावेज़ सारांश और अंतर्दृष्टि", "en-GB": "Document Summary & Insights" },
  "No documents uploaded yet.": { fr: "Aucun document téléversé pour l'instant.", es: "Aún no has subido documentos.", de: "Noch keine Dokumente hochgeladen.", zh: "尚未上传任何文档。", ar: "لم يتم تحميل أي مستندات بعد.", pt: "Nenhum documento carregado ainda.", ja: "まだ文書がアップロードされていません。", hi: "अभी तक कोई दस्तावेज़ अपलोड नहीं किया गया।", "en-GB": "No documents uploaded yet." },

  // Pomodoro
  "Focus Session": { fr: "Session de concentration", es: "Sesión de Enfoque", de: "Fokussitzung", zh: "专注时段", ar: "جلسة تركيز", pt: "Sessão de Foco", ja: "集中セッション", hi: "फोकस सत्र", "en-GB": "Focus Session" },
  "Short Break": { fr: "Courte pause", es: "Pausa Corta", de: "Kurze Pause", zh: "短休息", ar: "استراحة قصيرة", pt: "Pausa Curta", ja: "小休憩", hi: "छोटा ब्रेक", "en-GB": "Short Break" },
  "Long Break": { fr: "Longue pause", es: "Pausa Larga", de: "Lange Pause", zh: "长休息", ar: "استراحة طويلة", pt: "Pausa Longa", ja: "長休憩", hi: "लंबा ब्रेक", "en-GB": "Long Break" },
  "Cycles Completed": { fr: "Cycles terminés", es: "Ciclos Completados", de: "Abgeschlossene Zyklen", zh: "已完成循环", ar: "الدورات المكتملة", pt: "Ciclos Concluídos", ja: "完了したサイクル", hi: "पूरे हुए चक्र", "en-GB": "Cycles Completed" },

  // Quiz
  "Generate Practice Quiz": { fr: "Générer un quiz d'entraînement", es: "Generar Test de Práctica", de: "Übungsquiz erstellen", zh: "生成练习测验", ar: "إنشاء اختبار تدريبي", pt: "Gerar Quiz de Prática", ja: "練習クイズを生成", hi: "अभ्यास क्विज बनाएं", "en-GB": "Generate Practice Quiz" },
  "Number of Questions": { fr: "Nombre de questions", es: "Número de Preguntas", de: "Anzahl der Fragen", zh: "题目数量", ar: "عدد الأسئلة", pt: "Número de Questões", ja: "問題数", hi: "प्रश्नों की संख्या", "en-GB": "Number of Questions" },
  "Difficulty Level": { fr: "Niveau de difficulté", es: "Nivel de Dificultad", de: "Schwierigkeitsgrad", zh: "难度级别", ar: "مستوى الصعوبة", pt: "Nível de Dificuldade", ja: "難易度", hi: "कठिनाई स्तर", "en-GB": "Difficulty Level" },
  "Easy": { fr: "Facile", es: "Fácil", de: "Einfach", zh: "简单", ar: "سهل", pt: "Fácil", ja: "初級", hi: "आसान", "en-GB": "Easy" },
  "Medium": { fr: "Moyen", es: "Medio", de: "Mittel", zh: "中等", ar: "متوسط", pt: "Médio", ja: "中級", hi: "मध्यम", "en-GB": "Medium" },
  "Hard": { fr: "Difficile", es: "Difícil", de: "Schwer", zh: "困难", ar: "صعب", pt: "Difícil", ja: "上級", hi: "कठिन", "en-GB": "Hard" },
  "Start Quiz": { fr: "Commencer le quiz", es: "Comenzar Test", de: "Quiz starten", zh: "开始测验", ar: "بدء الاختبار", pt: "Iniciar Quiz", ja: "クイズを開始", hi: "क्विज शुरू करें", "en-GB": "Start Quiz" },
  "Next Question": { fr: "Question suivante", es: "Siguiente Pregunta", de: "Nächste Frage", zh: "下一题", ar: "السؤال التالي", pt: "Próxima Questão", ja: "次の問題", hi: "अगला प्रश्न", "en-GB": "Next Question" },
  "Previous Question": { fr: "Question précédente", es: "Pregunta Anterior", de: "Vorherige Frage", zh: "上一题", ar: "السؤال السابق", pt: "Questão Anterior", ja: "前の問題", hi: "पिछला प्रश्न", "en-GB": "Previous Question" },
  "Submit Quiz": { fr: "Soumettre les réponses", es: "Enviar Test", de: "Quiz abgeben", zh: "提交答案", ar: "إرسال الإجابات", pt: "Enviar Quiz", ja: "クイズを提出", hi: "क्विज जमा करें", "en-GB": "Submit Quiz" },
  "Your Score": { fr: "Votre score", es: "Tu Puntuación", de: "Dein Ergebnis", zh: "您的得分", ar: "نتيجتك", pt: "Sua Pontuação", ja: "あなたのスコア", hi: "आपका स्कोर", "en-GB": "Your Score" },
  "Review Answers & Explanations": { fr: "Revoir les réponses et explications", es: "Revisar Respuestas y Explicaciones", de: "Antworten & Erklärungen ansehen", zh: "查看解析与解释", ar: "مراجعة الإجابات والشروحات", pt: "Revisar Respostas e Explicações", ja: "解答と解説を確認", hi: "उत्तर और स्पष्टीकरण की समीक्षा करें", "en-GB": "Review Answers & Explanations" },
  "Retake Quiz": { fr: "Recommencer le quiz", es: "Repetir Test", de: "Quiz wiederholen", zh: "重新测验", ar: "إعادة الاختبار", pt: "Refazer Quiz", ja: "クイズをやり直す", hi: "पुनः क्विज लें", "en-GB": "Retake Quiz" },

  // Flashcards
  "Create New Deck": { fr: "Créer un nouveau paquet", es: "Crear Nuevo Mazo", de: "Neues Deck erstellen", zh: "创建新卡组", ar: "إنشاء مجموعة جديدة", pt: "Criar Novo Baralho", ja: "新しいデッキを作成", hi: "नया डेक बनाएं", "en-GB": "Create New Deck" },
  "Deck Name": { fr: "Nom du paquet", es: "Nombre del Mazo", de: "Deck-Name", zh: "卡组名称", ar: "اسم المجموعة", pt: "Nome do Baralho", ja: "デッキ名", hi: "डेक का नाम", "en-GB": "Deck Name" },
  "Front (Question / Concept)": { fr: "Recto (Question / Concept)", es: "Frente (Pregunta / Concepto)", de: "Vorderseite (Frage / Konzept)", zh: "正面 (问题 / 概念)", ar: "الوجه (السؤال / المفهوم)", pt: "Frente (Pergunta / Conceito)", ja: "表面（質問／概念）", hi: "सामने (प्रश्न / अवधारणा)", "en-GB": "Front (Question / Concept)" },
  "Back (Answer / Definition)": { fr: "Verso (Réponse / Définition)", es: "Reverso (Respuesta / Definición)", de: "Rückseite (Antwort / Definition)", zh: "背面 (答案 / 定义)", ar: "الظهر (الإجابة / التعريف)", pt: "Verso (Resposta / Definição)", ja: "裏面（答え／定義）", hi: "पीछे (उत्तर / परिभाषा)", "en-GB": "Back (Answer / Definition)" },
  "Study Deck": { fr: "Étudier le paquet", es: "Estudiar Mazo", de: "Deck lernen", zh: "学习此卡组", ar: "دراسة المجموعة", pt: "Estudar Baralho", ja: "デッキを学習", hi: "डेक का अध्ययन करें", "en-GB": "Study Deck" },
  "Click to Flip": { fr: "Cliquer pour retourner", es: "Toca para Voltear", de: "Klicken zum Umdrehen", zh: "点击翻转卡片", ar: "انقر للقلب", pt: "Clique para Virar", ja: "クリックして裏返す", hi: "पलटने के लिए क्लिक करें", "en-GB": "Click to Flip" },
  "Mastered": { fr: "Maîtrisé", es: "Dominado", de: "Gemeistert", zh: "已掌握", ar: "متقن", pt: "Dominado", ja: "習得済み", hi: "कंठस्थ", "en-GB": "Mastered" },
  "Review Again": { fr: "Réviser à nouveau", es: "Repasar de Nuevo", de: "Nochmal wiederholen", zh: "再次复习", ar: "مراجعة مجددًا", pt: "Revisar Novamente", ja: "もう一度復習", hi: "पुनः समीक्षा करें", "en-GB": "Review Again" },

  // Planner
  "Kanban Board": { fr: "Tableau Kanban", es: "Tablero Kanban", de: "Kanban-Board", zh: "看板视图", ar: "لوحة كانبان", pt: "Quadro Kanban", ja: "カンバンボード", hi: "कानबन बोर्ड", "en-GB": "Kanban Board" },
  "Weekly Timetable": { fr: "Emploi du temps hebdomadaire", es: "Horario Semanal", de: "Wochenstundenplan", zh: "每周课程表", ar: "الجدول الأسبوعي", pt: "Horário Semanal", ja: "週間時間割", hi: "साप्ताहिक समय सारिणी", "en-GB": "Weekly Timetable" },
  "Add Assignment": { fr: "Ajouter un devoir", es: "Añadir Tarea", de: "Aufgabe hinzufügen", zh: "添加作业", ar: "إضافة واجب", pt: "Adicionar Tarefa", ja: "課題を追加", hi: "असाइनमेंट जोड़ें", "en-GB": "Add Assignment" },
  "Add Study Session": { fr: "Ajouter une session d'étude", es: "Añadir Sesión", de: "Lernsitzung hinzufügen", zh: "添加自习日程", ar: "إضافة جلسة دراسة", pt: "Adicionar Sessão", ja: "学習セッションを追加", hi: "अध्ययन सत्र जोड़ें", "en-GB": "Add Study Session" },
  "Due Date": { fr: "Date limite", es: "Fecha Límite", de: "Fälligkeitsdatum", zh: "截止日期", ar: "تاريخ الاستحقاق", pt: "Data de Entrega", ja: "締切日", hi: "अंतिम तिथि", "en-GB": "Due Date" },
  "Priority": { fr: "Priorité", es: "Prioridad", de: "Priorität", zh: "优先级", ar: "الأولوية", pt: "Prioridade", ja: "優先度", hi: "प्राथमिकता", "en-GB": "Priority" },
  "High": { fr: "Élevée", es: "Alta", de: "Hoch", zh: "高", ar: "عالية", pt: "Alta", ja: "高", hi: "उच्च", "en-GB": "High" },
  "Low": { fr: "Basse", es: "Baja", de: "Niedrig", zh: "低", ar: "منخفضة", pt: "Baixa", ja: "低", hi: "कम", "en-GB": "Low" },

  // Scanner & Voice
  "Take a photo or upload homework question": {
    fr: "Prenez une photo ou téléversez votre question de devoir",
    es: "Toma una foto o sube una pregunta de tu tarea",
    de: "Foto machen oder Hausaufgabenfrage hochladen",
    zh: "拍照或上传作业题目",
    ar: "التقط صورة أو حمّل سؤال الواجب",
    pt: "Tire uma foto ou envie a questão do dever",
    ja: "写真を撮るか宿題の問題をアップロード",
    hi: "फोटो लें या प्रश्न अपलोड करें",
    "en-GB": "Take a photo or upload homework question",
  },
  "Hold to Speak": { fr: "Maintenir pour parler", es: "Mantén presionado para hablar", de: "Gedrückt halten zum Sprechen", zh: "按住说话", ar: "اضغط مع الاستمرار للتحدث", pt: "Segure para Falar", ja: "長押しして話す", hi: "बोलने के लिए दबाए रखें", "en-GB": "Hold to Speak" },
  "Listening...": { fr: "Écoute en cours...", es: "Escuchando...", de: "Zuhören...", zh: "正在倾听...", ar: "جارٍ الاستماع...", pt: "Ouvindo...", ja: "聞き取り中...", hi: "सुन रहा है...", "en-GB": "Listening..." },

  // Analytics
  "Study Time Breakdown": { fr: "Répartition du temps d'étude", es: "Desglose de Tiempo de Estudio", de: "Lernzeitaufschlüsselung", zh: "学习时长分布", ar: "توزيع وقت الدراسة", pt: "Distribuição do Tempo de Estudo", ja: "学習時間の内訳", hi: "विषयवार अध्ययन समय", "en-GB": "Study Time Breakdown" },
  "Subject Mastery Score": { fr: "Score de maîtrise par matière", es: "Puntuación de Dominio", de: "Fachbeherrschung", zh: "科目掌握度评分", ar: "مستوى إتقان المواد", pt: "Pontuação de Domínio", ja: "科目習得スコア", hi: "विषय निपुणता स्कोर", "en-GB": "Subject Mastery Score" },
  "Weekly Study Consistency": { fr: "Régularité d'étude hebdomadaire", es: "Constancia Semanal", de: "Wöchentliche Konsistenz", zh: "每周学习连贯度", ar: "الانتظام الأسبوعي", pt: "Consistência Semanal", ja: "週ごとの学習継続性", hi: "साप्ताहिक निरंतरता", "en-GB": "Weekly Study Consistency" },

  // Live Group Rooms
  "Create Live Room": { fr: "Créer une salle en direct", es: "Crear Sala en Vivo", de: "Live-Raum erstellen", zh: "创建直播自习室", ar: "إنشاء غرفة مباشرة", pt: "Criar Sala ao Vivo", ja: "ライブルームを作成", hi: "लाइव रूम बनाएं", "en-GB": "Create Live Room" },
  "Join Room": { fr: "Rejoindre la salle", es: "Unirse a la Sala", de: "Raum beitreten", zh: "加入自习室", ar: "انضمام للغرفة", pt: "Entrar na Sala", ja: "ルームに参加", hi: "कमरे में शामिल हों", "en-GB": "Join Room" },
  "Room Name": { fr: "Nom de la salle", es: "Nombre de la Sala", de: "Raumname", zh: "自习室名称", ar: "اسم الغرفة", pt: "Nome da Sala", ja: "ルーム名", hi: "कमरे का नाम", "en-GB": "Room Name" },
  "Participants": { fr: "Participants", es: "Participantes", de: "Teilnehmer", zh: "成员人数", ar: "المشاركون", pt: "Participantes", ja: "参加者", hi: "प्रतिभागी", "en-GB": "Participants" },

  // Offline status
  "⚡ Offline Mode Active": {
    fr: "⚡ Mode hors ligne actif",
    es: "⚡ Modo Sin Conexión Activo",
    de: "⚡ Offline-Modus aktiv",
    zh: "⚡ 离线模式已激活",
    ar: "⚡ وضع عدم الاتصال نشط",
    pt: "⚡ Modo Offline Ativo",
    ja: "⚡ オフラインモード有効",
    hi: "⚡ ऑफ़लाइन मोड सक्रिय",
    "en-GB": "⚡ Offline Mode Active",
  },
  "Study resources are cached. You can review notes, flashcards, study schedules, and run the Pomodoro timer without internet.": {
    fr: "Vos ressources sont enregistrées en cache. Vous pouvez réviser vos notes, flashcards, plannings et utiliser le minuteur Pomodoro sans connexion internet.",
    es: "Los recursos están guardados. Puedes repasar notas, tarjetas, horarios y usar el Pomodoro sin internet.",
    de: "Lernressourcen sind zwischengespeichert. Du kannst Notizen, Karteikarten und Zeitpläne ohne Internet nutzen.",
    zh: "学习资源已缓存。您可以在无网络状态下查阅笔记、抽认卡、日程并使用番茄计时器。",
    ar: "المصادر الدراسية محفوظة. يمكنك مراجعة الملاحظات والبطاقات والجداول واستخدام مؤقت بومودورو دون اتصال.",
    pt: "Recursos em cache. Você pode revisar notas, flashcards, cronogramas e usar o Pomodoro sem internet.",
    ja: "リソースがキャッシュされています。オフラインでもノート、単語カード、スケジュール、ポモドーロを利用できます。",
    hi: "अध्ययन संसाधन सुरक्षित हैं। आप बिना इंटरनेट के नोट्स, कार्ड, शेड्यूल और पोमोडोरो टाइमर का उपयोग कर सकते हैं।",
    "en-GB": "Study resources are cached. You can review notes, flashcards, study schedules, and run the Pomodoro timer without internet.",
  },
  "Back Online — Full AI & Cloud Sync Active": {
    fr: "De nouveau en ligne — Synchronisation IA et cloud active",
    es: "De nuevo en línea — Sincronización completa activa",
    de: "Wieder online — KI- und Cloud-Synchronisation aktiv",
    zh: "已恢复网络 — AI 与云端同步已就绪",
    ar: "تمت استعادة الاتصال — المزامنة السحابية الذكية نشطة",
    pt: "Online novamente — Sincronização em nuvem e IA ativa",
    ja: "オンラインに復帰 — AIとクラウド同期が有効です",
    hi: "पुनः ऑनलाइन — एआई और क्लाउड सिंक सक्रिय",
    "en-GB": "Back Online — Full AI & Cloud Sync Active",
  },
};

/**
 * Translates an arbitrary English text string to the target language.
 */
export function translateTextTo(text: string, targetLang: string): string {
  if (!text || targetLang === "en") return text;

  const trimmed = text.trim();
  if (!trimmed) return text;

  // 1. Direct dictionary match
  if (PHRASE_DICTIONARY[trimmed] && PHRASE_DICTIONARY[trimmed][targetLang]) {
    const translation = PHRASE_DICTIONARY[trimmed][targetLang];
    // Preserve leading/trailing whitespace
    const leadingSpace = text.match(/^\s*/)?.[0] || "";
    const trailingSpace = text.match(/\s*$/)?.[0] || "";
    return `${leadingSpace}${translation}${trailingSpace}`;
  }

  // 2. Case-insensitive dictionary lookup
  const lowerTrimmed = trimmed.toLowerCase();
  for (const [key, mapping] of Object.entries(PHRASE_DICTIONARY)) {
    if (key.toLowerCase() === lowerTrimmed && mapping[targetLang]) {
      const translation = mapping[targetLang];
      const leadingSpace = text.match(/^\s*/)?.[0] || "";
      const trailingSpace = text.match(/\s*$/)?.[0] || "";
      return `${leadingSpace}${translation}${trailingSpace}`;
    }
  }

  // 3. Match with common dynamic prefixes/suffixes (e.g., "(3 items)", "4.5 / 5.0", numbers)
  for (const [key, mapping] of Object.entries(PHRASE_DICTIONARY)) {
    if (mapping[targetLang] && trimmed.includes(key)) {
      const translatedKey = mapping[targetLang];
      return text.replace(key, translatedKey);
    }
  }

  return text;
}

/**
 * Client-Side Real-Time DOM Auto-Translator
 * Translates rendered text nodes and input placeholders automatically when language changes.
 */
class DOMTranslatorEngine {
  private originalTextMap = new WeakMap<Node, string>();
  private observer: MutationObserver | null = null;
  private currentLanguage = "en";
  private isTranslating = false;

  public init(lang: string) {
    this.currentLanguage = lang;
    this.startObserver();
    this.translateDOM();
  }

  public setLanguage(lang: string) {
    this.currentLanguage = lang;
    this.translateDOM();
  }

  private startObserver() {
    if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;
    if (this.observer) this.observer.disconnect();

    this.observer = new MutationObserver((mutations) => {
      if (this.isTranslating) return;
      if (this.currentLanguage === "en") return;

      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            this.translateSubtree(node);
          });
        } else if (mutation.type === "characterData") {
          if (mutation.target.nodeType === Node.TEXT_NODE) {
            this.translateTextNode(mutation.target as Text);
          }
        }
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  public translateDOM() {
    if (typeof document === "undefined") return;
    this.isTranslating = true;
    try {
      this.translateSubtree(document.body);
    } finally {
      this.isTranslating = false;
    }
  }

  private shouldSkipNode(node: Node): boolean {
    const parent = node.parentElement;
    if (!parent) return false;
    const tagName = parent.tagName.toUpperCase();
    if (["SCRIPT", "STYLE", "CODE", "PRE", "TEXTAREA"].includes(tagName)) {
      return true;
    }
    // Skip if marked with data-no-translate
    if (parent.hasAttribute("data-no-translate")) {
      return true;
    }
    return false;
  }

  private translateSubtree(root: Node) {
    if (!root) return;

    // Handle attributes on elements (placeholders, titles, aria-labels)
    if (root.nodeType === Node.ELEMENT_NODE) {
      const el = root as HTMLElement;
      this.translateElementAttributes(el);

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          if (this.shouldSkipNode(node)) return NodeFilter.FILTER_REJECT;
          const text = node.textContent?.trim();
          if (!text || text.length <= 1) return NodeFilter.FILTER_SKIP;
          return NodeFilter.FILTER_ACCEPT;
        },
      });

      let textNode: Node | null = walker.nextNode();
      while (textNode) {
        this.translateTextNode(textNode as Text);
        textNode = walker.nextNode();
      }
    } else if (root.nodeType === Node.TEXT_NODE) {
      this.translateTextNode(root as Text);
    }
  }

  private translateTextNode(node: Text) {
    if (this.shouldSkipNode(node)) return;

    let original = this.originalTextMap.get(node);
    const current = node.textContent || "";

    if (!original) {
      original = current;
      this.originalTextMap.set(node, original);
    }

    if (this.currentLanguage === "en") {
      if (node.textContent !== original) {
        node.textContent = original;
      }
      return;
    }

    const translated = translateTextTo(original, this.currentLanguage);
    if (translated && translated !== current && translated !== original) {
      node.textContent = translated;
    }
  }

  private translateElementAttributes(el: HTMLElement) {
    // 1. Placeholder attribute
    if (el.hasAttribute("placeholder")) {
      const currentPlaceholder = el.getAttribute("placeholder") || "";
      let orig = el.getAttribute("data-orig-placeholder");
      if (!orig) {
        orig = currentPlaceholder;
        el.setAttribute("data-orig-placeholder", orig);
      }

      if (this.currentLanguage === "en") {
        el.setAttribute("placeholder", orig);
      } else {
        const translated = translateTextTo(orig, this.currentLanguage);
        if (translated && translated !== orig) {
          el.setAttribute("placeholder", translated);
        }
      }
    }

    // 2. Title attribute
    if (el.hasAttribute("title")) {
      const currentTitle = el.getAttribute("title") || "";
      let orig = el.getAttribute("data-orig-title");
      if (!orig) {
        orig = currentTitle;
        el.setAttribute("data-orig-title", orig);
      }

      if (this.currentLanguage === "en") {
        el.setAttribute("title", orig);
      } else {
        const translated = translateTextTo(orig, this.currentLanguage);
        if (translated && translated !== orig) {
          el.setAttribute("title", translated);
        }
      }
    }
  }
}

export const domTranslator = new DOMTranslatorEngine();
