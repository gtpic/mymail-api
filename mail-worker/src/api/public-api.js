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

// --- 👇 核心处理逻辑 👇 ---
const messageHandler = async (c) => {
	const address = c.req.query('address');

	// 鉴权：支持 URL ?key= 或 Header Bearer Token
	const authHeader = c.req.header('Authorization');
	let key = c.req.query('key');

	if (authHeader && authHeader.startsWith('Bearer ')) {
		key = authHeader.substring(7);
	}

	// API KEY 校验
	if (key !== c.env.api_key) {
		return c.json({ error: 'Unauthorized' }, 401);
	}

	if (!address) {
		return c.json({ error: 'Address is required' }, 400);
	}

	// D1 查询邮件列表
	const emails = await orm(c)
		.select()
		.from(email)
		.where(eq(email.toEmail, address))
		.orderBy(desc(email.emailId))
		.limit(10)
		.all();

	// 数据映射
	const mappedResult = emails.map((e) => ({
		id: e.emailId,
		message_id: e.messageId || '',
		source: e.sendEmail,
		to: e.toEmail,
		sender: e.name ? `${e.name} <${e.sendEmail}>` : e.sendEmail,
		subject: e.subject,
		text: e.text || e.content,
		html: e.html || e.content,
		created_at: e.createTime,
		attachments: [],
	}));

	// 返回格式兼容（带 Authorization → messages 包装）
	if (authHeader) {
		return c.json({ messages: mappedResult });
	}

	return c.json(mappedResult);
};

// --- 路由绑定 ---
app.get('/messages', messageHandler);
app.get('/api/messages', messageHandler);

// --- 👇 删除邮件接口 👇 ---
const deleteHandler = async (c) => {
	const address = c.req.query('address');

	const authHeader = c.req.header('Authorization');
	let key = c.req.query('key');

	if (authHeader && authHeader.startsWith('Bearer ')) {
		key = authHeader.substring(7);
	}

	if (key !== c.env.api_key) {
		return c.json({ error: 'Unauthorized' }, 401);
	}

	if (address) {
		await orm(c)
			.delete(email)
			.where(eq(email.toEmail, address));
	}

	return c.json({ success: true });
};

// --- DELETE 路由绑定 ---
app.delete('/messages', deleteHandler);
app.delete('/api/messages', deleteHandler);
