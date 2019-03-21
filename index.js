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
        init();
      });
    }
  };

  function init() {
    // getting global object if defined
    // console.log('defined In config: ', sails.config.swaggerConfig);
    if (sails.config.swaggerConfig) {
      _.merge(swaggerConfig, sails.config.swaggerConfig);
    }
    // console.log('final swagger config: ', swaggerConfig);
    // return;
    if (swaggerConfig.disable) {
      sails.log.info('Swagger hook disabled, please enable it from sails.config.swaggerConfig.disable')
      return;
    }
    sails.log.info(" 🍺   Logistic Infotech's sails-hook-actions2-swagger loaded 🍺  ");

    let swagger = swaggerConfig.swagger;
    let routeList = sails.config.routes;
    let controllerPath = sails.config.paths.controllers;

    // console.log('routeList : ', routeList);
    for (const key in routeList) {
      if (routeList.hasOwnProperty(key)) {
        let arrRouteSplit = key.split(/ (.+)/);

        let methodType = arrRouteSplit[0].toLowerCase();
        let routeUrl = arrRouteSplit[1];

        if(arrRouteSplit.length == 1) {
          methodType = "get";
          routeUrl = arrRouteSplit[0]
        }

        // console.log('routeList[key] : ', routeList[key]);
        // console.log('methodType : ' + methodType + ' routeUrl : ' + routeUrl);
        // if route has path params
        let pathInputs = [];
        let objUrl = {};
        if (routeUrl && routeUrl.indexOf(':') > -1) {
          objUrl = addCurlyToRoute(routeUrl);
          routeUrl = objUrl.routeUrl;
          pathInputs = objUrl.pathInputs;
        }

        let tempTag = routeUrl;
        // console.log('view tempTag 1 : ', tempTag);
        if (swaggerConfig.defaults.pathsToIgnore.length) {
          if (swaggerConfig.defaults.pathsToIgnore.indexOf(tempTag)) {
            for (let i = 0; i < swaggerConfig.defaults.pathsToIgnore.length; i++) {
              tempTag = tempTag.replace(swaggerConfig.defaults.pathsToIgnore[i], '');
              // console.log(' =========>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> GONE');
            }
          }
        }
        tempTag = tempTag.replace(/\/\/+/g, '/');
        // console.log('view tempTag 2 : ', tempTag);

        let tags = tempTag.split("/");
        // console.log(tags);
        //   TODO:
        let tag = capitalizeString(tags[1]);
        if (!tag) {
          tag = "/";
        }

        let summary = routeList[key].description ? routeList[key].description : '';

        if(!swagger.paths[routeUrl]) {
          swagger.paths[routeUrl] = {};
        }

        if (routeList[key].controller && routeList[key].swagger) {
          //   console.log(routeList[key].swagger, routeUrl, methodType);
          swagger.paths[routeUrl][methodType] = routeList[key].swagger;

        } else if (routeList[key].view) {

          objUrl.methodType = methodType;
          objUrl.actionInputs = [];
          objUrl.tags = [tag];
          objUrl.summary = summary;
          objUrl.consumes = ["application/json"];
          objUrl.produces = ["application/json"];
          objUrl.responses = swaggerConfig.defaults.responses;
          objUrl.security = swaggerConfig.defaults.security;

          if (routeList[key].swagger) {
            objUrl = setDataFromRouteObj(routeList[key].swagger, objUrl);
          }

          swagger.paths[routeUrl][methodType] = generatePath(objUrl);

        } else if (routeList[key].action) {
          let filePathToRead = controllerPath + "/" + routeList[key].action;
          let actionInputs = getInputs(filePathToRead);

          objUrl.methodType = methodType;
          objUrl.actionInputs = actionInputs;
          objUrl.tags = [tag];
          objUrl.summary = summary;
          objUrl.consumes = ["application/json"];
          objUrl.produces = ["application/json"];
          objUrl.responses = swaggerConfig.defaults.responses;
          objUrl.security = swaggerConfig.defaults.security;

          if (routeList[key].swagger) {
            objUrl = setDataFromRouteObj(routeList[key].swagger, objUrl);
          }

          swagger.paths[routeUrl][methodType] = generatePath(objUrl);

        }
      }
    }
    swagger.definitions = generateDefinitions();
    generateFile(swagger);
  }

  function setDataFromRouteObj(urlData, objUrl) {
    if (urlData.tags) {
      objUrl.tags = urlData.tags;
    }
    if (urlData.summary) {
      objUrl.summary = urlData.summary;
    }
    if (urlData.consumes) {
      objUrl.consumes = urlData.consumes;
    }
    if (urlData.produces) {
      objUrl.produces = urlData.produces;
    }
    if (urlData.responses) {
      objUrl.responses = urlData.responses;
    }
    if (urlData.security) {
      objUrl.security = urlData.security;
    } else if (!urlData.security) {
      delete objUrl.security;
    }
    if (urlData.parameters) {
      objUrl.parameters = urlData.parameters;
    }
    return objUrl;
  }

  function addCurlyToRoute(routeUrl) {
    // if route has ':id' then we have to convert it to {id}
    let urlArray = routeUrl.split(':');
    let objUrl = {
      routeUrl: '',
      pathInputs: [],
      originalUrl: routeUrl
    }
    for (i = 0; i < urlArray.length; i++) {
      if (i == 0) {
        objUrl.routeUrl = urlArray[i];
      } else {
        objUrl.pathInputs.push(urlArray[i].split('/')[0]);
        if (i == urlArray.length - 1) {
          var paths = (urlArray[i]).split('/');
          if (paths.length > 1) {
            delete paths[0];
            objUrl.routeUrl = objUrl.routeUrl + '{' + (urlArray[i]).split('/')[0] + '}' + paths.join('/');
          } else {
            objUrl.routeUrl = objUrl.routeUrl + '{' + (urlArray[i]).split('/')[0] + '}';
          }
        } else {
          objUrl.routeUrl = objUrl.routeUrl + '{' + (urlArray[i]).split('/')[0] + '}' + '/';
        }
      }
    }
    return objUrl;
  }

  function generatePath(objUrl) {
    // get only the first instance of our space splitting
    let params = [];
    let obj;

    let pathInputs = [];
    if (objUrl.pathInputs && objUrl.pathInputs.length) {
      for (let i = 0; i < objUrl.pathInputs.length; i++) {
        for (const key in objUrl.actionInputs) {
          if (objUrl.actionInputs.hasOwnProperty(key)) {
            if (key == objUrl.pathInputs[i]) {
              pathInputs.push({
                [key]: objUrl.actionInputs[key]
              });
              delete objUrl.actionInputs[key];
            }
          }
        }
      }
    }

    pathInputs = Object.assign({}, ...pathInputs);
    params = generatePathData(pathInputs, 'path');
    if (objUrl.methodType == "post" || objUrl.methodType == "put") {
        obj = generateBodyData(objUrl.actionInputs);
        params.push(obj);
    } else {
        let tempObj = generatePathData(objUrl.actionInputs, 'query')
        params.push(tempObj);
    }

    let path = {
      tags: objUrl.tags,
      summary: objUrl.summary,
      consumes: objUrl.consumes,
      produces: objUrl.produces,
      responses: objUrl.responses,
      security: objUrl.security
    };

    if (params.length > 0 && params[0] != null) {
      path.parameters = params;
    }
    return path;
  }

  function generatePathData(actionInputs, type) {
    let obj = [];
    for (const key in actionInputs) {
      if (actionInputs.hasOwnProperty(key)) {
        let tempObj = {
          "in": type,
          name: key,
          required: actionInputs[key].required ? actionInputs[key].required : false,
          type: actionInputs[key].type ? actionInputs[key].type : '',
          description: actionInputs[key].description ? actionInputs[key].description : ''
        };
        obj.push(tempObj);
      }
    }
    return obj;
  }

  function generateBodyData(actionInputs) {
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
    for (const key in actionInputs) {
      if (actionInputs.hasOwnProperty(key)) {
        obj.schema.properties[key] = {
          type: actionInputs[key].type === 'ref' ? 'array' : actionInputs[key].type,
        };

        if (actionInputs[key].description) {
            obj.schema.properties[key].description = actionInputs[key].description;
        }
        if (actionInputs[key].items) {
            obj.schema.properties[key].items = actionInputs[key].items;
        }

        if (actionInputs[key].required) {
          obj.schema.required.push(key);
        }
      }
    }
    return obj;
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
          //   console.log(tempPath);
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
      //   console.log("Cheers 🍺  Swagger JSON generated at ", fullPath,  ' Access it with http://localhost:' + sails.config.port + '/swagger ');
      console.log('Cheers 🍺  Swagger doc generated, Access it with http://localhost:' + sails.config.port + '/swagger ');
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
      //   console.log('htmlFilePath');
    });
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

  function getInputs(path) {
    let inputs;
    try {
      let file = require(path);
      inputs = _.clone(file.inputs, true);
    } catch (error) {
      console.error('getInputs : ', error);
      inputs = "";
    }
    return inputs;
  }


  function capitalizeString(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
};
