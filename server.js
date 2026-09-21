const express = require('express');

(async () => {
    const { TikTokLiveConnection, WebcastEvent } =
        await import('tiktok-live-connector');

    const app = express();
    const PORT = 3000;

    const TIKTOK_USERNAME = 'affetmior';

    let messageQueue = [];

    const tiktok = new TikTokLiveConnection(TIKTOK_USERNAME, {
        processInitialData: true
    });

    tiktok.connect()
        .then(state => {
            console.log('TikTok Live bağlantısı başarılı!');
            console.log('Room ID:', state.roomId);
        })
        .catch(err => {
            console.error('TikTok bağlantı hatası:', err);
        });

    tiktok.on(WebcastEvent.CHAT, data => {
        const username = data.user?.uniqueId || 'unknown';
        const comment = data.comment || '';

        console.log(`[CHAT] ${username}: ${comment}`);

        messageQueue.push({
            type: 'chat',
            tiktokUser: username,
            comment: comment
        });
    });

    tiktok.on(WebcastEvent.FOLLOW, data => {
        const username = data.user?.uniqueId || 'unknown';

        console.log(`[FOLLOW] ${username} takip etti`);

        messageQueue.push({
            type: 'follow',
            tiktokUser: username
        });
    });

    tiktok.on(WebcastEvent.LIKE, data => {
        const username = data.user?.uniqueId || 'unknown';

        console.log(`[LIKE] ${username} liked`);
    });

    app.get('/tiktok-events', (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');

        res.json({
            messages: messageQueue
        });

        messageQueue = [];
    });

    app.listen(PORT, () => {
        console.log(`Bridge sunucusu: http://localhost:${PORT}`);
        console.log(`TikTok: @${TIKTOK_USERNAME}`);
        console.log('TikTok Live bekleniyor...');
    });
})();