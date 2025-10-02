import styles from "./page.module.css";
import Link from "next/link";

export default function Home() {
  return (
    <div className={styles.page}>
      <main style={{ padding: 24 }}>
        <h1>INVERTO</h1>
        <p>Studio → <Link href="/studio">/studio</Link> </p> 
        <p>API: /api/track, /api/c/[code], /api/cron/aggregate</p>
      </main>
    </div>
  );
}
