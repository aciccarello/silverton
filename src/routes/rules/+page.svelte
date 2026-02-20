<svelte:head>
  <title>Silverton Rules</title>
  <meta name="description" content="Helpful game rules and setup for Silverton" />
</svelte:head>

<div class="card animate-entrance">
  <h2>Official Resources</h2>
  <ul>
    <li><a href="https://board-game-rules.com/wp-content/uploads/2025/01/silverton_Official-Rules.pdf" target="_blank" rel="noopener noreferrer">Silverton Official Rules PDF</a></li>
    <li><a href="https://boardgamegeek.com/boardgame/511/silverton" target="_blank" rel="noopener noreferrer">BoardGameGeek: Silverton (1990)</a></li>
  </ul>
  <h2>Game Setup</h2>
  <ul>
    <li>Shuffle claims, deal 8 face up</li>
    <li>Shuffle each sub-deck of passenger contracts. Deal 8 "C" cards face down, 8 "B" cards face down on top of them, 8 "A" cards face UP on top of them</li>
    <li>Shuffle turn orders, deal these out. This determines where each person starts from, based on the first page in the manual</li>
    <li>Grab 5 small bowls to help manage all the resource chips</li>
    <li>Each player grabs a color bag and goes through Starting Steps on the left</li>
    <li>The first page in the manual also details which surveyors and prospectors each player gets, based on their turn orders. The rest go back into their bag</li>
  </ul>

  <h2>Helpful Game Notes</h2>
  <ul>
    <li>The first time operating a claim you only roll one dice and add 6</li>
    <li>You can prospect the deck. Draw one card for each prospector, then place face up with other claims if you don't want to purchase</li>
    <li>Only replenish claims when less than 8 visible, but prospecting the deck will replenish automatically too</li>
    <li>When purchasing 2 subsequent segments, you have to roll 2 dice to see if you get the second one. If you roll less than the length of the segment, you do not get it and your surveyor returns to your hand (only relevant to &lt;= 4 people)</li>
    <li>You can only purchase a passenger contract if you already own a route that connects the cities. You can't still be surveying the routes</li>
    <li>During winter you cannot survey winter segment</li>
    <li>During winter you cannot survey 2 subsequent segments (only relevant to &lt;= 4 people)</li>
    <li>During winter you cannot purchase a passenger contract if your route has a winter segment</li>
    <li>During winter you can't deliver resources if route between claim and port city is white</li>
    <li>You survey a route, and you prospect a mine or a contract</li>
  </ul>

  <h2>House Rules</h2>
  <ul>
    <li>Consider adding a new claim each turn and ignoring the 8 card rule</li>
    <li>Consider voting each turn to remove certain claim cards (and then roll a dice to remove them) (or vote every winter)</li>
  </ul>
</div>

<style>
  h2 {
    margin-top: var(--spacing-lg);
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 4px;
  }

  h2:first-of-type {
    margin-top: 0;
  }

  ul {
    padding-left: var(--spacing-lg);
    margin-bottom: var(--spacing-md);
  }

  li {
    margin-bottom: var(--spacing-sm);
    color: var(--color-text-secondary);
  }
</style>
