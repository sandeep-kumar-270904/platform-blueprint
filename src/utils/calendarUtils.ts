/**
 * Formats a given date/time string to the specified timezone and locale.
 * Fallbacks to the browser's local timezone if none is provided.
 */
export const formatToTimezone = (
  dateString: string, 
  timezone?: string, 
  locale: string = 'en-US'
): string => {
  try {
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const date = new Date(dateString);
    
    return new Intl.DateTimeFormat(locale, {
      timeZone: tz,
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  } catch (e) {
    console.error("Error formatting timezone", e);
    // fallback
    return new Date(dateString).toLocaleString();
  }
};

/**
 * Generates an ICS file for adding an event to a calendar.
 */
export const generateICS = (
  title: string,
  description: string,
  startTimeStr: string,
  durationMinutes: number = 60,
  url: string
): string => {
  const startDate = new Date(startTimeStr);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Platform//Virtual Classroom//EN
BEGIN:VEVENT
UID:${startDate.getTime()}@platform.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${title}
DESCRIPTION:${description}\\n\\nJoin here: ${url}
URL:${url}
END:VEVENT
END:VCALENDAR`;
};

/**
 * Triggers a download of an ICS file.
 */
export const downloadICS = (title: string, icsData: string) => {
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

/**
 * Generates a Google Calendar link.
 */
export const generateGoogleCalendarLink = (
  title: string,
  description: string,
  startTimeStr: string,
  durationMinutes: number = 60,
  url: string
): string => {
  const startDate = new Date(startTimeStr);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const details = encodeURIComponent(`${description}\n\nJoin here: ${url}`);
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${details}&text=${encodeURIComponent(title)}`;
};
