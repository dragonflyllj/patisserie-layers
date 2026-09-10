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
- `.jpg`, `.jpeg`, `.png`, `.webp` and `.avif` are all accepted. Keep whatever
  extension the file already has — `egg-tart-4.png` works exactly as well as
  `egg-tart-4.jpg`, so there is no need to convert anything.
- **Windows tip:** File Explorer hides known extensions by default, so renaming
  a file to `egg-tart-4.jpg` in the GUI can silently produce
  `egg-tart-4.jpg.png`. That still works here, but to see what you are actually
  editing, turn on **View → Show → File name extensions** in Explorer.
- Around 1200×1200 is plenty. Next.js resizes them for each screen.
- Products with no file here keep their placeholder, so a partial set is fine.

After adding files, restart the dev server (`npm run dev`). If you **replaced**
a file while keeping the same name, also clear the image cache first, or the
old picture will keep showing:

```powershell
Remove-Item -Recurse -Force .next\cache\images    # PowerShell
rmdir /s /q .next\cache\images                    # Command Prompt
rm -rf .next/cache/images                          # macOS / Linux
```
