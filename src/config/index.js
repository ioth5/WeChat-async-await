// 小程序通过配置信息;
let AppConfig = {
    env: 'dev',     //当前开发环境: local,dev,pro

    ak: "a8a06158a8034e1e4da698bfa6827b55", // 高德地图key
    bk: "YPvGSM6GWpf41L3DnDEjRO7vyycHoGq6", // 百度地址key

    //定位信息
    location: {
        //默认
        defaults: {

        },
        //当前
        current: null,
        //GPS
        gps: null
    },

    // 本地存储名称集合
    localKey: {
        user: "_user_info",                     // 用户信息
        qcRpt: "_qc_report",                    // 质检报告
        cartId: "_cartId",                      // 购物车ID
        boxId: "_boxId",                        // 购物箱ID
        sku: "_sku_info",                       // sku数据
        stlDL: "stl_delivery",             // 结算确认订单的配送信息
    },
};

//获取配置文件
Object.assign(AppConfig, require(`./env/${AppConfig.env}`).default);

export default AppConfig;