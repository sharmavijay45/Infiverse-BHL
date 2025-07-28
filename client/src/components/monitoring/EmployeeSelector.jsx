import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Building } from 'lucide-react';

export function EmployeeSelector({ employees, selectedEmployee, onEmployeeSelect }) {
  if (!employees || employees.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">No employees found</p>
      </div>
    );
  }

  return (
    <div className="h-64 overflow-y-auto">
      <div className="space-y-2">
        {employees.map((employee) => (
          <div
            key={employee._id}
            onClick={() => onEmployeeSelect(employee)}
            className={`p-3 rounded-xl cursor-pointer transition-cyber hover:neo-inset ${
              selectedEmployee?._id === employee._id 
                ? 'neo-inset border-primary/50' 
                : 'neo-card hover:border-primary/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                <AvatarImage src={employee.avatar} alt={employee.name} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                  {employee.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-foreground truncate">
                    {employee.name}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {employee.role}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{employee.email}</span>
                  </div>
                  {employee.department && (
                    <div className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      <span>{employee.department.name}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedEmployee?._id === employee._id && (
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse-cyber"></div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
