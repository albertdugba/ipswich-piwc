# Public site photos

The public site is a single page. Which photo goes where is set in
`src/features/public/content.ts` (`heroSlides`, `gallery`,
`transformationHour.image`) — add a file here, then point to it there.

Recommended: landscape photos for the hero banner (~1600–2400px wide); the
banner crops to a wide card, so set each slide's `position` to keep faces in
frame. Optimise to WebP or JPG under ~400 KB each.

| File                          | Where it appears                               |
| ----------------------------- | ---------------------------------------------- |
| hero.jpg                      | Hero banner — "Outreach" slide (Cornhill)      |
| community.jpg                 | Hero banner — "Youth" slide; gallery           |
| gallery/\*.webp               | Hero banner slides and the welcome photo strip |
| transformation-hour.webp      | Transformation Hour card (the official flyer)  |

`gallery/` photos are 1080p stills taken from the church's own TikTok videos.

Content (service times, address, social links, values, slide text) is edited
in `src/features/public/content.ts` — no code changes needed.
