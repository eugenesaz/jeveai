
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const formSchema = z.object({
  telegram: z.string().min(1, "Telegram username is required"),
});

interface TelegramWarningProps {
  userId: string;
  onUpdate: () => void;
}

export const TelegramWarning = ({ userId, onUpdate }: TelegramWarningProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      telegram: '',
    }
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Clean telegram handle by removing any @ symbol
      const cleanTelegramHandle = values.telegram.replace('@', '').trim();
      
      const { error } = await supabase
        .from('profiles')
        .update({ telegram: cleanTelegramHandle })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Telegram username has been updated",
      });
      
      onUpdate();
    } catch (error) {
      console.error('Error updating telegram:', error);
      toast({
        title: "Error",
        description: "Failed to update telegram username",
        variant: "destructive",
      });
    }
  };

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTitle>Telegram Username Required</AlertTitle>
      <AlertDescription className="mt-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="telegram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telegram Username</FormLabel>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="@username" 
                      {...field} 
                      className="flex-grow" 
                    />
                    <Button type="submit">Save</Button>
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
