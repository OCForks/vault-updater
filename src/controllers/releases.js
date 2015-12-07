let Joi = require('Joi')
let common = require('../common')
let _ = require('underscore')

exports.platforms = ['x64', 'osx']

let commonValidator = {
  params: {
    platform: Joi.valid(exports.platforms),
    version: Joi.string().regex(/[\d]+\.[\d]+\.[\d]+/)
  }
}

// modify the release to be returned to the client
let responseFormatter = (release) => {
  delete release.comparable_version
  return release
}

exports.setup = (runtime, releases) => {
  /*

  Format similar to:

    {
      "url": "http://mycompany.com/myapp/releases/myrelease",
      "name": "My Release Name",
      "notes": "Theses are some release notes innit",
      "pub_date": "2013-09-18T12:29:53+01:00",
    }

  */

  // find the latest release for this platform AFTER the version passed to this handler
  let get = {
    method: 'GET',
    path: '/1/releases/{platform}/{version}',
    config: {
      handler: function (request, reply) {
        // integer version for comparison
        let cv = common.comparableVersion(request.params.version)

        // potential releases
        let potentials = _.filter(
          releases[request.params.platform],
          (rel) => rel.comparable_version > cv
        )

        let targetRelease = null
        if (!_.isEmpty(potentials)) {
          // most current release
          targetRelease = _.max(
            potentials,
            (rel) => rel.comparable_version
          )
        }

        request.log([], 'get')
        if (targetRelease) {
          reply(responseFormatter(targetRelease))
        } else {
          let response = reply('No Content')
          response.code(204)
        }
      },
      validate: commonValidator
    }
  }

  return [
    get
  ]
}
