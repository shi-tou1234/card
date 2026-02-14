// pages/index/index.js
const app = getApp();
const { atob } = require('../../utils/util');

Page({
  data: {
    hasCard: false
  },

  onLoad() {
    
  },

  onShow() {
    // 检查是否已有保存的卡片
    const cardData = app.getCardData();
    this.setData({
      hasCard: !!cardData
    });
  },

  // 跳转到填写表单页面
  goToForm() {
    wx.navigateTo({
      url: '/pages/form/form'
    });
  },

  // 跳转到预览页面
  goToPreview() {
    if (!this.data.hasCard) {
      wx.showToast({
        title: '请先创建应急卡',
        icon: 'none'
      });
      return;
    }
    wx.navigateTo({
      url: '/pages/preview/preview'
    });
  },

  // 扫描二维码
  scanQRCode() {
    wx.scanCode({
      onlyFromCamera: false,
      scanType: ['qrCode'],
      success: (res) => {
        console.log('扫码结果:', res);
        try {
          // 解析二维码内容
          const result = res.result;
          
          // 检查是否是新格式（小程序页面路径格式）
          if (result.includes('/pages/scan/scan?d=')) {
            // 新格式：直接提取参数并跳转
            const paramMatch = result.match(/[?&]d=([^&]+)/);
            if (paramMatch) {
              wx.navigateTo({
                url: '/pages/scan/scan?d=' + paramMatch[1]
              });
              return;
            }
          }
          
          // 检查是否是旧格式（EMERGENCY_CARD:前缀）
          if (result.includes('EMERGENCY_CARD:')) {
            const base64Data = result.replace('EMERGENCY_CARD:', '');
            const jsonStr = decodeURIComponent(escape(atob(base64Data)));
            const cardData = JSON.parse(jsonStr);
            
            // 跳转到查看页面
            wx.navigateTo({
              url: '/pages/scan/scan?data=' + encodeURIComponent(JSON.stringify(cardData))
            });
            return;
          }
          
          wx.showToast({
            title: '无法识别此二维码',
            icon: 'none'
          });
        } catch (e) {
          console.error('解析二维码失败:', e);
          wx.showToast({
            title: '二维码格式错误',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.log('扫码取消或失败:', err);
      }
    });
  }
});