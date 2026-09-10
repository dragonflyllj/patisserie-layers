# Product photos

Drop a photo here named after the product's ID and it appears on the site
automatically — no code change needed.

| File to add | Product |
| --- | --- |
| `egg-tart-4.jpg` | エッグタルト 4個入 |
| `financier-8.jpg` | フィナンシェ 8個入 |
| `madeleine-8.jpg` | マドレーヌ 8個入 |
| `cookie-tin.jpg` | クッキー缶 |
| `gateau-chocolat.jpg` | ガトーショコラ |
| `sable-diamant.jpg` | サブレ・ディアマン 2種 |
| `gift-box-assort.jpg` | 焼き菓子詰め合わせ ギフトボックス |
| `shortcake-whole.jpg` | ショートケーキ（ホール5号） |
| `mont-blanc.jpg` | モンブラン |
| `cheesecake-whole.jpg` | ベイクドチーズケーキ（ホール） |

- **Square images** work best — they are displayed in a 1:1 frame and cropped
  to fill, so anything else loses its edges.
- `.jpg`, `.jpeg`, `.png`, `.webp` and `.avif` are all accepted.
- Around 1200×1200 is plenty. Next.js resizes them for each screen.
- Products with no file here keep their placeholder, so a partial set is fine.

After adding files, restart the dev server (`npm run dev`). If you **replaced**
a file while keeping the same name, also clear the image cache first, or the
old picture will keep showing:

```bat
rmdir /s /q .next\cache\images
```
