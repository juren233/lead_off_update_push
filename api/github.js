function escapeHTML(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

module.exports = async function handler(req, res) {
  try {
    // 兜底解析 payload
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

    // 拆分 commit message
    const lines = commit.message
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    const title = escapeHTML(lines[0]);
    const bodyLines = lines.slice(1, 6);

    // HTML 引用块（干净样式）
    const blockquote = bodyLines.length
      ? `<blockquote>${escapeHTML(bodyLines.join("\n"))}</blockquote>`
      : "";

    // 北京时间
    const time = new Date(commit.timestamp).toLocaleString(
      "zh-CN",
      {
        timeZone: "Asia/Shanghai",
        hour12: false,
      }
    );

    // 消息正文（最终定稿）
    const text = `
🚀 Leap Off 更新

${title}${blockquote}

Committed at
🕒 ${time}
`.trim();

    // 发送 Telegram 消息（双按钮）
    const resp = await fetch(
      `https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: process.env.TG_CHAT_ID,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔗 查看 Commit",
                  url: commit.url,
                },
                {
                  text: "🎮 尝鲜体验",
                  url: "https://leapoff.vercel.app/",
                },
              ],
            ],
          },
        }),
      }
    );

    if (!resp.ok) {
      console.error("Telegram API error:", await resp.text());
    }

    return res.status(200).send("ok");
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(200).send("handled");
  }
};