// pages/scan/scan.js
Page({
  data: {
    cardData: null
  },

  onLoad(options) {
    console.log('Scan page options:', options);
    
    // 支持两种参数格式：
    // 1. d=压缩格式 (新格式，用于小程序扫码)
    // 2. data=完整格式 (旧格式，用于内部跳转)
    
    if (options.d) {
      // 新格式：压缩数据
      this.parseCompactData(options.d);
    } else if (options.data) {
      // 旧格式：完整数据
      this.parseFullData(options.data);
    } else {
      this.showError('未获取到数据');
    }
  },

  // 解析压缩格式数据
  parseCompactData(encodedData) {
    try {
      const jsonStr = decodeURIComponent(encodedData);
      const compactData = JSON.parse(jsonStr);
      
      console.log('Compact data:', compactData);
      
      // 解析联系人信息
      let c1Name = '', c1Phone = '', c2Name = '', c2Phone = '';
      if (compactData.c1) {
        const parts = compactData.c1.split('|');
        c1Name = parts[0] || '';
        c1Phone = parts[1] || '';
      }
      if (compactData.c2) {
        const parts = compactData.c2.split('|');
        c2Name = parts[0] || '';
        c2Phone = parts[1] || '';
      }
      
      // 转换为完整格式 - 使用 WXML 模板中的字段名（下划线格式）
      const cardData = {
        name: compactData.n || '',
        age: compactData.a || '',
        blood: compactData.b || '',
        allergy: compactData.l || '',
        conditions: compactData.c || '',
        meds: compactData.m || '',
        address: compactData.d || '',
        c1_name: c1Name,
        c1_phone: c1Phone,
        c2_name: c2Name,
        c2_phone: c2Phone
      };
      
      console.log('Parsed cardData:', cardData);
      this.setData({ cardData });
    } catch (e) {
      console.error('解析压缩数据失败:', e);
      this.showError('数据解析失败');
    }
  },

  // 解析完整格式数据
  parseFullData(encodedData) {
    try {
      const rawData = JSON.parse(decodeURIComponent(encodedData));
      
      // 统一转换为 WXML 模板使用的字段名格式
      const cardData = {
        name: rawData.name || '',
        age: rawData.age || '',
        blood: rawData.blood || '',
        allergy: rawData.allergy || '',
        conditions: rawData.conditions || '',
        meds: rawData.medications || rawData.meds || '',
        address: rawData.address || '',
        c1_name: rawData.contact1Name || rawData.c1_name || '',
        c1_phone: rawData.contact1Phone || rawData.c1_phone || '',
        c2_name: rawData.contact2Name || rawData.c2_name || '',
        c2_phone: rawData.contact2Phone || rawData.c2_phone || ''
      };
      
      console.log('Parsed full cardData:', cardData);
      this.setData({ cardData });
    } catch (e) {
      console.error('解析完整数据失败:', e);
      this.showError('数据解析失败');
    }
  },

  // 显示错误
  showError(message) {
    wx.showToast({
      title: message,
      icon: 'none'
    });
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  },

  // 拨打联系人电话
  callPhone(e) {
    const phone = e.currentTarget.dataset.phone;
    if (phone) {
      wx.makePhoneCall({
        phoneNumber: phone,
        fail: () => {}
      });
    } else {
      wx.showToast({
        title: '未填写电话号码',
        icon: 'none'
      });
    }
  },

  // 拨打紧急电话
  callEmergency(e) {
    const phone = e.currentTarget.dataset.phone;
    wx.showModal({
      title: '确认拨打',
      content: `确定要拨打 ${phone} 吗？`,
      confirmText: '拨打',
      confirmColor: '#e74c3c',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: phone,
            fail: () => {}
          });
        }
      }
    });
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '老年人应急信息卡 - 关爱家人从这里开始',
      path: '/pages/index/index'
    };
  }
});
