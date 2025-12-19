export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const payload = req.body;

  // 只处理 push 事件
  const commit = payload.head_commit;
  if (!commit) {
    return res.status(200).send("No commit");
  }

  const message = commit.message.split("\n")[0];
  const time = new Date(commit.timestamp)
    .toLocaleString("zh-CN", { hour12: false });

  const text =  = `Lead Off 更新了

————————————

${message}


🕒 ${time}

🔗 ${commit.url}`;

  await fetch(`https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: process.env.TG_CHAT_ID,
      text,
      disable_web_page_preview: true,
    }),
  });

  res.status(200).send("ok");
}
