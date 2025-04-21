
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
    // First check if bucket already exists
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }
    
    // Check if our bucket is in the list
    const bucketExists = existingBuckets.some(bucket => bucket.name === bucketName);
    
    if (bucketExists) {
      console.log(`Bucket ${bucketName} already exists`);
      return true;
    }
    
    // Create the bucket if it doesn't exist
    const { error } = await supabase.storage.createBucket(bucketName, {
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

// Function to upload project image to storage
export const uploadProjectImage = async (image: File, userId: string): Promise<string | null> => {
  try {
    // Create a unique file path including user ID for better organization
    const fileExt = image.name.split('.').pop();
    const safeName = sanitizeFileName(image.name.split('.')[0]);
    const fileName = `${userId}/${Date.now()}_${safeName}.${fileExt}`;
    
    // Make sure the bucket exists
    const bucketExists = await createBucket('project-images');
    if (!bucketExists) {
      console.error('Failed to create or access project-images bucket');
      return null;
    }
    
    const { error: uploadError } = await supabase.storage
      .from('project-images')
      .upload(fileName, image, {
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Project image upload error:', uploadError);
      toast({
        title: 'Upload Failed',
        description: 'Could not upload the project image. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
    
    const { data: urlData } = supabase.storage
      .from('project-images')
      .getPublicUrl(fileName);
      
    console.log('Project image uploaded successfully. Public URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Exception during project image upload:', error);
    toast({
      title: 'Upload Error',
      description: 'An unexpected error occurred during image upload.',
      variant: 'destructive',
    });
    return null;
  }
};

// Function to generate a storage key for a knowledge document
export const generateKnowledgeStorageKey = (projectId: string, originalFileName: string): string => {
  const fileExt = originalFileName.split('.').pop() || '';
  const baseName = originalFileName.substring(0, originalFileName.lastIndexOf('.')) || originalFileName;
  const sanitizedName = sanitizeFileName(baseName);
  return `${projectId}/${Date.now()}_${sanitizedName}.${fileExt}`;
};

// Upload knowledge document to project-knowledge bucket
export const uploadKnowledgeDocument = async (file: File, projectId: string): Promise<{fileName: string, url: string} | null> => {
  try {
    // Create a storage key that avoids problematic characters
    const storageKey = generateKnowledgeStorageKey(projectId, file.name);
    console.log(`Attempting to upload document with storage key: ${storageKey}`);
    
    // Ensure bucket exists
    const bucketExists = await createBucket('project-knowledge');
    if (!bucketExists) {
      console.error('Failed to create or access project-knowledge bucket');
      toast({
        title: 'Storage Error',
        description: 'Could not access storage bucket. Please try again later.',
        variant: 'destructive',
      });
      return null;
    }
    
    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from('project-knowledge')
      .upload(storageKey, file, {
        upsert: true,
        cacheControl: '3600'
      });
    
    if (uploadError) {
      console.error('Knowledge document upload error:', uploadError);
      toast({
        title: 'Upload Failed',
        description: `Could not upload: ${uploadError.message}`,
        variant: 'destructive',
      });
      return null;
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('project-knowledge')
      .getPublicUrl(storageKey);
    
    console.log('Knowledge document uploaded successfully. Public URL:', urlData.publicUrl);
    return {
      fileName: file.name,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('Exception during knowledge document upload:', error);
    toast({
      title: 'Upload Error',
      description: 'An unexpected error occurred during document upload.',
      variant: 'destructive',
    });
    return null;
  }
};

// Generic function to upload a file to a bucket
export const uploadFile = async (bucket: string, filePath: string, file: File): Promise<string | null> => {
  try {
    console.log(`Attempting to upload file to bucket: ${bucket}, path: ${filePath}`);
    
    // Get file extension
    const fileExt = file.name.split('.').pop() || '';
    
    // Sanitize the file name part of the path
    const pathParts = filePath.split('/');
    const fileName = pathParts.pop() || '';
    const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    const sanitizedFileName = sanitizeFileName(baseName) + '.' + fileExt;
    const sanitizedPath = [...pathParts, sanitizedFileName].join('/');
    
    // Try to create the bucket if it doesn't exist
    const bucketExists = await createBucket(bucket);
    if (!bucketExists) {
      console.error(`Failed to create or access bucket: ${bucket}`);
      return null;
    }
    
    console.log(`Uploading file to ${bucket}/${sanitizedPath}`);
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(sanitizedPath, file, {
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
      .getPublicUrl(sanitizedPath);
    
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

// Initialize storage - ensure required buckets exist
export const initializeStorage = async (): Promise<void> => {
  console.log('Initializing storage buckets...');
  
  const buckets = ['project-images', 'project-knowledge'];
  
  for (const bucketName of buckets) {
    const hasAccess = await testBucketAccess(bucketName);
    if (!hasAccess) {
      console.log(`Bucket ${bucketName} not accessible, attempting to create...`);
      await createBucket(bucketName);
    } else {
      console.log(`Bucket ${bucketName} accessible, no need to create`);
    }
  }
};

// List all files in a bucket or folder
export const listFiles = async (bucket: string, path: string = ''): Promise<string[]> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path);
    
    if (error) {
      console.error(`Error listing files in ${bucket}/${path}:`, error);
      return [];
    }
    
    return data.map(item => item.name);
  } catch (error) {
    console.error(`Exception listing files in ${bucket}/${path}:`, error);
    return [];
  }
};
