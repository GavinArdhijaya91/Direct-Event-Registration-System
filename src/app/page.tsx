import Link from "next/link";
import Image from "next/image";
import { getPrismaClient } from "@/lib/prisma";
import RevealObserver from "@/app/reveal-observer";
import ChristmasAudioPlayer from "@/app/christmas-audio-player";
import HeaderNav from "@/app/header-nav";
import HeroActions from "@/app/hero-actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const activities = [
  { image: "/images/christmas/svg/candle.svg", title: "Ibadah & Pemberkatan", description: "Merayakan kelahiran Yesus dalam firman dan doa" },
  { image: "/images/christmas/svg/christmas-tree.svg", title: "Pohon Natal", description: "Berhias bersama dan foto di pohon Natal" },
  { image: "/images/christmas/svg/bell.svg", title: "Konser Musik", description: "Puji-pujian dan lagu Natal penuh sukacita" },
  { image: "/images/christmas/svg/christmas-lights.svg", title: "Makan Bersama", description: "Berbagi hidangan dalam kebersamaan komunitas" },
  { image: "/images/christmas/svg/reindeer.svg", title: "Penampilan & Permainan", description: "Pertunjukan dan permainan Natal yang seru" },
];

export default async function Home() {
  const settings = await getPrismaClient().eventSettings.findUnique({
    where: { id: 1 },
    select: {
      eventName: true,
      eventDate: true,
      eventLocation: true,
      maxCapacity: true,
      registeredCount: true,
      registrationOpen: true,
    },
  });

  const isOpen = settings?.registrationOpen ?? false;
  const isFull = settings ? settings.registeredCount >= settings.maxCapacity : false;
  const canRegister = isOpen && !isFull;
  const remaining = settings
    ? Math.max(settings.maxCapacity - settings.registeredCount, 0)
    : 0;

  const formattedDate = settings?.eventDate
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "long",
        timeZone: "Asia/Jakarta",
      }).format(settings.eventDate)
    : "28 Januari 2027";

  return (
    <main className="home-page" data-reveal-root>
      <div aria-hidden="true" className="registration-snowfall">
        {Array.from({ length: 12 }, (_, index) => (
          <span className="registration-snowflake" key={index} />
        ))}
      </div>
      <RevealObserver />
      <ChristmasAudioPlayer />
      <header className="site-header" data-reveal>
        <div className="site-header-inner">
          <Link href="/" className="brand-lockup" aria-label="Natal PWK UNNES 2026, beranda">
            <Image
              src="/images/logos/logo-natal-pwk-2026.png"
              alt=""
              width={52}
              height={52}
              className="brand-logo"
              priority
            />
            <span className="brand-copy">
              <span className="brand-name">Natal PWK UNNES 2026</span>
              <span className="brand-tagline">Terang Natal menuntun Civitas Akademika</span>
            </span>
          </Link>

          <HeaderNav />
        </div>
      </header>

      <section className="christmas-hero">
        <div className="hero-snow hero-snow-one" aria-hidden="true" />
        <div className="hero-snow hero-snow-two" aria-hidden="true" />
        <div className="hero-foliage hero-foliage-left" aria-hidden="true" />
        <div className="hero-foliage hero-foliage-right" aria-hidden="true" />
        <div className="hero-layout">
          <div className="hero-copy" data-reveal>
            <p className="hero-eyebrow"><span aria-hidden="true">✦</span> Perayaan Natal PWK UNNES 2026</p>
            <h1 className="hero-title">
              Terang Natal,
              <br />
              <span>menuntun langkah kita.</span>
            </h1>
            <p className="hero-description">
              Sebagai Civitas Akademika PWK UNNES, mari berkumpul dalam terang
              Natal untuk merayakan kelahiran Yesus Kristus dan membawa sukacita
              di tengah kegelapan.
            </p>
            <HeroActions />
            <p className="hero-note">
              <span className="hero-note-star" aria-hidden="true">✧</span>
              Satu terang, banyak cerita perjalanan iman
            </p>
          </div>
          <div className="hero-artwork" data-reveal>
            <Image
              src="/images/natal-winter-scene.svg"
              alt="Ilustrasi pohon Natal dengan hiasan warna-warni, rusa, hadiah, dan suasana bersalju"
              width={900}
              height={760}
              priority
              className="hero-illustration"
            />
            <span className="artwork-caption">Terang di tengah kegelapan <span aria-hidden="true">✦</span></span>
          </div>
        </div>
        <div className="hero-bottom-line" aria-hidden="true" />
      </section>

      <section className="event-details" aria-label="Informasi acara" data-reveal>
        <div className="event-detail">
          <span className="detail-icon" aria-hidden="true">✳</span>
          <div>
            <p className="detail-label">Tanggal</p>
            <p className="detail-value">{formattedDate}</p>
          </div>
        </div>
        <div className="event-detail">
          <span className="detail-icon" aria-hidden="true">⌖</span>
          <div>
            <p className="detail-label">Lokasi</p>
            <p className="detail-value">{settings?.eventLocation ?? "L4, FEB UNNES"}</p>
          </div>
        </div>
        <div className="event-detail event-status">
          <span className="detail-icon" aria-hidden="true">✦</span>
          <div>
            <p className="detail-label">Pendaftaran</p>
            {canRegister ? (
              <p className="detail-value"><span className="status-dot" /> Dibuka · Tersisa {remaining} kuota peserta</p>
            ) : isFull ? (
              <p className="detail-value status-closed">Kuota penuh</p>
            ) : (
              <p className="detail-value status-closed">Sedang ditutup</p>
            )}
          </div>
        </div>
      </section>

      <section
        className="holiday-gallery"
        aria-labelledby="holiday-gallery-title"
        data-reveal
      >
        <div className="holiday-gallery-heading">
          <div>
            <p className="section-kicker">Suasana Natal</p>
            <h2 id="holiday-gallery-title">Terang di tengah kebersamaan.</h2>
          </div>
          <p className="holiday-gallery-desc">
            Ibadah, kebersamaan, dan berbagi menjadi inti perayaan Natal PWK UNNES.
          </p>
        </div>
        <div className="holiday-gallery-grid">
          <figure className="holiday-photo">
            <Image
              src="/images/christmas/photos/01-christmas-church-tree.webp"
              alt="Pohon Natal bercahaya di sisi sebuah gereja pada malam hari"
              width={702}
              height={341}
              sizes="(max-width: 680px) 100vw, (max-width: 900px) 50vw, 33vw"
              className="holiday-photo-image"
            />
            <figcaption><span>01</span> Perayaan penuh terang</figcaption>
          </figure>
          <figure className="holiday-photo">
            <Image
              src="/images/christmas/photos/03-nativity-scene.webp"
              alt="Adegan palungan dengan bintang terang di langit malam"
              width={610}
              height={263}
              sizes="(max-width: 680px) 50vw, (max-width: 900px) 50vw, 33vw"
              className="holiday-photo-image"
            />
            <figcaption><span>02</span> Kabar sukacita</figcaption>
          </figure>
          <figure className="holiday-photo">
            <Image
              src="/images/christmas/photos/04-gifts-and-lantern.webp"
              alt="Hadiah Natal dan lentera menyala di dekat pohon cemara"
              width={497}
              height={263}
              sizes="(max-width: 680px) 50vw, (max-width: 900px) 50vw, 33vw"
              className="holiday-photo-image"
            />
            <figcaption><span>03</span> Terang yang dibagikan</figcaption>
          </figure>
        </div>
      </section>

      <section className="verse-section" data-reveal>
        <Image
          src="/images/christmas/svg/christmas-lights.svg"
          alt=""
          aria-hidden="true"
          width={160}
          height={80}
          className="verse-garland"
        />
        <div
          className="verse-holiday-side verse-holiday-side-left"
          aria-hidden="true"
        >
          <Image
            src="/images/christmas/illustrations/santa.png"
            alt=""
            width={88}
            height={100}
            className="verse-santa"
          />
          <Image
            src="/images/christmas/illustrations/bauble.png"
            alt=""
            width={24}
            height={32}
            className="verse-bauble verse-bauble-left"
          />
          <Image
            src="/images/christmas/illustrations/bells.png"
            alt=""
            width={44}
            height={42}
            className="verse-bells verse-bells-left"
          />
        </div>
        <div
          className="verse-holiday-side verse-holiday-side-right"
          aria-hidden="true"
        >
          <Image
            src="/images/christmas/illustrations/reindeer.png"
            alt=""
            width={104}
            height={90}
            className="verse-reindeer"
          />
          <Image
            src="/images/christmas/illustrations/snowman.png"
            alt=""
            width={42}
            height={38}
            className="verse-snowman"
          />
          <Image
            src="/images/christmas/illustrations/bauble.png"
            alt=""
            width={24}
            height={32}
            className="verse-bauble verse-bauble-right"
          />
          <Image
            src="/images/christmas/illustrations/bells.png"
            alt=""
            width={44}
            height={42}
            className="verse-bells verse-bells-right"
          />
        </div>
        <div className="verse-ornament" aria-hidden="true">✧</div>
        <p className="section-kicker">Tema Natal PWK 2026</p>
        <blockquote>
          “Terang Natal menuntun Civitas Akademika di tengah kegelapan”
        </blockquote>
        <p className="verse-reference">Terinspirasi dari Yohanes 1:5</p>
      </section>

      <section id="kegiatan" className="activities-section" data-reveal>
        <div className="section-heading">
          <p className="section-kicker">Terangnya kebersamaan</p>
          <h2>Momen Natal yang penuh terang</h2>
          <p>Luangkan waktu untuk beribadah, berbagi, dan merayakan bersama dalam terang Natal.</p>
        </div>
        <div className="activities-grid">
          {activities.map((activity, index) => (
            <article className={`activity-card activity-card-${index + 1}`} key={activity.title}>
              <div className="activity-art" aria-hidden="true">
                <Image
                  src={activity.image}
                  alt=""
                  width={56}
                  height={56}
                  className="activity-illustration"
                />
                <i className="activity-spark activity-spark-one" />
                <i className="activity-spark activity-spark-two" />
              </div>
              <div className="activity-copy">
                <h3>{activity.title}</h3>
                <p>{activity.description}</p>
              </div>
              <span className="activity-number" aria-hidden="true">0{index + 1}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="attendee-info" data-reveal>
        <div className="info-card">
          <span className="info-icon" aria-hidden="true">✦</span>
          <h3>Sebelum mendaftar</h3>
          <ul>
            <li>Satu nomor WhatsApp untuk satu peserta</li>
            <li>Isi data diri dengan benar</li>
            <li>Simpan tautan tiket dan kode pemulihan</li>
          </ul>
        </div>
        <div className="info-card">
          <span className="info-icon" aria-hidden="true">❋</span>
          <h3>Terbuka untuk</h3>
          <div className="category-tags">
            <span>Mahasiswa</span>
            <span>Alumni</span>
            <span>Tamu Undangan</span>
          </div>
        </div>
        <div className="info-card capacity-card">
          <span className="info-icon" aria-hidden="true">♡</span>
          <h3>Kapasitas acara</h3>
          <p className="capacity-number">{settings?.maxCapacity ?? 250}</p>
          <p className="capacity-remaining">Sisa kuota: {remaining}</p>
        </div>
      </section>

      <section className="privacy-section" data-reveal>
        <div className="privacy-card">
          <span className="privacy-mark" aria-hidden="true">
            <svg
              className="h-5 w-5 text-emerald-800"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </span>
          <div>
            <h2>Data Anda tetap terjaga</h2>
            <p>
              Nomor WhatsApp dan data identitas hanya digunakan untuk kebutuhan acara ini.
              Simpan tautan tiket serta kode pemulihan dengan aman dan jangan membagikan tautan tiket pribadi Anda.
            </p>
          </div>
        </div>
      </section>

      <footer className="site-footer" data-reveal>
        <div className="footer-gift-border" aria-hidden="true" />
        <div className="footer-inner">
          <div className="footer-organizer">
            <Image
              src="/images/logos/logo-pwk.png"
              alt="PWK UNNES"
              width={41}
              height={40}
              className="footer-pwk-logo"
            />
          </div>
          <p className="footer-note">© 2026 PWK UNNES<br /><span>Bawa terang, bagikan sukacita.</span></p>
          <Image
            src="/images/logos/logo-unnes.png"
            alt="Universitas Negeri Semarang"
            width={30}
            height={40}
            className="footer-unnes-logo"
          />
        </div>
      </footer>
    </main>
  );
}
