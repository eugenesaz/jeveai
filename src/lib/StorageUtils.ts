
import { supabase } from '@/integrations/supabase/client';

// Initialize storage buckets for the application
export const initializeStorage = async () => {
  try {
    // First check if the storage bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const projectImagesBucketExists = buckets?.some(bucket => bucket.name === 'project-images');
    
    if (!projectImagesBucketExists) {
      console.log('Creating project-images bucket...');
      // Create the bucket for project images
      const { error } = await supabase.storage.createBucket('project-images', {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
      });
      
      if (error) {
        // Log the error but continue execution
        console.error('Error creating bucket:', error);
      } else {
        console.log('Successfully created project-images bucket');
      }
    } else {
      console.log('project-images bucket already exists');
    }

    // Add other bucket initializations as needed
  } catch (error) {
    // Log the error but don't block the app from loading
    console.error('Error initializing storage:', error);
  }
};
