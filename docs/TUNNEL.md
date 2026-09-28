# Remote development preview

Requested URL: https://littlebot.mykiosk.app

Fresh preview URL for networks caching the original hostname's missing-name response: https://littlebot-preview.mykiosk.app

The ERD background tunnel forwards to this Mac's loopback HTTP port **5173**. It remains running for remote user testing; login autostart is not enabled. The local Vite server must remain running (`npm run dev`). The tunnel is a development preview, not a production deployment.

- Tunnel ID: `16f3dac8-5d16-4f67-940b-8179f2242f53`
- Activation ID after the requested restart: `61167b9a-0db7-4f11-9ddc-9faed90f6fbc`
- Preview tunnel ID: `831b7fa1-df9a-4242-9032-e56731a9df52`
- Preview activation ID: `a9f3253d-b753-435f-be85-577900de674d`
- Both hostnames are explicitly allowed in Vite. Other hostnames are not broadly allowlisted.
- Verified `connector_ready: true` and `origin_ready: true`.
- Public HTTPS returned 200 and the Littlebot page title using the address returned by Cloudflare DNS, with TLS certificate verification enabled. Cloudflare and Google public resolvers returned the new hostname. The local network resolver initially cached the earlier missing-name response with a negative-cache lifetime of up to 30 minutes; browser access on that connection remains unverified until the cache expires. No system DNS settings were changed.
- The original tunnel was stopped with verified cleanup and restarted on September 28, 2026. The fresh preview URL returned HTTPS 200 using normal DNS resolution and loaded the complete interactive studio in the browser. Both connectors and origins reported ready. Use the fresh URL while the original hostname's cached DNS error persists.

Inspect:

```sh
erd --json tunnel inspect littlebot.mykiosk.app
erd --json tunnel inspect littlebot-preview.mykiosk.app
```

Stop when remote testing is finished:

```sh
erd tunnel stop littlebot.mykiosk.app
erd --json tunnel inspect littlebot.mykiosk.app
erd tunnel stop littlebot-preview.mykiosk.app
erd --json tunnel inspect littlebot-preview.mykiosk.app
```

Check for `state: stopped` and `cleanup_status: verified` before considering public access closed. The reservation can remain for future testing. Do not stop or remove other tunnels.
