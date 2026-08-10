import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, isToday, eachDayOfInterval } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";

export const CalendarView = ({ currentMonth, setCurrentMonth, events, typeColorClass }: any) => {
  const navigate = useNavigate();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const today = () => setCurrentMonth(new Date());

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={today}>Today</Button>
          <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {weekDays.map(d => (
          <div key={d} className="p-3 text-center text-sm font-medium text-muted-foreground">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayEvents = events.filter((e: any) => isSameDay(new Date(e.startDate), day));
          const isCurrMonth = isSameMonth(day, monthStart);
          return (
            <div 
              key={day.toString()} 
              className={`min-h-[120px] p-2 border-r border-b ${!isCurrMonth ? 'bg-muted/10 text-muted-foreground' : ''} ${isToday(day) ? 'bg-primary/5' : ''}`}
            >
              <div className={`text-right text-sm mb-1 ${isToday(day) ? 'font-bold text-primary' : ''}`}>
                {format(day, dateFormat)}
              </div>
              <div className="space-y-1">
                {dayEvents.length > 0 ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="cursor-pointer space-y-1">
                        {dayEvents.slice(0, 3).map((e: any) => (
                          <div key={e.id} className={`text-xs p-1 px-2 rounded truncate ${typeColorClass(e.eventType)}`} title={e.title}>
                            {e.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground text-center font-medium">+{dayEvents.length - 3} more</div>
                        )}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="start">
                      <div className="p-3 font-semibold border-b flex justify-between items-center">
                        {format(day, "MMMM do, yyyy")}
                        <Badge variant="secondary">{dayEvents.length} Events</Badge>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {dayEvents.map((e: any) => (
                          <div key={e.id} className="p-3 border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate(`/events/${e.id}`)}>
                            <div className="flex gap-2 items-center mb-1">
                              <div className={`w-2 h-2 rounded-full ${typeColorClass(e.eventType).split(' ')[0]}`} />
                              <span className="font-medium text-sm line-clamp-1">{e.title}</span>
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center justify-between pl-4">
                              <span>{e.startTime}</span>
                              <span className="capitalize">{e.eventType}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <div className="h-full w-full"></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
