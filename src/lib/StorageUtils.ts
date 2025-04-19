
import { supabase } from '@/integrations/supabase/client';

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

// Function to upload a file and handle common errors
export const uploadFile = async (bucket: string, filePath: string, file: File): Promise<string | null> => {
  try {
    // Attempt to upload the file
    const { error: uploadError, data } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        upsert: true, // Override if exists
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      
      // If bucket not found, attempt to create it and try again
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
        console.log('Bucket not found, creating bucket...');
        await createBucket(bucket);
        
        // Try the upload again after creating the bucket
        const retryUpload = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            upsert: true,
            cacheControl: '3600'
          });
        
        if (retryUpload.error) {
          console.error('Retry upload failed:', retryUpload.error);
          return null;
        }
        
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
        
        return publicUrl;
      }
      
      return null;
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return publicUrl;
  } catch (error) {
    console.error('Exception during upload:', error);
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
    await createBucket('project-images');
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
      // If we get a specific error, we'll create the bucket
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
