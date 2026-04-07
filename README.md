# ExpoFinanceApp

ExpoFinanceApp is a lightweight personal expense tracker built with Expo and React Native. It is designed to work fully locally on the user's device or browser without requiring a backend or cloud sync.

Live web app: https://sharunodal.github.io/ExpoFinanceApp/

## What it does

- Track daily expenses with amount, currency, category, tags, note, and date
- View monthly summaries and spending graphs
- Filter expenses by date, category, tag, and currency
- Manage custom categories, tags, and currencies
- Store data locally only

## Privacy and storage

- The app is intended to be offline-first and local-only
- Web data is encrypted in the browser and requires a passphrase
- Mobile data stays on-device
- No external database is required for normal use

## How to use

1. Open the app on web or mobile
2. Add expenses from the `Add` screen
3. Review totals in `Summary`
4. Check spending trends in `Graph`
5. Use `Filter` to narrow down entries
6. Open `Settings` to manage categories, tags, currencies, and local data

## Development

Install dependencies:

```bash
npm install
```

Start the project:

```bash
npx expo start
```

## Notes

- The web version should be served over HTTPS, or on `localhost` during development
- Native encrypted storage uses platform-specific capabilities, so some features may require a development build instead of Expo Go
