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

Configure the WebDAV storage adapter by adding the following lines to the [Ghost config](https://docs.ghost.org/docs/config) file.

```json
{
  "storage": {
    "active": "webdav",
    "webdav": {
      "url": "URL_TO_YOUR_WEBDAV_SERVER",
      "username": "YOUR_WEBDAV_USERNAME",
      "password": "YOUR_WEBDAV_PASSWORD",
      "pathPrefix": "YOUR_PATH_PREFIX",
      "storagePathPrefix": "YOUR_STORAGE_PATH_PREFIX"
    }
  }
}
```

NOTE: `username`, `password`, `pathPrefix` and `storagePathPrefix` are all optional.

The `username` and `password` configuration parameters are used in the [Basic Auth](https://tools.ietf.org/html/rfc2617) access authentication on the WebDAV server.

Use a `pathPrefix` if you prefer to limit access to the WebDAV server to a subtree. E.g. with a `pathPrefix` of `/ghost` all files will be stored under `/ghost` and the adapter won't allow access to anything on the WebDAV server outside of `/ghost.

This adapter returns relative URLs for uploaded files. Requests to retrieve the file will be handled by Ghost as if they are stored on a local file system. This requires the returned URLs to start with the same prefix as Ghost's local storage adapter: `/content/images`. This is the default value for `storagePathPrefix` but you can provide a different prefix. Don't forget to create a Ghost route that routes requests for the prefix to the images store.
 
### Via environment variables

Alternatively, you can configure the WebDAV storage adapter by setting the following environment variables: 

```
WEBDAV_SERVER_URL
WEBDAV_USERNAME // optional
WEBDAV_PASSWORD // optional
WEBDAV_PATH_PREFIX // optional
WEBDAV_STORAGE_PATH_PREFIX // optional
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
