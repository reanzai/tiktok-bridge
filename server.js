const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

const TIKTOK_USERNAME = "affetmior";

let messageQueue = [];

async function startTikTok() {
    try {
        const TikTokModule = await import("tiktok-live-connector");

        console.log("TikTok module exports:", Object.keys(TikTokModule));

        const TikTokLiveConnection = TikTokModule.TikTokLiveConnection;
        const WebcastEvent = TikTokModule.WebcastEvent;

        if (typeof TikTokLiveConnection !== "function") {
            throw new Error(
                "TikTokLiveConnection constructor bulunamadı."
            );
        }

        const tiktok = new TikTokLiveConnection(TIKTOK_USERNAME);

        console.log(`TikTok bağlantısı başlatılıyor: @${TIKTOK_USERNAME}`);

        tiktok.on(WebcastEvent.CHAT, (data) => {
            const username = data.user?.uniqueId || "unknown";
            const comment = data.comment || "";

            console.log(`[CHAT] ${username}: ${comment}`);

            messageQueue.push({
                type: "chat",
                tiktokUser: username,
                comment: comment
            });
        });

        tiktok.on(WebcastEvent.FOLLOW, (data) => {
            const username = data.user?.uniqueId || "unknown";

            console.log(`[FOLLOW] ${username}`);

            messageQueue.push({
                type: "follow",
                tiktokUser: username
            });
        });

        tiktok.on(WebcastEvent.LIKE, (data) => {
            const username = data.user?.uniqueId || "unknown";

            console.log(`[LIKE] ${username}`);
        });

        await tiktok.connect();

        console.log("=================================");
        console.log("TikTok LIVE bağlantısı başarılı!");
        console.log("Room ID:", tiktok.roomId);
        console.log("=================================");

    } catch (error) {
        console.error("TikTok bağlantı hatası:", error);
    }
}

app.get("/", (req, res) => {
    res.json({
        status: "online",
        tiktok: TIKTOK_USERNAME,
        queueSize: messageQueue.length
    });
});

app.get("/tiktok-events", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");

    const events = messageQueue;

    messageQueue = [];

    res.json({
        messages: events
    });
});

app.listen(PORT, () => {
    console.log(`Bridge sunucusu ${PORT} portunda çalışıyor.`);
    console.log(`TikTok: @${TIKTOK_USERNAME}`);

    startTikTok();
});
