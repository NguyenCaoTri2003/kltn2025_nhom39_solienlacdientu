export interface ImageValidationResult {
  isValid: boolean;
  mimeType?: string;
  sizeInBytes?: number;
  error?: string;
}

export interface ImageOptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; 
  maxSizeInKB?: number; 
}


export function validateImageData(imageData: string): ImageValidationResult {
  try {

    const imageDataPattern = /^data:image\/(jpeg|jpg|png|gif|webp|bmp|svg\+xml);base64,/i;
    
    if (!imageDataPattern.test(imageData)) {
      if (!imageData.startsWith("data:")) {
        try {
          const decoded = atob(imageData);
          const uint8Array = new Uint8Array(decoded.length);
          for (let i = 0; i < decoded.length; i++) {
            uint8Array[i] = decoded.charCodeAt(i);
          }
          
          const mimeType = detectMimeType(uint8Array);
          if (!mimeType) {
            return {
              isValid: false,
              error: "Không phải định dạng ảnh hợp lệ",
            };
          }
          
          return {
            isValid: true,
            mimeType,
            sizeInBytes: imageData.length * 0.75,
          };
        } catch {
          return {
            isValid: false,
            error: "Không phải định dạng ảnh hợp lệ",
          };
        }
      }
      
      return {
        isValid: false,
        error: "Định dạng ảnh không hợp lệ. Phải có prefix data:image/...",
      };
    }

    const matches = imageData.match(/^data:image\/([^;]+);base64,(.+)$/i);
    if (!matches || matches.length < 3) {
      return {
        isValid: false,
        error: "Không thể parse image data",
      };
    }

    const mimeType = matches[1].toLowerCase();
    const dataString = matches[2];

    try {
      const decoded = atob(dataString);
      const sizeInBytes = decoded.length;

      // Kiểm tra kích thước
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (sizeInBytes > maxSize) {
        return {
          isValid: false,
          error: `Kích thước ảnh quá lớn (${(sizeInBytes / 1024 / 1024).toFixed(2)}MB). Tối đa 10MB`,
        };
      }

      const uint8Array = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) {
        uint8Array[i] = decoded.charCodeAt(i);
      }

      const detectedMimeType = detectMimeType(uint8Array);
      if (!detectedMimeType || !detectedMimeType.includes(mimeType)) {
        return {
          isValid: false,
          error: `Mime type không khớp. Expected: image/${mimeType}`,
        };
      }

      return {
        isValid: true,
        mimeType: `image/${mimeType}`,
        sizeInBytes,
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Lỗi decode image data: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  } catch (error) {
    return {
      isValid: false,
      error: `Lỗi validate: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function detectMimeType(uint8Array: Uint8Array): string | null {
  if (uint8Array.length < 4) return null;

  if (uint8Array[0] === 0xff && uint8Array[1] === 0xd8 && uint8Array[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    uint8Array[0] === 0x89 &&
    uint8Array[1] === 0x50 &&
    uint8Array[2] === 0x4e &&
    uint8Array[3] === 0x47
  ) {
    return "image/png";
  }

  if (
    uint8Array[0] === 0x47 &&
    uint8Array[1] === 0x49 &&
    uint8Array[2] === 0x46 &&
    uint8Array[3] === 0x38
  ) {
    return "image/gif";
  }

  if (
    uint8Array.length >= 12 &&
    uint8Array[0] === 0x52 &&
    uint8Array[1] === 0x49 &&
    uint8Array[2] === 0x46 &&
    uint8Array[3] === 0x46 &&
    uint8Array[8] === 0x57 &&
    uint8Array[9] === 0x45 &&
    uint8Array[10] === 0x42 &&
    uint8Array[11] === 0x50
  ) {
    return "image/webp";
  }

  if (uint8Array[0] === 0x42 && uint8Array[1] === 0x4d) {
    return "image/bmp";
  }

  return null;
}

export function imageDataToBlob(imageData: string): Blob | null {
  try {
    const validation = validateImageData(imageData);
    if (!validation.isValid || !validation.mimeType) {
      return null;
    }

    let dataString = imageData;
    if (imageData.includes(",")) {
      dataString = imageData.split(",")[1];
    }

    const byteCharacters = atob(dataString);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    return new Blob([byteArray], { type: validation.mimeType });
  } catch (error) {
    console.error("Error converting image data to Blob:", error);
    return null;
  }
}

export function fileToImageData(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

export function getImageDimensions(
  imageData: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = (error) => reject(error);
    
    if (!imageData.startsWith("data:")) {
      img.src = `data:image/png;base64,${imageData}`;
    } else {
      img.src = imageData;
    }
  });
}

export async function optimizeImage(
  imageData: string,
  options: ImageOptimizeOptions = {}
): Promise<string> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    maxSizeInKB = 500,
  } = options;

  try {
    const validation = validateImageData(imageData);
    if (!validation.isValid || !validation.mimeType) {
      throw new Error(validation.error || "Invalid image");
    }

    const dimensions = await getImageDimensions(imageData);
    
    const needsResize =
      dimensions.width > maxWidth || dimensions.height > maxHeight;

    if (!needsResize && validation.sizeInBytes && validation.sizeInBytes <= maxSizeInKB * 1024) {
      return imageData;
    }

    if (typeof window === "undefined") {
      console.warn("Image optimization on server-side not fully supported. Consider using sharp or similar.");
      return imageData;
    }

    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = imageData;
    });

    const canvas = document.createElement("canvas");
    let { width, height } = dimensions;

    if (width > height) {
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
    } else {
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    ctx.drawImage(img, 0, 0, width, height);

    const outputMimeType = validation.mimeType.includes("png") ? "image/png" : "image/jpeg";
    const optimized = canvas.toDataURL(outputMimeType, quality);

    const optimizedSize = (optimized.length * 0.75) / 1024;
    if (optimizedSize > maxSizeInKB) {
      if (quality > 0.5) {
        return optimizeImage(imageData, { ...options, quality: quality * 0.7 });
      }
    }

    return optimized;
  } catch (error) {
    console.error("Error optimizing image:", error);
    return imageData;
  }
}

export function isImageUrl(url: string): boolean {
  if (!url) return false;
  return url.startsWith("http://") || url.startsWith("https://");
}

export function getExtensionFromMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/bmp": "bmp",
    "image/svg+xml": "svg",
  };
  return map[mimeType.toLowerCase()] || "jpg";
}

