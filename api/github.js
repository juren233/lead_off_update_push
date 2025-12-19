module.exports = async function handler(req, res) {
  try {
    // 兜底解析 payload（防止 body 是字符串）
    let payload = req.body;
    if (!payload || typeof payload !== "object") {
      payload = JSON.parse(req.body);
    }

    // 兼容不同 push 形态
    const commits = payload.commits || [];
    const commit =
      payload.head_commit || commits[commits.length - 1];

    if (!commit) {
      return res.status(200).send("No commit found");
    }

    // 只取 commit 第一行，保证公告简洁
    const cleanMsg = commit.message.split("\n")[0].trim();

    // 时间（本地直观格式）
    const time = new Date(commit.timestamp).toLocaleString(
      "zh-CN",
      { hour12: false }
    );

    // 正文（纯文本，稳定不炸）
    const text = `🚀 Leap Off 更新

${cleanMsg}

————————

🕒 ${time}`;

    // 发送到 Telegram（用按钮隐藏链接）
    const resp = await fetch(
      `https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TG_CHAT_ID,
          text,
          disable_web_page_preview: true,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔗 查看 Commit",
                  url: commit.url,
                },
              ],
            ],
          },
        }),
      }
    );

    // Telegram 失败也不让 webhook 500
    if (!resp.ok) {
      console.error("Telegram error:", await resp.text());
    }

    return res.status(200).send("ok");
  } catch (err) {
    // 任何异常都吞掉，保证 GitHub 看到的是 200
    console.error("Webhook error:", err);
    return res.status(200).send("handled");
  }
};
