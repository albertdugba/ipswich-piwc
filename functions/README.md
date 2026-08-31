# Celebration messages

A scheduled Cloud Function that texts members on their birthday and wedding
anniversary. It shares its date and eligibility logic with the app by importing
`src/domain/celebration.ts` directly, so the register on screen and the messages
that go out can never disagree.

## Safety model

Nothing sends until **both** switches are set. This is deliberate — the default
state of a fresh deploy is silent.

| Variable          | Default         | Effect                                             |
| ----------------- | --------------- | -------------------------------------------------- |
| `SMS_ENABLED`     | `false`         | Master switch. Anything but `"true"` sends nothing |
| `SMS_DRY_RUN`     | `true`          | Anything but `"false"` logs instead of sending     |
| `SMS_TEST_NUMBER` | unset           | Diverts every message to one number                |
| `SMS_MAX_PER_RUN` | `50`            | Hard cap per run                                   |
| `SMS_TIMEZONE`    | `Europe/London` | Decides what "today" is                            |

Nobody is messaged if they are `DECEASED`, inactive, have `smsOptOut` set, have
no dialable number, or have already been greeted today — including manually in
the app.

Wedding anniversaries only go to members whose `maritalStatus` is `MARRIED`.
`WIDOWED` and `DIVORCED` members keep a `marriageDate` on record and must never
be greeted on it.

## How duplicates are prevented

Before sending, the run calls `create()` on `celebrationGreetings/{personId}__{kind}__{year}`.
`create` fails if the document exists, so a retried, overlapping or
manually-triggered run cannot send twice. The same key is what the app writes
when a leader taps "Mark greeted", so the two paths block each other.

If the send does not happen the claim is released, because a greeting record
that nobody received is worse than no record at all. Permanent failures (Twilio
4xx — bad number, blocked recipient) are also released so the row reappears as
ungreeted for a leader to handle. Ambiguous failures keep the claim, since the
message may have reached the carrier.

## Setup

```sh
npm --prefix functions install

firebase functions:secrets:set TWILIO_ACCOUNT_SID
firebase functions:secrets:set TWILIO_AUTH_TOKEN
firebase functions:secrets:set TWILIO_FROM

npm --prefix functions run deploy
```

## Going live

1. Deploy with the defaults. Nothing sends.
2. Call `previewCelebrationMessages` (signed in) to see exactly who would be
   texted today and with what wording.
3. Set `SMS_TEST_NUMBER` to your own phone, `SMS_ENABLED=true`,
   `SMS_DRY_RUN=false`. Every message now arrives at your handset.
4. Once the wording and the recipient list look right, clear `SMS_TEST_NUMBER`.

## Before real sending — data protection

These are automated messages to personal phone numbers, so PECR and UK GDPR
apply. Two things need to be true before step 4:

- Members have been told the church will text them on their birthday and
  anniversary, and how to stop it.
- `smsOptOut` is honoured. It is enforced in code, but somebody has to actually
  tick it when a member asks.

The `smsDeliveries` collection stores phone numbers and full message bodies. It
is written by the Admin SDK and must stay unreadable from the browser.
