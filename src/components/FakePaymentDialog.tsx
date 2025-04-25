
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
      const beginDate = now.toISOString();
      let endDate: string | null = null;
      
      // Set end date if course has a duration
      if (course.duration && course.duration > 0) {
        const end = new Date(now);
        end.setDate(end.getDate() + course.duration);
        endDate = end.toISOString();
      }

      console.log("Processing enrollment:", { userId, courseId: course.id });
      
      // Check for existing enrollment
      const { data: existingEnrollment, error: fetchError } = await supabase
        .from('enrollments')
        .select('id, begin_date, end_date, is_paid')
        .eq('user_id', userId)
        .eq('course_id', course.id)
        .order('begin_date', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (fetchError) {
        console.error("Error checking enrollment:", fetchError);
        throw new Error("Failed to check enrollment status");
      }
      
      console.log("Existing enrollment check:", existingEnrollment);
      
      if (existingEnrollment) {
        // Handle existing enrollment
        const currentDate = new Date();
        const hasEndDate = !!existingEnrollment.end_date;
        const isExpired = hasEndDate && new Date(existingEnrollment.end_date) < currentDate;
        
        console.log("Enrollment status:", { 
          hasEndDate, 
          isExpired: isExpired ? "yes" : "no",
          endDate: existingEnrollment.end_date
        });
        
        // For unlimited access courses (no end date)
        if (!hasEndDate && existingEnrollment.is_paid) {
          toast({
            title: "Already enrolled",
            description: "You already have unlimited access to this course.",
          });
          
          setLoading(false);
          onClose();
          
          setTimeout(() => navigate('/enrolled-courses'), 600);
          return;
        }
        
        // For fixed duration courses
        if (course.duration && course.duration > 0) {
          let newEndDate: Date;
          
          if (isExpired) {
            // If expired, start a fresh period from today
            newEndDate = new Date(currentDate);
            newEndDate.setDate(newEndDate.getDate() + course.duration);
            
            const updateData = {
              begin_date: currentDate.toISOString(),
              end_date: newEndDate.toISOString(),
              is_paid: true,
            };
            
            console.log("Updating expired enrollment:", { id: existingEnrollment.id, ...updateData });
            
            const { error: updateError } = await supabase
              .from('enrollments')
              .update(updateData)
              .eq('id', existingEnrollment.id);
              
            if (updateError) {
              console.error("Failed to update enrollment:", updateError);
              throw new Error("Failed to renew subscription");
            }
          } else {
            // If not expired, extend the current end date
            newEndDate = existingEnrollment.end_date 
              ? new Date(existingEnrollment.end_date) 
              : new Date(currentDate);
            
            newEndDate.setDate(newEndDate.getDate() + course.duration);
            
            const updateData = {
              end_date: newEndDate.toISOString(),
              is_paid: true,
            };
            
            console.log("Extending active enrollment:", { id: existingEnrollment.id, ...updateData });
            
            const { error: updateError } = await supabase
              .from('enrollments')
              .update(updateData)
              .eq('id', existingEnrollment.id);
              
            if (updateError) {
              console.error("Failed to extend enrollment:", updateError);
              throw new Error("Failed to extend subscription");
            }
          }
        } else {
          // For unlimited duration courses, ensure is_paid is true
          console.log("Ensuring unlimited enrollment is marked as paid:", existingEnrollment.id);
          
          const { error: updateError } = await supabase
            .from('enrollments')
            .update({ is_paid: true })
            .eq('id', existingEnrollment.id);
            
          if (updateError) {
            console.error("Failed to update enrollment payment status:", updateError);
            throw new Error("Failed to process payment");
          }
        }
      } else {
        // No existing enrollment, create a new one
        // Using upsert instead of insert to prevent conflicts
        console.log("Creating new enrollment:", { 
          userId, 
          courseId: course.id, 
          beginDate, 
          endDate 
        });
        
        const { error: insertError } = await supabase
          .from('enrollments')
          .upsert(
            {
              user_id: userId,
              course_id: course.id,
              is_paid: true,
              begin_date: beginDate,
              end_date: endDate,
            },
            { 
              onConflict: 'user_id,course_id',
              ignoreDuplicates: false 
            }
          );

        if (insertError) {
          console.error("Failed to create enrollment:", insertError);
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
