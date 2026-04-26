import Echo from 'laravel-echo';

import Pusher from 'pusher-js';
window.Pusher = Pusher;

const reverbKey = import.meta.env.VITE_REVERB_APP_KEY;
const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY;

if (reverbKey || pusherKey) {
    const useReverb = !!reverbKey;

    window.Echo = new Echo({
        broadcaster: useReverb ? 'reverb' : 'pusher',
        key: useReverb ? reverbKey : pusherKey,
        cluster: useReverb ? undefined : import.meta.env.VITE_PUSHER_APP_CLUSTER,
        wsHost: useReverb
            ? import.meta.env.VITE_REVERB_HOST
            : (import.meta.env.VITE_PUSHER_HOST || undefined),
        wsPort: useReverb ? import.meta.env.VITE_REVERB_PORT : (import.meta.env.VITE_PUSHER_PORT || 443),
        wssPort: useReverb ? import.meta.env.VITE_REVERB_PORT : (import.meta.env.VITE_PUSHER_PORT || 443),
        forceTLS: useReverb ? (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https' : true,
        enabledTransports: useReverb ? ['ws', 'wss'] : undefined,
        disableStats: true,
        encrypted: true,
    });
} else {
    // No WebSocket config — provide a no-op Echo stub so listeners don't crash
    window.Echo = {
        private: () => ({ listen: () => ({ listen: () => ({}) }), stopListening: () => ({}) }),
        channel: () => ({ listen: () => ({ listen: () => ({}) }), stopListening: () => ({}) }),
        leave: () => {},
        join: () => ({ here: () => ({ joining: () => ({ leaving: () => ({}) }) }) }),
    };
}
