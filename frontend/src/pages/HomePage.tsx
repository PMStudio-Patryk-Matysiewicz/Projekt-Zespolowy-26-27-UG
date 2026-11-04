import FeatureTiles from '../components/home/FeatureTiles'
import Hero from '../components/home/Hero'
import SiteHeader from '../components/home/SiteHeader'
import styles from './HomePage.module.css'

export default function HomePage() {
  return (
    <div className={styles.page}>
      <SiteHeader />
      <Hero />
      <FeatureTiles />
    </div>
  )
}
