/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */
const _ = require('lodash');
/**
 * getAvailRoutings(routing)
 * 
 * function generate avail routings
 * for routing template
 * 
 * app_eth.transaction.123 = [*, app_eth.*, app_eth.transaction.*, app_eth.transaction.123]
 *  
 * @param {String} template 
 * @returns [{String}, ...]
 */
module.exports =  (template) => {
  const parts = template.split('.');

  let buildPart = parts[0];
  const beginRoutings = [template, '*'];   

  return _.uniq(_.reduce(_.slice(parts, 1), (routings, part) => {
    routings.push(`${buildPart}.*`);
    buildPart = `${buildPart}.${part}`;

    return routings;
  }, beginRoutings));
};
