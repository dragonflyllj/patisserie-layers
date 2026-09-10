/**
 * "About" page — the shop's story and its approach.
 *
 * ⚠️ PLACEHOLDER COPY. This reads as a plausible patisserie story, but it is
 * written, not reported: the pâtissier's name, training and opening year below
 * are invented. Replace this page with your own words before launch.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { SHOP } from "@/lib/shop";

export const metadata: Metadata = {
  title: "レイヤーズについて",
  description: SHOP.description,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <p className="eyebrow">About</p>
      <h1 className="font-display text-3xl sm:text-4xl mt-3">
        レイヤーズについて
      </h1>

      <div className="mt-14 space-y-10 text-sm leading-loose text-ink/85">
        <p>
          {SHOP.name}は、西武新宿線・都立家政の商店街の一角にある、
          小さなパティスリーです。厨房とショーケースのあいだに壁がなく、
          その日焼いているものの音や匂いが、そのまま店内に流れています。
        </p>

        <h2 className="font-display text-xl text-ink pt-4">店名のこと</h2>
        <p>
          レイヤーズという名前は、生地を折り重ねる作業からとりました。
          パイ生地は、折る回数を増やすほど層は薄くなり、
          焼いたときの立ち上がりが変わります。何層にするかは、
          その日の湿度とバターの状態を見て決めています。
          決まったレシピを繰り返すのではなく、
          毎日ちがう材料に合わせて手を変える——
          その積み重ねを、そのまま名前にしました。
        </p>

        <h2 className="font-display text-xl text-ink pt-4">つくり方のこと</h2>
        <p>
          生菓子は、その日に売り切れる量だけを仕込みます。
          夕方に売り切れてしまうことも多く、お越しいただいたのに
          お渡しできない日もあります。それでも、時間が経って
          落ちてしまった状態のものをお出ししたくないので、
          この作り方を続けています。
        </p>
        <p>
          いっぽうで焼き菓子は、焼いてから数日おいたほうが、
          バターと粉がなじんで香りが立ちます。贈りものとして
          相手のもとに届いた日に、いちばんいい状態になるように——
          そこから逆算して、配合と焼成を決めています。
        </p>

        <h2 className="font-display text-xl text-ink pt-4">
          オンラインショップについて
        </h2>
        <p>
          焼き菓子は全国へお送りしています。生菓子は、
          よい状態を保ったままお届けする方法が見つかっていないため、
          店頭でのお受け取りのみとさせていただいております。
          ご予約いただければ、ご希望の日にご用意してお待ちしています。
        </p>
      </div>

      <div className="mt-16 flex flex-wrap gap-3">
        <Link
          href="/shop"
          className="rounded-full bg-ink text-cream px-8 py-3.5 text-sm hover:bg-accent-deep transition-colors"
        >
          オンラインショップへ
        </Link>
        <Link
          href="/access"
          className="rounded-full border border-ink/25 px-8 py-3.5 text-sm hover:border-accent hover:text-accent transition-colors"
        >
          店舗案内
        </Link>
      </div>
    </div>
  );
}
