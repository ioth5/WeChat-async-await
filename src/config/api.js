/**
 * api list
 */
import cfg from '../config/index.js';

export default {
    "wechatLogin":              "Mnplogin",                                                 // code换取小程序用户信息
   
    //活动相关
    "topicHotCoupon":           `${cfg.act_api}coupon/obtainBatch`,                         //领取组合优惠劵
    "topicHotMemberActInfo":    `${cfg.act_api}prize/searchMemberActInfo`,                  //查询用户活动信息
}
