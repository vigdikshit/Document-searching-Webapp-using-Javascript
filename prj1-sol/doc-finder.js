const {inspect} = require('util'); //for debugging

'use strict';
let mapOfWords;
let nWords;
let line;
let mapOfLines;
let mapWords;
let allWords;
class DocFinder {

  /** Constructor for instance of DocFinder. */
  constructor() {
      //@TODO
     mapOfWords = new Map();
     nWords = "";
     line = "";
     allWords = [];
     mapOfLines = new Map();
  }

  /** Return array of non-noise normalized words from string content.
   *  Non-noise means it is not a word in the noiseWords which have
   *  been added to this object.  Normalized means that words are
   *  lower-cased, have been stemmed and all non-alphabetic characters
   *  matching regex [^a-z] have been removed.
   */
  words(content) {
    //@TODO
      let wordMap = new Map();
      let count = 1;
      let arr = content.split(/\s+/);
      for(let word of arr){
        word = normalize(word);
        word = stem(word);
        if(!(nWords.indexOf(word) > -1)){
          if(wordMap.has(word) === true) {
              count = wordMap.get(word) + 1;
              wordMap.set(word, count);
          }else {
              wordMap.set(word, 1);
          }
          if(allWords.indexOf(word) < 0){
                allWords.push(word);
          }
        }
      }
    return wordMap;
  }

  /** Add all normalized words in noiseWords string to this as
   *  noise words. 
   */
  addNoiseWords(noiseWords) {
      //@TODO
    nWords = noiseWords.split(/\s+/);
    return nWords;
  }

  /** Add document named by string name with specified content to this
   *  instance. Update index in this with all non-noise normalized
   *  words in content string.
   */ 
  addContent(name, content) {
      //@TODO
    line = content.split(/\n/);
    mapOfLines.set(name, line);
    mapWords = new Map();
    mapWords = this.words(content);
    mapOfWords.set(name, mapWords);

  }

  /** Given a list of normalized, non-noise words search terms, 
   *  return a list of Result's  which specify the matching documents.  
   *  Each Result object contains the following properties:
   *     name:  the name of the document.
   *     score: the total number of occurrences of the search terms in the
   *            document.
   *     lines: A string consisting the lines containing the earliest
   *            occurrence of the search terms within the document.  Note
   *            that if a line contains multiple search terms, then it will
   *            occur only once in lines.
   *  The Result's list must be sorted in non-ascending order by score.
   *  Results which have the same score are sorted by the document name
   *  in lexicographical ascending order.
   *
   */
  find(terms) {
      //@TODO
    terms = terms.toString().replace(/,1/g, "");
    let results;
    let docN = [];
    let arrayResults = [];
    terms = terms.split(",");
      for(let term of terms) {
        for (const [docName, words] of mapOfWords.entries()) {
            if (words.has(term) === true) {
                let score = words.get(term);
                let lines = mapOfLines.get(docName);
                for (line of lines) {
                    //let res = line.search(new RegExp(term, "i"));
                    let res = line.search(new RegExp("\\b" + term + "\\b", "i"));
                    if (res >= 0) {
                        if(docN.indexOf(docName) >= 0) {
                            arrayResults.find(obj => obj.name === docName).score += score;
                            if (arrayResults.find(obj => obj.name === docName).lines !== line) {
                                arrayResults.find(obj => obj.name === docName).lines += "\n" + line;
                             }
                        }else {
                            docN.push(docName);
                            results = new Result(docName, score, line);
                            arrayResults.push(results);
                         }
                        break;
                    }
                }

            }
        }

    }
    arrayResults.sort(compareResults);
    return arrayResults;
  }

  /** Given a text string, return a ordered list of all completions of
   *  the last word in text.  Returns [] if the last char in text is
   *  not alphabetic.
   */
  complete(text) {
    //@TODO
      let completeWord = [];
      text = normalize(text);
      for(let words of allWords){
          if(words.startsWith(text)){
            completeWord.push(words);
          }
      }
          return completeWord;
  }

  
} //class DocFinder

module.exports = DocFinder;

/** Regex used for extracting words as maximal non-space sequences. */
const WORD_REGEX = /\S+/g;

/** A simple class which packages together the result for a 
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

