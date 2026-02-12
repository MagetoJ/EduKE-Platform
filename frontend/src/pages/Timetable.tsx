import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api, GradeLevel, Subject, TimetableEntry, DayOfWeek } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calendar, Clock, MapPin, User, Plus, Trash2 } from 'lucide-react';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function Timetable() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const [gl, sub] = await Promise.all([
          api.getGradeLevels(token),
          api.getSubjects(token)
        ]);
        setGradeLevels(gl);
        setSubjects(sub);
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
      }
    };
    fetchData();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        // If teacher, only fetch their own blocks as per RBAC plan
        const teacherId = isAdmin ? undefined : user?.id;
        const data = await api.getTimetable(
          token, 
          selectedGrade === 'all' ? undefined : selectedGrade,
          teacherId
        );
        setTimetable(data);
      } catch (err) {
        console.error('Failed to fetch timetable:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, [token, selectedGrade]);

  const handleDeleteEntry = async (entryId: number) => {
    if (!token || !confirm('Are you sure you want to delete this entry?')) return;
    try {
      await api.deleteTimetableEntry(token, entryId);
      setTimetable(prev => prev.filter(e => e.id !== entryId));
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary-600" />
            Class Timetable
          </h1>
          <p className="text-sm text-gray-600">View and manage school schedules</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
          >
            <option value="all">All Classes</option>
            {gradeLevels.map(gl => (
              <option key={gl.id} value={gl.id}>{gl.name}</option>
            ))}
          </select>
          {isAdmin && (
            <Button size="sm" className="bg-primary-600 hover:bg-primary-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {DAYS.map(day => (
          <div key={day} className="space-y-4">
            <div className="bg-gray-100 p-2 rounded-lg text-center font-semibold text-gray-700 text-sm">
              {day}
            </div>
            <div className="space-y-3">
              {timetable.filter(e => e.day_of_week === day).length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-xs">
                  No lessons
                </div>
              ) : (
                timetable
                  .filter(e => e.day_of_week === day)
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map(entry => (
                    <Card key={entry.id} className="shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-3 space-y-2 relative group">
                        {isAdmin && (
                          <button 
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        <div className="font-bold text-sm text-primary-700 truncate">
                          {entry.subject_name}
                        </div>
                        <div className="flex items-center text-[10px] text-gray-500 gap-1">
                          <Clock className="w-3 h-3" />
                          {entry.start_time} - {entry.end_time}
                        </div>
                        {entry.teacher_name && (
                          <div className="flex items-center text-[10px] text-gray-500 gap-1">
                            <User className="w-3 h-3" />
                            {entry.teacher_name}
                          </div>
                        )}
                        {entry.room && (
                          <div className="flex items-center text-[10px] text-gray-500 gap-1">
                            <MapPin className="w-3 h-3" />
                            {entry.room}
                          </div>
                        )}
                        <div className="mt-1 inline-block px-1.5 py-0.5 bg-gray-100 text-[10px] rounded text-gray-600">
                          {entry.grade_level_name}
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
