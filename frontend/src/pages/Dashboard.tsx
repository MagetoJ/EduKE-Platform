import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api, DashboardStats, FinancialReport } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUp, AlertTriangle, FileText, Users, GraduationCap, BookOpen, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { BranchSelector } from '@/components/BranchSelector';

type DateRange = 'today' | '30days' | 'quarter';

interface DateRangeOption {
  value: DateRange;
  label: string;
  days: number;
}

const DATE_RANGE_OPTIONS: DateRangeOption[] = [
  { value: 'today', label: 'Today', days: 1 },
  { value: '30days', label: 'Last 30 Days', days: 30 },
  { value: 'quarter', label: 'Last 3 Months', days: 90 },
];

const DEFAULT_DATE_RANGE: DateRange = '30days';
const STORAGE_KEY = 'dashboard-date-range';

export function Dashboard() {
  const { token, user } = useAuth();
  const permissions = usePermissions();
  const isStaff = user?.role === 'staff';

  const [stats, setStats] = useState<DashboardStats | null>(() => {
    const cached = localStorage.getItem('cached-dashboard-stats');
    return cached ? JSON.parse(cached) : null;
  });
  const [report, setReport] = useState<FinancialReport | null>(() => {
    const cached = localStorage.getItem('cached-dashboard-report');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(!stats);
  const [isOffline, setIsOffline] = useState(false);

  // Branch filtering state
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(() => {
    // Branch admins: locked to their branch
    if (permissions.isBranchAdmin && user?.branch_id) {
      return user.branch_id;
    }
    // Owners: default to "All Locations" (null)
    return null;
  });

  // Date range state with localStorage persistence
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as DateRange) || DEFAULT_DATE_RANGE;
  });

  // Derived state for selected option
  const selectedOption = DATE_RANGE_OPTIONS.find(
    opt => opt.value === selectedDateRange
  ) || DATE_RANGE_OPTIONS[1];

  // Lock branch admins to their branch
  useEffect(() => {
    if (permissions.isBranchAdmin && user?.branch_id) {
      setSelectedBranchId(user.branch_id);
    }
  }, [permissions.isBranchAdmin, user?.branch_id]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      setLoading(true);
      setIsOffline(false);
      try {
        const [statsData, reportData] = await Promise.all([
          api.getDashboardStats(token, selectedBranchId),
          api.getFinancialReport(token, selectedOption.days, selectedBranchId),
        ]);
        setStats(statsData);
        setReport(reportData);
        // Cache data for offline use
        localStorage.setItem('cached-dashboard-stats', JSON.stringify(statsData));
        localStorage.setItem('cached-dashboard-report', JSON.stringify(reportData));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setIsOffline(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, selectedDateRange, selectedBranchId]);

  const handleDateRangeChange = (range: DateRange) => {
    setSelectedDateRange(range);
    localStorage.setItem(STORAGE_KEY, range);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Filters and Branch Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 flex items-center gap-2">
            {isStaff ? 'My Performance' : 'School Dashboard'}
            {isOffline && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Offline Mode (Cached Data)
              </span>
            )}
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Welcome back! Here's your school overview.
          </p>
        </div>

        {/* Filters: Branch Selector + Date Range */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Branch Selector - Only for owners */}
          {permissions.isOwner && (
            <BranchSelector
              selectedBranchId={selectedBranchId}
              onBranchChange={setSelectedBranchId}
            />
          )}

          {/* Date Range Filter */}
          <div className="flex flex-wrap gap-2">
          {DATE_RANGE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={selectedDateRange === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDateRangeChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Total Students Card */}
        <Card className="overflow-hidden border-indigo-100 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Active Students</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">
                  {stats?.total_students || 0}
                </p>
                <Link to="/customers" className="text-xs text-indigo-600 hover:underline mt-1 inline-block">
                  View Directory →
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Classes Card */}
        <Card className="overflow-hidden border-emerald-100 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">
                  {stats?.total_classes || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Across all streams</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Subjects Card */}
        <Card className="overflow-hidden border-amber-100 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-3 rounded-lg text-amber-600">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Subjects Offered</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">
                  {stats?.total_subjects || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Academic curriculum</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Performance Card */}
        <Card className="overflow-hidden border-rose-100 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-rose-100 p-3 rounded-lg text-rose-600">
                <Award className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Avg. Performance</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">
                  {(stats?.avg_grade || 0).toFixed(1)}%
                </p>
                <Link to="/gradebook" className="text-xs text-rose-600 hover:underline mt-1 inline-block">
                  View Gradebook →
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial & Academic Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fee Collection Card */}
        <Card className="lg:col-span-1 border-primary-100 bg-primary-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-900">Fee Collection Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary-900">
              {formatCurrency(report?.total_revenue || 0)}
            </p>
            <div className="flex items-center gap-1 mt-2 text-sm text-primary-700">
              <ArrowUp className="w-4 h-4" />
              <span>{selectedOption.label}</span>
            </div>
            <div className="mt-4 pt-4 border-t border-primary-100 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-primary-700">School Expenses</span>
                <span className="font-semibold text-red-600">{formatCurrency(report?.total_expenses || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-primary-700">Net Surplus</span>
                <span className="font-bold text-green-700">
                  {formatCurrency((report?.total_profit || 0) - (report?.total_expenses || 0))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Collection Trend Chart - Hidden for "Today" view */}
        {selectedDateRange !== 'today' && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">
                {isStaff ? `My Collection Trend (${selectedOption.label})` : `Collection Trend (${selectedOption.label})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={report?.revenue_by_date || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#16a34a"
                    strokeWidth={2}
                    name="Fees"
                    dot={{ fill: '#16a34a', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* View Detailed Reports Link */}
      <Card className="bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
              <div className="bg-primary-100 text-primary-600 rounded-lg p-3">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Need More Insights?</h3>
                <p className="text-sm text-gray-600 mt-1">Access detailed academic and financial reports.</p>
              </div>
            </div>
            <Link to="/reports">
              <Button variant="default" size="sm" className="flex-shrink-0">
                View Detailed Reports →
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
