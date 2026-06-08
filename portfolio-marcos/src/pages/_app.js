import '../styles/globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Analytics } from "@vercel/analytics/react";

function MyApp({ Component, pageProps }) {
  return (
    <div className="site-container">
      <Navbar />
      <main>
        <Component {...pageProps} />
      </main>
      <Footer />
      <Analytics />
    </div>
  );
}

export default MyApp;
