import { supabase } from "../supabaseClient";
import { validateImageData, imageDataToBlob, getExtensionFromMimeType } from "@packages/utils/imageUtils";

export interface UploadImageOptions {
  folder?: string; 
  fileName?: string; 
  public?: boolean; 
}

export interface UploadResult {
  url: string;
  path: string;
  publicUrl?: string;
}

export class ImageRepository {
  private defaultBucket = "chat-uploads"; // Bucket để lưu ảnh trên supabase storage (tạo trên supabase storage)

  constructor(bucketName?: string) {
    if (bucketName) {
      this.defaultBucket = bucketName;
    }
  }

  private generateFileName(originalName?: string, mimeType?: string): string {
    if (originalName) {
      const ext = originalName.split(".").pop() || "bin";
      const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      return `${unique}.${ext}`;
    }
    
    if (mimeType) {
      const extension = getExtensionFromMimeType(mimeType);
      const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      return `${unique}.${extension}`;
    }
    
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.bin`;
  }

  async uploadImageData(
    imageData: string,
    options: UploadImageOptions = {}
  ): Promise<UploadResult> {
    try {
      const validation = validateImageData(imageData);
      if (!validation.isValid || !validation.mimeType) {
        throw new Error(validation.error || "Invalid image");
      }
      const blob = imageDataToBlob(imageData);
      if (!blob) {
        throw new Error("Failed to convert image data to blob");
      }
      const fileName = options.fileName || this.generateFileName(undefined, validation.mimeType);

      const filePath = options.folder 
        ? `${options.folder}/${fileName}` 
        : fileName;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.defaultBucket)
        .upload(filePath, blob, {
          cacheControl: "3600",
          upsert: false,
          contentType: validation.mimeType,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from(this.defaultBucket)
        .getPublicUrl(uploadData.path);

      return {
        url: urlData.publicUrl,
        path: uploadData.path,
        publicUrl: urlData.publicUrl,
      };
    } catch (error) {
      console.error("ImageRepository.uploadImageData error:", error);
      throw error;
    }
  }

  async uploadFile(
    file: File,
    options: UploadImageOptions = {}
  ): Promise<UploadResult> {
    try {
      const fileName = options.fileName || this.generateFileName(file.name);
      
      const filePath = options.folder 
        ? `${options.folder}/${fileName}` 
        : fileName;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.defaultBucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from(this.defaultBucket)
        .getPublicUrl(uploadData.path);

      return {
        url: urlData.publicUrl,
        path: uploadData.path,
        publicUrl: urlData.publicUrl,
      };
    } catch (error) {
      console.error("ImageRepository.uploadFile error:", error);
      throw error;
    }
  }

  async deleteImage(filePath: string, bucket?: string): Promise<void> {
    try {
      const bucketName = bucket || this.defaultBucket;
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }
    } catch (error) {
      console.error("ImageRepository.deleteImage error:", error);
      throw error;
    }
  }


  shouldUploadToStorage(imageData: string): boolean {
    return true;
  }

  getPublicUrl(filePath: string): string {
    const { data } = supabase.storage
      .from(this.defaultBucket)
      .getPublicUrl(filePath);
    return data.publicUrl;
  }

  extractPathFromUrl(url: string): { bucket: string; path: string } | null {
    try {
      const match = url.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/);
      if (match && match[1] && match[2]) {
        return {
          bucket: match[1],
          path: match[2],
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  async processImage(
    imageInput: string,
    options: UploadImageOptions = {}
  ): Promise<string> {
    if (imageInput.startsWith("http://") || imageInput.startsWith("https://")) {
      return imageInput;
    }

    const validation = validateImageData(imageInput);
    if (!validation.isValid) {
      throw new Error(validation.error || "Invalid image");
    }
    const result = await this.uploadImageData(imageInput, options);
    return result.url;
  }
}

