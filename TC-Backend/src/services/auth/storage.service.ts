// Supabase Storage Service for Avatar and File Uploads
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TRPCError } from '@trpc/server';
import * as crypto from 'crypto';
import * as path from 'path';

export interface UploadOptions {
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
  bucket?: string;
  folder?: string;
  makePublic?: boolean;
  upsert?: boolean;
}

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  mimeType?: string;
  publicUrl?: string;
}

export interface FileMetadata {
  name: string;
  size: number;
  mimeType: string;
  lastModified?: Date;
  checksum?: string;
}

export class StorageService {
  private supabase: SupabaseClient;
  private readonly DEFAULT_AVATAR_BUCKET = 'avatars';
  private readonly DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for admin operations
    );
  }

  /**
   * Upload avatar image for user
   */
  async uploadAvatar(
    userId: string,
    file: Buffer | Uint8Array,
    fileName: string,
    mimeType: string
  ): Promise<UploadResult> {
    try {
      const options: UploadOptions = {
        maxSizeBytes: this.DEFAULT_MAX_SIZE,
        allowedMimeTypes: this.ALLOWED_IMAGE_TYPES,
        bucket: this.DEFAULT_AVATAR_BUCKET,
        folder: `users/${userId}`,
        makePublic: true,
        upsert: true,
      };

      return await this.uploadFile(file, fileName, mimeType, options);
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error('Avatar upload failed:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to upload avatar',
      });
    }
  }

  /**
   * Generic file upload method
   */
  async uploadFile(
    file: Buffer | Uint8Array,
    fileName: string,
    mimeType: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      // Validate file
      await this.validateFile(file, fileName, mimeType, options);

      // Generate unique file path
      const filePath = this.generateFilePath(fileName, options.folder);

      // Upload to Supabase Storage
      const bucket = options.bucket || this.DEFAULT_AVATAR_BUCKET;
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          contentType: mimeType,
          upsert: options.upsert || false,
        });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Upload failed: ${error.message}`,
        });
      }

      // Generate URLs
      const { data: urlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      const result: UploadResult = {
        url: urlData.publicUrl,
        path: data.path,
        size: file.byteLength,
        mimeType,
        publicUrl: urlData.publicUrl,
      };

      return result;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error('File upload failed:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'File upload failed',
      });
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(filePath: string, bucket?: string): Promise<boolean> {
    try {
      const targetBucket = bucket || this.DEFAULT_AVATAR_BUCKET;

      const { error } = await this.supabase.storage
        .from(targetBucket)
        .remove([filePath]);

      if (error) {
        console.error('Delete file error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete file:', error);
      return false;
    }
  }

  /**
   * Delete old avatar and upload new one
   */
  async replaceAvatar(
    userId: string,
    file: Buffer | Uint8Array,
    fileName: string,
    mimeType: string,
    oldAvatarUrl?: string
  ): Promise<UploadResult> {
    try {
      // Upload new avatar
      const uploadResult = await this.uploadAvatar(userId, file, fileName, mimeType);

      // Delete old avatar if provided
      if (oldAvatarUrl) {
        const oldPath = this.extractPathFromUrl(oldAvatarUrl);
        if (oldPath) {
          await this.deleteFile(oldPath);
        }
      }

      return uploadResult;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error('Avatar replacement failed:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to replace avatar',
      });
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filePath: string, bucket?: string): Promise<FileMetadata | null> {
    try {
      const targetBucket = bucket || this.DEFAULT_AVATAR_BUCKET;

      const { data, error } = await this.supabase.storage
        .from(targetBucket)
        .list(path.dirname(filePath), {
          search: path.basename(filePath),
        });

      if (error || !data || data.length === 0) {
        return null;
      }

      const fileInfo = data[0];
      return {
        name: fileInfo.name,
        size: fileInfo.metadata?.size || 0,
        mimeType: fileInfo.metadata?.mimetype || 'application/octet-stream',
        lastModified: new Date(fileInfo.updated_at),
      };
    } catch (error) {
      console.error('Failed to get file metadata:', error);
      return null;
    }
  }

  /**
   * Create signed URL for temporary access
   */
  async createSignedUrl(
    filePath: string,
    expiresIn: number = 3600,
    bucket?: string
  ): Promise<string | null> {
    try {
      const targetBucket = bucket || this.DEFAULT_AVATAR_BUCKET;

      const { data, error } = await this.supabase.storage
        .from(targetBucket)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.error('Signed URL creation failed:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Failed to create signed URL:', error);
      return null;
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(
    folderPath: string,
    limit?: number,
    offset?: number,
    bucket?: string
  ): Promise<FileMetadata[]> {
    try {
      const targetBucket = bucket || this.DEFAULT_AVATAR_BUCKET;

      const { data, error } = await this.supabase.storage
        .from(targetBucket)
        .list(folderPath, {
          limit,
          offset,
        });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to list files: ${error.message}`,
        });
      }

      return data.map(file => ({
        name: file.name,
        size: file.metadata?.size || 0,
        mimeType: file.metadata?.mimetype || 'application/octet-stream',
        lastModified: new Date(file.updated_at),
      }));
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error('Failed to list files:', error);
      return [];
    }
  }

  /**
   * Validate file before upload
   */
  private async validateFile(
    file: Buffer | Uint8Array,
    fileName: string,
    mimeType: string,
    options: UploadOptions
  ): Promise<void> {
    // Check file size
    const maxSize = options.maxSizeBytes || this.DEFAULT_MAX_SIZE;
    if (file.byteLength > maxSize) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `File size ${file.byteLength} bytes exceeds maximum allowed size ${maxSize} bytes`,
      });
    }

    // Check mime type
    const allowedTypes = options.allowedMimeTypes || this.ALLOWED_IMAGE_TYPES;
    if (!allowedTypes.includes(mimeType)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `File type ${mimeType} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      });
    }

    // Check file extension
    const extension = path.extname(fileName).toLowerCase();
    const allowedExtensions = this.getMimeTypeExtensions(allowedTypes);
    if (!allowedExtensions.includes(extension)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `File extension ${extension} is not allowed`,
      });
    }

    // Validate file content (basic magic number check)
    if (allowedTypes.every(type => type.startsWith('image/'))) {
      this.validateImageFile(file, mimeType);
    }
  }

  /**
   * Validate image file content
   */
  private validateImageFile(file: Buffer | Uint8Array, mimeType: string): void {
    const buffer = Buffer.isBuffer(file) ? file : Buffer.from(file);

    // Check magic numbers for common image formats
    const magicNumbers = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
      'image/gif': [0x47, 0x49, 0x46],
      'image/webp': [0x52, 0x49, 0x46, 0x46],
    };

    const expectedMagic = magicNumbers[mimeType as keyof typeof magicNumbers];
    if (expectedMagic) {
      const actualMagic = Array.from(buffer.slice(0, expectedMagic.length));
      const matches = expectedMagic.every((byte, index) => byte === actualMagic[index]);

      if (!matches) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'File content does not match declared MIME type',
        });
      }
    }
  }

  /**
   * Generate unique file path
   */
  private generateFilePath(fileName: string, folder?: string): string {
    const extension = path.extname(fileName);
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const uniqueFileName = `${timestamp}-${random}${extension}`;

    if (folder) {
      return `${folder}/${uniqueFileName}`;
    }

    return uniqueFileName;
  }

  /**
   * Extract file path from Supabase public URL
   */
  private extractPathFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');

      // Supabase storage URLs have format: /storage/v1/object/public/{bucket}/{path}
      const bucketIndex = pathParts.findIndex(part => part === 'public') + 1;
      if (bucketIndex > 0 && bucketIndex < pathParts.length - 1) {
        return pathParts.slice(bucketIndex + 1).join('/');
      }

      return null;
    } catch (error) {
      console.error('Failed to extract path from URL:', error);
      return null;
    }
  }

  /**
   * Get file extensions for mime types
   */
  private getMimeTypeExtensions(mimeTypes: string[]): string[] {
    const mimeToExt: Record<string, string[]> = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
      'image/bmp': ['.bmp'],
      'image/tiff': ['.tiff', '.tif'],
      'image/svg+xml': ['.svg'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/json': ['.json'],
    };

    const extensions: string[] = [];
    for (const mimeType of mimeTypes) {
      const exts = mimeToExt[mimeType];
      if (exts) {
        extensions.push(...exts);
      }
    }

    return extensions;
  }

  /**
   * Initialize storage buckets (run on startup)
   */
  async initializeBuckets(): Promise<void> {
    try {
      const buckets = [
        {
          name: 'avatars',
          public: true,
          allowedMimeTypes: this.ALLOWED_IMAGE_TYPES,
          fileSizeLimit: this.DEFAULT_MAX_SIZE,
        },
        {
          name: 'attachments',
          public: false,
          allowedMimeTypes: ['*/*'],
          fileSizeLimit: 50 * 1024 * 1024, // 50MB
        },
      ];

      for (const bucket of buckets) {
        // Check if bucket exists
        const { data: existingBuckets } = await this.supabase.storage.listBuckets();
        const bucketExists = existingBuckets?.some(b => b.name === bucket.name);

        if (!bucketExists) {
          const { error } = await this.supabase.storage.createBucket(bucket.name, {
            public: bucket.public,
            allowedMimeTypes: bucket.allowedMimeTypes,
            fileSizeLimit: bucket.fileSizeLimit,
          });

          if (error) {
            console.error(`Failed to create bucket ${bucket.name}:`, error);
          } else {
            console.log(`Created storage bucket: ${bucket.name}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to initialize storage buckets:', error);
    }
  }
}