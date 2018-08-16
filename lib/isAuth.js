/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */
const _ = require('lodash'),
  request = require('request-promise'),
  models = require('../models'),
  bunyan = require('bunyan'),
  log = bunyan.createLogger({name: 'socketService.authLaborx'});

const getAddressesFromLaborx = async (providerPath, token) => {
  const response = await request({
    method: 'POST',
    uri: providerPath + '/signin/signature/chronomint',
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

const isAuth = (token) => { return token && token.length > 0; };

/**
 * isAuth function
 * 
 * right token for authentication or not
 * with cache in mongo
 * 
 * @param {String} url 
 * @param {String} token 
 * @return {Boolean}
 */
module.exports = async (url, token) => {
  try {
    if (!isAuth(token)) 
      throw new Error('Not set authorization headers');
    
  
    let addresses = await getAddressesFromMongo(models.profileModel, token);
    if (addresses) 
      return true;
  
    addresses = await getAddressesFromLaborx(url, token);

    if (!addresses) 
      return false;
    return true;
  } catch (err) {
    log.error('not sucess auth');
    log.error(err);
    return false;
  }
};
