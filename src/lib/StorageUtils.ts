
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

// Function to test bucket access - try to list files
export const testBucketAccess = async (bucket: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list('');
    
    if (error) {
      console.error(`Error accessing bucket ${bucket}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Exception testing bucket access for ${bucket}:`, error);
    return false;
  }
};

// Function to sanitize file names to ensure they're valid for storage
export const sanitizeFileName = (fileName: string): string => {
  // More aggressive sanitization to handle international characters
  // First transliterate or remove non-ASCII characters
  const asciiOnly = fileName.replace(/[^\x00-\x7F]/g, '');
  
  // Then replace any remaining problematic characters
  return asciiOnly
    .replace(/[^\w.-]/g, '_') // Replace any non-alphanumeric, period, or hyphen with underscore
    .replace(/\s+/g, '_')     // Replace spaces with underscores
    .replace(/__+/g, '_');    // Replace multiple consecutive underscores with a single one
};
