1. 从技术开发角度，这叫：
- 接口适配 (API Adaptation) / 接口兼容：我们相当于在原有的系统上加了一个“转换器”，让原本只服务于人类浏览器访问的代码，兼容了自动化脚本（如 Tavily 注册机）的调用标准。
- 内容协商 (Content Negotiation) / 自适应响应：这就是我们代码里通过判断是否有 Authorization 请求头来决定返回 JSON 还是纯文本排版的逻辑。系统变“聪明”了，能自动看人下菜碟（机器来访问给机器的格式，人来访问给人的格式）。
- RESTful API 规范化：我们通过提供标准的 GET（获取邮件）和 DELETE（清理邮件）方法，把它变成了一个标准的、符合现代规范的 Web API。

2. 在自动化/注册机圈子的俗称，这种接收邮件的方式叫：
- 临时邮箱 API (Temp Mail API)：注册机圈子最常用的叫法。相当于你自己搭建了一个类似于 Guerrilla Mail 或 Temp-Mail 的私人后端接口。
- 自动接码接口 / 收信 API：专门用于全自动接收注册验证码、激活链接的无头（Headless）服务。
- Catch-All 域名邮箱后端：因为配置了特定的前缀或全域接收，配合这个 API，可以无限生成类似 random123@example.com 的邮箱并瞬间通过 API 读取验证码。

<h4 id="h4-cloudflare-email-worker-" style="box-sizing: border-box; margin-bottom: 16px; color: rgba(0, 0, 0, 0.85); position: relative; line-height: 1.4; font-size: 1.25em; font-family: 'Microsoft YaHei', Helvetica, 'Meiryo UI', 'Malgun Gothic', 'Segoe UI', 'Trebuchet MS', Monaco, monospace, Tahoma, STXihei, 华文细黑, STHeiti, 'Helvetica Neue', 'Droid Sans', 'wenquanyi micro hei', FreeSans, Arimo, Arial, SimSun, 宋体, Heiti, 黑体, sans-serif; margin-top: 0px !important;">Cloudflare Email Worker（自建，免费）</h4>
<ul style="box-sizing: border-box; margin-top: 0px; padding: 0px 0px 0px 2em; color: #333333; font-family: 'Microsoft YaHei', Helvetica, 'Meiryo UI', 'Malgun Gothic', 'Segoe UI', 'Trebuchet MS', Monaco, monospace, Tahoma, STXihei, 华文细黑, STHeiti, 'Helvetica Neue', 'Droid Sans', 'wenquanyi micro hei', FreeSans, Arimo, Arial, SimSun, 宋体, Heiti, 黑体, sans-serif; margin-bottom: 0px !important;">
<li style="box-sizing: border-box;">
<pre>EMAIL_DOMAIN =example.com</pre>
</li>
<li style="box-sizing: border-box;">
<pre>EMAIL_API_URL =https://mail.example.com</pre>
</li>
<li style="box-sizing: border-box;">
<pre>EMAIL_API_TOKEN =888</pre>
<h4 id="h4-u6216u662F" style="box-sizing: border-box; margin-top: 1em; margin-bottom: 16px; color: rgba(0, 0, 0, 0.85); position: relative; line-height: 1.4; font-size: 1.25em;"><a class="reference-link" style="box-sizing: border-box; color: #4183c4; background-image: initial; background-position: 0px 0px; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial; outline: none; cursor: pointer; transition: color 0.3s ease 0s; touch-action: manipulation;" name="或是"></a>或是</h4>
</li>
<li style="box-sizing: border-box;">
<pre>邮箱域名：example.com</pre>
</li>
<li style="box-sizing: border-box;">
<pre>收码API地址：https://mail.example.com</pre>
</li>
<li style="box-sizing: border-box;">
<pre>收码密钥：888</pre>
</li>
</ul>
