<svelte:head>
  <title>Silverton Rules</title>
  <meta name="description" content="Helpful game rules and setup for Silverton" />
</svelte:head>

<div class="card animate-entrance">
  <h2>Game Overview</h2>
  <p>
	Set in the historic mining areas of Colorado, New Mexico, and Utah, Silverton is a game of railroading, mining, and commodity market manipulation.
	Use your surveyor to plot your railroads and your prospector to find your mines.
	Operate your empire of mines and railroads to position your gold, silver, and other commodities in the right market and at the right time to reap maximum profit.
  </p>
  <h2>Official Resources</h2>
  <ul>
    <li><a href="https://board-game-rules.com/wp-content/uploads/2025/01/silverton_Official-Rules.pdf" target="_blank" rel="noopener noreferrer">Silverton Official Rules PDF</a></li>
    <li><a href="https://boardgamegeek.com/boardgame/511/silverton" target="_blank" rel="noopener noreferrer">BoardGameGeek: Silverton (1990)</a></li>
    <li><a href="https://docs.google.com/spreadsheets/d/1-3tTmVOYEiv-pRnBoSkhal4yXAGd41lmZclD9r9ok6Y/edit?usp=sharing" target="_blank" rel="noopener noreferrer">Isaac's Spreadsheet</a></li>
  </ul>
  <h2>Game Setup</h2>
  <ul>
    <li>Shuffle claims, deal 8 face up</li>
    <li>Shuffle each sub-deck of passenger contracts. Deal 8 "C" cards face down, 8 "B" cards face down on top of them, 8 "A" cards face UP on top of them</li>
    <li>Place the resource chips in 5 small bowls</li>
    <li>Each player selects a color bag</li>
    <li>Once the game starting order has been assigned, each player should locate the surveyors and prospectors assigned to their position. The rest go back into their bag</li>
  </ul>

  <h2>Helpful Game Highlights</h2>
  <p>
	If you've played before, it may be helpful to remember these more unique rules.
  </p>
  <ul>
    <li>You survey a route, and you prospect a mine or a contract</li>
    <li>The first time operating a claim you only roll one dice and add 6</li>
    <li>You can prospect the deck. Draw one card for each prospector, then place face up with other claims if you don't want to purchase</li>
    <li>Only replenish claims when less than 8 visible, but prospecting the deck will replenish automatically too</li>
    <li>When purchasing 2 subsequent segments, you have to roll 2 dice to see if you get the second one. If you roll less than the length of the segment, you do not get it and your surveyor returns to your hand (only relevant to &lt;= 4 people)</li>
    <li>You can only purchase a passenger contract if you already own a route that connects the cities. You can't still be surveying the routes</li>
	<li>If you lose any segment of a passenger route, you must make the contract available for others to purchase (in a separate pile)</li>
	<li>You can only deliver and sell loads from two claims in a single turn</li>
    <li>During winter you cannot:</li>
	  <ul>
		<li>Survey winter segments</li>
		<li>Survey 2 subsequent segments (only relevant to &lt;= 4 people)</li>
		<li>Purchase a passenger contract if your route has a winter segment</li>
		<li>Deliver resources if route between claim and port city is white</li>
	  </ul>
  </ul>

  <h2>House Rules</h2>
  <ul>
    <li>Consider adding a new claim each turn and ignoring the 8 card rule</li>
    <li>Consider voting each turn to remove certain claim cards (and then roll a dice to remove them or vote every winter)</li>
	<li>Consider (mostly) ignoring turn order and allow players to play simultaneously per phase to speed up the game</li>
  </ul>

  <h2 id="game-turn-sequence">Game Turn Sequence</h2>
  <p>
	Each turn in Silverton corresponds to a season.
	During a season all the players have a chance to expand their mining empire.
	This takes place via seven phases.
  </p>

  <h3>I. Deal Turn Order Cards</h3>
  <p>
	This step determines the order players play the following steps.
	In this app the turn order is established automatically at the start of each turn and is visible on each player's dashboard under the list of players.
  </p>

  <h3>II. Place Prospectors and Surveyors</h3>
  <p>
	Make a bid for the tracks, claims, and contracts you want.
	Officially, this should occur in the order established at the start of the turn in case the previous player's decision impacts your choice.
  </p>
  <p>
	<strong>When you finish this phase, click the "I'm Done Prospecting" button to indicate to others that you are done.</strong>
  </p>

  <h4>Surveyors</h4>
  <p>
	Place your surveyor on the track you want to build.
	It must be connected to an existing track you own.
	Typically, you will want to focus on tracks that will help you deliver from your claims or where you can operate passenger rail.
  </p>
  <p>
	You may also choose to use your surveyor to dismantle a track you own.
	The bank pays $10 times the distance of the segment.
  </p>

  <h4>Prospectors</h4>
  <p>
	You may place your prospector on any of the following:
  </p>
  <ul>
    <li>Claims</li>
    <li>Unsold passenger contracts</li>
    <li>Someone else's passenger contracts</li>
    <li>The claims deck</li>
  </ul>
  <p>
	You can prospect any claim, but be aware you can't sell the resources until you have the track to deliver.
	This means that players typically only purchase claims withing a small radius from their home city.
  </p>
  <p>
	To prospect passenger rail contracts, you must have built all the associated tracks.
	To steal a passenger rail contract, you must have a shorter route than the current owner and win the dispute process.
  </p>
  <p>
	If you don't see any claims or contracts you want to purchase, you man prospect the deck.
	See step IV.1, for how prospecting the deck is completed and to learn about event cards.
  </p>

  <h3>III. Resolve Disputes</h3>
  <p>While they do not occur every turn, sometimes two players prospect or survey the same resource and the conflict needs to be resolved. During this phase, players will roll dice to determine who wins. Be aware that disputes involve risk for all players. The specific process depends on the type of disupte.</p>

  <h4>General Process</h4>
  <p>Most disputes share the same general process:</p>
  <ol>
    <li>Each involved player rolls two dice and adds the bonus (+1 or +2) indicated on their specific piece.</li>
    <li>The player with the highest total wins the resource.</li>
    <li>If the result is a tie, the pieces remain in place until the next turn, at which point they can be moved or the players can compete again.</li>
    <li>All losing pieces are returned to their owners and cannot take any further actions for the rest of the turn.</li>
  </ol>

  <h4>Surveyor Parallel Route Rule</h4>
  <p>The surveyor dispute follows the general process, but can be avoided if the segment has an identical parallel option (same cities and cost).</p>

  <h4>Prospector Claim Bonus</h4>
  <p>A player receives an additional <strong>+3 bonus</strong> if they already have a track connecting their home city to the city listed on the claim card.</p>

  <h4>Prospector Passenger Card Dispute</h4>
  <p>A player with a shorter route receives a bonus equal to the difference in distance between their route and their opponent's route.</p>

  <h4>Stealing Passenger Routes</h4>
  <p>A player attempting to "steal" a route must pay the purchase price to the bank first. Both players roll two dice, and the player with the shorter route adds the distance difference to their roll. If the challenger's total is higher, they take the card.</p>

  <h4>Special Disputes</h4>
  <p>If two players place surveyors on different segments that would eventually make one player's route useless (e.g., two routes funneling into a single city where only one can exit), either player may call for a dispute roll to determine who gets to proceed.</p>

  <h4>The "Jail" Rule</h4>
  <p>In any dispute roll (Surveyor or Prospector), if a player rolls a <strong>natural "2"</strong> (snake eyes) before any bonuses are added, their piece is immediately sent to <strong>Jail</strong>. The results of the dispute are still determined based on that roll before the piece is arrested.</p>

  <h3>IV. Construction and Operation</h3>
  <p>
    This is the phase where you will build your railroad and operate your mines.
    Officially, the first player should complete all 7 steps before the next player starts.
  </p>
  <p>
	<strong>When you finish this phase, click the "I'm Done Operating" button to save your balance adjustment and indicate to others that you are done.</strong>
  </p>
  <h4>1. Buy Claims/Contracts</h4>
  <p>
    During this step, you can complete the purchase of any claims or contracts your prospector is on and pay the bank its cost.
	You are not required to purchase claims and contracts you prospected, so you can decide to decline a purchase.
	If you prospected the deck, this is when you would turn the top card face up and decide if you want to purchase the claim.
	If you drew an event card, it take effect immediately.
  </p>

  <h4>2. Build Track</h4>
  <p>
    In this step, you pay the bank the cost of the track your surveyor is on, as indicated in the number in the box of the track.
	When purchased, you place a colored box on the track box.
	If you have two surveyors and are building two consecutive tracks, roll two die.
	If the roll is greater than the distance of the second track segment, you are allowed to build.
  </p>
  <p>
	If you run out of track segments you can remove another segment from the board, and it is considered abandoned (no money is received from the bank).
	If you placed your surveyor on an existing track segment you have, you receive $10 times the distance of the segment from the bank.
  </p>

  <h4>3. Operate Claims</h4>
  <p>
    In this step, you decide which claims you want to operate.
	Each claim has an associated cost with operating.
	To operate, roll two dice.
	The sum will correspond with a number of resources received.
	The first time you operate a mine, you automatically get a 6 for the first die, so only one roll is needed.
  </p>
  <p>
	If your total is too low, your mine can become depleted.
	You will no longer be able to operate it in the future.
	If the claim has previously produced freight, use a "Depleted" marker to indicate that is is inoperable.
	After all freight is delivered, the card can be moved to the discard pile.
  </p>

  <h4>4. Make Deals</h4>
  <p>
    Players may make trades or deals with other players.
	They may choose to make deals for claims, track segments, or freight.
	Freight on other player's claims may be bought if it can and will be delivered this turn.
	This means all track requirements and delivery limits apply.
  </p>

  <h4>5. Collect Passenger Revenue</h4>
  <p>
	This is the step where you would operate your passenger contracts.
	Each contract indicates how much it pays per turn.
	Be aware that some contracts have discard conditions such as a certain number of mine depletions.
	You also may not operate passenger routes over white segments during winter turns.
  </p>

  <h4>6. Deliver Loads</h4>
  <p>
	This is the step where you would move your resources from your claims to the market to sell.
	Note that you can only sell freight from 2 claims per turn and markets may have a cap on how much can be sold per player per turn.
	You also may not deliver loads over white segments during winter turns.
  </p>

  <h4>7. Pay Fines</h4>
  <p>
	Event cards from prospecting the deck may involve paying fines.
	This is the step when you would pay the amount indicated.
	This is also when you would work on getting a prospector or surveyor out of jail.
  </p>

  <h3>V. Roll For Price Changes</h3>
  <p>
    After all the goods have been delivered, roll dice to see how the market changes for next turn.
  </p>

  <h3>VI. Replenish Cards</h3>
  <p>
    If there are less than 8 available claim cards, turn over more cards till the total is 8.
	If an event card is found, shuffle it back into the deck.
	If any passenger contract cards were taken, turn over the cards that were underneath.
  </p>

  <h3>VII. Advance Game Turn Marker</h3>
  <p>
	Update the game turn to change the season.
	<strong>When everyone is ready, one player should click the "Next Turn" button towards the bottom of the page to change the phase and shuffle the turn order for the next round.</strong>
  </p>

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

  ul, ol {
    padding-left: var(--spacing-lg);
    margin-bottom: var(--spacing-md);
  }

  li {
    margin-bottom: var(--spacing-sm);
  }
</style>
