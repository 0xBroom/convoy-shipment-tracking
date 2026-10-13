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

The "Viewing as" switcher in the top bar changes role. "Demo controls" sits next to it, and "Last updated" shows the demo-clock time of the last operator event.

### Customer (3 to 4 minutes)

1. Start as the customer (Nordvik Subsidiary). The list shows six shipments, the ones needing attention first.
2. Open order 12345. Nordvik receives in Norway, outside the EU customs union, so the route runs road, sea, Norwegian import customs at Oslo and road again, each leg from a different operator. The legend under the route reads "Confirmed by operator", "Planned" and "Moved by Convoy estimate".
3. Look at the arrival card: an estimate with its confidence and the reason behind it. In the documents list the invoice is "Not sent"; click "Download" on the packing list to get a one-page PDF generated in the browser.
4. Open Notifications from the top bar. Keep it in mind, it fills up later.

### Ops (5 to 6 minutes)

1. Switch to ops. Today opens with the daily summary, ranked "Next actions" and "Your sites".
2. Open Exceptions. Order 12345 sits in the "Sailings rolled at Tarragona" incident group with two other shipments. Click "Draft notice to customer" on 12345, read the drafted message, edit a word, then "Send notice to customer".
3. Still in Exceptions, click "Draft notice to customer" on order 12471 (Rhone Industries, Marseille). The draft is in French because the account language is French; the dialog says so and offers "Write in English instead". Cancel.
4. Switch back to the customer. The banner on order 12345 changes from the earlier import-declaration update to the new delay notice, and Notifications has a new item with an unread count in the nav.
5. Switch to ops again. In Portfolio, click the suggestion "shipments to France this week running late" (or type it). Three interpreted chips appear and the table narrows to one row. Remove the window chip and a second French shipment comes back.
6. Type "purple unicorn". Convoy says it could not read the search and keeps the table as it was. Then type "20311": no match, and nothing leaks about hidden shipments.
7. Clear the search and open order 12345 from the portfolio. The raw operator feed ("Gate-in", "Deklarasjon mottatt", "OUT_FOR_DELIVERY") sits beside the normalised milestones. Hover a row to light up the same event in the timeline. The right rail explains the risk score.
8. Open "Demo controls" and choose "Start live feed". Seven operator events land, one every four seconds, each with a toast that links to its order; the panel counts "Event n of 7" and the button becomes "Pause live feed", then "Resume live feed". Order 12345 leaves the vessel, the Gdansk hold on 12439 is released, the stale feed on 12377 wakes up, Norwegian customs stop 12345 and clear it again, Nordhaul posts its own ETA on 12466 (the arrival card switches to "Operator ETA" and the Convoy estimate moves to "ETA history") and 12420 is delivered. "Last updated" in the top bar follows the demo clock. The customer view shows the same events.
9. On the detail page, use "Send document" on the invoice. The dialog says who receives it and how (Fjordklar Customs, the Norwegian import broker, by email), lists the ERP file as the attachment and lets you attach another. Confirm. The customer then sees "Sent to Fjordklar Customs" with the time and channel, and can download it.
10. "Demo controls" then "Reset demo data" brings everything back.

## What is simulated

All "AI" lives in `src/ai/` as plain deterministic functions: risk scoring, arrival estimates, the daily summary, the search parser and message drafting in English and French. The store only holds facts (operator events, the plan, what ops did) and those functions derive everything else. Search understands a fixed set of phrases. The live feed is a script of seven events stamped on the demo clock. Downloaded documents are synthetic PDFs written in the browser.

## Known limits

No automated tests, no backend, no auth, a scripted live feed, canned search, drafts in two languages. The write-up explains the cut and what comes next.

## AI coding tools

I used AI coding tools (Claude Code) to build this, as the brief expects. I made the product and scope decisions and reviewed the code. The write-up covers it too.
