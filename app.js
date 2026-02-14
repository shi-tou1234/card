// app.js
App({
  onLaunch(options) {
    // 初始化云开发环境
    if (wx.cloud) {
      wx.cloud.init({
        // env 参数说明：
        // 1. 如果使用云开发，请替换为你的云开发环境ID
        // 2. 云开发环境ID可在微信开发者工具-云开发控制台-设置中查看
        // 3. 格式通常为：xxx-xxxxxx（如：prod-1g2h3j4k）
        env: 'cloud1-xxxxxxxxxx', // TODO: 替换为你的云开发环境ID
        traceUser: true
      });
    }

    // 初始化存储
    const savedData = wx.getStorageSync('emergencyCard');
    if (savedData) {
      this.globalData.cardData = savedData;
    }
    
    // 处理扫码进入的场景
    this.handleScanScene(options);
  },

  onShow(options) {
    // 处理扫码进入的场景（冷启动和热启动都需要处理）
    this.handleScanScene(options);
  },

  // 处理扫码场景
  handleScanScene(options) {
    // scene=1011 扫描二维码
    // scene=1012 长按图片识别二维码
    // scene=1013 手机相册选取二维码
    // scene=1047 扫描小程序码
    // scene=1048 长按图片识别小程序码
    // scene=1049 手机相册选取小程序码
    const scanScenes = [1011, 1012, 1013, 1047, 1048, 1049];
    
    if (scanScenes.includes(options.scene)) {
      // 从 query 中获取数据
      if (options.query && options.query.data) {
        // 存储待显示的扫码数据
        this.globalData.scannedData = options.query.data;
        
        // 延迟跳转，确保页面已加载
        setTimeout(() => {
          wx.navigateTo({
            url: '/pages/scan/scan?data=' + options.query.data
          });
        }, 100);
      }
    }
  },

  globalData: {
    cardData: null,
    scannedData: null,
    // 小程序 AppID（发布时需要替换为真实的 AppID）
    appId: 'wx1234567890abcdef'
  },

  // 保存卡片数据
  saveCardData(data) {
    this.globalData.cardData = data;
    wx.setStorageSync('emergencyCard', data);
  },

  // 获取卡片数据
  getCardData() {
    return this.globalData.cardData;
  },

  // 清除卡片数据
  clearCardData() {
    this.globalData.cardData = null;
    wx.removeStorageSync('emergencyCard');
  }
});
