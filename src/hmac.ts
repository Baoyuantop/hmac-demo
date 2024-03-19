/* eslint-disable prefer-template */

// import CryptoJS from 'crypto-js/crypto-js';
import { HmacSHA256, enc } from 'crypto-js';

export interface Options { accessKey: string,  secretKey: string, body?: boolean }

/**
 * HmacSHA256加密
 * @param str 待加密的字符串内容
 * @param key 密钥
 * @returns 加密后的字符串
 */
function encryptHmacSHA256(str: string, key: string) {
  // 此方法为HMAC-SHA256的签名方式
  const res = HmacSHA256(str, key);
  // 使用base64的方法加密，输出字符串
  return enc.Base64.stringify(res);
}

/**
 * 获取路径中的参数字符串
 * @param params 请求参数
 * @returns 参数字符串
 */
function getQueryString(params: Record<string, any>) {
  if (!params) {
    return '';
  }

  let parameters = '';
  const keys = Object.keys(params);
  keys.sort();
  keys.forEach((key) => {
    if (params[key] === undefined || params[key] === null) {
      return;
    }
    parameters += key + '=' + encodeURIComponent(params[key]) + '&';
  });
  parameters = parameters.replace(/&$/, '');
  return parameters;
}

function param2Obj(url: string) {
  const search = decodeURIComponent(url.split('?')[1]).replace(/\+/g, ' ');
  if (!search) {
    return {};
  }
  const obj: Record<string, any> = {};
  const searchArr = search.split('&');
  searchArr.forEach((v) => {
    const index = v.indexOf('=');
    if (index !== -1) {
      const name = v.substring(0, index);
      const val = v.substring(index + 1, v.length);
      obj[name] = val;
    }
  });
  return obj;
}


/**
 * 根据协商的规则获取加密字符
 * @param config axios config
 * @param date GMT时间
 * @returns axios config
 */
function getSignature(config: any, date: string, options: Options) {
  const { method: methodStr, url, params, baseURL } = config || {};
  const method = (methodStr || '').toUpperCase();
  let sendParams = params || {};

  if (url.includes('?')) {
    const nowParams = param2Obj(url);
    sendParams = Object.assign({}, sendParams, nowParams);
  }

  const uri = url.startsWith('http')
    ? new URL(url).pathname
    : new URL((baseURL || '') + url).pathname;


  const canonicalQueryString = getQueryString(sendParams || {}) || '';
  const signingString = `${method}\n${decodeURIComponent(uri)}\n${canonicalQueryString}\n${options.accessKey}\n${date}\n`;  // eslint-disable-line
  console.log('signingString: ', signingString);

  return encryptHmacSHA256(signingString, options.secretKey);  // eslint-disable-line
}



/**
 * axios header 添加hmac相关请求头
 * @param config axios config
 * @returns axios config
 */
export default function (options: Options) {
  return function withHmacAuth(config: any) {
    const date = new Date().toUTCString();
    config.headers['X-DATE'] = date;
    config.headers['X-HMAC-SIGNATURE'] = getSignature(config, date, options);
    config.headers['X-HMAC-ACCESS-KEY'] = options.accessKey;
    config.headers['X-HMAC-ALGORITHM'] = 'hmac-sha256';

    if (options.body) {
      let bodyStr = '';
      if (typeof config.data === 'object' && !(config.data instanceof FormData)) {
        bodyStr = JSON.stringify(config.data);
      }

      config.headers['X-HMAC-DIGEST'] = 'd/iVLiZjPPKR4mfIBEUFJKClKdeATCzNfn52RKMZo0k=';
    }
    return config;
  }
}

export const generateSignatureHeaders = (
  config: any,
  options: Options
) => {
  const date = new Date().toUTCString();
  const signature = getSignature(config, date, options);
  return {
    'X-DATE': date,
    'X-HMAC-SIGNATURE': signature,
    'X-HMAC-ACCESS-KEY': options.accessKey,
    'X-HMAC-ALGORITHM': 'hmac-sha256'
  };
}