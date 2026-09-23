# وتد — Watad static theme

Static front-end theme for **وتد (watad.media)**. The whole thing is plain HTML, CSS and JavaScript: no framework and no build step. It's ready to be cut into Blade views.

- **Live preview:** https://imsemoo.github.io/watad-theme/
- **All pages:** https://imsemoo.github.io/watad-theme/pages.html

## Pages

| File | Page |
|---|---|
| `index.html` | الرئيسية |
| `article.html` | المقال (فصول، جداول ارقام، مراجع، يتبع القراءة) |
| `category.html` | القسم (سياسة): عنوان القسم كتصميم، مادة مختارة، ثم كل المواد بشكل القائمة المطلوب + ارقام صفحات |
| `search.html` | نتائج البحث: قائمة / شبكة / مضغوط + تصفية تعمل |
| `search-empty.html` | البحث بلا نتائج |
| `author.html` | صفحة الكاتب: صورة مفرغة على بلاطة الهوية، بطاقة نشر (عدد، توزيع الاقسام، ايقاع السنة شهرا بشهر)، كل المواد بتبويب وترتيب وصفحات تعمل، متابعة، كتاب القسم |
| `archive.html` | الارشيف «السجل»: تصفح بالتاريخ (سنة ثم شهر، مثل كانون الاول 2025)، شهور تفتح وتطوى، ارقام صفحات |
| `news.html` | خبر وتعليق: خط زمني قريب من شكل تويتر، والخبر يفتح في نافذة منبثقة (صفحته المفردة) |
| `writers.html` | كتاب وتد: كل الكتاب بصورهم |
| `about.html` | من نحن (النص الرسمي) |
| `404.html` | الصفحة غير موجودة |
| `pages.html` | فهرس الصفحات للعرض على العميل |

Open any file directly in the browser. The only external request is Google Fonts (El Messiri + Amiri).

## Structure

```
assets/
  css/watad.css      one stylesheet, sections numbered 1–32
  js/watad.js        vanilla JS, behaviour opt-in via data-attributes
  img/brand/         logo + the six identity marks (SVG)
  img/posts/         demo images (posters 9:16, covers 16:9)
  img/writers/       writers' cut-out portraits (placeholder.svg until the real ones arrive)
*.html               one file per template
```

## Layout system

- `.container` gives 1240px max width, with 24px side margins on small screens.
- `.l` is the main grid: **rail 160px + body**, with a 40px gutter.
- **The axis (المحور)** is a 1px line running down the middle of the gutter between rail and body. It's drawn once per page through `.axis-layer`, and each teal `.band` draws its own sand-coloured one. Nothing sits on the line.
- `.wedge` places one of the six brand marks centred on the axis. Put it inside `.rail`.
- Body splits: `.split` (600/400), `.split--rev`, `.split--even`, `.cols-3`, `.cols-4`.
- Breakpoints: **1199 / 1023 / 767**. Below 1024 the rail stacks above the body and the axis moves into the right margin.

## Design tokens (`:root`)

`--teal #0C4D5A` · `--sand #B9A779` · `--ink #282828` · `--grey #6E6E75` · `--mid #5F5F66` · `--hair #DDE0E0` · `--paper #F2F2F2`
Fonts: `--disp` (El Messiri: headlines + UI), `--body` (Amiri: reading text).

The brand grey `#818189` is used one step darker (`#6E6E75`) because dates and captions are 12px and need 4.5:1 on white and paper. For the same reason, quiet text on teal (`--on-dark-2`) is `#ABB9BB`. Sand is unchanged, so the sand index numerals (2.4:1 on white) and sand kickers on teal (4.0:1) are still below AA. That was a brand decision; if the client wants full AA, give those two a darker text-only sand.

## Content rules built into the CSS

- **Posters (9:16) are always shown whole**: `.poster` = `aspect-ratio:9/16`, no text over them.
- Covers (16:9) may crop: `.cover`, `.cover--wide`.
- No تشكيل, Western digits, no letter-spacing on Arabic, no shadows, gradients or rounded corners.
- A selected item is always underlined in sand (`.tab.is-active`, `.chip.is-active`, `.facet__opt.is-active`, `aria-current="page"`). On hover, the same line is drawn in from the start edge at half strength.
- Marks on a teal `.band` are always sand. The CSS recolours them, so a teal mark can't disappear on a band.

## Motion (CSS sections 18–19, JS sections 11–15)

One idea runs through all of it: the wedge (وتد) is driven into the axis, and a board (لوح) can be lifted off the wall. Everything else is quiet feedback.

- **Signature:** on load the axis draws itself down the first screen and the wedges on it drop into place. Wedges further down the page drop in as they scroll into view.
- **Boards:** a poster that is the first child of a `.story` inside a `.band` lifts off the wall on hover. It grows from its base, tilts toward the pointer, and a sand frame stands off it while the other boards in that band step back. This is mouse only and needs nothing in the markup. On white sections a poster shows only the frame. Posters are never cropped or zoomed.
- **Covers** (16:9) drift closer inside a fixed frame on hover.
- **عاجل (breaking news):** the headlines take turns. The current one is inked in reading direction while a sand line runs down its edge as its timer. When it hands over to the next, the sand wedge beside "عاجل" beats once. Hover or keyboard focus holds it, and it rests when it's off screen or the tab is hidden. On phones it's one slot that drops each headline in, with swipe, next and "1 من 5". Stepping through by hand stops it turning on its own.
- **Popups** rise from below while the teal veil fades in. In the خبر وتعليق popup, next and previous cross-fade the content in place.
- **Menu:** a teal curtain drops and the links land in order. **Search:** the overlay fades in and the field rises. Archive months open and close with their height, and a second click reverses from wherever the animation is.
- **Article (CSS 31, JS 23–29):**
  - **Arrival:** the title's words settle into place one after another, the epigraph's wedge is driven in, and the lead picture is lowered into its frame.
  - **While reading:** the page axis fills with sand down to where the reader is. Each chapter's rule draws from the start edge as its wedge is planted. The thesis and the closing line ink word by word with the scroll. The figures count up and the data-band bars grow.
  - **Tools:** the numbered citations show their source on hover or focus, and a click jumps to the source in the list, which flashes. Selecting a passage offers "quote on X" and "copy the quote" (with the title and address). The contents show the time left to read, and the head has share buttons.
  - A sand reading-progress line also runs along the top of the viewport, and the contents underline the chapter in view.
- **Between pages:** same-origin navigation cross-fades where the browser supports cross-document view transitions.
- **Reduced motion:** with `prefers-reduced-motion`, nothing moves. Colour, opacity and state changes stay.
- With JS off, everything is still visible. Nothing starts hidden unless the script has already taken charge of revealing it.

## Client requests (تعديلات على الموقع)

| Request | Where |
|---|---|
| Browse the archive by date, e.g. كانون الاول 2025 | `archive.html`: year tabs over a month grid (Levantine names with the international ones, counts), plus a month/year form. Both use `archive.html?y=2025&m=12`. The home page's archive form sends the same parameters. |
| Page numbers on every list | `.pager` on category, archive, search, the news timeline and the home archive bar: previous, 1 2 3 … last, next, and "الصفحة 1 من 17". Pages are `?page=N`. On phones it shrinks to previous / current / next. |
| Sections at the top, still visible while scrolling | The header is two rows. The brand row scrolls away and the sections row sticks to the top. Once it's stuck it also carries a small logo and the search / menu buttons. |
| Section titles as designed artwork, with no caption under them | `.secart` (CSS 20): a square per section on the home page and as the category page title. **The admin controls these**: when the designer's artwork is uploaded, output `<img src="…" alt="اسم القسم">` in place of `.secart__art`. The current squares are placeholders in the brand colours. |
| Articles inside a section in the client's format | `.alist` / `.aitem` (CSS 21): square picture at the start, then title, a two-line dek, and the writer with an avatar. |
| خبر وتعليق set apart, as a timeline, with a popup single page | `news.html` (CSS 22–23, JS 18): a timeline with day markers. Each post is the news in a line with the editor's comment under it. The headline opens the post in a popup, which has its own address (`news.html#n-3`), next/previous and arrow keys, and copy link / share on X. The home page's news items link to their popups. |
| The last six posts on X, on the home page | `.xside` (CSS 25) next to the news on the home page. In production, fill it from the X API or a cached feed. It's six items, newest first. |
| Writers with cut-out photos in the Watad look; six on the home page + "انقر للمزيد" + a popup with everyone + a separate list | `.writer` (CSS 24): the cut-out photo (transparent PNG) stands on a teal tile with the sand wedge behind. The home page shows six writers plus the "click for more" tile, which opens the popup (`#writers-modal`) with every writer. `writers.html` is the separate list. |

Still with the client: the designer's section artwork, the writers' cut-out photos (from Omar), the new text for من نحن / رؤيتنا / هويتنا ورسالتنا (the writers are rewriting it), and the X account feed.

## Components

| Class | Use |
|---|---|
| `article.story` + `a.stretched` | Any clickable unit. The link covers the whole unit, so the author link inside it still works and there are no nested `<a>`. |
| `.kicker` | القسم — النوع |
| `.byline` | Author (link) + `<time>` |
| `.rail-label` | Section label in the rail (`<b>` title + note + link). Use `<h2>` in place of `<b>` when the section has no other heading. |
| `.band` | Full-width teal section (has its own axis) |
| `.idx`, `.fg`, `.stat` | Numbered index row, figure row, big stat |
| `.facets` / `.facet__opt` | Filter rail |
| `.tabs`, `.chips`, `.pager`, `.btn`, `.btn--ghost`, `.link-accent`, `.social` | Controls |
| `.portrait` | Author photo 4:5. Replace the placeholder SVG with `<img>`. |
| `.secart.secart--{binaa,siyasa,wiki,nas,news}` | Section title artwork (square). Put the admin's `<img>` inside in place of `.secart__art`. |
| `.alist` > `article.story.aitem` | Section list item: `.aitem__thumb` (cover, poster or `--text`), `.aitem__title`, `.aitem__dek`, `.aitem__by` with `.avatar` |
| `.tl` > `.tl__day` / `li.tl__item[data-news]#n-…` > `.post` | Timeline post. `.post__more` (hidden) holds the full text and the related link the popup shows. |
| `.writer`, `.writer--card`, `.writer--more`, `.writers-row`, `.writers-list`, `.writers-grid` | Writers: portrait tile + name + field + count |
| `dialog.modal` | Popup (native dialog). A sheet from below on phones. |
| `.xside` > `.xfeed` > `.xpost` | X feed panel |
| `.nlist` > `.nitem` (`.nitem--lead`) | The خبر وتعليق items on the home page. Each has a picture, the place and time, the news line and the editor's comment, and opens its post in the timeline popup. Covers crop into the square, posters stay whole. |
| `.mread` | "الاكثر قراءة": a ranked list under the X panel, so the side column ends where the news column ends |
| `.wk` (`[data-wiki]`) | The ثورة ويكي register on the home page: `.wk-preview` (poster, or `.wk-card` built from the row), `.wk-years` year links, `.wk-search`, `.wk-table` rows `tr[data-year][data-img]` |
| `.wd-about`, `.wd-rec` | Home closing: the statement with the name's meaning and three ways in, then the archive on paper (years with their weight, a month jump, numbered pages) |
| `.site-footer` | Footer aligned to the rail. The axis runs on into it and ends on the base row's ground line with the sand quote-wedge (`.site-footer__end`). Columns: الاقسام / عن وتد / تصفح / تابع وتد, then © and "الى الاعلى". |
| `.arcal` | Archive calendar: `.arcal__years` tabs, `.arcal__grid[data-year-grid]`, `.arcal__m` months |

## JavaScript API (`data-*`)

| Attribute | Behaviour |
|---|---|
| `data-drawer`, `data-drawer-open`, `data-drawer-close` | Mobile menu |
| `data-search-overlay`, `data-search-open` | Search overlay (`/` shortcut, `Esc` closes) |
| `data-results` + `data-view-btn="list\|grid\|compact"` | Switch result views (kept in `?view=`) |
| `data-facets` + `data-facet="section" data-value="…"` on options, `data-item data-section data-type data-period` on items | Client-side filtering (demo). With real data, send the facets to the server as query params and drop the client filtering. |
| `data-result-count`, `data-filter-empty`, `data-facets-reset` | Counter, empty message, reset |
| `data-tabs="#list"` + `data-tab="…"` / `data-tab-item="…"` | Tabs that filter a list (author page) |
| `data-month` + `data-month-toggle` | Collapse / expand an archive month (animated height) |
| `data-toc` | Highlights the chapter currently in view, and adds the reading-progress line to the page |
| `data-query` | Fills `?q=` into the heading and the input |
| `data-follow` | Follow button state (demo) |
| `data-ticker` on `.ticker` | Breaking news: the headlines take turns. On phones it shows one at a time with swipe, next and "1 من 5". |
| `data-header` on `.site-header` | Adds `.is-stuck` once the brand row has scrolled away |
| `data-dialog-open="#id"`, `data-dialog-close` | Open / close a `dialog.modal` (a click on the veil closes it too) |
| `data-news-modal`, `data-news`, `data-news-open`, `data-news-prev/next` | The خبر وتعليق popup, filled from the post that was opened |
| `data-copy-link="#id"` | Copies this page's address with that anchor |
| `data-arcal`, `data-year`, `data-year-grid`, `data-key="2026-09"` on `.month` | Archive by date: switches the year and marks the month from `?y=&m=` |
| `data-archive-filter="section\|type"` + `data-value` on the archive chips | Filters the month rows by their kicker (`سياسة — تحليل`). Also reads `?section=&type=`, which is how "كل مداخل ثورة ويكي" links in. |
| `data-wiki`, `data-wiki-year` + `data-count`, `data-wiki-search`, `data-wiki-preview`, `data-wiki-count`, `data-wiki-empty`, `data-wiki-clear` | The ثورة ويكي register. The years filter it, and the search covers every year and treats أ/إ/آ, ة/ه and ى/ي as the same letter. The row under the pointer or keyboard focus shows in the preview. |
| `data-grow` | A block whose bars grow when it scrolls into view (the archive years at the home closing, the article's data band) |
| `data-axis-fill` on an `i.axis-fill` next to the page axis | The axis fills with sand to the reading position (article) |
| `data-count` | A figure that counts up from 0 when it comes into view. Screen readers get the final figure throughout. |
| `data-ink` on a plain-text paragraph | Inks word by word as it is read |
| `.cite > a[href="#src-N"]` + `li#src-N` in `.sources` | Citation with a source preview |
| `data-time-left` | Time left to read, inside the article contents |
| `data-share="x\|telegram"` | Share links, rebuilt from the page's address and title |
| `data-works` with `data-works-filter`, `data-works-sort`, `data-works-list` > `li[data-section][data-date]`, `data-works-pager`, `data-works-count` | The author's works. Filters by section, sorts newest or oldest, and shows 8 a page. The state lives in `?section=&sort=&page=`, and a sand line slides between the tabs. With real data, the server reads the same parameters. |

## Laravel / Blade

1. **Layout**: take everything between `<!-- @partial: header -->` and `<!-- @endpartial -->` into `resources/views/partials/header.blade.php`, and do the same for the footer. `<head>` + `<main class="page">` + the axis layer become `layouts/app.blade.php`. The static pages load the assets with `?v=13`. In Blade, use a version that changes with the file, e.g. `{{ asset('assets/css/watad.css') }}?v={{ filemtime(public_path('assets/css/watad.css')) }}`.
2. **Active nav**: add `aria-current="page"` to the current section link, e.g. `@if(request()->is('politics*')) aria-current="page" @endif`.
3. **Story component**: `<x-story :post="$post" variant="row" />` should output:
   ```html
   <article class="story">
     <img class="{{ $post->is_poster ? 'poster' : 'cover' }}" src="…" alt="{{ $post->title }}">
     <span class="kicker">{{ $post->section->name }} — {{ $post->type }}</span>
     <h3 class="story__title t-s">{{ $post->title }}</h3>
     <div class="byline"><a href="{{ route('authors.show',$post->author) }}"><b>{{ $post->author->name }}</b></a><time datetime="{{ $post->published_at->toDateString() }}">…</time></div>
     <a class="stretched" href="{{ route('posts.show',$post) }}" aria-label="{{ $post->title }}"></a>
   </article>
   ```
4. Suggested fields: `title, excerpt, body, section_id, type, author_id, published_at, image, image_ratio (poster|cover), reading_minutes`, plus `sources` as a JSON array and `chapters` generated from the body's `h2` elements.
5. **Search**: the form is `GET search?q=`. Facets should become query params (`?section=&type=&period=`) and the counts should come from the query.
6. **Archive**: `archive.html?y=&m=` should render that month server-side, and the month grid's counts come from a `GROUP BY year, month`. You can load a collapsed month's items on demand, for example with `fetch('/archive/2026/07')` into `.month__body`.
7. **خبر وتعليق**: posts are a separate type (news line, editor's comment, place, time, related article). The timeline is `news?page=`, and each post also needs its own URL (`news/{id}`) that renders the same popup content as a page for sharing and search engines.
8. **Section artwork**: add an image field to sections (square, SVG or PNG at least 800×800). Output it inside `.secart`, falling back to the text placeholder when it's empty.
9. **Writers**: add a `photo_cutout` (transparent PNG, portrait, at least 800×1000) and an `is_featured` / `sort` to pick the six shown on the home page.
10. **ثورة ويكي**: entries are numbered in the order they're added to the register (083 is the latest). The year links go to `archive.html?y=&section=ثورة ويكي`. Render the chosen year's latest entries server-side, and point the search box at a query endpoint when the register grows. Add `data-img` to a row when the entry has a poster; without one, the preview builds its index card from the row.
11. **Article**: split the title into word spans in Blade (`@foreach(explode(' ', $post->title) as $i => $w)<span class="tw" style="--i:{{ $i }}">{{ $w }}</span> @endforeach`) and keep the whole title in the `h1`'s `aria-label`. Citations come from the editor as `[1]` markers, rendered as `.cite` links to the sources list.
12. **Author**: the portrait is the writer's cut-out photo on the teal tile. The profile's twelve-month strip is `GROUP BY month` over the last year: each `li` gets `--h` (the share of the busiest month) and a `data-tip` label.

## Images

- Posters: upload at **1080×1920**. Covers: at least **1520×856**. Author photo: **1120×1400** (4:5). Writer cut-out: transparent PNG, at least **800×1000**, with the shoulders touching the bottom edge.
- The demo images in `assets/img/posts` are low resolution and are for layout only.

## Open items for the client

- Real author photos and bios, plus links to the writers' accounts (the social icons currently point to `#`).
- Real counts per section and per author (the demo counts are consistent with each other but aren't live data).
