import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User } from 'lucide-react';
import { useEmployeeIdentity } from '@/hooks/useEmployeeIdentity';
import { EmployeeIdentityModal } from './EmployeeIdentityModal';

export const EmployeeIdentityBadge = () => {
  const { identity, setEmployee, clearEmployee } = useEmployeeIdentity();
  const [open, setOpen] = useState(false);

  if (!identity) {
    return (
      <>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="text-xs">
          <User className="w-3 h-3 mr-1" /> Chọn nhân viên
        </Button>
        <EmployeeIdentityModal
          open={open}
          onClose={() => setOpen(false)}
          onSelected={(id, name) => { setEmployee(id, name); setOpen(false); }}
          dismissible
        />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="text-xs">
            <User className="w-3 h-3 mr-1" /> {identity.employee_name}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => { clearEmployee(); setOpen(true); }}>Đổi nhân viên</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EmployeeIdentityModal
        open={open}
        onClose={() => setOpen(false)}
        onSelected={(id, name) => { setEmployee(id, name); setOpen(false); }}
        dismissible
      />
    </>
  );
};
