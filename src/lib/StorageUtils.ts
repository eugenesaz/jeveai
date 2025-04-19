
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

// Function to upload a file with robust error handling and feedback
export const uploadFile = async (bucket: string, filePath: string, file: File): Promise<string | null> => {
  // First, check bucket access
  const hasAccess = await testBucketAccess(bucket);
  
  if (!hasAccess) {
    console.log(`Creating bucket ${bucket} since it doesn't exist or we don't have access...`);
    const bucketCreated = await createBucket(bucket);
    
    if (!bucketCreated) {
      console.error(`Failed to create bucket ${bucket}`);
      toast({
        title: 'Storage Error',
        description: 'Could not access or create storage bucket. Image upload failed.',
        variant: 'destructive',
      });
      return null;
    }
  }

  try {
    console.log(`Uploading file to ${bucket}/${filePath}...`);
    
    // Attempt to upload the file
    const { error: uploadError, data } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        upsert: true, // Override if exists
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      
      // Handle common upload errors
      if (uploadError.message?.includes('The resource already exists')) {
        // File exists, try with a different name
        const fileExt = file.name.split('.').pop();
        const newFileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const newFilePath = filePath.split('/').slice(0, -1).join('/') + '/' + newFileName;
        
        console.log('File already exists, trying with new path:', newFilePath);
        
        return uploadFile(bucket, newFilePath, file);
      }
      
      // Handle permission errors
      if (uploadError.message?.includes('row-level security policy') || 
          uploadError.message?.includes('permission denied')) {
        console.error('Permission denied when uploading file. Ensure RLS policies are properly configured.');
        toast({
          title: 'Permission Error',
          description: 'You do not have permission to upload files. Contact your administrator.',
          variant: 'destructive',
        });
        return null;
      }
      
      // Generic error fallback
      toast({
        title: 'Upload Failed',
        description: 'Could not upload the image. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
    
    // Get the public URL
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

// Create a bucket and ensure it's public
export const createBucket = async (bucketName: string): Promise<boolean> => {
  try {
    // Check if the bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      
      // Handle permissions for listing buckets
      if (listError.message?.includes('row-level security policy') || 
          listError.message?.includes('permission denied')) {
        console.error('Permission denied when listing buckets.');
        toast({
          title: 'Permission Error',
          description: 'You do not have permission to access storage buckets.',
          variant: 'destructive',
        });
      }
      
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Creating bucket ${bucketName}...`);
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB limit
      });
      
      if (error) {
        console.error(`Error creating bucket ${bucketName}:`, error);
        
        // Handle permissions for creating buckets
        if (error.message?.includes('row-level security policy') || 
            error.message?.includes('permission denied')) {
          console.error('Permission denied when creating bucket.');
          toast({
            title: 'Permission Error',
            description: 'You do not have permission to create storage buckets.',
            variant: 'destructive',
          });
        }
        
        return false;
      }
      
      console.log(`Successfully created bucket ${bucketName}`);
      return true;
    }
    
    console.log(`Bucket ${bucketName} already exists`);
    return true;
  } catch (error) {
    console.error(`Error creating/checking bucket ${bucketName}:`, error);
    return false;
  }
};

// Initialize storage buckets for the application
export const initializeStorage = async () => {
  try {
    console.log('Initializing storage buckets...');
    
    // Test access first
    const hasAccess = await testBucketAccess('project-images');
    
    if (!hasAccess) {
      await createBucket('project-images');
    } else {
      console.log('project-images bucket is accessible');
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
};

// Function to check if a bucket exists and is accessible
export const checkBucketAccess = async (bucketName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage.getBucket(bucketName);
    
    if (error) {
      console.error(`Error accessing bucket ${bucketName}:`, error);
      
      // If bucket not found, try to create it
      if (error.message?.includes('not found')) {
        return await createBucket(bucketName);
      }
      
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error(`Error checking bucket ${bucketName} access:`, error);
    return false;
  }
};
