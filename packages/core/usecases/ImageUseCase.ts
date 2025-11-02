import { ImageRepository } from "@packages/data/repositories/ImageRepository";
import {
  validateImageData,
  optimizeImage,
  isImageUrl,
  ImageOptimizeOptions,
} from "@packages/utils/imageUtils";

export interface ProcessImageOptions {

  optimize?: ImageOptimizeOptions;
  folder?: string;
  fileName?: string;
}

export class ImageUseCase {
  private repo: ImageRepository;

  constructor(repo?: ImageRepository, bucketName?: string) {
    this.repo = repo ?? new ImageRepository(bucketName);
  }

  async processImage(
    imageInput: string,
    options: ProcessImageOptions = {}
  ): Promise<string> {
    try {
      if (isImageUrl(imageInput)) {
        return imageInput;
      }
      const validation = validateImageData(imageInput);
      if (!validation.isValid) {
        throw new Error(validation.error || "Invalid image format");
      }

      let processedImage = imageInput;

      if (options.optimize) {
        try {
          processedImage = await optimizeImage(imageInput, options.optimize);
        } catch (error) {
          console.warn("Image optimization failed, using original:", error);
        }
      }

      const result = await this.repo.processImage(processedImage, {
        folder: options.folder,
        fileName: options.fileName,
      });

      return result; 
    } catch (error) {
      console.error("ImageUseCase.processImage error:", error);
      throw error;
    }
  }

  validateImage(imageInput: string): { isValid: boolean; error?: string } {
    if (isImageUrl(imageInput)) {
      return { isValid: true };
    }

    const validation = validateImageData(imageInput);
    return {
      isValid: validation.isValid,
      error: validation.error,
    };
  }

  async uploadImage(
    imageInput: string,
    options: { folder?: string; fileName?: string } = {}
  ): Promise<string> {
    if (isImageUrl(imageInput)) {
      return imageInput;
    }

    const result = await this.repo.processImage(imageInput, {
      folder: options.folder,
      fileName: options.fileName,
    });

    return result;
  }

  async deleteImage(imageUrl: string): Promise<void> {
    if (!isImageUrl(imageUrl)) {
      return;
    }

    const extracted = this.repo.extractPathFromUrl(imageUrl);
    if (extracted) {
      await this.repo.deleteImage(extracted.path, extracted.bucket);
    }
  }

  async processImages(
    images: string[],
    options: ProcessImageOptions = {}
  ): Promise<string[]> {
    return Promise.all(images.map((img) => this.processImage(img, options)));
  }

  shouldUpload(imageInput: string): boolean {
    if (isImageUrl(imageInput)) {
      return false; 
    }
    return true;
  }
}

