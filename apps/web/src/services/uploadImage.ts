import { supabase } from "@packages/data/supabaseClient";

export const formatImageFileName = (file: File) => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(
    now.getHours(),
  )}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  const nameExtension = file.name.includes(".")
    ? `.${file.name.split(".").pop()?.toLowerCase() || ""}`
    : "";
  const mimeExtension = file.type.includes("/") ? `.${file.type.split("/")[1]}` : "";
  const extension = nameExtension || mimeExtension || "";

  return `IMG${timestamp}${extension}`;
};


export const validateImageSize = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};


export const validateImageFile = (
  file: File,
  maxSizeMB: number = 10,
): { isValid: boolean; error?: string } => {
  if (!file) {
    return { isValid: false, error: "Vui lòng chọn file ảnh" };
  }

  if (!validateImageSize(file, maxSizeMB)) {
    return {
      isValid: false,
      error: `Ảnh không được vượt quá ${maxSizeMB}MB`,
    };
  }

  return { isValid: true };
};

export const handleImageChange = (
  file: File | null | undefined,
  maxSizeMB: number = 10,
): { isValid: boolean; error?: string; previewUrl?: string } => {
  if (!file) {
    return { isValid: false, error: "Vui lòng chọn file ảnh" };
  }

  const validation = validateImageFile(file, maxSizeMB);
  if (!validation.isValid) {
    return { isValid: false, error: validation.error };
  }

  const previewUrl = URL.createObjectURL(file);

  return { isValid: true, previewUrl };
};


export const uploadFileToStorage = async (file: File, bucket = "image"): Promise<string> => {
  const filePath = formatImageFileName(file);
  const { error } = await supabase.storage.from(bucket).upload(filePath, file);
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
};

