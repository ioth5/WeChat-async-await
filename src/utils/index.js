import cfg from '../config/index.js';
import ApiList from  '../config/api';
import {promisify, complete} from 'promisify';

const regeneratorRuntime = require('./../libs/regenerator/runtime-module');

/*
 * 判断是否包含http协议
 * */
function isHttpUrl(url) {
    return /^http/i.test(url);
}

/*
 * 兼容获取请求url
 * */
function getRequestUrl(url) {
    let reqUrl;
    const api = ApiList[url];
    if (!api) {
        if (isHttpUrl(url)) {
            reqUrl = url;
        } else {
            console.error('[config/api.js]中未配置', url, '映射');
        }
    } else {
        reqUrl = isHttpUrl(api) ? api : (cfg.api + api);
    }
    return reqUrl;
}

/*
 * 显示loading
 * */
function showLoading(opt) {
    let _loading = opt.showLoading;
    if (!_loading) return false;
    switch (_loading.type) {
        case 1:
            //微信系统的loading
            opt.timer && clearTimeout(opt.timer);
            opt.timer = setTimeout(() => {
                wx.showLoading({
                    mask: true,
                    title: _loading.title || '加载中'
                });
            }, 180);
            break;
        case 2:
            //顶部导航栏loading
            wx.showNavigationBarLoading();
            break;
        default:
            // 自定义loading
            const page = getCurrPage();
            opt.timer && clearTimeout(opt.timer);
            opt.timer = setTimeout(() => {
                page.setData({
                    '__loading__.show': true
                });
            }, 180);
            break;
    }
    return true;
}

/*
 * 隐藏loading
 * */
function hideLoading(opt) {
    let _loading = opt.showLoading;
    if (!_loading) return false;
    switch (_loading.type) {
        case 1:
            //微信系统的loading
            opt.timer && clearTimeout(opt.timer);
            wx.hideLoading();
            break;
        case 2:
            //顶部导航栏loading
            wx.hideNavigationBarLoading();
            break;
        default:
            // 自定义loading
            const page = getCurrPage();
            opt.timer && clearTimeout(opt.timer);
            page.setData({
                '__loading__.show': false
            });
            break;
    }
    return true;
}

//获取当前page
function getCurrPage() {
    const pages = getCurrentPages();
    return pages[pages.length - 1];
}


/*========== Function ==========*/

/*
 * 获取用户信息，来源：本地存储
 * */
const getUserInfo = async function(type) {
    let res = null;
    const key_user = cfg.localKey.user;
    const userInfo = wx.getStorageSync(key_user);
    if (userInfo) {
        res = type ? userInfo[type] : userInfo;
    }
    return res;
};


/*
 * Tip
 * 1. 要注意 method 的 value 必须为大写（例如：GET）；
 * 3. request 的默认超时时间和最大超时时间都是 60s
 * 4. request 的最大并发数是 10
 * 5. 网络请求的 referer 是不可以设置的，格式固定为 https://servicewechat.com/{appid}/{version}/page-frame.html
 *   其中 {appid} 为小程序的 appid，{version} 为小程序的版本号，版本号为 0 表示为开发版。
 * */

/*
 * 封装request
 * 参数说明：
 * @params {Boolean} login           是否需要登录
 * @params {Boolean} location        是否需要获取地理位置信息
 * @params {String} url              请求的url地址，可传api中的key或http绝对路径
 * @params {String} method           请求方式：GET/POST
 * @params {Object} header           请求头，如contentType等
 * @params {Object} data             请求数据体参数
 * @params {Object} showLoading      是否显示加载loading提示，默认为false不显示。 可设置true默认为{type: 1, title: '加载中'}。
 *                                   type：1为默认加载样式，type：2为顶部导航条进度提示loading样式。
 * @params {String} errType          统一处理错误或异常，默认以toast的形式弹出
 * @params {String} mode             'natural': 直接使用wx.request发起请求，不处理授权等用户信息
 * */

const request = async function (opt) {

    //env:local时使用本地数据
    if (!cfg.api) {
        const mock = require(`../config/local/data`);
        return opt.success.call(opt, {data: mock.default[opt.url] || {}});
    }

    // 获取请求url
    const reqUrl = getRequestUrl(opt.url);
    if (!reqUrl) return;

    //请求方式不同设置不同的contentType
    const header = {
        //'Content-Type': /GET/i.test(opt.method) ? 'application/json' : 'application/x-www-form-urlencoded',
        //'UA-Info': ', WeApp request v1.0.0,  V5.1.0 2017080808'
    };

    const option = {
        url: reqUrl,
        method: (opt.method || "POST").toUpperCase(),
        header: Object.assign(header, opt.header),
        data: opt.data || {}
    };

    switch (opt.mode) {
        case 'natural':
            //自然模式，不进行任何附加处理
            break;

        default:
            //设置loading
            showLoading(opt);

            //是否需要用户登录信息
            let bxmUser = opt.login ? await login(true) : await getUserInfo('bxm');
            if (bxmUser) {
                const {memberId, token} = bxmUser;
                Object.assign(option.header, {memberId, token});
            }
            //将用户openid作为deviceId参数
            const wxUser = await getUserInfo('wx');
            Object.assign(option.data, {deviceId: (wxUser && wxUser.openId) || 'abcdefghijklmnopqrstuvwxyz-A'});
            //需要地理位置信息
            if (opt.location) {
           
            }

            break;
    }

    //wx.request
    console.info('wx.request参数', option);

    const promise = complete(wx.request)(option);
    //promise.then(opt.success, opt.fail);

    const res = await promise;
    let errInfo, status = res.statusCode;
    console.info(opt.url, status, '=> ', res);

    //隐藏loading
    hideLoading(opt);

    //处理请求出错的情况
    if (status !== 200) {
        let errMsg = '服务器竟然在开小差', errCode = status || 1000;
        if (/timeout/gi.test(res.errMsg)) {
            errCode = 1001;
        }
        res.data = {
            error_code: errCode,
            error: [errMsg, ' #', errCode].join('')
        };
    }

    const {error_code, error} = res.data;
    if (error_code) {
        errInfo = {error_code, error};
        //错误类型处理
        switch (opt.errType) {
            case 'page':
                //页面数据增加error字段
                const page = getCurrPage();
                page.setData({
                    error: errInfo
                });
                break;
            case 'modal':

                break;
            case 'none':

                break;
            default:
                //默认为toast
                const app = getApp();
                wx.showToast({
                  title: errInfo.error,
                  icon: 'none',
                  duration: 2000
                })
                break;
        }
        return Promise.reject(errInfo);
    } else {
        //页面数据重置已有error字段
        const page = getCurrPage();
        if (page.data.error) {
            page.setData({
                error: null
            });
        }
    }

    return res;
};

/*
 * 检验是否授权
 * 处理未授权的情况
 * */
const checkAuthorize = async function (scope) {
    //scope列表
    const scopeList = {
        'scope.userInfo': '用户信息',
        'scope.userLocation': '地理位置',
        'scope.address': '通讯地址',
        'scope.record': '录音功能',
        'scope.writePhotosAlbum': '保存到相册',
    };

    await complete(wx.authorize)({scope: scope});
    let {authSetting} = await promisify(wx.getSetting)();
    console.info('wx.getSetting => ', authSetting);
    if (!authSetting[scope]) {
        const modal = await promisify(wx.showModal)({
            title: '授权提示',
            content: `检测到您没打开 服务的${scopeList[scope]}权限，请在设置中打开`
        });
        if (modal.confirm) {
            let {authSetting} = await promisify(wx.openSetting)();
            return authSetting[scope] || Promise.reject();
        }
        return Promise.reject();
    }
    return true;
};

/*
 * 判断当前是否为登录状态
 * 已登录则直接返回 用户信息
 * */
const isLogin = function () {
    const userInfo = wx.getStorageSync(cfg.localKey.user);
    return !!(userInfo && userInfo.bxm);
};

/*
 * 解密微信用户信息，根据openid查询是否已有 用户信息
 * 返回wx和bxm字段
 * */
const decodeUserInfo = async function () {
    const userInfo = {wx: null, bxm: null};
    //允许授权
    const basic = await promisify(wx.login)();
    console.info('login => ', basic);
    const userData = await request({
      mode: 'natural',
      method: 'GET',
      url: "wechatLogin",
      showLoading: { type: 2 },
      data: {
        code: basic.code,
        scene: 1,
      }
    })
    console.log(userData);

    //成功获取用户信息
    if (userData.data && userData.data.result) {
      userInfo.bxm = userData.data.result.openid;
      userInfo.wx = userData.data.result.userToken;
      //存储到本地缓存
      wx.setStorageSync(cfg.localKey.user, userInfo);
    } else {
        //wx.login 接口返回报错
        wx.showModal({
            title: '提示',
            content: `接口请求失败，请重试！#[wx.login]`
        });
        return Promise.reject();
    }

    return userInfo;
};

/*
 * 需要登录，未获取到 用户信息，需要跳转到绑定页
 * 1. 需要登录信息，不需要强制跳转到登录页面。app.login().then(res=>{})
 * 2. 登录后返回当前页面。 app.login(true)或app.login(true).then(res=>{})
 * 3. 登录后跳转到目标url。 app.login({go: target_url})
 * */
const login = async function (params) {
    /*
     * 获取本地存储的用户信息
     * 这里查询 用户信息，没有则重新请求一次，可能在其他端进行了绑定
     * */
    let bxmUser = await getUserInfo('bxm');

    const goUrl = params && params.go;

    /*
     * 未授权，则先授权，获取用户信息
     * 注：必须要先授权，获取到用户openid等信息，才能跳转到绑定页面
     * */
    if (!bxmUser) {
        bxmUser = await decodeUserInfo();
    }

    /*
     * 已有 用户信息，直接next
     * */
    if (bxmUser) {
        if (goUrl) {
            return wx.navigateTo({
                url: goUrl
            })
        }
        return bxmUser;
    }

    /*
     * 未绑定，跳转到绑定页面
     * */
    if (params) {
        let loginUrl = '/pages/login/index';
        if (goUrl) loginUrl += ('?go=' + goUrl);
        return wx.navigateTo({
            url: loginUrl
        })
    }
    return Promise.reject(bxmUser);
};

/**
 *微信支付
 * @param orderBatchNo {*}
 */
const wxPay = async function({orderBatchNo}) {
    const userInfo = await getUserInfo('wx');
    // 1.checkPay 不需要了
    // 3.wxPay
    // 4.支付成功 lockOrder removeStorage(清除缓存的临时数据)
    // 5.跳转支付成功结果页

    const payResult = await request({
        url: 'wxPay',
        showLoading: {type: 2},
        data: {
            'openId': userInfo.openId,
            'orderNo': orderBatchNo,
        }
    });

    const data = payResult.data;
    if (data.error) {
        return console.error('API wxPay => ', data);
    }
    return await promisify(wx.requestPayment)({
        "timeStamp": data.timeStamp,
        "nonceStr": data.nonceStr,
        "package": data.package,
        "signType": "MD5",
        "paySign": data.paySign
    });
};


export {getUserInfo, login, isLogin, request, checkAuthorize};

