# Convoy

Convoy is a shipment tracking prototype for an industrial manufacturer that ships from several sites, through several operators, by road and sea. It gives customers one honest answer to "when does it arrive?" and gives ops a short list of what needs attention today.

Everything runs on mocked data with simulated AI and no backend. The write-up is in [`docs/write-up.md`](docs/write-up.md) and [`docs/write-up.pdf`](docs/write-up.pdf).

## Run it

Node 22.

```bash
npm install
npm run dev
```

Open the URL Vite prints. `npm run lint` and `npm run build` both pass. Fonts and icons are bundled, so it works offline.

The app has a fixed "now": 13 Oct 2026, 14:30, Europe/Madrid. Reloading the page resets all data.

## Demo script (about 10 minutes)

The "Viewing as" switcher in the top bar changes role. "Demo controls" sits next to it.

### Customer (3 to 4 minutes)

1. Start as the customer (Nordvik Subsidiary). The list shows six shipments, the ones needing attention first.
2. Open order 12345. Read the route timeline: road, sea, Norwegian import customs and road again, each leg from a different operator. Solid lines are confirmed by an operator, dashed and hatched ones are not.
3. Look at the arrival card: an estimate with its confidence and the reason behind it. Check the documents list, where the invoice has not been sent yet.
4. Open Notifications from the top bar. Keep it in mind, it fills up later.

### Ops (5 to 6 minutes)

1. Switch to ops. Today opens with the daily summary, a few ranked next actions and the sites snapshot.
2. Open Exceptions. Order 12345 sits in a port incident group with two other shipments. Click "Draft notice to customer" on 12345, read the drafted message, edit a word, then "Send notice to customer".
3. Switch back to the customer. The banner on order 12345 changes from the earlier "documents lodged" update to the new delay notice, and Notifications has a new item with an unread count in the nav.
4. Switch to ops again. In Portfolio, click the suggestion "shipments to France this week running late" (or type it). Three interpreted chips appear and the table narrows to one row. Remove the window chip and a second French shipment comes back.
5. Type "purple unicorn". Convoy says it could not read the search and keeps the table as it was. Then type "20311": no match, and nothing leaks about hidden shipments.
6. Clear the search and open order 12345 from the portfolio. The raw operator feed ("Gate-in", "Deklarasjon mottatt", "OUT_FOR_DELIVERY") sits beside the normalised milestones. Hover a row to light up the same event in the timeline. The right rail explains the risk score.
7. Open "Demo controls" and choose "Simulate new event". A toast appears and the timeline extends. The estimate stays but its reason changes. Customer view shows the same event.
8. On the detail page, use "Send document" on the invoice. The dialog says who receives it and how (Fjordklar Customs, the Norwegian import broker, by email) and names the attached file. Confirm. The customer then sees "Sent to Fjordklar Customs on 13 Oct, 14:30 by email".
9. "Demo controls" then "Reset demo data" brings everything back.

## What is simulated

All "AI" lives in `src/ai/` as plain deterministic functions: risk scoring, arrival estimates, the daily summary, the search parser and notice drafting. The store only holds facts (operator events, the plan, what ops did) and those functions derive everything else. Search understands a fixed set of phrases. Only one live event is scripted.

## Known limits

No automated tests, no backend, no auth, one scripted live event, canned search. The write-up explains the cut and what comes next.

## AI coding tools

I used AI coding tools (Claude Code) to build this, as the brief expects. I made the product and scope decisions and reviewed the code. The write-up covers it too.
