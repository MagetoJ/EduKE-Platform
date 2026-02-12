import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api, TimetableEntry, DayOfWeek } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calendar, Clock, MapPin, BookOpen, GraduationCap, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function TeacherDashboard() {
  const { token, user } = useAuth();
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    
    const fetchMyTimetable = async () => {
      try {
        setLoading(true);
        const data = await api.getMyTimetable(token);
        setTimetable(data);
      } catch (err) {
        console.error('Failed to fetch my timetable:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyTimetable();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Get unique classes/grade levels from timetable
  const assignedClasses = Array.from(new Set(timetable.map(e => e.grade_level_id)))
    .map(id => {
      const entry = timetable.find(e => e.grade_level_id === id);
      return {
        id,
        name: entry?.grade_level_name || 'Unknown Class'
      };
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Here's your teaching schedule and class overview.
          </p>
        </div>
      </div>

      {/* Quick Stats / Assigned Classes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-indigo-100 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Assigned Classes</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">
                  {assignedClasses.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Lessons This Week</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">
                  {timetable.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-3 rounded-lg text-amber-600">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Active Terms</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Weekly Schedule View */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-600" />
              My Weekly Schedule
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {DAYS.map(day => {
              const dayLessons = timetable
                .filter(e => e.day_of_week === day)
                .sort((a, b) => a.start_time.localeCompare(b.start_time));
              
              return (
                <div key={day} className="space-y-2">
                  <div className="bg-gray-100 p-2 rounded text-center font-medium text-gray-700 text-xs">
                    {day}
                  </div>
                  <div className="space-y-2">
                    {dayLessons.length === 0 ? (
                      <div className="text-center py-4 border border-dashed border-gray-200 rounded text-gray-400 text-[10px]">
                        No classes
                      </div>
                    ) : (
                      dayLessons.map(entry => (
                        <div 
                          key={entry.id} 
                          className="p-2 bg-white border border-gray-200 rounded shadow-sm space-y-1"
                        >
                          <div className="font-bold text-[10px] text-primary-700 truncate">
                            {entry.subject_name}
                          </div>
                          <div className="flex items-center text-[9px] text-gray-500 gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {entry.start_time}
                          </div>
                          <div className="text-[9px] font-medium text-gray-600">
                            {entry.grade_level_name}
                          </div>
                          {entry.room && (
                            <div className="flex items-center text-[8px] text-gray-400 gap-0.5">
                              <MapPin className="w-2 h-2" />
                              {entry.room}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Assigned Classes Quick Links */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <div className="space-y-3">
            {assignedClasses.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No classes assigned yet.</p>
            ) : (
              assignedClasses.map(cls => (
                <Card key={cls.id} className="hover:border-primary-300 transition-colors shadow-none">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-2">
                      <div className="font-semibold text-gray-900">{cls.name}</div>
                      <Link 
                        to={`/gradebook?grade_level_id=${cls.id}`}
                        className="flex items-center justify-between text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Open Gradebook
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
            
            <Link to="/gradebook">
              <Button variant="outline" className="w-full justify-start text-sm mt-2">
                <BookOpen className="w-4 h-4 mr-2" />
                All Gradebooks
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
