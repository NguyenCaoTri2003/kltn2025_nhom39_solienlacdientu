const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// ✅ Theo khuyến nghị chính thức từ Expo Monorepo docs
config.watchFolders = [workspaceRoot];

// ✅ Giữ nguyên resolver extension, chỉ thêm nếu tồn tại
if (config.resolver?.sourceExts && !config.resolver.sourceExts.includes("cjs")) {
  config.resolver.sourceExts.push("cjs");
}

module.exports = config;