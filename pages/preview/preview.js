// pages/preview/preview.js
const app = getApp();
const { encodeObj } = require('../../utils/util');
const { drawQRCode } = require('../../utils/qrcode');

Page({
  data: {
    cardData: null,
    qrcodeImage: '',
    qrCodeTip: ''
  },

  onLoad() {
    const cardData = app.getCardData();
    if (!cardData) {
      wx.showToast({
        title: '暂无应急卡数据',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }
    
    this.setData({ cardData });
    
    // 延迟生成二维码，确保 canvas 已渲染
    setTimeout(() => {
      this.generateQRCode();
    }, 500);
  },

  // 生成二维码
  generateQRCode() {
    const { cardData } = this.data;
    
    console.log('Card data for QR:', cardData);
    
    // 精简数据，只保留必要字段（使用 form 页面保存的字段名格式）
    const essentialData = {
      n: cardData.name || '',           // 姓名
      a: cardData.age || '',            // 年龄
      b: cardData.blood || '',          // 血型
      l: cardData.allergy || '',        // 过敏
      c: cardData.conditions || '',     // 病症
      m: cardData.meds || '',           // 用药
      d: cardData.address || '',        // 地址
      c1: (cardData.c1_name || '') + '|' + (cardData.c1_phone || ''),  // 联系人1
      c2: (cardData.c2_name || '') + '|' + (cardData.c2_phone || '')   // 联系人2
    };
    
    // 将数据编码为 URL 安全的格式
    const jsonStr = JSON.stringify(essentialData);
    const encodedData = encodeURIComponent(jsonStr);
    
    // 生成小程序页面路径
    // 格式：小程序页面路径?参数
    // 当用户使用微信扫码时，如果识别为小程序码，会自动打开小程序并跳转到指定页面
    const pagePath = '/pages/scan/scan';
    const qrContent = pagePath + '?d=' + encodedData;
    
    console.log('QR Content:', qrContent);
    console.log('QR Content length:', qrContent.length);
    
    // 提示用户
    this.setData({
      qrCodeTip: '提示：此二维码需配合小程序码使用，或在小程序内扫码查看'
    });
    
    // 使用 canvas 绘制二维码
    const query = wx.createSelectorQuery();
    query.select('#qrcode-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) {
          console.error('Canvas not found');
          this.generateQRCodeFallback(qrContent);
          return;
        }
        
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        
        // 设置 canvas 尺寸 - 使用更大的尺寸以提高清晰度
        const size = 300;
        const dpr = wx.getWindowInfo().pixelRatio;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);
        
        // 使用二维码工具库绘制，增加边距
        drawQRCode(ctx, qrContent, size, { margin: 2 });
        
        // 将 canvas 转为图片
        setTimeout(() => {
          wx.canvasToTempFilePath({
            canvas: canvas,
            success: (res) => {
              this.setData({
                qrcodeImage: res.tempFilePath
              });
            },
            fail: (err) => {
              console.error('Canvas to image failed:', err);
            }
          });
        }, 100);
      });
  },

  // 备用方案
  generateQRCodeFallback(content) {
    console.log('Using fallback QR code generation');
    console.log('QR Code content:', content);
    
    wx.showToast({
      title: '请使用微信开发者工具查看完整效果',
      icon: 'none',
      duration: 2000
    });
  },

  // 保存二维码到相册
  saveQRCode() {
    if (!this.data.qrcodeImage) {
      wx.showToast({
        title: '二维码生成中，请稍候',
        icon: 'none'
      });
      return;
    }
    
    wx.saveImageToPhotosAlbum({
      filePath: this.data.qrcodeImage,
      success: () => {
        wx.showToast({
          title: '已保存到相册',
          icon: 'success'
        });
      },
      fail: (err) => {
        if (err.errMsg.includes('auth deny')) {
          wx.showModal({
            title: '提示',
            content: '需要您授权保存图片到相册',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        } else {
          wx.showToast({
            title: '保存失败',
            icon: 'none'
          });
        }
      }
    });
  },

  // 编辑卡片
  editCard() {
    wx.navigateTo({
      url: '/pages/form/form'
    });
  },

  // 拨打电话
  callPhone(e) {
    const phone = e.currentTarget.dataset.phone;
    if (phone) {
      wx.makePhoneCall({
        phoneNumber: phone,
        fail: () => {}
      });
    }
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '老年人应急信息卡 - 关爱家人从这里开始',
      path: '/pages/index/index'
    };
  }
});
