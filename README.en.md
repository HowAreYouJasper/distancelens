<div align="center">
  <img src="docs/assets/logo.svg" width="96" alt="DistanceLens logo">
  <h1>DistanceLens · Three-point positioning</h1>
  <p>Enter three places and their distances to find a possible location.</p>
  <p><a href="README.md">简体中文</a> | <strong>English</strong></p>
  <p>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-64765a" alt="MIT license"></a>
    <a href="package.json"><img src="https://img.shields.io/badge/version-0.3.0-52676b" alt="Version 0.3.0"></a>
    <img src="https://img.shields.io/badge/Node.js-22%2B-64765a" alt="Node.js 22 or newer">
    <a href="https://github.com/1812370360/distancelens/stargazers"><img src="https://img.shields.io/github/stars/1812370360/distancelens?style=flat&color=52676b" alt="GitHub stars"></a>
  </p>
  <p><a href="https://1812370360.github.io/distancelens/">Live demo</a> · <a href="#how-to-use-it">How to use it</a> · <a href="#amap-setup">AMap setup</a> · <a href="https://github.com/1812370360/distancelens/issues">Report an issue</a></p>
</div>

## What does it do?

**If you know how far a target is from three known places, you can try to work out its location.** DistanceLens draws this process so you can see the circles and possible area.

Imagine you know the target's straight-line distance from places A, B, and C. Draw a circle around each place, using its distance as the radius. With ideal measurements, a shared point on all three circle edges gives the target's location. This is three-point positioning.

Real distances have errors, so the app gives each circle a band of width. **Where all three bands overlap is a possible location area.** Inaccurate distances or poorly arranged places may produce no overlap or several possible areas. The result is an estimate, not a confirmed location.

Use **your own data or data you are authorized to use**. The app supports 3 to 8 places and optional AMap address search.

## Preview

[Open the live demo](https://1812370360.github.io/distancelens/)

![Three-point positioning illustration](docs/assets/overview.svg)

This illustration explains the idea. It is not a real map or a measured result.

![DistanceLens three-point positioning interface](docs/assets/preview.jpg)

The screenshot uses fictional places and distances without a live AMap key. The interface is in Chinese. The app starts empty so you can enter your own data.

## How to use it

1. **Choose places:** enter coordinates, or connect AMap and select addresses from search results.
2. **Enter distances:** add the straight-line distance from the target to each place in meters, plus how many meters it might be off by.
3. **Find the area:** add at least three places, then calculate. Inspect the circle bands, green area, and white cross.

Each color represents a place. The **green area** contains the sampled positions that fit every distance within its allowed error. The **white cross** is an estimated position that tries to fit all distances. It can lie outside the green area.

A smaller displayed distance mismatch means the estimate is closer to your inputs. The approximate area tells you how large the possible region is. Neither guarantees real positioning accuracy.

## Features

- **Search addresses:** select an AMap result to fill in its coordinates.
- **Enter data manually:** draw circles and calculate without an API key.
- **Add more places:** use 3 to 8 places, each with its own distance and allowed error.
- **Make changes:** edit distances and errors, remove places, and calculate again.
- **Enter rows in bulk:** add several coordinates and distances at once.
- **Export JSON:** save your inputs and calculated results.
- **Use on mobile:** the layout adapts to small screens and does not request device location.

## Run locally

Install Node.js 22 or newer, then run:

```sh
git clone https://github.com/1812370360/distancelens.git
cd distancelens
npm start
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). No additional dependencies are needed. Manual input works without an AMap key.

For offline drawing and calculation, you can also open `dist/index.html` directly. Use the local server when connecting AMap.

## AMap setup

1. Sign in to the [AMap developer console](https://console.amap.com/dev/key/app) and create an application.
2. Create a **Web (JS API)** key and obtain its security code, `securityJsCode`. Do not choose the Web Service key type.
3. Enter both in the page's AMap connection panel and connect.
4. Enter a city and place name, search, and select the correct address.
5. Add distances for at least three places, then calculate.

No working key is included. Configure allowed domains, search permissions, and quotas in your AMap account. Keys and security codes are not written to project files or exported results. Refreshing clears them.

<details>
<summary>Using a security proxy for a public deployment</summary>

For public deployments, keep the security code on a server through a proxy. The page supports `serviceHost`, such as `https://your-domain.example/_AMapService`. You do not need to enter the security code in the page when using a proxy. You must deploy the proxy yourself.

See the [AMap security guide](https://developer.amap.com/api/javascript-api-v2/guide/abc/jscode). Address search uses [PlaceSearch](https://developer.amap.com/api/javascript-api-v2/guide/services/autocomplete). A loaded map SDK does not guarantee the key has permission to search.

</details>

## Tips for entering data

- **Use straight-line distances**, not walking or driving route lengths.
- **Keep coordinates consistent.** AMap uses GCJ-02. For GPS coordinates, select WGS84 and use the drawing view. Clear the places before switching systems.
- **Allow realistic errors.** An error of 35 means the actual distance might be 35 meters smaller or larger. Very small errors can prevent the bands from overlapping.
- **Stay within a small area.** Distances and separation between places are limited to 10 km. Allowed errors range from 1 to 500 m.
- **Spread places out.** Three places on one straight line can produce two mirror locations.

For bulk input, enter one place per line without a header:

```text
latitude,longitude,straight_line_distance_m,allowed_error_m
```

The final error is optional and defaults to 35 m. Enter 3 to 8 rows. Bulk input replaces the current places.

## How accurate is it?

Accuracy depends on your coordinates, distances, and allowed errors. More decimal places on the screen do not mean better accuracy.

The green area is found using a grid approximation, which can miss very narrow overlaps. No detected common area does not prove that no intersection exists. The estimated position is not a measured location. Use it to learn the idea or explore authorized data.

<details>
<summary>For developers: calculation details</summary>

Positioning from three distance measurements is called trilateration. With more reference places, it is multilateration. It does not measure angles.

A circle band contains points whose distance from a place differs from the input by no more than its allowed error. The estimated position uses nonlinear least squares with 25 starting points, damped Gauss–Newton, and backtracking. Global optimality is not guaranteed. Allowed errors affect the green area, not the fit weights.

Coordinates use a local spherical projection with a radius of 6,371,008.8 m. The green area uses a 240 × 240 grid. Its area is approximate, not a statistical confidence interval. Projection errors and GCJ-02 distortions affect the result. This is not a high-precision surveying tool.

</details>

## Data and privacy

Use only your own or authorized data. Do not track someone without consent. The app does not read screenshots, obtain device location, or automatically collect personal locations.

Distance calculations run in your browser. The app does not persist inputs, and refreshing clears them. Connecting AMap sends searches and map requests to AMap. Its SDK runs as a third-party script with access to the page. Exported JSON contains places and distances, so store it responsibly.

## Technology and files

The interface uses HTML, CSS, and vanilla JavaScript. Canvas draws the circles. AMap provides the map and address search. Node.js runs the local server and tests.

```text
dist/                   Interface, calculation, and AMap integration
docs/assets/            Logo, illustration, and screenshot
tests/                  Solver and AMap adapter tests
server.cjs              Local static server
.github/workflows/      GitHub Pages testing and deployment
README.md               Chinese documentation
```

## Deployment and contributions

Serve `dist/` on a static host. For GitHub Pages, select GitHub Actions in Settings → Pages. Pushing to main automatically tests and deploys the app. Allow the actual website domain in your AMap key settings.

Issues and pull requests are welcome. Run `npm test` after code changes. Adapter tests use a mock SDK and cannot replace testing with a live key. Do not commit credentials or personal location data.

## License

[MIT](LICENSE). You may use and modify the project under the license terms.
