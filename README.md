# BikeHopper UI

BikeHopper is a navigation app for everything but cars. It gives you
directions that include riding a bike, taking transit, or both. We're
developing and testing in the San Francisco Bay Area, California, but
in principle it could be used anywhere in the world where transit info
is available in GTFS format.

BikeHopper is free software under the GNU Affero General Public
License, which requires the source to be kept open. We discourage
corporate uses of BikeHopper, but highly encourage self-hosted,
community instances in other regions. Get in touch if you'd like us to
help you be the first region beyond the Bay Area to set one up.

This is the frontend! Here's how to get started. For setting up the whole project, see the [project README](https://github.com/bikehopper/)

## Getting Started With the BikeHopper UI

This project uses [Vite](https://vitejs.dev/) as its build system and
for running a dev server.
To get started clone this repo, copy the `.env.development.template` to `.env.development.local`.
Then setup the environment variables so that the basemap style can be loaded from Mapbox.
This will require you to

1. Create a Mapbox Account (Free one is fine)
2. Copy the `bikehopper-nouveau` style to your account by grabbing the link from the `#web-app` channel in Discord.
3. Set the variables in the `.env.development.local` file as per the instructions in the file.

If you're unable to copy the style, then you can use the public `mapbox://styles/mapbox/streets-v11` for the map style. It will look different, but will have the same functionality.

Then run:

```
npm install
```

to install all dependencies, and

```
npm start
```

to start the Vite Dev Server.

Requests to `localhost` are proxied to
`https://api-staging.bikehopper.org`. This is configured by a "proxy"
property within `vite.config.json`. Presently there is a thin client
library at `src/lib/BikeHopperClient.ts`. More methods should be added
as needed. This library calls the BikeHopper
[backend](https://github.com/bikehopper/bikehopper-web-app).

To expose your dev server to your local network (so you can access it
from your phone), run `npx vite --host`.

If you are running [local graphhopper](https://github.com/graphhopper/graphhopper), Edit the relevant variable in your `.env.development.local` in `bikehopper-ui` to point to local GraphHopper.

## Internationalization

All user-facing strings should be wrapped in either `<FormattedMessage>`
instances or calls to `intl.formatMessage`, so that they can be translated. As
of August 2024 we translate to Spanish and most but not all of the app is
translated.

This is not yet automated, so currently, when you add a new string into the
code, or modify one, you should run `npm run extract` to extract the default
message and its description to the English-language file.

And after syncing translations from Weblate, run the script `compile-langs.sh`.
(The lack of symmetry is because this command was too complex to be put into
package.json.)
