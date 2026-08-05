import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Props {
  open: boolean;
  minutes: number;
  onViewCached: () => void;
  onSearchAgain: () => void;
}

export const CacheWarningDialog: React.FC<Props> = ({ open, minutes, onViewCached, onSearchAgain }) => (
  <AlertDialog open={open}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Đã có kết quả tìm kiếm cách đây {minutes} phút</AlertDialogTitle>
        <AlertDialogDescription>
          Giá hiển thị chỉ mang tính tham khảo vì giá vé có thể đã thay đổi.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={onViewCached}>Xem kết quả cũ</AlertDialogCancel>
        <AlertDialogAction onClick={onSearchAgain}>Tìm kiếm lại</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
