# lickilicky

[![CircleCI](https://circleci.com/gh/tongrhj/lickilicky.svg?style=svg)](https://circleci.com/gh/tongrhj/lickilicky) [![DeepScan grade](https://deepscan.io/api/teams/3580/projects/5330/branches/40882/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=3580&pid=5330&bid=40882)

Easy to reference list of merchants offering 1-for-1 F&B deals in Singapore

Will allow for tracking over time in case merchants are added/removed without informing subscribers (rude!)

## Running the script

```
npm run build
```

- `npm run data`: Retrieves the latest merchant data and compares it with the existing data to build the diff
  - `tsc`: compiles to `/output` as JavaScript
  - Generates its output as `dist/venues.min.json` for frontend (`index.html`) to consume
  - Sends notifications to Telegram with the diff formatted for chat
- `npm run frontend`: Copies relevant frontend files to `dist` folder

## Feel good food feed

- Subscribe for updates at [Telegram Channel Burpple Beyond Updates](https://t.me/burpplebeyond)
  - Updates published every weekday, 9am SGT
  - I know you're busy and need to focus. Notifications are disabled by default.

## Maintainers

- [Jared Tong](https://jaredtong.com/burpple-beyond/)

## Disclaimer

lickilicky is not affiliated with any of the establishments listed or the source of the data in any way.
