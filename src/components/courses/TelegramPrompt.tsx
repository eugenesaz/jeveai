
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";

const formSchema = z.object({
  telegram: z.string().min(1, "Telegram username is required"),
});

interface TelegramPromptProps {
  userId: string;
  onUpdate: () => void;
}

export const TelegramPrompt = ({ userId, onUpdate }: TelegramPromptProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      telegram: '',
    }
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ telegram: values.telegram })
        .eq('id', userId);

      if (error) throw error;

      toast.success("Telegram username has been saved");
      onUpdate();
    } catch (error) {
      console.error('Error updating telegram:', error);
      toast.error("Failed to update telegram username");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50">
      <MessageSquare className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-800">Telegram Username Required</AlertTitle>
      <AlertDescription className="mt-3">
        <p className="mb-4 text-sm text-blue-700">
          This course requires a Telegram username to be set in your profile. Please enter your Telegram username to continue.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="telegram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-700">Telegram Username</FormLabel>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="@username" 
                      {...field} 
                      className="flex-grow border-blue-200 focus-visible:ring-blue-500" 
                    />
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Save
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </AlertDescription>
    </Alert>
  );
};
