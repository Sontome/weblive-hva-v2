import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Employee { id: string; name: string }

interface Props {
  open: boolean;
  onClose?: () => void;
  onSelected: (employeeId: string, employeeName: string) => void;
  dismissible?: boolean;
}

export const EmployeeIdentityModal = ({ open, onClose, onSelected, dismissible }: Props) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from('employees').select('id,name,active').eq('active', true).order('sort_order').order('name');
        if (error) throw error;
        setEmployees(data || []);
      } catch (e: any) { toast.error('Không tải được danh sách nhân viên'); }
      finally { setLoading(false); }
    })();
  }, [open]);

  const handleConfirm = () => {
    const emp = employees.find((e) => e.id === selectedId);
    if (!emp) { toast.error('Vui lòng chọn nhân viên'); return; }
    onSelected(emp.id, emp.name);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && dismissible) onClose?.(); }}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => { if (!dismissible) e.preventDefault(); }} onEscapeKeyDown={(e) => { if (!dismissible) e.preventDefault(); }}>
        <DialogHeader><DialogTitle>Bạn là ai?</DialogTitle></DialogHeader>
        <div className="py-2">
          <Label>Chọn nhân viên</Label>
          <Select value={selectedId} onValueChange={setSelectedId} disabled={loading}>
            <SelectTrigger className="mt-2"><SelectValue placeholder={loading ? 'Đang tải...' : 'Chọn nhân viên'} /></SelectTrigger>
            <SelectContent>
              {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">Lựa chọn này sẽ được nhớ trên trình duyệt cho đến khi bạn đổi.</p>
        </div>
        <DialogFooter>
          {dismissible && <Button variant="outline" onClick={onClose}>Hủy</Button>}
          <Button onClick={handleConfirm} disabled={!selectedId}>Xác nhận</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
