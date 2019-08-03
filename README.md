### sails-hook-actions2-swagger

### Here is full article with step by step guidance [article](https://www.logisticinfotech.com/blog/sails-hook-actions2-swagger-generator).


A sails hook that generates swagger json with inputs of actions2 and provides swagger-ui.
We have recently added support for controllers that doesn't have actions input.

### Installation

```
$ npm i @logisticinfotech/sails-hook-actions2-swagger
```

After installation just `sails lift` and browse swagger doc at
http://localhost:1337/swagger (assuming that you are using localhost and default port)

#### For [nodemon](https://nodemon.io/) users
use `nodemon --ignore 'swagger.json'` as we are generating swagger files in that folder we need to ignore that changes.

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

### How to use multipart with SailsJS Actions2?

First, you have to add a swagger object next to the `action`.

```json
    'POST /api/v1/company/upload': { action: 'company/mobile/upload', swagger: {security: [ {"ApiKey": [] } ], consumes: ["multipart/form-data"] }},   
```
In the example above, we redefine the security and set the format of the passed data to `multipart/form-data`.
This is the part that's added to your `config/swagger.js`.
```json
    securityDefinitions: {
        "Authorization": {
            "type": "apiKey",
            "description": "user JWT Auth Token",
            "name": "Authorization",
            "in": "header",
            "flow": "password"
        },
        "ApiKey": {
            "type": "apiKey",
            "description": "uses api-key",
            "name":"api-key",
            "in": "query",
            "flow": "password"
        }
    }
```

When the `swagger.json` is generated there will be a list of arguments that can be used with `multipart/form-data`. To add a `file` type, you can define the following action input in controller.

```json
    document: {
      description: 'The file that should be uploaded.',
      type: 'ref',
      required: true,
      swaggerType: 'file'
    }   
```
> Note: You have to add `files: ["document"]` to the controller at root level (next to `inputs`). For more information check [here](https://github.com/sailshq/machine-as-action#customizing-the-response) 

### For Usage and more details see my [blog](https://www.logisticinfotech.com/blog/sails-hook-actions2-swagger-generator).

### TODO
- File Upload
