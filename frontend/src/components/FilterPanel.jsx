import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select } from './ui';
import { EXPENSE_CATEGORIES } from '../utils/constants';

export default function FilterPanel({
  filters,
  setFilters,
  onClear,
  hasActiveFilters,
  departments,
  showDepartmentFilter = false,
  showApprovalFilter = false
}) {
  const handleChange = (key, value) => setFilters({ ...filters, [key]: value });

  const setRange = (days) => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - days);
    setFilters({
      ...filters,
      startDate: start.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    });
  };

  const setToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setFilters({ ...filters, startDate: today, endDate: today });
  };

  return (
    <Card className="mb-8 bg-white/90 shadow-sm animate-slideDown">
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border p-5">
        <CardTitle className="flex items-center gap-2 text-base">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Filters
        </CardTitle>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground">
            <X className="h-4 w-4" />
            Clear all
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Label className="mb-2 flex items-center gap-1.5"><Search className="h-3.5 w-3.5" />Search</Label>
            <Input type="text" placeholder="Search transactions..." value={filters.search} onChange={(e) => handleChange('search', e.target.value)} />
          </div>
          <div>
            <Label className="mb-2 block">Start Date</Label>
            <Input type="date" value={filters.startDate} onChange={(e) => handleChange('startDate', e.target.value)} />
          </div>
          <div>
            <Label className="mb-2 block">End Date</Label>
            <Input type="date" value={filters.endDate} onChange={(e) => handleChange('endDate', e.target.value)} />
          </div>
          <div>
            <Label className="mb-2 block">Type</Label>
            <Select value={filters.type} onChange={(e) => handleChange('type', e.target.value)}>
              <option value="">All Types</option>
              <option value="ALLOCATION">Allocation</option>
              <option value="EXPENSE">Expense</option>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">Category</Label>
            <Select value={filters.category} onChange={(e) => handleChange('category', e.target.value)}>
              <option value="">All Categories</option>
              {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </Select>
          </div>
          {showApprovalFilter && (
            <div>
              <Label className="mb-2 block">Status</Label>
              <Select value={filters.approvalStatus} onChange={(e) => handleChange('approvalStatus', e.target.value)}>
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </Select>
            </div>
          )}
          {showDepartmentFilter && departments && (
            <div>
              <Label className="mb-2 block">Department</Label>
              <Select value={filters.department} onChange={(e) => handleChange('department', e.target.value)}>
                <option value="">All Departments</option>
                {departments.map(dept => <option key={dept._id} value={dept._id}>{dept.name}</option>)}
              </Select>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={setToday}>Today</Button>
          <Button variant="outline" size="sm" onClick={() => setRange(7)}>Last 7 days</Button>
          <Button variant="outline" size="sm" onClick={() => setRange(30)}>Last 30 days</Button>
        </div>
      </CardContent>
    </Card>
  );
}
