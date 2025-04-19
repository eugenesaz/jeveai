
import { supabase } from '@/integrations/supabase/client';

// Initialize storage buckets for the application
export const initializeStorage = async () => {
  try {
    console.log('Checking for project-images bucket...');
    // First check if the storage bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    const projectImagesBucketExists = buckets?.some(bucket => bucket.name === 'project-images');
    
    if (!projectImagesBucketExists) {
      console.log('Creating project-images bucket...');
      // Create the bucket for project images
      const { error } = await supabase.storage.createBucket('project-images', {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
      });
      
      if (error) {
        console.error('Error creating bucket:', error);
        throw error; // Throw the error so we can properly handle it
      } else {
        console.log('Successfully created project-images bucket');
      }
    } else {
      console.log('project-images bucket already exists');
    }
  } catch (error) {
    // Log the error but don't block the app from loading
    console.error('Error initializing storage:', error);
  }
};

// Function to check if a bucket exists and is accessible
export const checkBucketAccess = async (bucketName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage.getBucket(bucketName);
    if (error) {
      console.error(`Error accessing bucket ${bucketName}:`, error);
      return false;
    }
    return !!data;
  } catch (error) {
    console.error(`Error checking bucket ${bucketName} access:`, error);
    return false;
  }
};
