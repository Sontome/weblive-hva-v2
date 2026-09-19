import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plane, ArrowLeft } from 'lucide-react';
import { SunUpdatePnrPanel } from './SunUpdatePnrPanel';

interface UpdatePnrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpdatePnrModal: React.FC<UpdatePnrModalProps> = ({ isOpen, onClose }) => {
  const [airline, setAirline] = useState<'SUN' | null>(null);

  const handleClose = () => {
    setAirline(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {airline === 'SUN' ? 'Cập nhật PNR - SunPQ' : 'Cập nhật PNR'}
          </DialogTitle>
        </DialogHeader>

        {!airline ? (
          <div className="flex flex-wrap gap-3 py-2">
            <Button
              variant="outline"
              className="h-24 w-24 flex-col gap-2"
              onClick={() => setAirline('SUN')}
            >
              <Plane className="h-7 w-7" />
              <span className="font-bold">SUN</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setAirline(null)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Quay lại
            </Button>
            <SunUpdatePnrPanel />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
