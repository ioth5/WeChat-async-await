import cfg from '../config/index.js';

/*
 * 将浮点数去除小数点，返回整数和倍数。如 3.14 >> 314，倍数是 100
 * @param n {number} 浮点数
 * return {object}
 * {num: 314, times: 100}
 * */
const fnMathExt = function () {

    function toInt(n) {
        n = +n;
        var res = {num: n, times: 1};
        if (n !== (n | 0)) { //判断浮点数，n===parseInt(n)
            var arr = ('' + n).split('.');
            var len = arr[1].length; //小数长度
            res.times = Math.pow(10, len); //需要乘的倍数=>10的指数
            res.num = Math.round(n * res.times); //四舍五入取整
        }
        return res;
    }

    function operation(a, b, op) {
        var result; //最终计算的值
        var o1 = toInt(a), o2 = toInt(b);

        var n1 = o1.num, t1 = o1.times;
        var n2 = o2.num, t2 = o2.times;

        var max = Math.max(t1, t2);

        switch (op) {
            case 'add':
                if (t1 > t2) {
                    result = n1 + n2 * (t1 / t2);
                } else {
                    result = n2 + n1 * (t2 / t1);
                }
                result = result / max;
                break;
            case 'subtract':
                if (t1 > t2) {
                    result = n1 - n2 * (t1 / t2);
                } else {
                    result = n1 * (t2 / t1) - n2;
                }
                result = result / max;
                break;
            case 'multiply':
                result = (n1 * n2) / (t1 * t2);
                return result;
            case 'divide':
                result = (n1 / n2) * (t2 / t1);
                return result;

        }
        return result;
    }

    /*加*/
    function add(a, b) {
        return operation(a, b, 'add');
    }

    /*减*/
    function subtract(a, b) {
        return operation(a, b, 'subtract');
    }

    /*乘*/
    function multiply(a, b) {
        return operation(a, b, 'multiply');
    }

    /*除*/
    function divide(a, b) {
        return operation(a, b, 'divide');
    }

    //exports
    return {
        add: add,
        subtract: subtract,
        multiply: multiply,
        divide: divide
    };
};
Object.assign(Math, fnMathExt());


Object.assign(JSON, {
    /**
     * 序列化json对象为string
     * {a: 1, b: 2} --> a=1&b=2
     */
    param: function (n) {
        var e = [];
        for (var o in n)e.push(encodeURIComponent(o) + "=" + encodeURIComponent(null == n[o] ? "" : n[o]));
        return e.join("&").replace(/%20/g, "+")
    }
});


/*
 * 扩展Array方法
 * 数组去重，支持数组内存储的是对象
 * */
Array.prototype.unique = function () {
    const res = [], json = {}, len = this.length;
    for (let i = 0; i < len; i++) {
        let key = this[i];
        if (Object.prototype.toString.call(this[i]) == '[object Object]') {
            key = JSON.stringify(this[i]);
        }
        if (!json[key]) {
            res.push(this[i]);
            json[key] = 1;
        }
    }
    return res;
};
/*
 * 获取元素索引值
 * */
Array.prototype.getIndex = function (c) {
    let b = 0, a = this.length;
    for (; b < a; b++) {
        if (this[b] == c) {
            return b;
        }
    }
    return -1;
};


/*
 * 节流函数处理
 * 参考 Underscore.js 1.8.3
 * https://github.com/jashkenas/underscore/blob/master/underscore.js
 * */

/*
* before_.before(count, function)
* 创建一个函数,调用不超过count 次。 当count已经达到时，最后一个函数调用的结果 是被记住并返回 。
* */
const before = function(times, func) {
    let memo;
    return function() {
        if (--times > 0) {
            memo = func.apply(this, arguments);
        }
        if (times <= 1) func = null;
        return memo;
    };
};

/*
 * throttle
 * app.throttle(function, wait, [options])
 * 创建并返回一个像节流阀一样的函数，当重复调用函数的时候，至少每隔 wait毫秒调用一次该函数。对于想控制一些触发频率较高的事件有帮助。
 * 默认情况下，throttle将在你调用的第一时间尽快执行这个function，并且，如果你在wait周期内调用任意次数的函数，都将尽快的被覆盖。
 * 如果你想禁用第一次首先执行的话，传递{leading: false}，还有如果你想禁用最后一次执行的话，传递{trailing: false}。
 * 示例：$(window).scroll(throttled);
 * */
const throttle = function (func, wait, options) {
    let timeout, context, args, result;
    let previous = 0;
    if (!options) options = {};
    wait = wait || 300;     //默认300ms

    const later = function () {
        previous = options.leading === false ? 0 : +new Date();
        timeout = null;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
    };

    const throttled = function () {
        const now = +new Date();
        if (!previous && options.leading === false) previous = now;
        const remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            previous = now;
            result = func.apply(context, args);
            if (!timeout) context = args = null;
        } else if (!timeout && options.trailing !== false) {
            timeout = setTimeout(later, remaining);
        }
        return result;
    };

    throttled.cancel = function () {
        clearTimeout(timeout);
        previous = 0;
        timeout = context = args = null;
    };

    return throttled;
};

/*
 * debounce
 * app.debounce(function, wait)
 * 延迟函数的执行(真正的执行)在函数最后一次调用时刻的 wait 毫秒之后. 对于必须在一些输入（多是一些用户操作）停止到达之后执行的行为有帮助。
 * 在类似不小心点了提交按钮两下而提交了两次的情况下很有用。
 * 示例：$(window).resize(debounce(function(e){}));
 * */
const debounce = (fn, wait) => {
    let timer = null;
    return function () {
        const context = this, args = arguments;
        timer && clearTimeout(timer);
        timer = setTimeout(function () {
            fn.apply(context, args);
        }, typeof wait === 'number' ? wait : 300);
    };
};

/**防止页面快速点击可以重复触发调用方法 app.preventMoreTap()
 * let app = getApp();
 * Page({
 *   xxx: function (e) {
 *       if (app.preventMoreTap(e)) {
 *            return;
 *       }
 *       //跳转
 *   }
 *   })
 */
const preventMoreTap = function(e) {
    let lastTime = this.globalLastTapTime || 0;
    let result = e.timeStamp - lastTime < 500;
    this.globalLastTapTime = e.timeStamp;
    return result;
};

/*
* 处理console.log
* */
if(cfg.env === 'pro'){
    //console.log = console.error = console.warn = console.info = function () {}
}


export { throttle, debounce, before, preventMoreTap }
