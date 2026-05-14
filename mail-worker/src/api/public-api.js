import app from '../hono/hono';
import result from '../model/result';
import publicService from '../service/public-service';

// --- 👇 引入 D1 数据库操作需要的依赖 👇 ---
import { eq, desc } from 'drizzle-orm';
import email from '../entity/email';
import orm from '../entity/orm';
// ------------------------------------------

app.post('/public/genToken', async (c) => {
	const data = await publicService.genToken(c, await c.req.json());
	return c.json(result.ok(data));
});

app.post('/public/emailList', async (c) => {
	const list = await publicService.emailList(c, await c.req.json());
	return c.json(result.ok(list));
});

app.post('/public/addUser', async (c) => {
	await publicService.addUser(c, await c.req.json());
	return c.json(result.ok());
});

// --- 👇 提取核心处理逻辑 👇 ---
const messageHandler = async (c) => {
	const address = c.req.query('address');
	const key = c.req.query('key');
	
	// 1. 鉴权：使用传入的环境变量 api_key 进行校验 (对应您设置的 888)
	if (key !== c.env.api_key) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	if (!address) {
		return c.json({ error: "Address is required" }, 400);
	}

	// 2. 使用 D1 ORM 直接从数据库查询该随机地址的邮件
	const emails = await orm(c).select()
		.from(email)
		.where(eq(email.toEmail, address))
		.orderBy(desc(email.emailId)) // 最新的邮件排在最前
		.limit(10)
		.all();

	// 3. 字段精准映射 (100% 模拟简化版 worker.js 的返回格式)
	const mappedResult = emails.map(e => ({
		id: e.emailId,                 
		message_id: e.messageId || "", 
		source: e.sendEmail,           // 关键：发件人地址映射为 source
		to: e.toEmail,                 
		sender: e.name ? `${e.name} <${e.sendEmail}>` : e.sendEmail,
		subject: e.subject,            
		text: e.text || e.content,     // 关键：纯文本正文，方便提取验证码
		html: e.html || e.content,
		created_at: e.createTime,      // 关键：时间映射为 created_at
		attachments: []                
	}));

	// 核心：直接返回数组，不加任何包装
	return c.json(mappedResult);
};


