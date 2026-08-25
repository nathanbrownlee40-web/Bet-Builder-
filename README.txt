TOP DAILY BUILDERS — VALUE SCANNER v22

WHAT CHANGED
- Fixed the regression where the Value screen found fixtures but produced only “Data error” rows or no model markets.
- Bookmaker odds are no longer required for a scan. The scanner shows model probability + fair odds first. You can compare those fair odds with your bookmaker yourself.
- Added a server-side account-plan check so the app does not waste requests trying blocked seasons on the free plan.
- Free plan: historical form is taken from the latest supported 2024 season. Paid plans: the current season is used.
- Historical fixture statistics are fetched in batches of up to 20 fixture IDs, reducing API calls compared with one statistics request per match.
- Goals, corners, cards and shots on target are modelled where the source data exists. Missing statistics are left missing rather than invented.
- The scan now keeps the fixture list visible even when a particular market cannot be modelled.
- Results show probability, fair odds, sample size and the form season used.

HOW THE VALUE CHECK WORKS
1. The app finds the major-league/cup fixtures for the selected date.
2. It collects historical completed matches for both teams.
3. It aggregates goals and available corners/cards/shots-on-target statistics.
4. A Poisson model converts the combined averages into probabilities for the supported over markets.
5. Fair odds are calculated as 1 / model probability.
6. You then check the exact same market at your bookmaker. If the bookmaker price is higher than the model fair odds, it is a potential value price. That is not a guarantee of profit; the model needs backtesting/calibration.

NETLIFY SETUP
- Deploy this folder as the site root.
- Netlify function: netlify/functions/football.js
- Environment variable: API_FOOTBALL_KEY
- The key stays server-side in Netlify and is not embedded in the browser.

API-FOOTBALL PLAN NOTE
API-Football currently lists the free plan as 100 requests/day and 10 requests/minute, with restricted historical seasons. Paid plans have much larger quotas and deeper historical access. The app checks the plan server-side and chooses the form season accordingly.

IMPORTANT
This is a quantitative screening model, not proof that a bet is profitable. A fair price is only as good as the data and calibration behind the probability.
