declare module "react-native-heic-converter" {
  interface HeicConvertOptions {
    path: string;
    quality?: number;
  }

  interface HeicConvertResult {
    path?: string;
    success?: boolean;
  }

  const HeicConverter: {
    convert(options: HeicConvertOptions): Promise<HeicConvertResult>;
  };

  export default HeicConverter;
}
