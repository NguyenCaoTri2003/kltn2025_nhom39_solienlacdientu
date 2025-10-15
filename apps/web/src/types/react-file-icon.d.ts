declare module "react-file-icon" {
  import React from "react";

  interface FileIconProps {
    extension?: string;
    color?: string;
    labelColor?: string;
    glyphColor?: string;
    labelUppercase?: boolean;
    fold?: boolean;
    radius?: number;
    type?: string;
    gradientOpacity?: number;
  }

  export const FileIcon: React.FC<FileIconProps>;

  export const defaultStyles: Record<string, any>;
}
