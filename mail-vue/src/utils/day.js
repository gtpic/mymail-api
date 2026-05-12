import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import {useSettingStore} from "@/store/setting.js";

const settingStore = useSettingStore();
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale(settingStore.lang === 'en' ? 'en' : 'zh-cn')

// 缓存浏览器默认时区
const defaultBrowserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// --- 【核心性能优化：合法性验证缓存】 ---
let cachedRawTz = null;   // 记录后台传来的原始时区值
let cachedValidTz = null; // 记录经过验证后的绝对合法时区值

// 安全且极速地获取当前时区
function getCurrentTimeZone() {
    const rawTz = settingStore.settings?.timezone || settingStore.settings?.timeZone;
    
    // 1. 如果后台没设置，直接秒回浏览器默认时区
    if (!rawTz) return defaultBrowserTimeZone;

    // 2. 【性能关键】：如果后台的值跟上次一模一样，说明已经验证过了，直接秒回缓存的合法结果，坚决不重复执行底层API
    if (rawTz === cachedRawTz) {
        return cachedValidTz;
    }

    // 3. 只有当后台更改了新时区时，才进行唯一一次安全拦截验证
    cachedRawTz = rawTz;
    try {
        Intl.DateTimeFormat(undefined, { timeZone: rawTz });
        cachedValidTz = rawTz;
    } catch (e) {
        // 拦截像 '-7' 这样的非法格式，自动降级并记录
        console.warn(`非法时区值: ${rawTz}，已自动回退到浏览器默认时区`);
        cachedValidTz = defaultBrowserTimeZone;
    }
    
    return cachedValidTz;
}

export function fromNow(date) {
    const timeZone = getCurrentTimeZone();
    const d = dayjs.tz(date, timeZone);
    const now = dayjs().tz(timeZone);
    
    const diffSeconds = now.diff(d, 'second');
    const diffMinutes = now.diff(d, 'minute');
    const diffHours = now.diff(d, 'hour');
    const isToday = now.isSame(d, 'day');
    
    if (settingStore.lang === 'en') {
        if (isToday) {
            if (diffSeconds < 60) return `Just now`;
            if (diffMinutes < 60) return `${diffMinutes} min ago`;
            if (diffHours < 2) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
            return d.format('hh:mm A');
        }
        if (now.subtract(1, 'day').isSame(d, 'day')) {
            return d.format('MMM D');
        }
        return d.year() === now.year()
            ? d.format('MMM D')
            : d.format('YYYY/MM/DD');
    } else {
        if (isToday) {
            if (diffSeconds < 60) return `几秒前`;
            if (diffMinutes < 60) return `${diffMinutes}分钟前`;
            if (diffHours >= 1 && diffHours < 2) return '1小时前';
            return d.format('HH:mm');
        }
        else if (now.subtract(1, 'day').isSame(d, 'day')) {
            return `昨天 ${d.format('HH:mm')}`;
        }
        else if (now.subtract(2, 'day').isSame(d, 'day')) {
            return `前天 ${d.format('HH:mm')}`;
        }
        return d.year() === now.year()
            ? d.format('M月D日')
            : d.format('YYYY/M/D');
    }
}

export function updateNow(date) {
    const timeZone = getCurrentTimeZone();
    const d = dayjs.tz(date, timeZone);
    const now = dayjs().tz(timeZone);
    const diffSeconds = now.diff(d, 'second');
    const diffMinutes = now.diff(d, 'minute');
    const diffHours = now.diff(d, 'hour');
    const isToday = now.isSame(d, 'day');

    if (isToday) {
        if (diffSeconds < 60) return `Just now`;
        if (diffMinutes < 60) return `${diffMinutes} min ago`;
        if (diffHours < 2) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return d.format('hh:mm A');
    }
    return d.format('YYYY/MM/DD');
}

export function formatDetailDate(time) {
    const timeZone = getCurrentTimeZone();
    const d = dayjs.tz(time, timeZone);
    const now = dayjs().tz(timeZone);

    const isSameYear = now.year() === d.year();

    if (settingStore.lang === 'en') {
        return isSameYear
            ? d.format('ddd, MMM D, h:mm A')
            : d.format('ddd, MMM D, YYYY, h:mm A');
    } else {
        return d.format('YYYY年M月D日 ddd AH:mm');
    }
}

export function tzDayjs(time) {
    const timeZone = getCurrentTimeZone();
    return dayjs.tz(time, timeZone);
}

export function toUtc(time) {
    return dayjs(time).utc()
}

export function setExtend(lang) {
    dayjs.locale(lang)
}
