import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gohargeisa.app',
  appName: 'Go Hargeisa',
  webDir: 'public',
  server: {
    url: 'https://gohargeisa.com',
    cleartext: false
  }
};

export default config;