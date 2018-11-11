//app.js
import { throttle, debounce, preventMoreTap} from 'utils/ext';
import {getUserInfo,login,isLogin,checkAuthorize,request} from 'utils/index';


//app.js
App({
  getUserInfo, //获取用户信息，可选参数[String] 'bxm'、'wx'或空
  login, //登录后执行回调函数，返回Promise对象.
  isLogin, //当前状态是否已登录
  checkAuthorize, // 检验是否授权
  request, // request请求
  throttle,
  debounce, //节流函数
  preventMoreTap, //防止快速点击多次跳转
  onLaunch() {
    login(); //执行静默授权登录，保存用户信息到本地存储
  },
  globalData: {
    isIphoneX: false
  },
  onShow: function() {
    let me = this;
    wx.getSystemInfo({
      success: res => {
        // console.log('手机信息res'+res.model)
        let modelmes = res.model;
        if (modelmes.search('iPhone X') != -1) {
          me.globalData.isIphoneX = true
        }
      }
    })
  }
});