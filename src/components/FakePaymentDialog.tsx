
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
import { getOrCreateEnrollment } from "@/utils/enrollmentUtils";

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
    console.log("Processing payment for user:", userId, "course:", course.id);

    try {
      // Calculate dates for the subscription
      const now = new Date();
      const beginDate = now.toISOString();
      let endDate: string | null = null;
      
      // Set end date if course has a duration
      if (course.duration && course.duration > 0) {
        const end = new Date(now);
        end.setDate(end.getDate() + course.duration);
        endDate = end.toISOString();
      }

      // Step 1: Get or create enrollment
      const enrollment = await getOrCreateEnrollment(userId, course.id);
      
      if (!enrollment) {
        throw new Error('Failed to create enrollment');
      }
      
      console.log("Enrollment created/found:", enrollment);
      
      // Step 2: Check for active subscription
      const now2 = new Date();
      const { data: activeSubscriptions, error: subCheckError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('enrollment_id', enrollment.id)
        .eq('is_paid', true)
        .or(`end_date.gt.${now2.toISOString()},end_date.is.null`);

      if (subCheckError) {
        console.error("Error checking subscriptions:", subCheckError);
        throw new Error('Failed to check subscription status');
      }

      if (activeSubscriptions && activeSubscriptions.length > 0) {
        toast({
          title: "Already subscribed",
          description: "You already have an active subscription for this course.",
          variant: "destructive"
        });
        setLoading(false);
        onClose();
        return;
      }

      // Step 3: Create new subscription with the enrollment_id
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          enrollment_id: enrollment.id,
          begin_date: beginDate,
          end_date: endDate,
          is_paid: true
        });

      if (subscriptionError) {
        console.error("Error creating subscription:", subscriptionError);
        throw new Error('Failed to create subscription');
      }

      console.log("Subscription created:", subscriptionData);

      toast({
        title: "Payment successful!",
        description: "Your subscription has been activated.",
      });

      setLoading(false);
      onClose();

      // Redirect after a short pause
      setTimeout(() => {
        navigate('/enrolled-courses');
      }, 600);
    } catch (error) {
      console.error("Payment processing error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onClose();
    }}>
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
              {loading ? "Processing..." : "Pay"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
