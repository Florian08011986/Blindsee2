interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  bundledWebRuntime?: boolean;
}

const config: CapacitorConfig = {
  appId: 'de.blindsee.reisebegleiter',
  appName: 'Kroatien Reisebegleiter',
  webDir: 'dist'
};

export default config;
