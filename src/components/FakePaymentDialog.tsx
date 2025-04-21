
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Course } from "@/types/supabase";

interface FakePaymentDialogProps {
  open: boolean;
  onClose: () => void;
  course: Course | null;
  userId: string | null;
}

export function FakePaymentDialog({
  open,
  onClose,
  course,
  userId,
}: FakePaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePay = async () => {
    if (!userId || !course) {
      toast({
        title: "Payment failed",
        description: "User or course information missing.",
        variant: "destructive",
      });
      onClose();
      return;
    }
    setLoading(true);

    // Calculate dates
    const now = new Date();
    const begin_date = now.toISOString();
    let end_date: string | null = null;
    if (course.duration && course.duration > 0) {
      const end = new Date(now);
      end.setDate(end.getDate() + course.duration);
      end_date = end.toISOString();
    }

    // Insert enrollment
    const { error } = await supabase.from('enrollments').insert([
      {
        user_id: userId,
        course_id: course.id,
        is_paid: true,
        begin_date,
        end_date,
      }
    ]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to record enrollment",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Payment successful!",
      description: "You have been enrolled in the course.",
    });

    setLoading(false);
    onClose();

    // Redirect after a short pause
    setTimeout(() => {
      navigate('/enrolled-courses');
    }, 600);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pay & Enroll</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={e => {
            e.preventDefault();
            handlePay();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-sm font-medium">Cardholder Name</label>
            <Input value="Joe Doe" readOnly />
          </div>
          <div>
            <label className="text-sm font-medium">Card Number</label>
            <Input value="0000 0000 0000 0000" readOnly />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Expiry Month</label>
              <Input value="01" readOnly />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Expiry Year</label>
              <Input value="28" readOnly />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">CVV</label>
              <Input value="123" readOnly type="password" />
            </div>
          </div>
          <DialogFooter className="gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              Pay
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
