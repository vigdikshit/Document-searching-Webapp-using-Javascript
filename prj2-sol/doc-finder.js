const assert = require('assert');
const mongo = require('mongodb').MongoClient;

const {inspect} = require('util'); //for debugging

'use strict';

/** This class is expected to persist its state.  Hence when the
 *  class is created with a specific database url, it is expected
 *  to retain the state it had when it was last used with that URL.
 */
let nWords;
let allWords;
let dbName;
let db;
let client;
let count = 0;
let countNoise = 0;
let docCount = 0;
const docs_table = 'wordsInfo';
const noise_table = 'noiseWords';
const docContent_table = 'docContent';
class DocFinder {

  /** Constructor for instance of DocFinder. The dbUrl is
   *  expected to be of the form mongodb://SERVER:PORT/DB
   *  where SERVER/PORT specifies the server and port on
   *  which the mongo database server is running and DB is
   *  name of the database within that database server which
   *  hosts the persistent content provided by this class.
   */
  constructor(dbUrl) {
    //TODO
      this.dbUrl = dbUrl;
      dbName = dbUrl.substring(dbUrl.lastIndexOf('/')  + 1, dbUrl.length);
  }

  /** This routine is used for all asynchronous initialization
   *  for instance of DocFinder.  It must be called by a client
   *  immediately after creating a new instance of this.
   */
  async init() {
    //TODO
     client = await mongo.connect(this.dbUrl);
     db = client.db(dbName);
  }

  /** Release all resources held by this doc-finder.  Specifically,
   *  close any database connections.
   */
  async close() {
    //TODO
      await client.close();
  }

  /** Clear database */
  async clear() {
    //TODO
      await db.dropDatabase();
  }

  /** Return an array of non-noise normalized words from string
   *  contentText.  Non-noise means it is not a word in the noiseWords
   *  which have been added to this object.  Normalized means that
   *  words are lower-cased, have been stemmed and all non-alphabetic
   *  characters matching regex [^a-z] have been removed.
   */
  async words(contentText) {
    //TODO
      let words = [];
      let splitWords;
      let noiseWords = [];
      await db.collection(noise_table).find({}).forEach(function (u) {
          noiseWords.push(u.word);
      });
      while (splitWords = WORD_REGEX.exec(contentText)) {
          let [word, offset] = [splitWords[0], splitWords.index];
          word = normalize(word);
          word = stem(word);
          if(!(noiseWords.indexOf(word) > -1)) {
              words.push([word, offset]);
          }
      }
      return await words;

  }

  /** Add all normalized words in the noiseText string to this as
   *  noise words.  This operation should be idempotent.
   */
  async addNoiseWords(noiseText) {
    //TODO
      nWords = noiseText.split('\n');
      for(const nWord of nWords){
        countNoise++;
        await db.collection(noise_table).insertOne(
            { _id: countNoise, word: nWord }
        );
      }
  }

  /** Add document named by string name with specified content string
   *  contentText to this instance. Update index in this with all
   *  non-noise normalized words in contentText string.
   *  This operation should be idempotent.
   */ 
  async addContent(name, contentText) {
    //TODO
      allWords = await this.words(contentText);
      docCount++;
      await db.collection(docContent_table).insertOne(
          {_id: docCount,docN: name, content: contentText}
      );
       for(let [word,offsets] of allWords){
              await db.collection(docs_table).updateOne(
                  {_id: {word, name}},
                  {
                      $inc: {score: 1},
                      $setOnInsert: {
                           words: word,
                           docs: name,
                           offset: offsets
                      }
                  },
                  {upsert: true}
              );
      }
  }

  /** Return contents of document name.  If not found, throw an Error
   *  object with property code set to 'NOT_FOUND' and property
   *  message set to `doc ${name} not found`.
   */
  async docContent(name) {
    //TODO
      let coll = db.collection(docContent_table);
      if(await coll.find({docN: name}).count() === 1){
          let res = await coll.findOne({docN: name});
              return res['content'];
      }
      else{
          return "Document not found\n";
      }
  }
  
  /** Given a list of normalized, non-noise words search terms, 
   *  return a list of Result's  which specify the matching documents.  
   *  Each Result object contains the following properties:
   *
   *     name:  the name of the document.
   *     score: the total number of occurrences of the search terms in the
   *            document.
   *     lines: A string consisting the lines containing the earliest
   *            occurrence of the search terms within the document.  The 
   *            lines must have the same relative order as in the source
   *            document.  Note that if a line contains multiple search 
   *            terms, then it will occur only once in lines.
   *
   *  The returned Result list must be sorted in non-ascending order
   *  by score.  Results which have the same score are sorted by the
   *  document name in lexicographical ascending order.
   *
   */
  async find(terms) {
    //TODO
      terms = terms.toString().replace(/,1/g, "");
      let results;
      let score;
      let docName = "";
      let arrayItems = [];
      let arrayResults = [];
      let ret;
      let line;
      let startIndex;
      let endIndex;
      let document = [];
      terms = terms.split(",");
      for(let term of terms) {
          arrayItems.length = 0;
          await db.collection(docs_table).find({ words: term }).forEach(function(items){
            arrayItems.push(items);
          });
          for(let item of arrayItems){
              score = item.score;
              startIndex = endIndex = item.offset;
              docName = item.docs;
            ret = await db.collection(docContent_table).findOne(
                {docN: docName} );
              while(ret.content.charAt(startIndex) !== '\n'){
                if(startIndex === 0){break;};
                startIndex--;
              }
              while(ret.content.charAt(endIndex) !== '\n'){
                  endIndex++;
              }
              line = ret.content.substring(startIndex, endIndex);
              if(document.indexOf(docName) >= 0) {
                  arrayResults.find(obj => obj.name === docName).score += score;
                  if (arrayResults.find(obj => obj.name === docName).lines !== line) {
                      arrayResults.find(obj => obj.name === docName).lines += "\n" + line;
                  }
              }else {
                  document.push(docName);
                  results = new Result(docName, score, line);
                  arrayResults.push(results);
              }
          }
      }
      arrayResults.sort(compareResults);
      return arrayResults;
  }

  /** Given a text string, return a ordered list of all completions of
   *  the last normalized word in text.  Returns [] if the last char
   *  in text is not alphabetic.
   */
  async complete(text) {
    //TODO
      let completeWord = [];
      let arr = [];
      text = normalize(text);
      let regX = new RegExp("^" + text);
      await db.collection(docs_table).find({
          words: { $regex: regX } })
          .forEach(function(items){
          arr.push(items);
      });
      for(let a of arr){
        completeWord.push(a.words);
      }
      return completeWord;
  }

  //Add private methods as necessary

} //class DocFinder

module.exports = DocFinder;

//Add module global functions, constants classes as necessary
//(inaccessible to the rest of the program).

//Used to prevent warning messages from mongodb.
const MONGO_OPTIONS = {
  useNewUrlParser: true
};

/** Regex used for extracting words as maximal non-space sequences. */
const WORD_REGEX = /\S+/g;

/** A simple utility class which packages together the result for a
 *  document search as documented above in DocFinder.find().
 */ 
class Result {
  constructor(name, score, lines) {
    this.name = name; this.score = score; this.lines = lines;
  }

  toString() { return `${this.name}: ${this.score}\n${this.lines}`; }
}

/** Compare result1 with result2: higher scores compare lower; if
 *  scores are equal, then lexicographically earlier names compare
 *  lower.
 */
function compareResults(result1, result2) {
  return (result2.score - result1.score) ||
    result1.name.localeCompare(result2.name);
}

/** Normalize word by stem'ing it, removing all non-alphabetic
 *  characters and converting to lowercase.
 */
function normalize(word) {
  return stem(word.toLowerCase()).replace(/[^a-z]/g, '');
}

/** Place-holder for stemming a word before normalization; this
 *  implementation merely removes 's suffixes.
 */
function stem(word) {
  return word.replace(/\'s$/, '');
}


