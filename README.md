### sails-hook-actions2-swagger with kue and redis

A sails hook that generates swagger json with inputs of actions2 and provides swagger-ui.

### Installation

```
$ npm i @logisticinfotech/sails-hook-actions2-swagger
```

After installation list sails `sails lift` and browse

http://localhost:1337/swagger (here i'm assuming that you are using default port)

### Change / Customize Default Options

Create swagger.js inside your config folder (config/swagger.js). Copy and paste all setting from default [swagger.js](https://github.com/logisticinfotech/sails-hook-actions2-swagger/blob/master/swagger.js) file.
By default `disable: false`, you should disable it when it's not needed because this hook generates `swagger.json` on every `sails lift` you done.

You can update

- basePath
- externalDocs
- host
- contact
- parameters
  and many more things from here.

### For Usage and more details see my [blog](https://logisticinfotech.com).

### TODO

Add support for controllers that doesn't have actions input
