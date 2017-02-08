'use strict';

const _ = require('lodash');

const debug = require('debug')('metalsmith-godi-indexsettings');

const models = require('../census/models');

module.exports = plugin;

/**
 * GODI Metalsmith plugin that works with the Index setting data loaded from
 * the CMS.
 *
 * It locates anillary page content present in the Index settings object and
 * adds each page as a file to be built by Metalsmith. Ancillary pages have a
 * key ending with `_page`, e.g. about_page.
 *
 * It also adds the Google Analytics code to the metalsmith metadata for use
 * in templates.
 *
 * @return {Function}
 */

function plugin(options) {
  return (files, metalsmith, done) => {
    let metadata = metalsmith.metadata();

    debug('Adding ancillary pages.');
    models.Site.findById(options.domain)
    .then(site => {
      // Get ancillary page content from Index settings.
      const indexSettings = site.indexSettings;
      metadata.ancillary_pages = [];
      _.each(indexSettings, (v, k) => {
        if (_.endsWith(k, '_page') && v) {
          const keyName = k.split('_page')[0];
          const fileData = {
            title: _.capitalize(keyName),
            layout: 'page.html',
            breadcrumbTitle: _.capitalize(keyName),
            contents: v
          };
          files[keyName + '.md'] = fileData;
          metadata.ancillary_pages.push(keyName);
        }
      });

      // Add GA code snippet to metadata
      if (indexSettings.google_analytics_key) {
        metadata.google_analytics_key = indexSettings.google_analytics_key;
      }

      // Add site title to metadata
      if (indexSettings.title) {
        metadata.site_title = indexSettings.title;
      }
      done();
    })
    .catch(err => done(err));
  };
}
