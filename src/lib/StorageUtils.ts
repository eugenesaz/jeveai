import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

// Function to ensure necessary buckets exist via edge function
export const ensureStorageBuckets = async (): Promise<boolean> => {
  try {
    const { data: authData } = await supabase.auth.getSession();
    if (!authData.session?.access_token) {
      console.error('No authentication token available');
      return false;
    }
    
    console.log('Invoking manage-knowledge-buckets edge function...');
    const { data, error } = await supabase.functions.invoke('manage-knowledge-buckets', {
      method: 'POST',
      body: { action: 'ensure_buckets' },
      headers: {
        Authorization: `Bearer ${authData.session.access_token}`,
      }
    });

    if (error) {
      console.error('Error ensuring storage buckets:', error);
      toast({
        title: 'Storage Error',
        description: `Error configuring storage: ${error.message}`,
        variant: 'destructive',
      });
      return false;
    }

    console.log('Storage buckets setup response:', data);
    return true;
  } catch (error) {
    console.error('Exception ensuring buckets:', error);
    toast({
      title: 'Storage Error',
      description: `Exception configuring storage: ${error.message}`,
      variant: 'destructive',
    });
    return false;
  }
};

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
    // Use the edge function to ensure buckets exist
    const bucketsConfigured = await ensureStorageBuckets();
    
    if (!bucketsConfigured) {
      console.error(`Failed to configure buckets via edge function`);
      return false;
    }
    
    // Now test access to the specific bucket
    const hasAccess = await testBucketAccess(bucketName);
    return hasAccess;
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

// Check if file is within size limit (in MB)
export const isFileSizeValid = (file: File, maxSizeMB: number = 2): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    toast({
      title: 'File Too Large',
      description: `File size exceeds the maximum allowed size of ${maxSizeMB}MB`,
      variant: 'destructive',
    });
    return false;
  }
  return true;
};

// Function to upload project image to storage
export const uploadProjectImage = async (image: File, userId: string): Promise<string | null> => {
  try {
    // Check file size - 5MB limit for images
    if (!isFileSizeValid(image, 5)) {
      return null;
    }

    // Ensure buckets are properly configured first
    const bucketsConfigured = await ensureStorageBuckets();
    if (!bucketsConfigured) {
      console.error('Failed to configure storage buckets');
      toast({
        title: 'Storage Error',
        description: 'Could not access storage. Please try again later.',
        variant: 'destructive',
      });
      return null;
    }

    // Create a unique file path including user ID for better organization
    const fileExt = image.name.split('.').pop();
    const safeName = sanitizeFileName(image.name.split('.')[0]);
    const fileName = `${userId}/${Date.now()}_${safeName}.${fileExt}`;
    
    // Upload the file
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
        description: `Could not upload the project image: ${uploadError.message}`,
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
      description: `An unexpected error occurred during image upload: ${error.message}`,
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
    console.log(`Starting upload for document: ${file.name} for project ${projectId}`);

    // Check file size - 50MB limit for knowledge documents (updated from 2MB)
    if (!isFileSizeValid(file, 50)) {
      return null;
    }

    // Ensure buckets are properly configured first
    console.log('Ensuring storage buckets are configured...');
    const bucketsConfigured = await ensureStorageBuckets();
    if (!bucketsConfigured) {
      console.error('Failed to configure storage buckets');
      toast({
        title: 'Storage Error',
        description: 'Could not access storage. Please try again later.',
        variant: 'destructive',
      });
      return null;
    }

    // Create a storage key that avoids problematic characters
    const storageKey = generateKnowledgeStorageKey(projectId, file.name);
    console.log(`Attempting to upload document with storage key: ${storageKey}`);

    // Test bucket access before attempting upload
    console.log('Testing bucket access...');
    const hasAccess = await testBucketAccess('project-knowledge');
    if (!hasAccess) {
      console.error('No access to project-knowledge bucket');
      toast({
        title: 'Storage Error',
        description: 'Could not access project knowledge storage.',
        variant: 'destructive',
      });
      return null;
    }

    // Upload the file
    console.log('Uploading file...');
    const { data, error: uploadError } = await supabase.storage
      .from('project-knowledge')
      .upload(storageKey, file, {
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Knowledge document upload error:', uploadError);

      // Specific error for file size
      if (uploadError.message && uploadError.message.includes("too large")) {
        toast({
          title: 'File Too Large',
          description: `The file is too large. Maximum allowed size is 50MB.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Upload Failed',
          description: `Could not upload: ${uploadError.message}`,
          variant: 'destructive',
        });
      }
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
      description: `An unexpected error occurred during document upload: ${error.message}`,
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
    
    // Ensure buckets are properly configured first
    const bucketsConfigured = await ensureStorageBuckets();
    if (!bucketsConfigured) {
      console.error(`Failed to configure storage`);
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
  await ensureStorageBuckets();
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
