### sails-hook-actions2-swagger

A sails hook that generates swagger json with inputs of actions2 and provides swagger-ui.
We have recently added support for controllers that doesn't have actions input.

### Installation

```
$ npm i @logisticinfotech/sails-hook-actions2-swagger
```

After installation just `sails lift` and browse swagger doc at
http://localhost:1337/swagger (assuming that you are using localhost and default port)

#### For [nodemon](https://nodemon.io/) users
use `nodemon --ignore 'assets/swagger/*'` as we are generating swagger files in that folder we need to ignore that changes.

### Change / Customize Default Options

Create swagger.js inside your config folder (config/swagger.js). Copy and paste all setting from default [swagger.js](https://github.com/logisticinfotech/sails-hook-actions2-swagger/blob/master/swagger.js) file.
You must declare **swaggerConfig** to work (for ex. module.exports.swaggerConfig = {})

By default `disable: false`, you should disable it when it's not needed because this hook generates `swagger.json` on every `sails lift` you done.

You can update
- basePath
- externalDocs
- host
- contact
- parameters
- auth token header key
- version of api
  and almost every thing from here.

### For Usage and more details see my [blog](https://www.logisticinfotech.com/blog/sails-hook-actions2-swagger-generator).

### TODO
- File Upload
