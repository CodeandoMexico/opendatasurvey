'use strict';

var rewire = require('rewire');
var _ = require('lodash');
var models = require('../census/models');
var modelUtils = rewire('../census/models/utils');
var chai = require('chai');
var expect = chai.expect;
var utils = require('./utils');

describe('Dataset instance methods', function() {
  this.timeout(20000);

  beforeEach(utils.setupFixtures);
  afterEach(utils.dropFixtures);

  it('.getQuestions', function() {
    var dataOptions = {
      models: models,
      domain: 'site1',
      dataset: 'dataset11',
      place: null,
      year: null,
      cascade: true,
      ynQuestions: true,
      locale: null,
      with: {Entry: true, Dataset: true, Place: true, Question: true}
    };
    return modelUtils.getData(dataOptions)
    .then(data => {
      expect(data).to.have.property('dataset');
      return data.dataset.getQuestions();
    })
    .then(questions => {
      expect(questions).to.have.length(18);
    });
  });

  it('.getQuestionSetSchema', function() {
    var dataOptions = {
      models: models,
      domain: 'site1',
      dataset: 'dataset11',
      place: null,
      year: null,
      cascade: true,
      ynQuestions: true,
      locale: null,
      with: {Entry: true, Dataset: true, Place: true, Question: true}
    };
    return modelUtils.getData(dataOptions)
    .then(data => {
      expect(data).to.have.property('dataset');
      return data.dataset.getQuestionSetSchema();
    })
    .then(qsSchema => {
      expect(qsSchema).to.have.length(12);
      var firstQuestionSchema = qsSchema[0];
      expect(firstQuestionSchema).to.have.property('id');
      expect(firstQuestionSchema).to.have.property('if');
      expect(firstQuestionSchema).to.have.property('position');
      expect(firstQuestionSchema).to.have.property('defaultProperties');
    });
  });
});

describe('Data access layer', function() {
  this.timeout(20000);

  beforeEach(utils.setupFixtures);
  afterEach(utils.dropFixtures);

  it('works with defaults', function() {
    var dataOptions = {
      models: models,
      domain: 'site1',
      dataset: null,
      place: null,
      year: null,
      cascade: true,
      ynQuestions: true,
      locale: null,
      with: {Entry: true, Dataset: true, Place: true, Question: true}
    };
    return modelUtils.getData(dataOptions).then(function(data) {
      expect(data).to.have.property('entries');
      expect(data).to.have.property('pending');
      expect(data).to.have.property('rejected');
      expect(data).to.have.property('datasets');
      expect(data).to.have.property('places');
      expect(data).to.have.property('questions');
    });
  });

  it('keepAll=true should return all entries', function() {
    var dataOptions = {
      models: models,
      domain: 'site1',
      dataset: null,
      place: null,
      year: null,
      cascade: false,
      ynQuestions: false,
      locale: null,
      keepAll: true,
      with: {Entry: true, Dataset: false, Place: false, Question: false}
    };
    return modelUtils.getData(dataOptions).then(function(data) {
      expect(data).to.have.property('entries');
      var hasCurrent = false;
      var hasNonCurrent = false;
      _.forEach(data.entries, entry => {
        entry.isCurrent ? hasCurrent = true : hasNonCurrent = true;
      });
      expect(hasCurrent).to.be.true;
      expect(hasNonCurrent).to.be.true;
    });
  });

  it('keepAll=false should return only current entries', function() {
    var dataOptions = {
      models: models,
      domain: 'site1',
      dataset: null,
      place: null,
      year: null,
      cascade: false,
      ynQuestions: false,
      locale: null,
      with: {Entry: true, Dataset: false, Place: false, Question: false}
    };
    return modelUtils.getData(dataOptions).then(function(data) {
      expect(data).to.have.property('entries');
      var hasCurrent = false;
      var hasNonCurrent = false;
      _.forEach(data.entries, entry => {
        entry.isCurrent ? hasCurrent = true : hasNonCurrent = true;
      });
      expect(hasCurrent).to.be.true;
      expect(hasNonCurrent).to.be.false;
    });
  });

  it('does not return results of an Entry query', function() {
    var dataOptions = {
      models: models,
      domain: 'site1',
      dataset: null,
      place: null,
      year: null,
      cascade: true,
      ynQuestions: true,
      locale: null,
      with: {Entry: false, Dataset: true, Place: true, Question: true}
    };
    return modelUtils.getData(dataOptions).then(function(data) {
      expect(data).to.not.have.property('entries');
      expect(data).to.not.have.property('pending');
      expect(data).to.not.have.property('rejected');
      expect(data).to.have.property('datasets');
      expect(data).to.have.property('places');
      expect(data).to.have.property('questions');
    });
  });

  it('only returns yn questions by default', function() {
    var dataOptions = {
      models: models,
      domain: 'site1',
      dataset: null,
      place: null,
      year: null,
      cascade: true,
      ynQuestions: true,
      locale: null,
      with: {Entry: true, Dataset: true, Place: true, Question: true}
    };
    return modelUtils.getData(dataOptions).then(function(data) {
      expect(data.questions).to.have.length(9);
    });
  });

  it('can return all questions', function() {
    var dataOptions = {
      models: models,
      domain: 'site1',
      dataset: null,
      place: null,
      year: null,
      cascade: true,
      ynQuestions: false,
      locale: null,
      with: {Entry: true, Dataset: true, Place: true, Question: true}
    };
    return modelUtils.getData(dataOptions).then(function(data) {
      expect(data.questions).to.have.length(18);
    });
  });

  it('returns a place and not places when we have a place argument',
    function() {
      var dataOptions = {
        models: models,
        domain: 'site1',
        dataset: null,
        place: 'place11',
        year: null,
        cascade: true,
        ynQuestions: true,
        locale: null,
        with: {Entry: true, Dataset: true, Place: true, Question: true}
      };
      return modelUtils.getData(dataOptions).then(function(data) {
        expect(data).to.not.have.property('places');
        expect(data).to.have.property('place');
      });
    });

  it('returns a dataset and not datasets when we have a dataset argument',
    function() {
      var dataOptions = {
        models: models,
        domain: 'site1',
        dataset: 'dataset11',
        place: null,
        year: null,
        cascade: true,
        ynQuestions: true,
        locale: null,
        with: {Entry: true, Dataset: true, Place: true, Question: true}
      };
      return modelUtils.getData(dataOptions).then(function(data) {
        expect(data).to.not.have.property('datasets');
        expect(data).to.have.property('dataset');
      });
    });

  it('returns cascaded entries when cascade is true', function() {
    var dataOptions = {
      models: models,
      domain: 'site1',
      dataset: null,
      place: null,
      year: 2015,
      cascade: true,
      ynQuestions: true,
      locale: null,
      with: {Entry: true, Dataset: true, Place: true, Question: true}
    };
    return modelUtils.getData(dataOptions).then(function(data) {
      expect(data.entries).to.have.length(3);
      expect(data.pending).to.have.length(2);
      expect(data.rejected).to.have.length(1);
    });
  });

  it('returns entries by year when cascade is false', function() {
    var dataOptions = {
      models: models,
      domain: 'site1',
      dataset: null,
      place: null,
      year: 2015,
      cascade: false,
      ynQuestions: true,
      locale: null,
      with: {Entry: true, Dataset: true, Place: true, Question: true}
    };
    return modelUtils.getData(dataOptions).then(function(data) {
      expect(data.entries).to.have.length(2);
      expect(data.pending).to.have.length(2);
      expect(data.rejected).to.have.length(1);
    });
  });

  it('excludes dataset if exclude_dataset option is present', function() {
    var dataOptions = {
      models: models,
      domain: 'site1',
      dataset: null,
      place: null,
      year: 2015,
      cascade: true,
      ynQuestions: true,
      locale: null,
      with: {Entry: true, Dataset: true, Place: true, Question: true},
      exclude_datasets: ['dataset12']
    };
    return modelUtils.getData(dataOptions).then(function(data) {
      expect(data.entries).to.have.length(2);
      expect(data.datasets).to.have.length(1);
    });
  });

  it('exclude dataset if disableforyears is set for year', function() {
    var dataOptions = {
      models: models,
      domain: 'site1',
      dataset: null,
      place: null,
      year: 2015,
      cascade: true,
      ynQuestions: true,
      locale: null,
      with: {Entry: true, Dataset: true, Place: true, Question: true}
    };
    return modelUtils.getData(dataOptions).then(function(data) {
      expect(data.entries).to.have.length(3);
      expect(data.datasets).to.have.length(2);
    });
  });
});

describe('Util function', function() {
  describe('#excludedDatasetsByYear', function() {
    before(function() {
      this.excludedDatasetsByYear = modelUtils.__get__('excludedDatasetsByYear');
    });

    it('returns empty object for single dataset with empty disableforyears',
    function() {
      let data = {
        dataset: {
          id: 'id1',
          disableforyears: []
        }
      };

      let excludedDatasets = this.excludedDatasetsByYear(data);
      expect(excludedDatasets).to.be.empty;
    });
    it('returns expected object for single dataset with disableforyears',
    function() {
      let data = {
        dataset: {
          id: 'id1',
          disableforyears: ['2013', '2016']
        }
      };

      let excludedDatasets = this.excludedDatasetsByYear(data);
      expect(excludedDatasets).not.to.be.empty;
      expect(excludedDatasets).to.have.all.keys('2013', '2016');
      expect(excludedDatasets).to.be.deep.equal({2013: ['id1'], 2016: ['id1']});
    });
    it('returns empty object for single dataset with null disableforyears',
    function() {
      let data = {
        dataset: {
          id: 'id1',
          disableforyears: null
        }
      };

      let excludedDatasets = this.excludedDatasetsByYear(data);
      expect(excludedDatasets).to.be.empty;
    });
    it('returns empty object for array of datasets, all with empty disableforyears',
    function() {
      let data = {
        datasets: [
          {
            id: 'id1',
            disableforyears: []
          },
          {
            id: 'id2',
            disableforyears: []
          }
        ]
      };
      let excludedDatasets = this.excludedDatasetsByYear(data);
      expect(excludedDatasets).to.be.empty;
    });
    it('returns empty object for array of datasets, all with null disableforyears',
    function() {
      let data = {
        datasets: [
          {
            id: 'id1',
            disableforyears: null
          },
          {
            id: 'id2',
            disableforyears: null
          }
        ]
      };
      let excludedDatasets = this.excludedDatasetsByYear(data);
      expect(excludedDatasets).to.be.empty;
    });
    it('returns expected object for array of datasets, with disableforyears',
    function() {
      let data = {
        datasets: [
          {
            id: 'id1',
            disableforyears: ['2013', '2014']
          },
          {
            id: 'id2',
            disableforyears: []
          },
          {
            id: 'id3',
            disableforyears: ['2014', '2015']
          },
          {
            id: 'id4',
            disableforyears: null
          }
        ]
      };
      let excludedDatasets = this.excludedDatasetsByYear(data);
      expect(excludedDatasets).not.to.be.empty;
      expect(excludedDatasets).to.have.all.keys('2013', '2014', '2015');
      expect(excludedDatasets).to.be.deep.equal({
        2013: ['id1'], 2014: ['id1', 'id3'], 2015: ['id3']
      });
    });
  });
});
