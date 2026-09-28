# Remote development preview

Requested URL: https://littlebot.mykiosk.app

The ERD background tunnel forwards to this Mac's loopback HTTP port **5173**. It remains running for remote user testing; login autostart is not enabled. The local Vite server must remain running (`npm run dev`). The tunnel is a development preview, not a production deployment.

- Tunnel ID: `16f3dac8-5d16-4f67-940b-8179f2242f53`
- Activation ID: `ef36f10f-902f-4647-90c1-ddc211d71692`
- Requested hostname is explicitly allowed in Vite. Other hostnames are not broadly allowlisted.
- Verified `connector_ready: true` and `origin_ready: true`.
- Public HTTPS returned 200 and the Littlebot page title using the address returned by Cloudflare DNS, with TLS certificate verification enabled. Cloudflare and Google public resolvers returned the new hostname. The local network resolver initially cached the earlier missing-name response with a negative-cache lifetime of up to 30 minutes; browser access on that connection remains unverified until the cache expires. No system DNS settings were changed.

Inspect:

```sh
erd --json tunnel inspect littlebot.mykiosk.app
```

Stop when remote testing is finished:

```sh
erd tunnel stop littlebot.mykiosk.app
erd --json tunnel inspect littlebot.mykiosk.app
```

Check for `state: stopped` and `cleanup_status: verified` before considering public access closed. The reservation can remain for future testing. Do not stop or remove other tunnels.
