import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AddPNRModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddPNRModal = ({ isOpen, onClose }: AddPNRModalProps) => {
  const [pnrs, setPnrs] = useState('');
  const [type, setType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePNRs = (input: string): boolean => {
    const pnrList = input.trim().split(/[\s,]+/).filter(Boolean);
    if (pnrList.length === 0) return false;
    return pnrList.every(pnr => /^[A-Za-z0-9]{6}$/.test(pnr));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePNRs(pnrs)) {
      toast.error('PNR không hợp lệ. Mỗi PNR phải gồm 6 ký tự chữ/số.');
      return;
    }

    const pnrString = pnrs.trim().split(/[\s,]+/).filter(Boolean).join(' ');

    setIsLoading(true);
    try {
      const response = await fetch('https://apilive.hanvietair.com/add-reprice', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pnrs: pnrString, type }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Thêm PNR thành công!`);
        setPnrs('');
        setType('');
        onClose();
      } else {
        toast.error('Lỗi khi thêm PNR. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error adding PNR:', error);
      toast.error('Không thể kết nối. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Thêm PNR</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>PNR (6 ký tự, cách nhau bởi dấu cách hoặc dấu phẩy)</Label>
            <Input
              value={pnrs}
              onChange={(e) => setPnrs(e.target.value.toUpperCase())}
              placeholder="VD: ABCDEF, GHIJKL"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADT">ADT</SelectItem>
                <SelectItem value="VFR">VFR</SelectItem>
                <SelectItem value="STU">STU</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Đang xử lý...</> : 'Xác nhận'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
