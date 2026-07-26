import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// In a real production app, we would load these asynchronously or use a backend plugin
const resources = {
  en: {
    translation: {
      
      "Take Quiz": "Take Quiz",
      "Submit": "Submit",
      "Time Remaining": "Time Remaining",
      "Leaderboard": "Leaderboard",
      "Correct": "Correct",
      "Incorrect": "Incorrect",
      "Your Score": "Your Score",

      "Virtual Classroom": "Virtual Classroom",
      "Live and scheduled learning sessions.": "Live and scheduled learning sessions.",
      "Schedule Class": "Schedule Class",
      "No classrooms scheduled yet.": "No classrooms scheduled yet.",
      "Join Room": "Join Room",
      "Enter Classroom": "Enter Classroom",
      "LIVE": "LIVE",
      "RSVP": "RSVP",
      "Join Waitlist (Free)": "Join Waitlist (Free)",
      "Share": "Share",
      "Follow Host": "Follow Host",
      "Load More Sessions": "Load More Sessions",
      "Focus Mode": "Focus Mode",
      "Show Sidebar": "Show Sidebar",
      "Session Tools": "Session Tools",
      "Report": "Report",
      "AI Classroom Assistant": "AI Classroom Assistant",
      "Thinking...": "Thinking...",
      "Add to Calendar": "Add to Calendar",
      "Host Tools": "Host Tools",
      "Discover Sessions": "Discover Sessions",
      "Community": "Community",
      "Community Feed": "Community Feed",
      "Share an update, idea, or achievement...": "Share an update, idea, or achievement...",
      "Post": "Post",
      "Drafts": "Drafts",
      "Saved": "Saved",
      "Trending Tags": "Trending Tags",
      "Followers": "Followers",
      "Following": "Following",
      "Search community...": "Search community...",
      "Sort by": "Sort by",
      "Recent": "Recent",
      "Top": "Top",
      "No posts found": "No posts found",
      "Moderation": "Moderation",
      "Approve": "Approve",
      "Reject": "Reject",
      "Warn User": "Warn User",
      "Flagged Posts": "Flagged Posts"
    }
  },
  es: {
    translation: {
      
      "Take Quiz": "Tomar Prueba",
      "Submit": "Enviar",
      "Time Remaining": "Tiempo Restante",
      "Leaderboard": "Tabla de Clasificación",
      "Correct": "Correcto",
      "Incorrect": "Incorrecto",
      "Your Score": "Tu Puntuación",

      "Virtual Classroom": "Aula Virtual",
      "Live and scheduled learning sessions.": "Sesiones de aprendizaje en vivo y programadas.",
      "Schedule Class": "Programar Clase",
      "No classrooms scheduled yet.": "Aún no hay aulas programadas.",
      "Join Room": "Entrar a la sala",
      "Enter Classroom": "Entrar al Aula",
      "LIVE": "EN VIVO",
      "RSVP": "Reservar",
      "Join Waitlist (Free)": "Unirse a lista de espera (Gratis)",
      "Share": "Compartir",
      "Follow Host": "Seguir al Anfitrión",
      "Load More Sessions": "Cargar Más Sesiones",
      "Focus Mode": "Modo Enfoque",
      "Show Sidebar": "Mostrar Barra Lateral",
      "Session Tools": "Herramientas de Sesión",
      "Report": "Reportar",
      "AI Classroom Assistant": "Asistente de IA",
      "Thinking...": "Pensando...",
      "Add to Calendar": "Añadir al Calendario",
      "Host Tools": "Herramientas de Anfitrión",
      "Discover Sessions": "Descubrir Sesiones",
      "Community": "Comunidad",
      "Community Feed": "Feed de la Comunidad",
      "Share an update, idea, or achievement...": "Comparte una actualización, idea o logro...",
      "Post": "Publicar",
      "Drafts": "Borradores",
      "Saved": "Guardado",
      "Trending Tags": "Etiquetas Populares",
      "Followers": "Seguidores",
      "Following": "Siguiendo",
      "Search community...": "Buscar en la comunidad...",
      "Sort by": "Ordenar por",
      "Recent": "Reciente",
      "Top": "Mejor",
      "No posts found": "No se encontraron publicaciones",
      "Moderation": "Moderación",
      "Approve": "Aprobar",
      "Reject": "Rechazar",
      "Warn User": "Advertir Usuario",
      "Flagged Posts": "Publicaciones Marcadas"
    }
  },
  ar: {
    translation: {
      
      "Take Quiz": "بدء الاختبار",
      "Submit": "إرسال",
      "Time Remaining": "الوقت المتبقي",
      "Leaderboard": "لوحة الصدارة",
      "Correct": "صحيح",
      "Incorrect": "غير صحيح",
      "Your Score": "نتيجتك",

      "Virtual Classroom": "الفصل الافتراضي",
      "Live and scheduled learning sessions.": "جلسات التعلم المباشرة والمجدولة.",
      "Schedule Class": "جدولة فصل",
      "No classrooms scheduled yet.": "لم تتم جدولة أي فصول بعد.",
      "Join Room": "انضمام للغرفة",
      "Enter Classroom": "دخول الفصل",
      "LIVE": "مباشر",
      "RSVP": "تأكيد الحضور",
      "Join Waitlist (Free)": "الانضمام لقائمة الانتظار (مجاناً)",
      "Share": "مشاركة",
      "Follow Host": "متابعة المضيف",
      "Load More Sessions": "تحميل المزيد من الجلسات",
      "Focus Mode": "وضع التركيز",
      "Show Sidebar": "إظهار الشريط الجانبي",
      "Session Tools": "أدوات الجلسة",
      "Report": "إبلاغ",
      "AI Classroom Assistant": "مساعد الذكاء الاصطناعي",
      "Thinking...": "يفكر...",
      "Add to Calendar": "إضافة للتقويم",
      "Host Tools": "أدوات المضيف",
      "Discover Sessions": "اكتشاف الجلسات",
      "Community": "المجتمع",
      "Community Feed": "تغذية المجتمع",
      "Share an update, idea, or achievement...": "شارك تحديثاً أو فكرة أو إنجازاً...",
      "Post": "نشر",
      "Drafts": "مسودات",
      "Saved": "محفوظ",
      "Trending Tags": "العلامات الرائجة",
      "Followers": "متابعون",
      "Following": "يتابع",
      "Search community...": "ابحث في المجتمع...",
      "Sort by": "ترتيب حسب",
      "Recent": "الأحدث",
      "Top": "الأفضل",
      "No posts found": "لم يتم العثور على منشورات",
      "Moderation": "إشراف",
      "Approve": "موافقة",
      "Reject": "رفض",
      "Warn User": "تحذير المستخدم",
      "Flagged Posts": "المنشورات المبلغ عنها"
    }
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: "en", // language to use, more will be detected dynamically from user profile
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
