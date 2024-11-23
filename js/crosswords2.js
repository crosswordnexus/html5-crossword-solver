/* Auxiliary functions for the solve tracker */

// list of sources that are easy to identify
const SOURCES = ['New York Times', 'LA Times', 'USA Today', "Jonesin'",
  "Universal", "Universal Sunday", "AVCX", "Newsday", "Boston Globe",
  "The Atlantic", "New Yorker", "MGWCC", "BEQ", "Crossword Nexus", "WSJ",
  "Washington Post", "Club 72"
];

function metadataToSourceDate(jsxw) {
  if (jsxw.config.source && jsxw.config.date) {
    return {source: jsxw.config.source, date: jsxw.config.date};
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

/** Write data to DB when the submit button is clicked **/
function sendData() {
  // Data to be sent to the server
  // get solve time first
  const solveMinutes = parseInt(document.getElementById('solveminutes').value);
  const solveSeconds = parseInt(document.getElementById('solveseconds').value);
  const totalSeconds = solveMinutes * 60 + solveSeconds;
  // next is source and puzzle date
  const source = document.getElementById('sourceInput').value.trim();
  const puzzleDate = document.getElementById('datepicker').value.trim();
  const data = { source: source, puzzle_date: puzzleDate, solve_time_seconds: totalSeconds };

  // Validate form fields
  if (!source || !puzzleDate) {
      showFeedback('Source and puzzle date cannot be empty', 'error');
      return; // Stop the fetch call
  }

  // Call the PHP/Python script
  fetch('../insert_data.php', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(result => {
      console.log(result);
      showFeedback('Solve successfully logged!', 'success');
      // At this point, we need to let the user know it was successful
  })
  .catch(error => {
      console.error('Error:', error);
      showFeedback('An unexpected error occurred.', 'error');
  });
}

// function to show status of the submitted solve
function showFeedback(message, type) {
    const feedback = document.getElementById('feedbackMessage');
    feedback.textContent = message;
    feedback.className = type; // Apply "success" or "error" class
    feedback.style.display = 'block';

    // Fade out after 3 seconds
    setTimeout(() => {
        feedback.style.opacity = '1'; // Ensure it's fully visible before starting the fade
        feedback.style.transition = 'opacity 1s';
        feedback.style.opacity = '0';

        // Remove after fading out
        setTimeout(() => {
            feedback.style.display = 'none';
            feedback.style.opacity = '1'; // Reset opacity for next use
        }, 1000); // Matches the fade-out duration
    }, 3000); // Delay before fading out
}
