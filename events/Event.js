/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */

module.exports = {
  /**
   * General Event structure
   * 
   * @param {String} connectionId 
   * @param {mixed} data 
   * @returns {Object}
   */
  create (connectionId, data) {
    return {
      connectionId,
      data,
      routing: data.routing
    };
  }
};
