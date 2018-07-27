
const  _ = require('lodash'),
  request = require('request-promise'),
  profileModel = require('../models/profileModel'),
  bunyan = require('bunyan'),
  log = bunyan.createLogger({name: 'socketService.authLaborx'});

const getAddressesFromLaborx = async (providerPath, token) => {
  const response = await request({
    method: 'GET',
    uri: providerPath + '/me/addresses',
    json: true,
    headers: {
      'Authorization': 'Bearer ' + token
    }
  });
  if (!_.get(response, 'addresses')) 
    throw new Error('not found addresses from auth response ' + response);
  return response.addresses;
};

const getAddressesFromMongo = async (profileModel, token) => {
  const profile = await profileModel.findOne({token});
  if (profile) 
    return profile.addresses;
  return null;
};

const saveAddressesToMongo = async (profileModel, token, addresses) => {
  await profileModel.findOneAndUpdate({token}, {$set: {addresses}}, {
    upsert: true,
    setDefaultsOnInsert: true
  });
};

const isAuth = (token) => { return token.length == 0; };

module.exports = async (token) => {
  try {
    if (!isAuth(token)) {
      throw new Error('Not set authorization headers');
    }
  
    msg.addresses = await getAddressesFromMongo(profileModel, token);
    if (msg.addresses) 
      return true;
  

    let addresses = await getAddressesFromLaborx(config.laborx.uri, token);
    if (!addresses) 
      return false;

    return true;
  } catch (err) {
    log.error('Not success auth ' + err.mesage)
    return false;
  }
}