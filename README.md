1. 从技术开发角度，这叫：
- 接口适配 (API Adaptation) / 接口兼容：我们相当于在原有的系统上加了一个“转换器”，让原本只服务于人类浏览器访问的代码，兼容了自动化脚本（如 Tavily 注册机）的调用标准。
- 内容协商 (Content Negotiation) / 自适应响应：这就是我们代码里通过判断是否有 Authorization 请求头来决定返回 JSON 还是纯文本排版的逻辑。系统变“聪明”了，能自动看人下菜碟（机器来访问给机器的格式，人来访问给人的格式）。
- RESTful API 规范化：我们通过提供标准的 GET（获取邮件）和 DELETE（清理邮件）方法，把它变成了一个标准的、符合现代规范的 Web API。

2. 在自动化/注册机圈子的俗称，这种接收邮件的方式叫：
- 临时邮箱 API (Temp Mail API)：注册机圈子最常用的叫法。相当于你自己搭建了一个类似于 Guerrilla Mail 或 Temp-Mail 的私人后端接口。
- 自动接码接口 / 收信 API：专门用于全自动接收注册验证码、激活链接的无头（Headless）服务。
- Catch-All 域名邮箱后端：因为配置了特定的前缀或全域接收，配合这个 API，可以无限生成类似 random123@example.com 的邮箱并瞬间通过 API 读取验证码。

Cloudflare Email Worker（自建，免费）
EMAIL_DOMAIN =example.com
EMAIL_API_URL =https://mail.example.com
EMAIL_API_TOKEN =888
或是
邮箱域名：example.com
收码API地址：https://mail.example.com
收码密钥：888
