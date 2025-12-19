const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

module.exports = async function handler(req, res) {
  try {
    let payload = req.body;

    if (!payload || typeof payload !== "object") {
      payload = JSON.parse(req.body);
    }

    const commits = payload.commits || [];
    const commit = payload.head_commit || commits[commits.length - 1];

    if (!commit) {
      return res.status(200).send("No commit found");
    }

    const message = commit.message.split("\n")[0];
    const time = new Date(commit.timestamp)
      .toLocaleString("zh-CN", { hour12: false });

    const text = `🚀 Lead Off 更新

————————————

${message}


🕒 ${time}

🔗 ${commit.url}`;

    const resp = await fetch(
      `https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TG_CHAT_ID,
          text,
          disable_web_page_preview: true,
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
