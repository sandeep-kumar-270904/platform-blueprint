import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// In a real production app, we would load these asynchronously or use a backend plugin
const resources = {
  en: {
    translation: {
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
      "Discover Sessions": "Discover Sessions"
    }
  },
  es: {
    translation: {
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
      "Discover Sessions": "Descubrir Sesiones"
    }
  },
  ar: {
    translation: {
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
      "Discover Sessions": "اكتشاف الجلسات"
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
