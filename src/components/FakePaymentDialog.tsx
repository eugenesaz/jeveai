
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
        .select('id, end_date, is_paid')
        .eq('user_id', userId)
        .eq('course_id', course.id)
        .order('begin_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingEnrollmentError) {
        console.error("Error checking existing enrollment:", existingEnrollmentError);
        throw new Error("Failed to check existing enrollment");
      }

      if (existingEnrollment) {
        // There's an existing enrollment
        const now = new Date();
        const isActive = existingEnrollment.is_paid && 
          (!existingEnrollment.end_date || new Date(existingEnrollment.end_date) > now);
        
        if (isActive && !course.duration) {
          // For unlimited duration courses with existing active enrollment, just return success
          toast({
            title: "Already enrolled!",
            description: "You already have an active unlimited subscription to this course.",
          });
          
          setLoading(false);
          onClose();
          
          // Redirect after a short pause
          setTimeout(() => {
            navigate('/enrolled-courses');
          }, 600);
          
          return;
        }
        
        if (existingEnrollment.end_date && course.duration && course.duration > 0) {
          // If there's an existing enrollment with an end date, extend it
          const currentEnd = new Date(existingEnrollment.end_date);
          // Check if it's expired
          const isExpired = currentEnd < now;
          
          if (isExpired) {
            // If expired, start a new subscription from now
            const newEnd = new Date(now);
            newEnd.setDate(newEnd.getDate() + course.duration);
            
            const { error: updateError } = await supabase
              .from('enrollments')
              .update({ 
                begin_date: now.toISOString(),
                end_date: newEnd.toISOString(),
                is_paid: true,
                updated_at: now.toISOString()
              })
              .eq('id', existingEnrollment.id);
              
            if (updateError) {
              console.error("Enrollment update error:", updateError);
              throw new Error("Failed to update enrollment");
            }
          } else {
            // If not expired, extend from current end date
            currentEnd.setDate(currentEnd.getDate() + course.duration);
            
            const { error: updateError } = await supabase
              .from('enrollments')
              .update({ 
                end_date: currentEnd.toISOString(),
                is_paid: true,
                updated_at: now.toISOString()
              })
              .eq('id', existingEnrollment.id);
              
            if (updateError) {
              console.error("Enrollment update error:", updateError);
              throw new Error("Failed to update enrollment");
            }
          }
        } else {
          // Create a new enrollment (this handles cases where there was an enrollment but it's different from current conditions)
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
            console.error("New enrollment insert error:", insertError);
            throw new Error("Failed to record new enrollment");
          }
        }
      } else {
        // No existing enrollment, create a new one
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
