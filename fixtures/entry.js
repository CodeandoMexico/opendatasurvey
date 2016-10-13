'use strict';

var _ = require('lodash');
var uuid = require('node-uuid');
var datasets = require('./dataset');
var places = require('./place');
var users = require('./user');

function answers() {
  return {
    digital: true,
    exists: 'Yes',
    machinereadable: true,
    openlicense: false,
    online: false,
    public: false,
    publisher: 'Acme',
    format: ['CSV', 'PSF'],
    license: 'http://example.com'
  };
}

function currentAnswers() {
  return {
    digital: false,
    exists: false,
    machinereadable: false,
    openlicense: true,
    online: true,
    public: true,
    publisher: 'Acme',
    format: ['CSV', 'PSF'],
    license: 'http://example.com'
  };
}

function bySite(fixtures, siteId) {
  return _.filter(fixtures, function(D) {
    return D.data.site === siteId;
  });
}

var objects = [
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site1',
      year: 2014,
      place: 'place12',
      dataset: 'dataset11',
      answers: answers(),
      submissionNotes: '',
      reviewed: true,
      reviewResult: true,
      reviewComments: '',
      details: 'This is site1 entry',
      isCurrent: true, // Need to be sure that at least one current Entry exists for proper testing
      submitterId: _.sample(users).data.id,
      reviewerId: _.sample(users).data.id
    }
  },
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site1',
      year: 2015,
      place: 'place11',
      dataset: 'dataset11',
      answers: currentAnswers(),
      submissionNotes: '',
      reviewed: true,
      reviewResult: true,
      reviewComments: '',
      details: 'This is site1 entry',
      isCurrent: true, // Need to be sure that at least one current Entry exists for proper testing
      submitterId: _.sample(users).data.id,
      reviewerId: _.sample(users).data.id
    }
  },
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site1',
      year: 2015,
      place: 'place12',
      dataset: 'dataset11',
      answers: answers(),
      submissionNotes: '',
      reviewed: true,
      reviewResult: false,
      reviewComments: '',
      details: '',
      isCurrent: false,
      submitterId: _.sample(users).data.id,
      reviewerId: _.sample(users).data.id
    }
  },
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site1',
      year: 2015,
      place: 'place11',
      dataset: 'dataset12',
      answers: answers(),
      submissionNotes: '',
      reviewed: true,
      reviewResult: true,
      reviewComments: '',
      details: '',
      isCurrent: true,
      submitterId: _.sample(users).data.id,
      reviewerId: _.sample(users).data.id
    }
  },
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site1',
      year: 2016,
      place: 'place11',
      dataset: 'dataset12',
      answers: answers(),
      submissionNotes: '',
      reviewed: false,
      reviewResult: false,
      reviewComments: '',
      details: '',
      isCurrent: false,
      submitterId: _.sample(users).data.id,
      reviewerId: _.sample(users).data.id
    }
  },
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site1',
      year: 2015,
      place: 'place12',
      dataset: 'dataset12',
      answers: answers(),
      submissionNotes: '',
      reviewed: false,
      reviewResult: false,
      reviewComments: '',
      details: '',
      isCurrent: false,
      submitterId: _.sample(users).data.id,
      reviewerId: _.sample(users).data.id
    }
  },
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site1',
      year: 2015,
      place: 'place11',
      dataset: 'dataset11',
      answers: answers(),
      submissionNotes: '',
      reviewed: false,
      reviewResult: false,
      reviewComments: '',
      details: '',
      isCurrent: false,
      submitterId: _.sample(users).data.id,
      reviewerId: _.sample(users).data.id
    }
  },
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site1',
      year: 2015,
      place: 'place11',
      dataset: 'dataset13',
      answers: answers(),
      submissionNotes: '',
      reviewed: true,
      reviewResult: true,
      reviewComments: '',
      details: '',
      isCurrent: true,
      submitterId: _.sample(users).data.id,
      reviewerId: _.sample(users).data.id
    }
  },
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site2',
      year: 2016,
      place: _.sample(bySite(places, 'site2')).data.id,
      dataset: _.sample(bySite(datasets, 'site2')).data.id,
      answers: answers(),
      submissionNotes: '',
      reviewed: true,
      reviewResult: false,
      reviewComments: '',
      details: '',
      isCurrent: _.sample([false, true]),
      submitterId: _.sample(users).data.id,
      reviewerId: _.sample(users).data.id
    }
  },
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site2',
      year: 2016,
      place: _.sample(bySite(places, 'site2')).data.id,
      dataset: _.sample(bySite(datasets, 'site2')).data.id,
      answers: answers(),
      submissionNotes: '',
      reviewed: true,
      reviewResult: false,
      reviewComments: '',
      details: '',
      isCurrent: _.sample([false, true]),
      submitterId: _.sample(users).data.id,
      reviewerId: _.sample(users).data.id
    }
  },
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site2',
      year: 2016,
      place: _.sample(bySite(places, 'site2')).data.id,
      dataset: _.sample(bySite(datasets, 'site2')).data.id,
      answers: answers(),
      submissionNotes: '',
      reviewed: true,
      reviewResult: false,
      reviewComments: '',
      details: '',
      isCurrent: _.sample([false, true]),
      submitterId: _.sample(users).data.id,
      reviewerId: _.sample(users).data.id
    }
  },
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site2',
      year: 2016,
      place: _.sample(bySite(places, 'site2')).data.id,
      dataset: _.sample(bySite(datasets, 'site2')).data.id,
      answers: answers(),
      submissionNotes: '',
      reviewed: true,
      reviewResult: false,
      reviewComments: '',
      details: '',
      isCurrent: true,
      submitterId: _.sample(users).data.id,
      reviewerId: _.sample(users).data.id
    }
  },
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site2',
      year: 2016,
      place: _.sample(bySite(places, 'site2')).data.id,
      dataset: _.sample(bySite(datasets, 'site2')).data.id,
      answers: answers(),
      submissionNotes: '',
      reviewed: true,
      reviewResult: false,
      reviewComments: '',
      details: '',
      isCurrent: false,
      submitterId: _.sample(users).data.id,
      reviewerId: _.sample(users).data.id
    }
  },
  // A set of entries for pair of place-dataset which all have isCurrent === false
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site2',
      year: 2015,
      place: 'placeOfNoEntry',
      dataset: 'datasetOfNoEntry',
      answers: answers(),
      submissionNotes: '',
      reviewed: true,
      reviewResult: false,
      reviewComments: '',
      details: '',
      isCurrent: false,
      submitterId: _.sample(users).data.id,
      reviewerId: _.sample(users).data.id
    }
  }
];

module.exports = objects;
