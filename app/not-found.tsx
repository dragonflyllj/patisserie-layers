/**
 * 404 page. Rendered by `notFound()` and for any unmatched route.
 */

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-32 text-center">
      <p className="eyebrow">404</p>
      <h1 className="font-display text-2xl mt-4">
        ページが見つかりませんでした
      </h1>
      <p className="text-sm text-muted mt-5 leading-loose">
        お探しのページは、移動または削除された可能性があります。
      </p>
      <div className="flex flex-wrap gap-3 justify-center mt-10">
        <Link
          href="/"
          className="rounded-full bg-ink text-cream px-8 py-3.5 text-sm hover:bg-accent-deep transition-colors"
        >
          トップページへ
        </Link>
        <Link
          href="/shop"
          className="rounded-full border border-ink/25 px-8 py-3.5 text-sm hover:border-accent hover:text-accent transition-colors"
        >
          オンラインショップ
        </Link>
      </div>
    </div>
  );
}
