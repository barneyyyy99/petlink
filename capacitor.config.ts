import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.petlink.app',
  appName: 'PetLink 宠物陪伴',
  webDir: 'dist',
  android: {
    // 允许加载混合内容（演示用；生产按需收紧）
    allowMixedContent: true,
  },
}

export default config
