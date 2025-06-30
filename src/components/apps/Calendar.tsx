import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, X, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  description?: string;
}

export const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    time: '',
    location: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user, currentDate]);

  const loadEvents = async () => {
    if (!user) return;
    
    try {
      // Load events for the current month
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('event_date', startOfMonth.toISOString().split('T')[0])
        .lte('event_date', endOfMonth.toISOString().split('T')[0]);

      if (error) throw error;

      const formattedEvents: Event[] = data.map(event => ({
        id: event.id,
        title: event.title,
        date: event.event_date,
        time: event.event_time || '',
        location: event.location || '',
        description: event.description || ''
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: "Error Loading Events",
        description: "Failed to load calendar events",
        variant: "destructive",
      });
    }
  };

  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentMonth + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getDaysInCalendar = () => {
    const days = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(start));
      start.setDate(start.getDate() + 1);
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth;
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setEditingEvent(null);
    setNewEvent({ title: '', time: '', location: '', description: '' });
    setShowEventDialog(true);
  };

  const handleEventClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      time: event.time,
      location: event.location || '',
      description: event.description || ''
    });
    setShowEventDialog(true);
  };

  const handleCreateOrUpdateEvent = async () => {
    if (!user || (!selectedDate && !editingEvent) || !newEvent.title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter an event title",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (editingEvent) {
        // Update existing event
        const { error } = await supabase
          .from('calendar_events')
          .update({
            title: newEvent.title,
            event_time: newEvent.time || null,
            location: newEvent.location || null,
            description: newEvent.description || null
          })
          .eq('id', editingEvent.id)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update local state
        setEvents(events.map(event => 
          event.id === editingEvent.id 
            ? { ...event, ...newEvent }
            : event
        ));

        toast({
          title: "Event Updated",
          description: "Calendar event updated successfully",
        });
      } else {
        // Create new event
        const eventData = {
          user_id: user.id,
          title: newEvent.title,
          event_date: selectedDate!.toISOString().split('T')[0],
          event_time: newEvent.time || null,
          location: newEvent.location || null,
          description: newEvent.description || null
        };

        const { data, error } = await supabase
          .from('calendar_events')
          .insert(eventData)
          .select()
          .single();

        if (error) throw error;

        const formattedEvent: Event = {
          id: data.id,
          title: data.title,
          date: data.event_date,
          time: data.event_time || '',
          location: data.location || '',
          description: data.description || ''
        };

        setEvents([...events, formattedEvent]);

        toast({
          title: "Event Created",
          description: "Calendar event created successfully",
        });
      }

      setNewEvent({ title: '', time: '', location: '', description: '' });
      setShowEventDialog(false);
      setSelectedDate(null);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: "Error",
        description: "Failed to save calendar event",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!editingEvent || !user) return;

    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', editingEvent.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setEvents(events.filter(event => event.id !== editingEvent.id));
      setShowEventDialog(false);
      setEditingEvent(null);

      toast({
        title: "Event Deleted",
        description: "Calendar event deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete calendar event",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full flex bg-slate-900 text-white">
      {/* Calendar Grid */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => navigateMonth('prev')}
                size="sm"
                variant="outline"
                className="border-slate-600"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => navigateMonth('next')}
                size="sm"
                variant="outline"
                className="border-slate-600"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button
            onClick={() => setCurrentDate(new Date())}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Today
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Week Headers */}
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center font-semibold text-slate-400 text-sm">
              {day}
            </div>
          ))}
          
          {/* Calendar Days */}
          {getDaysInCalendar().map((date, index) => {
            const dayEvents = getEventsForDate(date);
            return (
              <div
                key={index}
                className={`min-h-24 p-2 border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors ${
                  isCurrentMonth(date) ? 'bg-slate-900' : 'bg-slate-800/50'
                } ${
                  isToday(date) ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleDateClick(date)}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isCurrentMonth(date) 
                    ? isToday(date) 
                      ? 'text-blue-400' 
                      : 'text-white'
                    : 'text-slate-500'
                }`}>
                  {date.getDate()}
                </div>
                
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded mb-1 truncate hover:bg-blue-600/30 transition-colors"
                    onClick={(e) => handleEventClick(event, e)}
                  >
                    {event.time && <span className="mr-1">{event.time}</span>}
                    {event.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 border-l border-slate-700 p-6">
        <h3 className="text-lg font-semibold mb-4">Today's Events</h3>
        
        <div className="space-y-4">
          {getEventsForDate(today).map(event => (
            <div 
              key={event.id} 
              className="bg-slate-800 rounded-lg p-4 border border-slate-700 cursor-pointer hover:bg-slate-700 transition-colors"
              onClick={(e) => handleEventClick(event, e)}
            >
              <h4 className="font-medium mb-2">{event.title}</h4>
              <div className="space-y-2 text-sm text-slate-400">
                {event.time && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{event.time}</span>
                  </div>
                )}
                {event.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
              {event.description && (
                <p className="text-sm text-slate-300 mt-3">{event.description}</p>
              )}
            </div>
          ))}
          
          {getEventsForDate(today).length === 0 && (
            <div className="text-center text-slate-400 py-8">
              <Clock className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>No events today</p>
            </div>
          )}
        </div>
      </div>

      {/* Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingEvent ? 'Edit Event' : `Create Event - ${selectedDate?.toLocaleDateString()}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Event title"
              value={newEvent.title}
              onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
              className="bg-slate-700 border-slate-600 text-white"
            />
            <Input
              type="time"
              placeholder="Time (optional)"
              value={newEvent.time}
              onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
              className="bg-slate-700 border-slate-600 text-white"
            />
            <Input
              placeholder="Location (optional)"
              value={newEvent.location}
              onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
              className="bg-slate-700 border-slate-600 text-white"
            />
            <Textarea
              placeholder="Description (optional)"
              value={newEvent.description}
              onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
              className="bg-slate-700 border-slate-600 text-white"
              rows={3}
            />
            <div className="flex space-x-2">
              <Button
                onClick={handleCreateOrUpdateEvent}
                disabled={loading || !newEvent.title.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
              </Button>
              {editingEvent && (
                <Button
                  onClick={handleDeleteEvent}
                  variant="destructive"
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                onClick={() => setShowEventDialog(false)}
                variant="outline"
                className="border-slate-600"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};