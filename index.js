const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public')); 

const adminPassword = "abdo3mk"; // استخدم كلمة مرور المدير من متغيرات البيئة

// Middleware للتحقق من إذا كان المستخدم هو المدير
function checkAdmin(req, res, next) {
    if (req.body.admin === adminPassword || req.query.admin === adminPassword) {
        next();
    } else {
        res.redirect(`/login?error=Invalid%20password`);
    }
}

// Middleware لتعقب عدد الزوار
async function trackVisits(req, res, next) {
    try {
        const visitorCount = await db.incrementVisitorCount();
        req.visitorCount = visitorCount;
        next();
    } catch (err) {
        console.error('Error tracking visits', err);
        next();
    }
}

// الصفحة الرئيسية لعرض الرسائل والردود
app.get('/', trackVisits, async (req, res) => {
    try {
        const messages = await db.getMessages(true);
        res.render('index', { messages, visitorCount: req.visitorCount });
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
});

// إرسال رسالة جديدة
app.post('/message', async (req, res) => {
    const content = req.body.content;
    if (!content) {
        res.redirect('/?error=Message content cannot be empty');
        return;
    }
    try {
        await db.addMessage(content);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
});

// صفحة تسجيل الدخول كمدير
app.get('/login', (req, res) => {
    res.render('admin_login', { error: req.query.error });
});

// صفحة عرض الرسائل (تحتاج إلى مصادقة المدير)
app.post('/messages', checkAdmin, async (req, res) => {
    try {
        const messages = await db.getMessages();
        const visitorCount = await db.getVisitorCount();
        res.render('messages', { messages, adminPassword, visitorCount });
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
});

// صفحة الرد على الرسائل (تحتاج إلى مصادقة المدير)
app.post('/reply/:id', checkAdmin, async (req, res) => {
    try {
        const message = await db.getMessageById(req.params.id);
        res.render('reply', { message });
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
});

// حفظ الرد على الرسالة (تحتاج إلى مصادقة المدير)
app.post('/save_reply/:id', checkAdmin, async (req, res) => {
    const reply = req.body.reply;
    if (!reply) {
        res.redirect(`/reply/${req.params.id}?admin=${adminPassword}&error=Reply content cannot be empty`);
        return;
    }
    try {
        await db.updateMessageReply(req.params.id, reply);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
});

// حذف رسالة (تحتاج إلى مصادقة المدير)
app.post('/delete/:id', checkAdmin, async (req, res) => {
    try {
        await db.deleteMessage(req.params.id);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
