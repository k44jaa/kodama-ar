# kodama-ar

An AR web‑based Japanese ghost flies around the creative space with sound, favoring rooms with plants or randomly selected pleasant people

It runs in the browser and needs one with WebXR AR support, such as Chrome on
Android.

## Try it on your computer

```sh
docker compose up --build
```

Then open http://localhost:8080.

WebXR only works over HTTPS or on `localhost`. To try it on an Android phone
without HTTPS: connect the phone by USB, open `chrome://inspect` in Chrome on
the computer, turn on *Port forwarding* from port 8080 to `localhost:8080`, and
open http://localhost:8080 in Chrome on the phone.

## How it gets published

Every push to `main` builds a container image and publishes it as
`ghcr.io/k44jaa/kodama-ar:main` ([.github/workflows/image.yml](.github/workflows/image.yml)).
The image contains `index.html`, `app.js` and `assets/`; a new file or folder
of the site has to be added to the [Dockerfile](Dockerfile) as well.
