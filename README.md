# lickilicky

[![CircleCI](https://circleci.com/gh/tongrhj/lickilicky.svg?style=svg)](https://circleci.com/gh/tongrhj/lickilicky) [![DeepScan grade](https://deepscan.io/api/teams/3580/projects/5330/branches/40882/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=3580&pid=5330&bid=40882)

Easy to reference list of merchants offering 1-for-1 F&B deals in Singapore

Will allow for tracking over time in case merchants are added/removed without informing subscribers (rude!)

Magic happens during `npm run build`:

- Copies relevant frontend files to `dist` folder
- Retrieves the latest merchant data and compares it with the existing data to build the diff
- Generates its output as `dist/venues.min.json` for frontend (`index.html`) to consume
- Sends a notification to Telegram with the diff formatted for chat

CircleCI is scheduled to run every weekday, 9am SGT

## Credits

lickilicky is not affiliated with any of the establishments listed or the source of the data in any way.

Forked from [Repokémon](https://github.com/cheeaun/repokemon)
