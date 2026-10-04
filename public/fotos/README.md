# Passport-style photos

Put the photos here (portrait 7:9, for example 700×900 px, as .jpg, .webp,
.png or .avif). They are picked up automatically at build time, sorted by file
name (`foto-01.webp`, `foto-02.webp`, …), and the carousel counter shows the
real total (for example "Photo 02/04").

Alt text comes from the `photos` list in `src/data/site.ts`, in the same
order. Setting a `src` there overrides the folder.

With no photos, the site shows a placeholder and hides the counter and the
Pause button. With a single photo there is no carousel.
