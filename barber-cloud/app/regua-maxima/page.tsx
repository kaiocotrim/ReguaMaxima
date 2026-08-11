import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowDown,
  ArrowRight,
  Bot,
  Check,
  Heart,
  Play,
  Rocket,
  Smartphone,
  Store,
  Users,
} from "lucide-react"

import Header from "@/app/_components/header"
import { DonationCoin, DonationProgress, JarMotion, Reveal } from "./motion-elements"
import styles from "./page.module.css"

export const metadata: Metadata = {
  title: "Apoie o Régua Máxima",
  description:
    "Faça parte da história do Régua Máxima e ajude o aplicativo a chegar à App Store e à Google Play.",
}

const goals = [
  { icon: Smartphone, label: "App Store", detail: "Licença de publicação" },
  { icon: Bot, label: "Google Play", detail: "Cadastro de desenvolvedor" },
  { icon: Rocket, label: "Versão mobile", detail: "Preparação e lançamento" },
]

const donationGoal = 800
const donations: number[] = []
const raisedAmount = donations.reduce((total, donation) => total + donation, 0)
const goalProgress = Math.min((raisedAmount / donationGoal) * 100, 100)

export default function ReguaMaximaPage() {
  return (
    <div className="min-h-screen bg-[#f4f5ef] text-[#183f40]">
      <Header />

      <main>
        <section className={`${styles.hero} px-5 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-20`}>
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between border-b border-white/15 pb-5 text-xs font-bold uppercase tracking-[0.18em] text-white/55">
              <span>Projeto independente • Brasil</span>
              <span className="hidden sm:block">App Store + Google Play</span>
            </div>

            <div className="grid gap-12 pt-12 lg:grid-cols-[1.2fr_.8fr] lg:items-end lg:pt-20">
              <div>
                <Reveal>
                  <h1 className="max-w-5xl text-[clamp(3.25rem,8vw,7.5rem)] font-black leading-[.88] tracking-[-.075em] text-white">
                    Ajude uma ideia brasileira a caber no seu bolso.
                  </h1>
                </Reveal>
              </div>

              <Reveal delay={0.12} className="border-l border-white/15 pl-6 lg:mb-2 lg:pl-9">
                <p className="text-lg leading-8 text-white/70">
                  O Régua Máxima está crescendo. Agora queremos levar a experiência
                  completa de barbearias, barbeiros e clientes também para{" "}
                  <strong className="text-white">iPhone e Android.</strong>
                </p>
                <Link
                  href="#apoie"
                  className="mt-7 inline-flex min-h-14 items-center gap-3 rounded-full bg-[#c8f135] px-6 font-black text-[#153536] transition hover:-translate-y-0.5 hover:bg-[#d6fa53]"
                >
                  Quero fazer parte
                  <ArrowDown className="size-4" aria-hidden="true" />
                </Link>
              </Reveal>
            </div>

            <div className={`${styles.goalGrid} mt-16 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 lg:mt-24`}>
              {goals.map(({ icon: Icon, label, detail }, index) => (
                <Reveal key={label} delay={0.18 + index * 0.07} className="bg-[#173c3d]/90 p-4 sm:p-6">
                  <Icon className="mb-7 size-5 text-[#c8f135]" aria-hidden="true" />
                  <strong className="block text-sm text-white sm:text-base">{label}</strong>
                  <span className="mt-1 hidden text-sm text-white/45 sm:block">{detail}</span>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.75fr_1.25fr] lg:gap-20">
            <div>
              <span className={styles.eyebrow}>De projeto a produto</span>
              <h2 className="mt-5 text-4xl font-black leading-[.98] tracking-[-.055em] sm:text-6xl">
                Construído com tempo, testes e muita vontade de fazer acontecer.
              </h2>
            </div>
            <div className="self-end lg:pb-1">
              <p className="text-xl leading-9 text-[#526665]">
                O Régua Máxima nasceu de uma ideia simples: criar uma plataforma
                moderna que facilite a rotina de barbearias, barbeiros e clientes.
                Depois de muito desenvolvimento, aprendizado e dedicação, a versão
                mobile já é o nosso próximo grande passo.
              </p>
              <p className="mt-6 text-xl font-bold leading-9">
                Para publicá-la oficialmente, precisamos das contas e licenças das
                duas lojas. É aqui que a sua ajuda muda a história.
              </p>
            </div>
          </div>
        </section>

        <section className="px-5 pb-20 sm:px-8 sm:pb-28">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex items-end justify-between gap-6">
              <div>
                <span className={styles.eyebrow}>Veja o projeto</span>
                <h2 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-5xl">
                  Conheça o Régua Máxima
                </h2>
              </div>
              <Play className="hidden size-10 text-[#9fbe2b] sm:block" aria-hidden="true" />
            </div>
            <div className={styles.videoFrame}>
              <iframe
                src="https://www.youtube-nocookie.com/embed/yqX5qP2vLQI?rel=0"
                title="Conheça o projeto Régua Máxima"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </section>

        <section id="apoie" className="scroll-mt-24 bg-[#e7e9df] px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.78fr] lg:gap-16">
            <div>
              <span className={styles.eyebrow}>A sua ajuda vira lançamento</span>
              <h2 className="mt-5 max-w-3xl text-5xl font-black leading-[.92] tracking-[-.065em] sm:text-7xl">
                Qualquer valor nos deixa mais perto das lojas.
              </h2>

              <div className="mt-12 grid gap-3 sm:grid-cols-2">
                {[
                  "Licença para publicação na App Store",
                  "Cadastro para publicação na Google Play",
                  "Preparação e publicação do aplicativo",
                  "Continuidade do desenvolvimento mobile",
                ].map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl bg-white/65 p-4">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#c8f135]">
                      <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                    </span>
                    <p className="text-sm font-bold leading-6">{item}</p>
                  </div>
                ))}
              </div>

              <p className="mt-9 max-w-2xl text-lg leading-8 text-[#526665]">
                R$ 5, R$ 10, R$ 20 ou qualquer quantia que você puder contribuir
                representa um apoio enorme. Se não puder contribuir agora,
                compartilhar também nos leva mais longe. 💚
              </p>
            </div>

            <aside className="lg:sticky lg:top-8 lg:self-start">
              <div className="overflow-hidden rounded-[2rem] bg-[#173c3d] text-white shadow-2xl shadow-[#173c3d]/20">
                <div className="p-7 sm:p-9">
                  <div className="flex items-center justify-between">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-[#c8f135] text-[#173c3d]">
                      <Heart className="size-6 fill-current" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-black uppercase tracking-[.18em] text-white/45">Via PIX</span>
                  </div>
                  <h3 className="mt-8 text-4xl font-black tracking-[-.05em]">Apoie o projeto</h3>
                  <p className="mt-3 leading-7 text-white/60">
                    Abra o aplicativo do seu banco e envie o valor que fizer sentido para você.
                  </p>

                  <div className="mt-8 rounded-2xl border border-white/15 bg-white/5 p-5">
                    <span className="text-xs font-bold uppercase tracking-[.16em] text-[#d7f96a]">Chave PIX</span>
                    <p className="mt-2 break-all text-lg font-black">[SUA CHAVE PIX]</p>
                  </div>
                </div>
                <div className="border-t border-white/10 bg-white/5 px-7 py-5 text-sm font-bold text-white/70 sm:px-9">
                  Todo valor faz diferença. Obrigado por acreditar.
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="bg-[#e7e9df] px-5 pb-20 sm:px-8 sm:pb-28">
          <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] bg-[#173c3d] text-white lg:grid-cols-[.85fr_1.15fr]">
            <div className="flex min-h-[430px] items-center justify-center bg-white/5 p-8 sm:p-12">
              <JarMotion className={styles.coinJar}>
                <div className={styles.jarLid} />
                <div className={styles.jarGlass} aria-label={`${donations.length} contribuições recebidas`}>
                  <div className={styles.coins}>
                    {donations.map((donation, index) => (
                      <DonationCoin
                        key={`${donation}-${index}`}
                        className={styles.coin}
                        title={`Doação de R$ ${donation.toFixed(2).replace(".", ",")}`}
                        delay={0.55 + index * 0.08}
                      >
                        $ 
                      </DonationCoin>
                    ))}
                  </div>
                  {donations.length === 0 && (
                    <span className={styles.emptyJar}>A primeira moeda pode ser a sua 💚</span>
                  )}
                </div>
              </JarMotion>
            </div>

            <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
              <span className="text-xs font-black uppercase tracking-[.2em] text-[#d7f96a]">
                Pote de contribuições
              </span>
              <h2 className="mt-4 text-4xl font-black tracking-[-.055em] sm:text-6xl">
                Meta: R$ 800
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-white/60">
                Cada doação recebida coloca uma nova moeda neste pote. Juntos,
                vamos completar o valor necessário para levar o aplicativo às lojas.
              </p>

              <div className="mt-10">
                <div className="mb-3 flex items-end justify-between gap-4">
                  <div>
                    <strong className="text-3xl font-black">
                      R$ {raisedAmount.toFixed(2).replace(".", ",")}
                    </strong>
                    <span className="ml-2 text-sm text-white/45">arrecadados</span>
                  </div>
                  <span className="text-sm font-bold text-white/55">
                    {Math.round(goalProgress)}%
                  </span>
                </div>
                <div
                  className="h-3 overflow-hidden rounded-full bg-white/10"
                  role="progressbar"
                  aria-valuenow={raisedAmount}
                  aria-valuemin={0}
                  aria-valuemax={donationGoal}
                  aria-label="Progresso da meta de doações"
                >
                  <DonationProgress
                    className={`${styles.progressFill} h-full rounded-full bg-[#c8f135]`}
                    progress={goalProgress / 100}
                  />
                </div>
                <div className="mt-4 flex items-center justify-between text-sm font-bold text-white/45">
                  <span>{donations.length} {donations.length === 1 ? "contribuição" : "contribuições"}</span>
                  <span>Objetivo: R$ 800,00</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={`${styles.founders} px-5 py-20 text-white sm:px-8 sm:py-28`}>
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-14 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
              <div>
                <h2 className="text-5xl font-black leading-[.94] tracking-[-.06em] sm:text-7xl">
                  Seu nome fará parte dessa história.
                </h2>
              </div>

              <div>
                <p className="text-xl leading-9 text-white/65">
                  Todos os contribuidores terão seus nomes homenageados em uma área
                  especial do futuro painel do Régua Máxima — um registro permanente
                  de quem acreditou no projeto antes de ele chegar às lojas.
                </p>
                <div className="mt-9 flex items-start gap-4 border-t border-white/15 pt-7">
                  <Users className="mt-1 size-6 shrink-0 text-[#c8f135]" aria-hidden="true" />
                  <p className="font-bold leading-7 text-white/85">
                    Ao contribuir, guarde o comprovante. Divulgaremos o canal para
                    envio do nome que será exibido no painel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 text-center sm:px-8 sm:py-28">
          <Store className="mx-auto size-9 text-[#9fbe2b]" aria-hidden="true" />
          <h2 className="mx-auto mt-7 max-w-4xl text-4xl font-black leading-[.98] tracking-[-.055em] sm:text-7xl">
            Estamos construindo apenas o começo.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#526665]">
            Ajude o Régua Máxima a chegar oficialmente à App Store e à Google Play.
          </p>
          <Link
            href="#apoie"
            className="mt-9 inline-flex min-h-14 items-center gap-3 rounded-full bg-[#173c3d] px-7 font-black text-white transition hover:-translate-y-0.5"
          >
            Apoiar o Régua Máxima 💚
            <ArrowRight className="size-5" aria-hidden="true" />
          </Link>
          <div className="mx-auto mt-20 max-w-7xl border-t border-[#173c3d]/15 pt-8 text-sm font-bold text-[#526665] sm:flex sm:justify-between">
            <span>Régua Máxima</span>
            <span className="mt-2 block sm:mt-0">Seu estilo. Seu horário. Sua barbearia.</span>
          </div>
        </section>
      </main>
    </div>
  )
}
