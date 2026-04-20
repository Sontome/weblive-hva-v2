import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  active?: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EmployeeCheckInModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const loadEmployees = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from('employees')
          .select('id, name, active')
          .eq('active', true)
          .order('name');
        if (error) throw error;
        setEmployees((data as Employee[]) || []);
      } catch (err: any) {
        console.error('Load employees error:', err);
        toast.error('Không tải được danh sách nhân viên');
      } finally {
        setIsLoading(false);
      }
    };
    loadEmployees();
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!selectedId) {
      toast.error('Vui lòng chọn nhân viên');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await (supabase as any).rpc('checkin', { emp_id: selectedId });
      if (error) throw error;
      // Lấy tên nhân viên
      const employee = employees.find((e) => e.id === selectedId);
  
      const employeeName = employee?.name || 'Nhân viên';
  
      // Gọi API Telegram
      await fetch('https://apilive.hanvietair.com/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          message: `${employeeName} đã sẵn sàng check tin nhắn`,
        }),
      });
      toast.success('Check-in thành công');
      onSuccess?.();
      setSelectedId('');
      onClose();
    } catch (err: any) {
      console.error('Checkin error:', err);
      toast.error(err.message || 'Check-in thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Employee Check In</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Nhân viên</Label>
            <Select value={selectedId} onValueChange={setSelectedId} disabled={isLoading}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder={isLoading ? 'Đang tải...' : 'Chọn nhân viên'} />
              </SelectTrigger>
              <SelectContent>
                {employees.length === 0 && !isLoading && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Chưa có nhân viên</div>
                )}
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={isSubmitting || !selectedId}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Check In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
