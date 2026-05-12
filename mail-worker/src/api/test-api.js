import app from '../hono/hono';
import emailService from '../service/email-service';
import result from '../model/result';

app.get('/', async (c) => {
	const query = c.req.query();
	const secretKey = c.env.api_key || '';
    
	if (query.key !== secretKey) {
		return c.json(result.fail('暗号错误，无权访问', 401));
	}
	try {
		query.size = query.size ? Number(query.size) : 20;
		if (query.emailId) query.emailId = Number(query.emailId);

		// 1. 提取所有自定义过滤参数
		const searchContent = query.content;
		const searchSubject = query.subject;
		const filterTo = query.to;
		const filterFrom = query.from;
		const showType = query.show || 'to'; // 默认为收件箱

		// 移除会干扰数据库原生查询的参数
		if (searchContent) delete query.content;
		if (searchSubject) delete query.subject;

		// 2. 去数据库拉取原始数据
		const data = await emailService.allList(c, query);

		// 3. 执行多重过滤
		data.list = data.list.filter(email => {
			// A. 区分收发件类型 (show=from 看发件, 否则看收件)
			const targetType = showType === 'from' ? 1 : 0;
			if (email.type !== targetType) return false;

			// B. 匹配收件人地址关键字 (to)
			if (filterTo && !(email.toEmail && email.toEmail.includes(filterTo))) return false;

			// C. 匹配发件人地址关键字 (from)
			if (filterFrom && !(email.sendEmail && email.sendEmail.includes(filterFrom))) return false;

			// D. 匹配标题关键字 (subject)
			if (searchSubject && !(email.subject && email.subject.includes(searchSubject))) return false;

			// E. 匹配正文关键字 (content)
			if (searchContent) {
				const inText = email.text && email.text.includes(searchContent);
				const inHtml = email.content && email.content.includes(searchContent);
				if (!inText && !inHtml) return false;
			}

			return true;
		});

		// 4. 清理多余字段
		delete data.latestEmail;
		data.total = data.list.length;

		// 5. 结果处理
		if (data.list.length === 0) {
			return c.text('没有匹配邮件');
		}

		// 6. 格式化输出
		const extractPureEmail = (str) => {
			if (!str) return "Unknown";
			const match = str.match(/<([^>]+)>/);
			return match ? match[1].trim() : str.replace(/["']/g, "").trim();
		};

		let output = "";

		for (const row of data.list) {
			// 1️⃣ 时间处理：直接使用原始时间
			let dateStr = row.createTime || "0000-00-00 00:00:00";

			// 2️⃣ 发件人/收件人
			let sender = row.sendEmail || "Unknown";
			let recipient = row.toEmail || "Unknown";

			// 3️⃣ 邮件解析 (直接读取数据库字段)
			let plain = row.text || "";
			let html = row.content || "";
			let subj = (row.subject || "").trim();

			// 4️⃣ 清理发件人/收件人
			sender = extractPureEmail(sender);
			recipient = extractPureEmail(recipient);

			// 5️⃣ 清理 HTML
			html = html
				.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
				.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
				.replace(/<br\s*\/?>/gi, ' ')
				.replace(/<\/p>/gi, ' ')
				.replace(/<\/?[^>]+(>|$)/g, " ")
				.replace(/&nbsp;/g, " ");

			// 6️⃣ 合并正文，避免重复
			let finalBody = (plain.replace(/\s+/g, '') === html.replace(/\s+/g, '')) 
				? plain 
				: (plain + " " + html);

			// 7️⃣ 单行输出
			let singleLineContent = (subj + " | " + finalBody)
				.replace(/[\r\n\t]+/g, ' ')
				.replace(/\s{2,}/g, ' ')
				.trim();

			// 8️⃣ 拼接最终输出
			output += `${dateStr} | ${sender} -> ${recipient} | ${singleLineContent}\n\n`;
		}

		return c.text(output || "暂无相关邮件");
	} catch (error) {
		return c.json(result.fail(error.message, 500));
	}
});
app.get('/test/delete', async (c) => {
	const query = c.req.query();
	const secretKey = c.env.api_key || '';
    
	if (query.key !== secretKey) {
		return c.text('暗号错误，无权访问', 401);
	}
	const { startTime, endTime, sendEmail, toEmail, subject, sendName } = query;
	// 判断：是否只填了一个时间，或者什么删除条件都没填
	const isPartialTime = (startTime && !endTime) || (!startTime && endTime);
	const noAnyConditions = !startTime && !endTime && !sendEmail && !toEmail && !subject && !sendName;

	if (isPartialTime || noAnyConditions) {
		const host = new URL(c.req.url).host;
		return c.text(`删除失败，时间格式错误，请正确填写时间，如：\nhttps://${host}/api/test/delete?key=${query.key || 'XXX'}&startTime=2026-05-01&endTime=2026-05-03`);
	}
	try {
		const res = await emailService.batchDelete(c, query) || {};
		let msg = '';
		
		if (query.sendEmail) {
			if (res.missingSend && res.missingSend.length > 0) {
				msg += '已成功删除对应发件人邮件，但有以下发件人地址错误或缺失删除失败：\n' + res.missingSend.join('\n') + '\n\n';
			} else {
				msg += '已成功删除所有对应发件人邮件\n\n';
			}
		}
		
		if (query.toEmail) {
			if (res.missingTo && res.missingTo.length > 0) {
				msg += '已成功删除对应收件人邮件，但有以下收件人地址错误或缺失删除失败：\n' + res.missingTo.join('\n') + '\n\n';
			} else {
				msg += '已成功删除所有对应收件人邮件\n\n';
			}
		}
		
		if (!msg) msg = '删除成功';
		return c.text(msg.trim());
	} catch (error) {
		return c.text('删除失败: ' + error.message, 500);
	}
});
