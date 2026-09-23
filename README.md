# وتد — Watad static theme

Static front-end theme for **وتد (watad.media)**. The whole thing is plain HTML, CSS and JavaScript: no framework and no build step. It's ready to be cut into Blade views.

- **Live preview:** https://imsemoo.github.io/watad-theme/
- **All pages:** https://imsemoo.github.io/watad-theme/pages.html

## Pages

| File | Page |
|---|---|
| `index.html` | الرئيسية |
| `article.html` | المقال (فصول، جداول ارقام، مراجع، يتبع القراءة) |
| `category.html` | القسم (سياسة) |
| `search.html` | نتائج البحث: قائمة / شبكة / مضغوط + تصفية تعمل |
| `search-empty.html` | البحث بلا نتائج |
| `author.html` | صفحة الكاتب (تبويبات، متابعة، حسابات) |
| `archive.html` | الارشيف «السجل» (شهور تفتح وتطوى) |
| `about.html` | من نحن (النص الرسمي) |
| `404.html` | الصفحة غير موجودة |
| `pages.html` | فهرس الصفحات للعرض على العميل |

Open any file directly in the browser. The only external request is Google Fonts (El Messiri + Amiri).

## Structure

```
assets/
  css/watad.css      one stylesheet, sections numbered 1–17
  js/watad.js        vanilla JS, behaviour opt-in via data-attributes
  img/brand/         logo + the six identity marks (SVG)
  img/posts/         demo images (posters 9:16, covers 16:9)
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

`--teal #0C4D5A` · `--sand #B9A779` · `--ink #282828` · `--grey #818189` · `--mid #5F5F66` · `--hair #DDE0E0` · `--paper #F2F2F2`
Fonts: `--disp` (El Messiri: headlines + UI), `--body` (Amiri: reading text).

## Content rules built into the CSS

- **Posters (9:16) are always shown whole**: `.poster` = `aspect-ratio:9/16`, no text over them.
- Covers (16:9) may crop: `.cover`, `.cover--wide`.
- No تشكيل, Western digits, no letter-spacing on Arabic, no shadows, gradients or rounded corners.
- A selected item is always underlined in sand (`.tab.is-active`, `.chip.is-active`, `.facet__opt.is-active`, `aria-current="page"`).

## Components

| Class | Use |
|---|---|
| `article.story` + `a.stretched` | Any clickable unit. The link covers the whole unit, so the author link inside it still works and there are no nested `<a>`. |
| `.kicker` | القسم — النوع |
| `.byline` | Author (link) + `<time>` |
| `.rail-label` | Section label in the rail (`<b>` title + note + link) |
| `.band` | Full-width teal section (has its own axis) |
| `.idx`, `.fg`, `.stat` | Numbered index row, figure row, big stat |
| `.facets` / `.facet__opt` | Filter rail |
| `.tabs`, `.chips`, `.pager`, `.btn`, `.btn--ghost`, `.link-accent`, `.social` | Controls |
| `.portrait` | Author photo 4:5. Replace the placeholder SVG with `<img>`. |

## JavaScript API (`data-*`)

| Attribute | Behaviour |
|---|---|
| `data-drawer`, `data-drawer-open`, `data-drawer-close` | Mobile menu |
| `data-search-overlay`, `data-search-open` | Search overlay (`/` shortcut, `Esc` closes) |
| `data-results` + `data-view-btn="list\|grid\|compact"` | Switch result views (kept in `?view=`) |
| `data-facets` + `data-facet="section" data-value="…"` on options, `data-item data-section data-type data-period` on items | Client-side filtering (demo). With real data, send the facets to the server as query params and drop the client filtering. |
| `data-result-count`, `data-filter-empty`, `data-facets-reset` | Counter, empty message, reset |
| `data-tabs="#list"` + `data-tab="…"` / `data-tab-item="…"` | Tabs that filter a list (author page) |
| `data-month` + `data-month-toggle` | Collapse / expand an archive month |
| `data-toc` | Highlights the chapter currently in view |
| `data-query` | Fills `?q=` into the heading and the input |
| `data-follow` | Follow button state (demo) |

## Laravel / Blade

1. **Layout**: take everything between `<!-- @partial: header -->` and `<!-- @endpartial -->` into `resources/views/partials/header.blade.php`, and do the same for the footer. `<head>` + `<main class="page">` + the axis layer become `layouts/app.blade.php`.
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
6. **Archive**: load a collapsed month's items on demand, for example with `fetch('/archive/2026/07')` into `.month__body`.

## Images

- Posters: upload at **1080×1920**. Covers: at least **1520×856**. Author photo: **1120×1400** (4:5).
- The demo images in `assets/img/posts` are low resolution and are for layout only.

## Open items for the client

- Real author photos and bios, plus links to the writers' accounts (the social icons currently point to `#`).
- Real counts per section and per author (the demo counts are consistent with each other but aren't live data).
