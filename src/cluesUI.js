/**
 * @file cluesUI.js
 * @description Handles rendering, layout, and visual state of the clues lists.
 * 
 * What belongs here:
 * - Rendering clues lists into DOM and binding note input event listeners.
 * - Sizing/styling clues (e.g. graying out completed clues).
 * - Clue layout column adjustments on resize.
 */

import { escape } from './utils.js';

export function updateClueLayout() {
  /** Some JS magic to deal with weird numbers of clue lists **/
  const holder = this.clues_holder ? this.clues_holder.get(0) : null;
  if (!holder) return; // nothing to do if it doesn't exist

  const clues = holder.querySelectorAll('.cw-clues');
  if (!clues.length) return;

  const MIN_AVG_WIDTH = this.config.min_sidebar_clue_width || 220; // tweak this breakpoint

  // available width per clue list
  const avgWidth = holder.offsetWidth / clues.length;
  const useColumn = avgWidth < MIN_AVG_WIDTH;

  // apply layout
  holder.style.flexDirection = useColumn ? 'column' : 'row';
  clues.forEach(clue => {
    clue.style.width = useColumn ? 'auto' : '';
  });
}

export function renderClues(clues_group, clues_container) {
  const $container = $(clues_container);

  // Locate title and items within the container
  const $title = $container.find('div.cw-clues-title').length ?
    $container.find('div.cw-clues-title') :
    $container.closest('.cw-clues').find('div.cw-clues-title');

  const $items = $container.find('div.cw-clues-items').length ?
    $container.find('div.cw-clues-items') :
    $container;

  const notes = this.notes;
  $items.find('div.cw-clue').remove();

  // --- render each clue ---
  for (const clue of clues_group.clues) {
    const clue_el = $(`
      <div style="position: relative">
        <span class="cw-clue-number">${escape(clue.number)}</span>
        <span class="cw-clue-text">
          ${escape(clue.text)}
          <div class="cw-edit-container" style="display: none;">
            <input class="cw-input note-style" type="text">
          </div>
          <span class="cw-cluenote-button" style="display: none;"></span>
        </span>
      </div>
    `);

    // attach metadata
    clue_el.data({
      clue: clue,
      word: clue.word,
      number: clue.number,
      clues: clues_group.id,
    }).addClass(`cw-clue word-${clue.word} group-${clues_group.id}`);

    // restore any saved note
    const clueNote = notes.get(clue.word);
    if (clueNote !== undefined) {
      clue_el.find('.cw-input').val(clueNote);
      clue_el.find('.cw-edit-container').show();
    }

    $items.append(clue_el);
  }

  // Set the group title
  if ($title.length) $title.text(escape(clues_group.title));
  clues_group.clues_container = $items;

  // --- event listeners ---
  const save = () => this.saveGame();

  $items
    .on('mouseenter', '.cw-clue', function() {
      const $el = $(this);
      if ($el.find('.cw-input').val().trim().length === 0) {
        $el.find('.cw-cluenote-button').show();
      }
    })
    .on('mouseleave', '.cw-clue', function(event) {
      const $el = $(this);
      const relatedTarget = event.relatedTarget;
      const isInsideNote = $(relatedTarget).closest('.cw-edit-container').length > 0;
      if (!isInsideNote) $el.find('.cw-cluenote-button').hide();
    })
    .on('click', '.cw-cluenote-button', function(event) {
      event.stopPropagation();
      const $clue = $(this).closest('.cw-clue');
      $clue.find('.cw-edit-container').show().find('.cw-input').focus();
      $(this).hide();
    })
    .on('click', '.cw-input', function(event) {
      event.stopPropagation();
    })
    .on('blur', '.cw-input', function() {
      const $input = $(this);
      const $clue = $input.closest('.cw-clue');
      const wordId = $clue.data('word');
      const newText = $input.val().trim();

      setTimeout(() => {
        const newlyFocused = document.activeElement;
        if (newlyFocused?.classList.contains('cw-hidden-input')) return;

        if (newText.length > 0) {
          notes.set(wordId, newText);
        } else {
          $clue.find('.cw-edit-container').hide();
          notes.delete(wordId);
        }
        save();
      }, 10);
    })
    .on('keydown', '.cw-input', function(event) {
      if (event.key === 'Enter') $(this).blur();
    });
}

export function styleClues() {
  // Update all clues in the sidebar
  this.clues_holder.find('.cw-clue').each((i, el) => {
    const $el = $(el);
    const clue = $el.data('clue');
    this.updateClueAppearance(clue, $el);
  });
}

export function updateClueAppearance(clue, $el) {
  if (!clue) return;

  // Use provided $el or look it up in the DOM using unique identifying info
  const clueEl = $el || $(document).find(`.cw-clue.word-${clue.word}[data-number="${clue.number}"]`);

  // We specifically target the clue-text span to avoid graying out the clue number
  const textEl = clueEl.hasClass('cw-clue-text') ? clueEl : clueEl.find('.cw-clue-text');

  const groupId = clueEl.data('clues');
  const group = this.clueGroups.find(g => g.id === groupId);

  if (!this.config.gray_completed_clues && (!group || !group.isFake) && !this.fakeclues) {
    // Reset clue styling if the setting is turned off and this is not a fake clue context
    textEl.css({
      "text-decoration": "",
      "color": ""
    });
    return;
  }

  // Determine if it should be gray based on fakeclues context or word fill state
  let shouldGray = false;
  if (this.fakeclues || (group && group.isFake)) {
    shouldGray = Boolean(clue.fakeClueCompleted);
  } else if (clue.word && this.words[clue.word]) {
    shouldGray = this.words[clue.word].isFilled();
  }

  textEl.css({
    "text-decoration": "",
    "color": shouldGray ? "#aaa" : ""
  });
}
