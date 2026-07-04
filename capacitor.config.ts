import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hangul.app',
  appName: 'Hangul Study',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#121214',
    allowMixedContent: true,
  },
};

export default config;
