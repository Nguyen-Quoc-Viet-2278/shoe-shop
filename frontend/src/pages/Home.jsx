import Header from "../components/Header";
import Banner from "../components/Banner";
import ProductList from "../components/ProductList";
import Features from "../components/Features";
import Newsletter from "../components/Newsletter";
import Footer from "../components/Footer";
import { useProducts } from "../hooks/useProducts";

export default function Home() {
  const { products, loading } = useProducts();

  return (
    <div className="bg-white">
      <Header />
      <Banner />
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ProductList products={products} />
      )}
      <Features />
      <Newsletter />
      <Footer />
    </div>
  );
}
