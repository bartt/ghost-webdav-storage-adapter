# WebDAV storage adapter for Ghost

A WebDAV storage adapter for the [Ghost](https://ghost.org/) publishing platform 1.x

[![npm Version][npm-image]][npm-url] [![npm Downloads][downloads-image]][downloads-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][david-image]][david-url] [![Open Issues][issues-image]][issues-url]


## Installation

```shell
npm install ghost-webdav-storage-adapter
mkdir -p ./content/adapters/storage/webdav
cp -v ./node_modules/ghost-webdav-storage-adapter/dist/*.js ./content/adapters/storage/webdav

``````

## Configuration

```json
{
  "storage": {
    "active": "webdav",
    "webdav": {
      "url": "URL_TO_YOUR_WEBDAV_SERVER",
      "username": "YOUR_WEBDAV_USERNAME",
      "password": "YOUR_WEBDAV_PASSWORD",
      "pathPrefix": "YOUR_PATH_PREFIX"
    }
  }
}
```

NOTE: `username`, `password` and `pathPrefix` are all optional.

### Via environment variables

```
WEBDAV_SERVER_URL
WEBDAV_USERNAME // optional
WEBDAV_PASSWORD // optional
WEBDAV_PATH_PREFIX // optional
```

## License

[ISC](./LICENSE.md)

[npm-image]: http://img.shields.io/npm/v/ghost-webdav-storage-adapter.svg
[npm-url]: http://npm.im/ghost-webdav-storage-adapter
[downloads-image]: http://img.shields.io/npm/dm/ghost-webdav-storage-adapter.svg
[downloads-url]: http://npm.im/ghost-webdav-storage-adapter
[travis-image]: https://secure.travis-ci.org/bartt/ghost-webdav-storage-adapter.png
[travis-url]: http://travis-ci.org/bartt/ghost-webdav-storage-adapter
[david-image]: https://david-dm.org/bartt/ghost-webdav-storage-adapter.png
[david-url]: https://david-dm.org/bartt/ghost-webdav-storage-adapter
[issues-image]: http://img.shields.io/github/issues/bartt/ghost-webdav-storage-adapter.svg
[issues-url]: https://github.com/bartt/ghost-webdav-storage-adapter/issues
