import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2, Rocket } from "lucide-react";

interface FirstTimeFounderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateStartup: () => void;
}

const FirstTimeFounderModal = ({ open, onOpenChange, onCreateStartup }: FirstTimeFounderModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="items-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Rocket className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-xl">Create Your Startup Page</DialogTitle>
          <DialogDescription className="text-sm">
            Build your startup's official presence in the SparkX Index ecosystem. Showcase your team, attract investors, and connect with mentors.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={() => { onOpenChange(false); onCreateStartup(); }}
            className="gap-2 bg-gradient-gold text-navy font-semibold hover:opacity-90"
          >
            <Building2 className="h-4 w-4" />
            Create Startup
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Skip for Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FirstTimeFounderModal;
