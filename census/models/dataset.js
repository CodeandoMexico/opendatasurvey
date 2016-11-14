'use strict';

var _ = require('lodash');
var mixins = require('./mixins');

module.exports = function(sequelize, DataTypes) {
  var Dataset = sequelize.define('Dataset', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      comment: 'id of the dataset. Composite key with site.'
    },
    site: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      comment: 'Site this dataset belongs to. Composite key with id.'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'The name of the dataset.'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'A text description of this dataset.'
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'The category for this dataset. Used in UI.'
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'The icon class for this dataset. Used in UI.'
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      default: 100,
      comment: 'The order for this dataset relative to others. ' +
        'Used for various table displays.'
    },
    reviewers: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      comment: 'Dataset-specific reviewers.'
    },
    disableforyears: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      comment: 'Years for which dataset is disabled.'
    },
    characteristics: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      comment: 'An array of dataset characterstics.'
    },
    updateevery: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'A time interval to determine timeliness for the dataset.'
    },
    qsurl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'A URL pointing to the QuestionSet used by this dataset.'
    },
    translations: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'dataset',
    indexes: [
      {
        fields: ['site']
      }
    ],
    instanceMethods: {
      translated: mixins.translated,
      score: function(entries, questions) {
        let entriesForDataset = _.filter(entries, {dataset: this.id});
        let scoreableQuestions = _.filter(questions, q => q.isScored());
        return _.sum(
          _.map(entriesForDataset, entry => {
            return entry.scoreForQuestions(scoreableQuestions);
          })
        );
      },
      /*
      Get Questions from the associated QuestionSet.
      */
      getQuestions: function() {
        return this.getQuestionSet()
        .then(qset => {
          if (qset)
            return qset.getQuestions();
          return undefined;
        });
      },
      /*
      Get QuestionSetSchema object from the associated QuestionSet.
      */
      getQuestionSetSchema: function() {
        return this.getQuestionSet()
        .then(qset => _.get(qset, 'qsSchema', undefined));
      }
    },
    classMethods: {
      associate: function(models) {
        Dataset.belongsTo(models.QuestionSet, {foreignKey: 'questionsetid'});
      },
      /* Calculate the max score possible for all unique datasets used by a given list
         of entries.*/
      maxScore: function(entries, questionMaxScore) {
        // number of unique datasets across the passed entries.
        var count = _.size(_.uniq(_.map(entries, entry => entry.dataset)));
        // max score possible across all unique datasets
        var score = count * questionMaxScore;
        return score;
      }
    }
  });

  return Dataset;
};
