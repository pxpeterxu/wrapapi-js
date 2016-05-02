var assign = require('object-assign');
var axios = require('axios');

var Config = {
  host: 'https://wrapapi.com'
};

// Base class for all WrapAPI errors
function WAError(response) {
  this.name = 'WAError';
  
  this.message = response.messages.join('; ');
  this.error = this.message;
  
  this.messages = response.messages;
  this.errTypes = response.errTypes;
  
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    this.stack = (new Error()).stack;
  }
}
WAError.prototype = Object.create(Error.prototype);
WAError.prototype.constructor = WAError;

/**
 * Creates a WrapAPI client with a given API key
 * @param apiKey   WrapAPI key to use
 */
var WAClient = function(apiKey) {
  if (apiKey.search(/^\w{32}$/) === -1) {
    throw new TypeError(apiKey + ' is not a valid WrapAPI key. It should be a 32-character alphanumeric string');
  }
  this.apiKey = apiKey;
};

/**
 * Runs a WrapAPI API element
 * @param username    the owner of the API element
 * @param repository  the repository of the API element
 * @param name        the name of the API element
 * @param version     the version to use; either "latest" or in the format of "x.y.z"
 * @param data        object with data to pass as inputs for API element
 * @param stateToken  state token representing all the cookies to send with the request
 */
WAClient.prototype.run = function(username, repository, name, version, data, stateToken) {
  var argumentErrors = [];
  if (!username) {
    argumentErrors.push('The API element\'s username is missing');
  }
  if (!repository) {
    argumentErrors.push('The API element\'s repository is missing');
  }
  if (!name) {
    argumentErrors.push('The API element\'s name is missing');
  }
  if (typeof version !== 'string' || version.search(/^latest|\d+\.\d+\.\d+$/) === -1) {
    argumentErrors.push('The version entered (' + version + ') is not "latest" or in the form "x.y.z"');
  }
  if (data != null && typeof data !== 'object') {
    argumentErrors.push('data should be an object with one key for each input, but is ' + typeof data + ' instead');
  }
  if (stateToken != null && typeof stateToken !== 'string') {
    argumentErrors.push('stateToken should be a string, but is ' + typeof stateToken + ' instead');
  }
  if (argumentErrors.length !== 0) {
    return Promise.reject(new TypeError(argumentErrors.join('; ')));
  }
  
  var internalData = data;
  if (stateToken) {
    internalData = assign({}, data);
    internalData.stateToken = stateToken;
  }
  
  return axios({
    url: Config.host + '/use/' + [username, repository, name, version].join('/'),
    method: 'post',
    data: internalData,
    params: {
      wrapAPIKey: this.apiKey
    },
    responseType: 'json'
  }).then(function handleResponse(response) {
    if (!response.data) {
      throw new WAError({ messages: ['Received an unexpected response'], errTypes: ['unexpectedResponse'] });
    } else if (!response.data.success) {
      throw new WAError(response.data);
    }
    return response.data;
  });
};

var Session = function(client) {
  this.client = client;
  this.stateToken = null;
};

Session.prototype.run = function(username, repository, name, version, data) {
  return this.client.run(username, repository, name, version, data, this.stateToken).then(function(response) {
    // Preserve the stateToken in our closure
    if (response && response.stateToken) {
      this.stateToken = response.stateToken;
    }
    return response;
  }.bind(this));
};

/**
 * Creates a session that will automatically store the last stateToken
 * to use in future requests. Will also have the same run() function signature
 */
WAClient.prototype.Session = function() {
  return new Session(this);
};

module.exports = {
  Client: WAClient,
  Error: WAError
};
