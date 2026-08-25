TOP DAILY BUILDERS — VALUE SCANNER v19

Adds a new 💰 Value tab to the existing app.

WHAT IT DOES
- Pulls fixtures by DATE instead of relying on a hard-coded fixture list.
- Prioritises major leagues and cups: Premier League, Championship, LaLiga, Bundesliga, Serie A, Ligue 1, Champions League, Europa League, Conference League, FA Cup, EFL Cup, Eredivisie, Primeira Liga, Scottish Premiership, Liga MX, Libertadores, Sudamericana, MLS, Brazil, Argentina, Colombia, Saudi Pro League, J1 League and more.
- Filters the value scan to those major competitions, so youth/reserve matches do not take over the results.
- Retrieves the latest completed team fixtures and available match statistics.
- Uses a Poisson probability model for goals, corners, cards and shots on target where enough source data exists.
- Shows model probability and fair odds.
- A bet is only labelled VALUE after a bookmaker price is entered and the model EV meets the minimum EV setting.

IMPORTANT
The model is a starting quantitative model, not proof of profitable value. It needs backtesting/calibration before you should trust the probabilities with real money. Missing competition statistics are not invented.

NETLIFY SETUP
1. Upload/deploy this folder.
2. Netlify will use netlify/functions/football.js.
3. In Netlify: Site configuration -> Environment variables -> Add variable.
4. Name: API_FOOTBALL_KEY
5. Value: your API-Football key.
6. Redeploy.

The API key is deliberately NOT embedded in the browser code.

API-FOOTBALL PLAN
The function first tries team fixtures with last=5. If the Free plan rejects that parameter, it falls back to a 120-day team date range and takes the five latest completed matches. Free plans still have limited season/data access, so some current major competitions may require a paid plan.
