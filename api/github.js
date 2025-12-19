function escapeMarkdownV2(text) {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

module.exports = async function handler(req, res) {
  try {
    let payload = req.body;
    if (!payload || typeof payload !== "object") {
      payload = JSON.parse(req.body);
    }

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

    const title = escapeMarkdownV2(lines[0]); // 标题（不进引用块）
    const bodyLines = lines.slice(1, 6);      // 正文最多 5 行

    const quotedBody = bodyLines.length
      ? bodyLines.map(l => `> ${escapeMarkdownV2(l)}`).join("\n")
      : "";

    // 北京时间
    const time = new Date(commit.timestamp).toLocaleString(
      "zh-CN",
      {
        timeZone: "Asia/Shanghai",
        hour12: false,
      }
    );

    const text = `
    🚀 Leap Off 更新

${title}
${quotedBody ? `\n\n${quotedBody}` : ""}

————————

🕒 ${time}`;

    const resp = await fetch(
      `https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TG_CHAT_ID,
          text,
          parse_mode: "MarkdownV2",
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

    if (!resp.ok) {
      console.error("Telegram error:", await resp.text());
    }

    return res.status(200).send("ok");
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(200).send("handled");
  }
};
