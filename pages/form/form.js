// pages/form/form.js
const app = getApp();

Page({
  data: {
    formData: {
      name: '',
      age: '',
      blood: '',
      allergy: '',
      conditions: '',
      meds: '',
      address: '',
      c1_name: '',
      c1_relation: '',
      c1_phone: '',
      c2_name: '',
      c2_relation: '',
      c2_phone: ''
    },
    bloodTypes: ['不填写', 'A型', 'B型', 'AB型', 'O型', '不详'],
    bloodTypeIndex: 0
  },

  onLoad() {
    // 加载已保存的数据
    const savedData = app.getCardData();
    if (savedData) {
      // 找到血型对应的索引
      let bloodIndex = 0;
      if (savedData.blood) {
        bloodIndex = this.data.bloodTypes.findIndex(item => item === savedData.blood);
        if (bloodIndex === -1) bloodIndex = 0;
      }
      
      this.setData({
        formData: savedData,
        bloodTypeIndex: bloodIndex
      });
    }
  },

  // 输入处理
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`formData.${field}`]: value
    });
  },

  // 血型选择
  onBloodTypeChange(e) {
    const index = e.detail.value;
    const blood = index == 0 ? '' : this.data.bloodTypes[index];
    this.setData({
      bloodTypeIndex: index,
      'formData.blood': blood
    });
  },

  // 提交表单
  submitForm() {
    const { formData } = this.data;
    
    // 验证必填项
    if (!formData.name.trim()) {
      wx.showToast({ title: '请填写姓名', icon: 'none' });
      return;
    }
    if (!formData.c1_name.trim()) {
      wx.showToast({ title: '请填写紧急联系人姓名', icon: 'none' });
      return;
    }
    if (!formData.c1_phone.trim()) {
      wx.showToast({ title: '请填写紧急联系人电话', icon: 'none' });
      return;
    }
    
    // 验证手机号格式
    if (!/^1\d{10}$/.test(formData.c1_phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    // 保存数据
    app.saveCardData(formData);
    
    wx.showToast({
      title: '保存成功',
      icon: 'success',
      duration: 1500
    });

    // 跳转到预览页面
    setTimeout(() => {
      wx.navigateTo({
        url: '/pages/preview/preview'
      });
    }, 1500);
  },

  // 清空表单
  clearForm() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有填写的内容吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            formData: {
              name: '',
              age: '',
              blood: '',
              allergy: '',
              conditions: '',
              meds: '',
              address: '',
              c1_name: '',
              c1_relation: '',
              c1_phone: '',
              c2_name: '',
              c2_relation: '',
              c2_phone: ''
            },
            bloodTypeIndex: 0
          });
          app.clearCardData();
          wx.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  }
});
