import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Copy, X } from "lucide-react";

interface OtherTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OtherTicketModal: React.FC<OtherTicketModalProps> = ({ isOpen, onClose }) => {
  const [pnr, setPnr] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Cleanup object URL when changed/unmounted
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const resetState = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setImageBlob(null);
    setError(null);
    setPnr("");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async () => {
    const code = pnr.trim().toUpperCase();
    if (!code) {
      setError("Vui lòng nhập PNR");
      return;
    }
    setError(null);
    setIsLoading(true);
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
      setImageBlob(null);
    }

    try {
      const response = await fetch(`https://apilive.hanvietair.com/checkpnrother/${code}`, {
        method: "GET",
        headers: { accept: "application/json" },
      });
      if (!response.ok) throw new Error("API error");
      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) {
        throw new Error("Invalid response");
      }
      const url = URL.createObjectURL(blob);
      setImageBlob(blob);
      setImageUrl(url);
    } catch (err) {
      console.error("checkpnrother error:", err);
      setError("Không tìm thấy vé hoặc hệ thống lỗi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!imageBlob) return;
    try {
      let blobToCopy = imageBlob;
      if (imageBlob.type !== "image/png") {
        blobToCopy = new Blob([imageBlob], { type: "image/png" });
      }
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blobToCopy }),
      ]);
      toast.success("Đã copy ảnh");
    } catch (err) {
      console.error("copy image error:", err);
      toast.error("Không thể copy ảnh");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tra vé Other</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="other-pnr">Mã đặt chỗ (PNR)</Label>
            <Input
              id="other-pnr"
              ref={inputRef}
              value={pnr}
              onChange={(e) => {
                setPnr(e.target.value.toUpperCase());
                if (error) setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Nhập mã PNR (VD: GQBCN0)"
              disabled={isLoading}
              autoComplete="off"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận"
              )}
            </Button>
            <Button onClick={handleClose} variant="outline" disabled={isLoading}>
              <X className="h-4 w-4" />
              Đóng
            </Button>
          </div>

          {imageUrl && (
            <div className="space-y-3 pt-2 border-t">
              <div className="flex justify-end">
                <Button onClick={handleCopy} variant="outline" size="sm">
                  <Copy className="h-4 w-4" />
                  Copy ảnh
                </Button>
              </div>
              <div className="flex justify-center bg-muted/30 rounded-md p-2">
                <img
                  src={imageUrl}
                  alt="Vé Other"
                  className="max-w-full h-auto rounded"
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OtherTicketModal;
