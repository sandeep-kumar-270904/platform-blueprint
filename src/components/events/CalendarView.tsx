import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, isToday, eachDayOfInterval } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react";
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
    <div className="bg-card/80 backdrop-blur-sm border-muted/60 rounded-3xl overflow-hidden shadow-xl">
      <div className="flex items-center justify-between p-6 md:px-8 border-b bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <CalendarIcon className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">{format(currentMonth, "MMMM yyyy")}</h2>
        </div>
        <div className="flex items-center gap-2 bg-background p-1.5 rounded-2xl shadow-sm border">
          <Button variant="ghost" size="sm" className="rounded-xl font-bold" onClick={today}>Today</Button>
          <div className="w-[1px] h-4 bg-muted mx-1" />
          <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 hover:bg-muted/50" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 hover:bg-muted/50" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 border-b bg-muted/10">
        {weekDays.map(d => (
          <div key={d} className="py-4 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">{d}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 bg-background">
        {days.map((day, i) => {
          const dayEvents = events.filter((e: any) => isSameDay(new Date(e.startDate), day));
          const isCurrMonth = isSameMonth(day, monthStart);
          const isCurrentDay = isToday(day);
          
          return (
            <div 
              key={day.toString()} 
              className={`min-h-[140px] p-2 md:p-3 border-r border-b transition-colors group
                ${!isCurrMonth ? 'bg-muted/20 text-muted-foreground/50' : 'hover:bg-muted/5'} 
                ${isCurrentDay ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : ''}`}
            >
              <div className="flex justify-end mb-2">
                <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all
                  ${isCurrentDay ? 'bg-primary text-primary-foreground shadow-md' : 'group-hover:bg-muted/50'}
                `}>
                  {format(day, dateFormat)}
                </div>
              </div>
              
              <div className="space-y-1.5">
                {dayEvents.length > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="cursor-pointer space-y-1.5">
                        {dayEvents.slice(0, 3).map((e: any) => (
                          <div 
                            key={e.id} 
                            className={`text-[11px] font-medium p-1.5 px-2.5 rounded-lg truncate shadow-sm transition-transform hover:scale-[1.02] border border-transparent hover:border-muted-foreground/20
                            ${typeColorClass(e.eventType)}`} 
                            title={e.title}
                          >
                            {e.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-[10px] font-bold text-muted-foreground text-center bg-muted/30 rounded-md py-1">+{dayEvents.length - 3} more</div>
                        )}
                      </div>
                    </PopoverTrigger>
                    
                    <PopoverContent className="w-80 p-0 rounded-2xl shadow-xl overflow-hidden border-muted/50" align="start">
                      <div className="p-4 bg-muted/30 border-b flex justify-between items-center">
                        <span className="font-bold">{format(day, "MMMM do, yyyy")}</span>
                        <Badge variant="outline" className="bg-background shadow-sm border-muted">{dayEvents.length} Events</Badge>
                      </div>
                      <div className="max-h-[320px] overflow-y-auto">
                        {dayEvents.map((e: any) => (
                          <div 
                            key={e.id} 
                            className="p-4 border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors group/item" 
                            onClick={() => navigate(`/events/${e.id}`)}
                          >
                            <div className="flex gap-2.5 items-start mb-1.5">
                              <div className={`w-2.5 h-2.5 mt-1 rounded-full shrink-0 shadow-sm ${typeColorClass(e.eventType).split(' ')[0]}`} />
                              <span className="font-semibold text-sm line-clamp-2 leading-tight group-hover/item:text-primary transition-colors">{e.title}</span>
                            </div>
                            <div className="text-[11px] font-medium text-muted-foreground flex items-center justify-between pl-5">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {e.startTime}</span>
                              <Badge variant="secondary" className="text-[9px] uppercase tracking-wider px-1.5 py-0 bg-muted/50">{e.eventType}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
