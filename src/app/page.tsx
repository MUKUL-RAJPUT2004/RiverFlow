import Header from './components/Header';
import HeroSection from './components/HeroSection';
import LatestQuestions from './components/LatestQuestions';
import TopContributers from './components/TopContributors';
import Footer from './components/Footer';

export default function Home() {
  return (
    <div>
      <Header />
      <HeroSection />
      <div>
        <span><LatestQuestions />
        </span>
        <span><TopContributers />
        </span>
      </div>
      <Footer />
    </div>
  );
}