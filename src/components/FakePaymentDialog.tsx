
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

    try {
      // Calculate dates
      const now = new Date();
      const begin_date = now.toISOString();
      let end_date: string | null = null;
      if (course.duration && course.duration > 0) {
        const end = new Date(now);
        end.setDate(end.getDate() + course.duration);
        end_date = end.toISOString();
      }

      // Check if there's an existing enrollment for this course/user combination
      const { data: existingEnrollment, error: existingEnrollmentError } = await supabase
        .from('enrollments')
        .select('id, end_date')
        .eq('user_id', userId)
        .eq('course_id', course.id)
        .eq('is_paid', true)
        .maybeSingle();

      if (existingEnrollmentError) {
        console.error("Error checking existing enrollment:", existingEnrollmentError);
      }

      if (existingEnrollment && existingEnrollment.end_date) {
        // If there's an existing enrollment with an end date, extend it
        const currentEnd = new Date(existingEnrollment.end_date);
        const extension = course.duration ? course.duration : 0;
        
        if (extension > 0) {
          // Extend from current end date
          currentEnd.setDate(currentEnd.getDate() + extension);
          
          const { error: updateError } = await supabase
            .from('enrollments')
            .update({ 
              end_date: currentEnd.toISOString(),
              updated_at: now.toISOString()
            })
            .eq('id', existingEnrollment.id);
            
          if (updateError) {
            console.error("Enrollment update error:", updateError);
            throw new Error("Failed to update enrollment duration");
          }
        } else {
          // For unlimited duration courses with existing enrollment, just return success
          // No need to create a duplicate enrollment
          toast({
            title: "Payment successful!",
            description: "Your enrollment has been extended.",
          });
          
          setLoading(false);
          onClose();
          
          // Redirect after a short pause
          setTimeout(() => {
            navigate('/enrolled-courses');
          }, 600);
          
          return;
        }
      } else {
        // No existing active enrollment, create a new one
        const { error: insertError } = await supabase
          .from('enrollments')
          .insert({
            user_id: userId,
            course_id: course.id,
            is_paid: true,
            begin_date,
            end_date,
          });

        if (insertError) {
          console.error("Enrollment insert error:", insertError);
          throw new Error("Failed to record enrollment");
        }
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
              {loading ? "Processing..." : "Pay"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
