let swaggerConfig = require('./swagger');
module.exports = function swaggerGenerator(sails) {
    return {
        initialize: async function () {
            var eventsToWaitFor = [];
            if (sails.hooks.orm) {
                eventsToWaitFor.push("hook:orm:loaded");
            }

            if (sails.hooks.pubsub) {
                eventsToWaitFor.push("hook:pubsub:loaded");
            }
            sails.after(eventsToWaitFor, function () {
                //   sails.after('lifted', function () {
                init();
            });
        }
    };

    function init() {
        // getting global object if defined
        if (sails.config.swaggerConfig) {
            swaggerConfig = sails.config.swaggerConfig;
        }

        if (swaggerConfig.disable) {
            sails.log.info('Swagger hook disabled, please enable it from sails.config.swaggerConfig.disable')
            return;
        }
        sails.log.info(" 🍺   Logistic Infotech's sails-hook-swagger loaded 🍺  ");

        let swagger = swaggerConfig.swagger;
        let routeList = sails.config.routes;
        let controllerPath = sails.config.paths.controllers;
        for (const key in routeList) {
            if (routeList.hasOwnProperty(key) && !routeList[key].controller && routeList[key].action) {
                let filePathToRead = controllerPath + "/" + routeList[key].action;
                let swaggerData = getInputs(filePathToRead);

                let methodType = key.split(/ (.+)/)[0].toLowerCase();
                let routeUrl = key.split(/ (.+)/)[1];
                let tags = routeList[key].action.split("/");
                if (methodType && routeUrl && tags && tags.length > 0) {
                    let tag = tags[0];
                    if (!tags[1]) {
                        tag = "/";
                    }
                    swagger.paths[routeUrl] = generatePath(methodType, swaggerData, tag);
                }
            }
        }
        swagger.definitions = generateDefinitions();
        generateFile(swagger);
    }

    function generateDefinitions() {
        let models = sails.models;
        let defintions = {};
        for (const key in models) {
            //   if (key === 'archive') {
            //     continue;
            //   }
            if (models.hasOwnProperty(key)) {
                let model = models[key];
                if (model.globalId) {
                    let objModel = addOnlySpecificKeys(model.attributes);
                    defintions[model.identity] = {
                        properties: objModel.attributes,
                        required: objModel.required
                    };
                }
            }
        }
        return defintions;
    }

    function addOnlySpecificKeys(object) {
        let objModel = {
            attributes: {},
            required: []
        };
        for (const key in object) {
            if (object.hasOwnProperty(key)) {
                // creating defintions.required array here
                if (object[key].required) {
                    objModel.required.push(key);
                }
                objModel.attributes[key] = {};
                if (object[key].type) {
                    if (object[key].type == 'json') {
                        object[key].type = 'object'
                    }
                    objModel.attributes[key].type = object[key].type;
                }
                if (object[key].description) {
                    objModel.attributes[key].description = object[key].description;
                }
                if (object[key].defaultsTo) {
                    objModel.attributes[key].default = object[key].defaultsTo;
                }
                // if validation found
                if (object[key].validations) {
                    if (object[key].validations.isEmail) {
                        objModel.attributes[key].format = 'email';
                    }

                    if (object[key].validations.maxLength) {
                        objModel.attributes[key].maxLength = object[key].validations.maxLength;
                    }

                    if (object[key].validations.minLength) {
                        objModel.attributes[key].minLength = object[key].validations.minLength;
                    }

                    if (object[key].validations.isIn) {
                        objModel.attributes[key].enum = object[key].validations.isIn;
                    }
                }

                if (object[key].example) {
                    objModel.attributes[key].example = object[key].example;
                }

                // if autoMigrations found
                if (object[key].autoMigrations) {
                    if (object[key].autoMigrations.unique) {
                        objModel.attributes[key].uniqueItems = true;
                    }
                }
            }
        }
        return objModel;
    }

    function generatePath(methodType, swaggerData, tag) {
        // get only the first instance of our space splitting
        let params = [];
        let obj;
        if (methodType == "post" || methodType == "put") {
            obj = generateBodyData(swaggerData);
        } else {
            obj = generateQueryData(swaggerData);
        }

        params.push(obj);
        let path = {
            [methodType]: {
                tags: [tag],
                summary: "",
                consumes: ["application/json"],
                produces: ["application/json"],
                responses: {
                    "200": {
                        description: "The requested resource"
                    },
                    "404": {
                        description: "Resource not found"
                    },
                    "500": {
                        description: "Internal server error"
                    }
                }
            }
        };
        if (params.length > 0 && params[0] != null) {
            path[methodType].parameters = params;
        }
        return path;
    }

    function generateQueryData(swaggerData) {
        for (const key in swaggerData) {
            if (swaggerData.hasOwnProperty(key)) {
                let obj = { in: "query",
                    name: key,
                    required: swaggerData[key].required,
                    type: swaggerData[key].type,
                    description: swaggerData[key].description
                };
            }
        }
    }

    function generateBodyData(swaggerData) {
        let obj = {
            name: "body",
            in: "body",
            required: true,
            description: "An object defining our schema for this request",
            schema: {
                properties: {},
                required: []
            }
        };
        for (const key in swaggerData) {
            if (swaggerData.hasOwnProperty(key)) {
                obj.schema.properties[key] = {
                    type: swaggerData[key].type
                };
                if (swaggerData[key].required) {
                    obj.schema.required.push(key);
                }
            }
        }
        return obj;
    }

    function generateFile(data) {
        let fs = require("fs");

        // generating folder if not exists
        swaggerConfig.pathToGenerateFile = 'assets/swagger/';
        swaggerConfig.fileName = 'swagger.json';
        let folders = swaggerConfig.pathToGenerateFile.split('/');
        let tempPath = '';
        for (let i = 0; i < folders.length; i++) {
            if (folders[i] != '') {
                tempPath = tempPath + folders[i] + '/';

                if (!fs.existsSync(tempPath)) {
                    var oldmask = process.umask(0);
                    console.log(tempPath);
                    //   fs.mkdirSync(path, { recursive: true })
                    fs.mkdir(tempPath, '0755', function (err) {
                        process.umask(oldmask);
                        if (err) {
                            console.log('generateFile =>', err);
                        }
                    });
                }
            }
        }
        let fullPath = sails.config.appPath + '/' + swaggerConfig.pathToGenerateFile + swaggerConfig.fileName;
        // let fullPath = sails.config.assets + 'assets/swagger/swagger.json';

        fs.writeFile(fullPath, JSON.stringify(data), function (err) {
            if (err) {
                return console.log(err);
            }
            // console.log("🍺  Cheers Swagger JSON generated at ", fullPath, ' access it with /swagger ');
            console.log("🍺  Cheers Swagger JSON generated at successfully access it with /swagger");
        });

        let htmlFilePath = sails.config.appPath + '/' + swaggerConfig.pathToGenerateFile + 'index.html';

        // copying html file
        fs.copyFile(__dirname + '/index.html', htmlFilePath, true, (err) => {
            if (err) {
                if (err.code != 'EEXIST') {
                    return console.log(err);
                }
                return;
            };
        });
    }

    function getInputs(path) {
        let inputs;
        try {
            let file = require(path);
            inputs = file.inputs;
        } catch (error) {
            inputs = "";
        }
        return inputs;
    }
};