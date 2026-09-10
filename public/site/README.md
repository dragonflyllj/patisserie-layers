# Site imagery

Optional decorative images. Each one is used only if present; without it the
page falls back to its CSS design, which is a finished look in its own right.

| File to add | Where it appears | Shape |
| --- | --- | --- |
| `hero.jpg` | Home page background, behind the headline | Wide, 16:9 |
| `about-layers.jpg` | 「レイヤーズについて」, after the name section | 3:2 |
| `about-interior.jpg` | 「レイヤーズについて」, after the method section | 3:2 |

The hero has a cream scrim over it so the headline stays readable whatever the
photo's brightness — but a busy or very dark image on the left side will still
fight the text. Something calm with open space on the left works best.

After adding files, restart the dev server. If you replaced a file while
keeping the same name, clear `.next/cache/images` first.
