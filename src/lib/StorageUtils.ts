
import { supabase } from '@/integrations/supabase/client';

export const initializeStorage = async () => {
  try {
    // Check if the bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('Error checking for buckets:', bucketError);
      return;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'project-images');
    
    if (!bucketExists) {
      // Create the bucket
      const { error } = await supabase.storage.createBucket('project-images', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (error) {
        console.error('Error creating bucket:', error);
      } else {
        console.log('Created project-images bucket');
      }
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
};
