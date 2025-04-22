
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Edit } from "lucide-react";
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
  const [isEditing, setIsEditing] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ telegram: values.telegram })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Telegram username has been updated",
      });
      
      setIsEditing(false);
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
      <AlertTitle className="flex items-center justify-between">
        Telegram Username Required
        {!isEditing && (
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2">
        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="telegram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telegram Username</FormLabel>
                    <div className="flex gap-2">
                      <Input placeholder="@username" {...field} />
                      <Button type="submit">Save</Button>
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        ) : (
          <p>
            This course requires a Telegram username to access the course materials.
            Please add your Telegram username to continue.
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
};
