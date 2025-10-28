const TOKEN_KEY = 'Token'

class Token {
  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY)
  }
  get() {
    return this.token
  }
  set(val) {
    this.token = val
    if (val) localStorage.set(TOKEN_KEY, val)
    else localStorage.remove(TOKEN_KEY)
  }
}

export default new Token()
