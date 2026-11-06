# No. 54 "The King's Festival": where the initials and the vellum come from

Requested by the owner on 2026-11-06 03:13Z: real public-domain scans in place of the drawn (CSS/SVG) letters and clouds.

## The initials (source/assets/lombard-<letter>-<colour>.webp)

All of them come from one book, so they match:

- **Gregorius Bock, Scribal Pattern Book**, Swabia, about 1510-1517, on parchment. Yale University, Beinecke Rare Book
  and Manuscript Library, **MS 439**. A model book for scribes; it holds a whole alphabet of red and blue
  Lombardic capitals with flourished ends on ff. 31r-34v, three of each letter (A to Z, with K, Q, W and Y).
- Record: https://collections.library.yale.edu/catalog/10450154 (IIIF manifest
  https://collections.library.yale.edu/manifests/10450154).
- License: **public domain**. The book is about 500 years old; Yale shares its images of public-domain works freely
  (Yale Open Access policy), and the Public Domain Review lists this book's images as public domain.

| Initial | Paragraph | Leaf (Yale's image label) | Which of the three on its row |
| --- | --- | --- | --- |
| T blue, large | "The King of the courtyard…" (the part's opening) | f. 34r ("33v-34r") | 3rd |
| S red, medium | "Stranger and stranger…" (the circus acts) | f. 33v ("33v-34r") | 3rd |
| E blue, medium | "Elsewhere, the King is sober…" (the King) | f. 31v ("31v-32r") | 1st |
| K red, medium | "Knights atop their horses…" (the massacre) | f. 32v ("32v-33r") | 1st |

Ranked as in the manuscripts (owner, 2026-11-06 05:38Z): one large initial (3 lines) on the first paragraph, medium
ones (2 lines) on the paragraphs marked `"sec": true` in chapters_all.json, plain text everywhere else. Blue and red in
turn.

How they were cleaned: each letter was cut from the full-size scan; the vellum around it was taken away by how much ink
each pixel holds against the vellum next to it (so the show-through from the other side of the leaf stays out), and
loose dots and hairlines of the same letter were kept. The book's blue has faded to a grey-blue in places, so every
letter is set in the book's own strongest red (#9c4236) or blue (#48608c), keeping the scan's grain, and faded strokes
are made as solid as fresh ones. 320 px tall, WebP with transparency.

## The vellum (source/assets/vellum.webp)

- **Towneley Lectionary**, about 1550, a blank leaf. New York Public Library, Manuscripts and Archives Division
  (NYPL b12455533, image 1610013).
- Wikimedia Commons: https://commons.wikimedia.org/wiki/File:Towneley_Lectionary_(blank_page)_(NYPL_b12455533-1610013).tiff
  (source https://digitalcollections.nypl.org/items/510d47e3-ee0e-a3d9-e040-e00a18064a99).
- License: **public domain** (Public Domain Mark 1.0 on Commons; NYPL public-domain release).
- Cleaned: the middle of the leaf only (away from the ruled frame and the binding), 1130 x 1670 px from the 1920 px
  copy; tinted to the page's tan (#ba966c) with the leaf's own grain kept and its broad shading softened, so there are no
  blotches. The edges are only a little darker (a 16% vignette in site.css).
