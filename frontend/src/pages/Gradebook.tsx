import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api, Student, GradeLevel, Subject, Assessment, GradeRecord } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BookOpen, Search, Save, ChevronRight, GraduationCap } from 'lucide-react';

export function Gradebook() {
  const { token } = useAuth();
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<number, number>>({});
  const [remarks, setRemarks] = useState<Record<number, string>>({});
  
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>('all');
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [selectedAssessment, setSelectedAssessment] = useState<number | ''>('');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const [gl, sub, ass] = await Promise.all([
          api.getGradeLevels(token),
          api.getSubjects(token),
          api.getAssessments(token)
        ]);
        setGradeLevels(gl);
        setSubjects(sub);
        setAssessments(ass);
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
      }
    };
    fetchData();
  }, [token]);

  useEffect(() => {
    if (!token || selectedGrade === 'all') {
      setStudents([]);
      return;
    }
    
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const data = await api.getStudents(token, selectedGrade as number);
        setStudents(data);
        
        // Reset marks when student list changes
        setMarks({});
        setRemarks({});
      } catch (err) {
        console.error('Failed to fetch students:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [token, selectedGrade]);

  const handleMarkChange = (studentId: number, value: string) => {
    const numValue = parseFloat(value);
    setMarks(prev => ({ ...prev, [studentId]: isNaN(numValue) ? 0 : numValue }));
  };

  const handleRemarkChange = (studentId: number, value: string) => {
    setRemarks(prev => ({ ...prev, [studentId]: value }));
  };

  const handleSaveAll = async () => {
    if (!token || !selectedSubject || !selectedAssessment) return;
    
    try {
      setSaving(true);
      const promises = Object.entries(marks).map(([studentId, mark]) => 
        api.enterGrade(token, {
          student_id: parseInt(studentId),
          subject_id: selectedSubject as number,
          assessment_id: selectedAssessment as number,
          marks_obtained: mark,
          remarks: remarks[parseInt(studentId)] || ''
        })
      );
      
      await Promise.all(promises);
      setSuccessMessage('Grades saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to save grades:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary-600" />
            Student Gradebook
          </h1>
          <p className="text-sm text-gray-600">Enter and manage student marks and assessments</p>
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      {/* Selection Header */}
      <Card className="bg-white shadow-sm border-gray-200">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade / Class</label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              >
                <option value="all">Select a Class</option>
                {gradeLevels.map(gl => (
                  <option key={gl.id} value={gl.id}>{gl.name} {gl.stream ? `(${gl.stream})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value ? parseInt(e.target.value) : '')}
              >
                <option value="">Select a Subject</option>
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name} {sub.code ? `[${sub.code}]` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assessment / Exam</label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                value={selectedAssessment}
                onChange={(e) => setSelectedAssessment(e.target.value ? parseInt(e.target.value) : '')}
              >
                <option value="">Select an Assessment</option>
                {assessments.map(ass => (
                  <option key={ass.id} value={ass.id}>{ass.name} ({ass.term_name || 'N/A'})</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grade Entry Table */}
      {selectedGrade !== 'all' && selectedSubject && selectedAssessment ? (
        <Card className="overflow-hidden border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 border-b border-gray-200 py-3 sm:py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-gray-500" />
              Grading for {students.length} Students
            </CardTitle>
            <Button 
              size="sm" 
              onClick={handleSaveAll} 
              disabled={saving || Object.keys(marks).length === 0}
              className="bg-primary-600 hover:bg-primary-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save All Marks'}
            </Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adm No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks (/{assessments.find(a => a.id === selectedAssessment)?.max_marks || 100})</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">Loading student list...</td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">No students found in this class</td>
                  </tr>
                ) : (
                  students.map(student => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.admission_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.first_name} {student.last_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Input
                          type="number"
                          className="w-24 text-center border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="0.0"
                          value={marks[student.id] ?? ''}
                          onChange={(e) => handleMarkChange(student.id, e.target.value)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Input
                          className="w-full min-w-[200px] border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Add a remark..."
                          value={remarks[student.id] || ''}
                          onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to grade?</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Please select a class, subject, and assessment from the filters above to load the student list and start entering marks.
          </p>
        </div>
      )}
    </div>
  );
}
