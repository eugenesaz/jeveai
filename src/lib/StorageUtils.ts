
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

// Function to create a bucket if it doesn't exist
export const createBucket = async (bucketName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true
    });
    
    if (error) {
      console.error(`Error creating bucket ${bucketName}:`, error);
      return false;
    }
    
    console.log(`Bucket ${bucketName} created successfully`);
    return true;
  } catch (error) {
    console.error(`Exception creating bucket ${bucketName}:`, error);
    return false;
  }
};

// Initialize storage - placeholder function for App.tsx
export const initializeStorage = async (): Promise<void> => {
  console.log('Initializing storage...');
  const bucketName = 'project-images';
  
  const hasAccess = await testBucketAccess(bucketName);
  if (!hasAccess) {
    console.log(`Bucket ${bucketName} not accessible, attempting to create...`);
    await createBucket(bucketName);
  } else {
    console.log(`Bucket ${bucketName} accessible, no need to create`);
  }
};

// Generic function to upload a file to a bucket
export const uploadFile = async (bucket: string, filePath: string, file: File): Promise<string | null> => {
  try {
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      toast({
        title: 'Upload Failed',
        description: 'Could not upload the file. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    console.log('File uploaded successfully. Public URL:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Exception during upload:', error);
    toast({
      title: 'Upload Error',
      description: 'An unexpected error occurred during upload.',
      variant: 'destructive',
    });
    return null;
  }
};

// Function to upload a project image with proper organization
export const uploadProjectImage = async (file: File, userId: string): Promise<string | null> => {
  const bucket = 'project-images';
  
  try {
    console.log(`Uploading project image to ${bucket}/${userId}/...`);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      toast({
        title: 'Upload Failed',
        description: 'Could not upload the image. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    console.log('Project image uploaded successfully. Public URL:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Exception during upload:', error);
    toast({
      title: 'Upload Error',
      description: 'An unexpected error occurred during upload.',
      variant: 'destructive',
    });
    return null;
  }
};

// Check if a file exists in a bucket
export const fileExists = async (bucket: string, path: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);
    
    if (error) {
      console.error(`Error checking if file exists at ${path}:`, error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error(`Exception checking if file exists at ${path}:`, error);
    return false;
  }
};
