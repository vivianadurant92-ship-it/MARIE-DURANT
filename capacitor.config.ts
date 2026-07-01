import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'ai.nutricoach.app',
  appName: 'NutriCoach.Ai',
  webDir: 'dist',
  plugins: {
    Camera: {
      permissions: ['camera', 'photos'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_nutricoach',
      iconColor: '#10b981',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#10b981',
      showSpinner: false,
    },
  },
  android: {
    minSdkVersion: 26,
    targetSdkVersion: 34,
  },
  ios: {
    deploymentTarget: '16.0',
  },
}

export default config
