export class ServerError extends Error {
  constructor(message = 'Unknown Error', code = -1) {
    super(message)
    this._status = code
    this._message = message
    this.code = code
  }
}

/** 涵盖项目范围内常见的错误场景消息取值 */
export function getErrMsg(err, fallbackMsg = 'Server Error') {
  try {
    if (!err) {
      return fallbackMsg
    }
    return `${err.message || err.Message || err.msg || err.Msg || fallbackMsg}`
  } catch (e) {
    return getErrMsg(e, fallbackMsg)
  }
}
