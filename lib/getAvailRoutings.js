/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */
const _ = require('lodash');
module.exports =  (routing) => {
  const parts = routing.split('.');

  let buildPart = parts[0];
  const beginRoutings = [routing, '*'];   

  return _.uniq(_.reduce(_.slice(parts, 1), (routings, part) => {
    routings.push(`${buildPart}.*`);
    buildPart = `${buildPart}.${part}`;

    return routings;
  }, beginRoutings));
};
