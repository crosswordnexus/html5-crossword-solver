export class CluesGroup {
  constructor(crossword, data) {
    this.id = '';
    this.title = '';
    this.clues = [];
    this.clues_container = null;
    this.words_ids = [];
    this.crossword = crossword;
    this.isFake = data.fake || this.crossword.fakeclues || false;
    if (data) {
      if (
        data.hasOwnProperty('id') &&
        data.hasOwnProperty('title') &&
        data.hasOwnProperty('clues') &&
        data.hasOwnProperty('words_ids')
      ) {
        this.id = data.id;
        this.title = data.title;
        this.clues = data.clues;
        this.words_ids = data.words_ids;
      }
    }
  }

  getFirstWord() {
    if (this.words_ids.length) {
      return this.crossword.words[this.words_ids[0]];
    }
    return null;
  }

  getLastWord() {
    if (this.words_ids.length) {
      return this.crossword.words[
        this.words_ids[this.words_ids.length - 1]
      ];
    }
    return null;
  }

  // gets word which has cell with specified coordinates
  getMatchingWord(x, y, change_word = false) {
    var i,
      word_id,
      word,
      words = [];
    for (i = 0;
      (word_id = this.words_ids[i]); i++) {
      word = this.crossword.words.hasOwnProperty(word_id) ?
        this.crossword.words[word_id] :
        null;
      if (word && word.cells.indexOf(`${x}-${y}`) >= 0) {
        words.push(word);
      }
    }
    if (words.length == 1) {
      return words[0];
    } else if (words.length == 0) {
      return null;
    } else {
      // with more than one word we look for one
      // that's either current or not
      var finding_word = false;
      for (i = 0; i < words.length; i++) {
        word = words[i];
        if (change_word) {
          if (
            this.crossword.selected_word &&
            word.id == this.crossword.selected_word.id
          ) {
            finding_word = true;
          } else if (finding_word) {
            return word;
          }
        } else {
          if (
            this.crossword.selected_word &&
            word.id == this.crossword.selected_word.id
          ) {
            return word;
          }
        }
      }

      // if we didn't match a word in the above
      // just return the first one
      return words[0];
    }
    return null;
  }

  // in clues list, marks clue for word that has cell with given coordinates
  markActive(x, y, is_passive, fakeclues = false) {
    // don't mark anything as active if fake clues
    if (this.isFake || this.crossword.diagramless_mode) {
      return;
    }
    var classname = is_passive ? 'passive' : 'active',
      word = this.getMatchingWord(x, y);
    this.clues_container.find('div.cw-clue.active').removeClass('active');
    this.clues_container.find('div.cw-clue.passive').removeClass('passive');
    if (word) {
      const clue_el = this.clues_container.find(
        'div.cw-clue.word-' + word.id
      );
      clue_el.addClass(classname);
      const clueRect = clue_el.get(0).getBoundingClientRect();

      const scrollContainer = clue_el.closest('.cw-clues-items');
      const scrollRect = scrollContainer.get(0).getBoundingClientRect();

      if (clueRect.top < scrollRect.top) {
        scrollContainer.stop().animate({
            scrollTop: scrollContainer.scrollTop() - (scrollRect.top - clueRect.top),
          },
          150
        );
      } else if (clueRect.bottom > scrollRect.bottom) {
        scrollContainer.stop().animate({
            scrollTop: scrollContainer.scrollTop() +
              (clueRect.bottom - scrollRect.bottom),
          },
          150
        );
      }
    }
  }

  // returns word next to given
  getNextWord(word) {
    var next_word = null,
      index = this.words_ids.indexOf(word.id);
    if (index < this.words_ids.length - 1) {
      next_word = this.crossword.words[this.words_ids[index + 1]];
    }
    return next_word;
  }

  // returns word previous to given
  getPreviousWord(word) {
    var prev_word = null,
      index = this.words_ids.indexOf(word.id);
    if (index > 0) {
      prev_word = this.crossword.words[this.words_ids[index - 1]];
    }
    return prev_word;
  }
}
