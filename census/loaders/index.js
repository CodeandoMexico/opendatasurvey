'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const config = require('../config');
const utils = require('./utils');
const controllerUtils = require('../controllers/utils');
const marked = require('marked');
const crypto = require('crypto');
const util = require('util');

let loadConfig = function(siteId, models) {
  return models.Registry.findById(siteId)
  .then(registry => {
    return utils.spreadsheetParse(registry.settings.configurl);
  })
  .then(config => {
    let settings = {};
    const raw = _.object(_.zip(_.pluck(config, 'key'), _.pluck(config, 'value')));
    _.each(raw, (v, k) => {
      if (v && _.trim(v.toLowerCase()) === 'true') {
        settings[k] = true;
      } else if (v && _.trim(v.toLowerCase()) === 'false') {
        settings[k] = false;
      } else if (v && _.trim(v.toLowerCase()) === 'null') {
        settings[k] = null;
      } else if (v && ['reviewers', 'locales'].indexOf(k) !== -1) {
        settings[k] = _.map(v.split(
          controllerUtils.FIELD_SPLITTER), _.trim);
      } else if (v && ['navbar_logo', 'overview_page', 'submit_page',
        'about_page', 'faq_page', 'contribute_page',
        'banner_text', 'tutorial_page', 'methodology_page'].indexOf(k) !== -1) {
        settings[k] = marked(v);
      } else {
        settings[k] = v;
      }
    });
    return settings;
  })
  .then(settings => {
    let indexConfig = {};
    if (settings.index_config) {
      indexConfig = utils.spreadsheetParse(settings.index_config);
    }
    return [settings, indexConfig];
  })
  .spread((settings, indexConfig) => {
    let indexSettings = {};
    const raw = _.object(_.zip(_.pluck(indexConfig, 'key'), _.pluck(indexConfig, 'value')));
    _.each(raw, (v, k) => {
      if (v && k.endsWith('_page')) {
        indexSettings[k] = v;
      } else {
        indexSettings[k] = v;
      }
    });
    return models.Site.upsert({
      id: siteId,
      settings: settings,
      indexSettings: indexSettings
    });
  });
};

/* Extend the passed `mapped` object to include translation mapping.

  There may be translated fields. Map field name <name>@<language>
  into translation: {<language>: {<name>: ..., <another name>: ..., ...}}.
*/
let _translationMapper = function(mapped) {
  mapped = _.extend(mapped, {
    translations: _.chain(mapped)
      .pairs()
      .reduce(function(reducedValue, pair) {
        let fieldLang;
        if (!(pair[0].indexOf('@') + 1)) {
          return reducedValue;
        }
        fieldLang = pair[0].split('@');
        // Default empty dict
        reducedValue[fieldLang[1]] = reducedValue[fieldLang[1]] || {};
        reducedValue[fieldLang[1]][fieldLang[0]] = pair[1];
        return reducedValue;
      }, {})
      .value()
  });
  // Handle characteristics for each language key
  const characteristicsPattern = /^characteristics:\d+$/i;
  _.forEach(mapped.translations, (transObj, key) => {
    // Make an array of characteristics from all 'characteristics:n' keys
    let characteristics =
      controllerUtils.commonFieldArray(transObj, characteristicsPattern);
    // If the characteristics array has items, add it to the translations obj.
    if (characteristics.length) {
      mapped.translations[key] = _.extend(mapped.translations[key], {
        characteristics: characteristics
      });
    }
    // Clean up items with 'characteristics:n' keys from translations obj.
    mapped.translations[key] = _.omit(mapped.translations[key], (v, k) => {
      return characteristicsPattern.test(k);
    });
  });
  return mapped;
};

let _createQuestionsForQuestionSet = function(questionsUrl,
                                              qsId,
                                              openQuestions,
                                              models,
                                              transaction) {
  return models.QuestionSet.findById(qsId, {transaction: transaction})
  .then(qset => {
    return models.Question.destroy({
      where: {questionsetid: qsId},
      transaction: transaction
    }).then(() => qset);
  })
  .then(qset => {
    return utils.spreadsheetParse(questionsUrl)
    .then(data => [qset, data]);
  })
  .spread((qset, data) => {
    return Promise.all(
      _.map(data, dataObj => {
        // Allow custom data mapping
        let createData = controllerUtils.questionMapper(dataObj, qset.site);
        // Map translation data
        createData = _translationMapper(createData);
        let isOpen = _.contains(openQuestions, createData.id);
        // All Questions belong to a site and questionset
        createData = _.extend(createData, {
          site: qset.site,
          questionsetid: qset.id,
          openquestion: isOpen
        });

        let parsedConfig = '';
        if (dataObj.config !== '') {
          parsedConfig = JSON.parse(dataObj.config);
        }

        // Put score into question.score from the question config.
        createData = _.extend(createData, {
          score: _.get(parsedConfig, 'score.weight', 0)
        });
        // User may mix up lower cased and upper cased field names
        createData = _.mapKeys(createData, (v, key) => key.toLowerCase());
        return models.Question.create(createData, {transaction: transaction});
      })
    );
  });
};

/*
  A helper function to create a QuestionSet from the parsed question set url,
  and associate it with each dataset in the datasets array.
*/
let _createQuestionSetForDatasets = function(datasets,
                                            qsurl,
                                            siteId,
                                            models,
                                            transaction) {
  return utils.spreadsheetParse(qsurl)
  .then(qsConfig => {
    let raw = _.object(_.zip(_.pluck(qsConfig, 'key'),
                             _.pluck(qsConfig, 'value')));
    // create QuestionSet instance from raw data obj.
    let qsHash = crypto.createHash('sha1').update(siteId + qsurl).digest('hex');
    let qsSchema = JSON.parse(raw.question_set_schema);
    // create array of question ids which are required for dataset to be
    // considered 'open'.
    let openQuestions = [];
    if (_.has(raw, 'open_questions')) {
      openQuestions = _.map(raw.open_questions.split(
                            controllerUtils.FIELD_SPLITTER), _.trim);
    }
    return models.QuestionSet.create({
      id: qsHash,
      site: siteId,
      qsSchema: qsSchema
    }, {transaction: transaction})
    .then(qsInstance => [qsInstance, raw, openQuestions]);
  })
  .spread((qsInstance, raw, openQuestions) => {
    return Promise.each(datasets, ds => {
      return ds.update({questionsetid: qsInstance.id},
                       {transaction: transaction});
    }).then(() => [qsInstance, raw, openQuestions]);
  })
  .spread((qsInstance, raw, openQuestions) => {
    return _createQuestionsForQuestionSet(raw.questions,
                                          qsInstance.id,
                                          openQuestions,
                                          models,
                                          transaction);
  });
};

let loadQuestionSets = function(siteId, models, transaction) {
  return models.sequelize.transaction(t => {
    if (transaction !== undefined) {
      t = transaction;
    }

    // Destroy all QuestionSets associated with siteId.
    return models.QuestionSet.destroy({
      where: {site: siteId},
      transaction: t
    })
    .then(destroyed => {
      // Get the datasets for the site
      return models.Dataset.findAll({
        where: {site: siteId},
        transaction: t
      });
    })
    .then(datasets => {
      // Fetch the qset config at dataset.qsurl for each dataset.
      let qsLoaders = [];
      // Group datasets by their ds.qsurl properties.
      let datasetsByQSUrl = _.groupBy(datasets, ds => ds.qsurl);
      // Create an array of Promises for each qsurl:datasets, to parse the
      // spreadsheet at qsurl and create a QuestionSet object.
      _.each(datasetsByQSUrl, (datasetArr, qsurl) => {
        qsLoaders.push(
          _createQuestionSetForDatasets(datasetArr, qsurl, siteId, models, t)
        );
      });
      // Resolve all the Promises in qsLoaders array.
      return Promise.all(qsLoaders).then(() => {
        console.log(util.format('All QuestionSets loaded for %s. Resolving.',
                                siteId));
      });
    });
  });
};

let loadRegistry = function(models) {
  let registryUrl = config.get('registryUrl') || false;

  return utils.spreadsheetParse(registryUrl)
  .then(registry => {
    if (!registry) {
      throw new Error('could not reload registry');
    }
    return models.Registry.count().then(() => registry);
  })
  .then(registry => {
    // Make each upsert (can't do a bulk with upsert, but that is ok for our
    // needs here)
    return Promise.all(
      _.map(registry, reg => {
        // Normalize data before upsert
        if (reg.adminemail) {
          reg.adminemail = _.each(reg.adminemail
            .split(controllerUtils.FIELD_SPLITTER),
            function(r) {
              r.trim();
            });
        }
        return models.Registry.upsert(_.extend(reg, {
          id: reg.censusid,
          settings: _.omit(reg, 'censusid')
        }));
      })
    );
  });
};

/* Load data and create model instances based on options param.

  e.g. for an options object:
  { mapper: [Function],
  Model: Dataset,
  setting: 'datasets',
  site: 'global' }

  using the config for the site 'global', retrieve data from the spreadsheet
  url defined at setting 'datasets'. Create instances of the Model 'Dataset'
  with the retrieved data, using the optional mapper function.
  */
let loadData = function(options, models) {
  return models.sequelize.transaction(function(t) {
    return models.Site.findById(options.site, {transaction: t})
    .then(site => {
      return options.Model.destroy({
        where: {site: options.site},
        transaction: t
      }).then(() => site);
    })
    .then(site => {
      return utils.spreadsheetParse(site.settings[options.setting])
      .then(data => [data, site]);
    })
    .spread((data, site) => {
      return Promise.all(_.map(data, dataObj => {
        // Allow custom data mapping
        let createData = _.isFunction(options.mapper) ?
          options.mapper(dataObj, site) : dataObj;
        // All records belongs to certain domain
        createData = _.extend(createData, {site: options.site});
        // User may mix up lower cased and upper cased field names
        createData = _.mapKeys(createData, (v, key) => key.toLowerCase());
        return options.Model.create(createData, {transaction: t});
      }));
    })
    .then(() => {
      console.log(util.format('All %s loaded for %s.',
                              options.setting,
                              options.site));
      if (options.setting === 'datasets') {
        return loadQuestionSets(options.site, models, t);
      }
    })
    .catch(err => {
      console.log(err.stack);
      throw err;
    });
  });
};

/* Call loadData with a mapper for translations field. */
let loadTranslatedData = function(options, models) {
  // Avoid recursive call
  let mapper = options.mapper;

  return models.Site.findById(options.site).then(function(site) {
    return loadData(_.extend(options, {
      mapper: function(data) {
        // Call user defined mapper function
        let mapped = _.isFunction(mapper) ? mapper(data, site) : data;
        return _translationMapper(mapped);
      }
    }), models);
  });
};

module.exports = {
  loadData: loadData,
  loadTranslatedData: loadTranslatedData,
  loadRegistry: loadRegistry,
  loadConfig: loadConfig,
  loadQuestionSets: loadQuestionSets
};
