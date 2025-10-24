import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useModalStore } from "../../store/useModalStore";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const DialogStored = () => {
  const { isOpen, close, content } = useModalStore();
  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) close(); }}>
      <DialogContent showCloseButton={false}>
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle></DialogTitle>
          </DialogHeader>
          <DialogDescription></DialogDescription>
        </VisuallyHidden>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default DialogStored;
