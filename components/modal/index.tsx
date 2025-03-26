import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onChange: (open: boolean) => void;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onChange,
  title,
  description,
  footer,
  children,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onChange}>
      <DialogContent
        className={cn(
        )}
      >
        <DialogHeader>
          <DialogTitle>
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div>{children}</div>
        <DialogFooter>
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;