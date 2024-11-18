/* Auxiliary functions for the solve tracker */

// list of sources that are easy to identify
const SOURCES = ['NY Times', 'LA Times', 'USA Today', "Jonesin'",
  "Universal", "Universal Sunday", "AVCX", "Newsday", "Boston Globe",
  "The Atlantic", "New Yorker", "MGWCC"
];

function metadataToSource(author, copyright) {
  if (copyright.includes('Matt Jones')) {
    return "Jonesin'";
  }
}

function solveInputs(display_minutes, display_seconds) {
  // HTML for inputs when a puzzle is completed

  let html = `
  <br /><br />
  <div class="custom-form">
    <!-- First Row: Puzzle Source and Puzzle Date -->
    <div class="form-row">
        <div>
            <label for="sourceInput">Puzzle Source:</label>
            <input type="text" id="sourceInput" list="puzzle-sources">
        </div>
        <div>
            <label for="datepicker">Puzzle Date:</label>
            <input type="date" id="datepicker">
        </div>
    </div>

    <!-- Second Row: Solve Minutes and Solve Seconds -->
    <div class="form-row">
        <div>
            <label for="solveminutes">Solve Minutes:</label>
            <input type="number" id="solveminutes" min="0" value="${display_minutes}">
        </div>
        <div>
            <label for="solveseconds">Solve Seconds:</label>
            <input type="number" id="solveseconds" min="0" max="59" value="${display_seconds}">
        </div>
    </div>
</div>
  `;
  return html;

}
