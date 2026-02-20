import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { Footer } from "../../../components/Footer";
import { getArticle, articles } from "../content";

export async function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: `${article.title} — Practice ERP Support`,
    description: article.description,
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F7FA]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-2 text-sm text-[#5C677D]">
          <Link href="/support" className="hover:text-[#3EB3E7] transition-colors">
            Support
          </Link>
          <span>/</span>
          <span className="text-[#0B1F3A] font-medium">{article.category}</span>
          <span>/</span>
          <span className="text-[#0B1F3A] truncate">{article.title}</span>
        </div>
      </div>

      {/* Article */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Back link */}
        <Link
          href="/support"
          className="inline-flex items-center gap-2 text-[#3EB3E7] hover:text-[#2da0d4] text-sm font-medium mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Support Center
        </Link>

        <div className="bg-white rounded-xl shadow-sm p-8 sm:p-12">
          {/* Category badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#3EB3E7]/10 text-[#3EB3E7] rounded-full text-xs font-semibold uppercase tracking-wide mb-6">
            <BookOpen className="h-3 w-3" />
            {article.category}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-[#0B1F3A] mb-4">
            {article.title}
          </h1>
          <p className="text-lg text-[#5C677D] mb-10 border-b border-gray-100 pb-10">
            {article.description}
          </p>

          {/* Sections */}
          <div className="space-y-10">
            {article.sections.map((section, i) => (
              <div key={i}>
                <h2 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                  {section.heading}
                </h2>
                <ul className="space-y-3">
                  {section.body.map((paragraph, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-3 text-[#374151] leading-relaxed"
                    >
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#3EB3E7] flex-shrink-0" />
                      {paragraph}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Related links */}
          {article.relatedLinks && article.relatedLinks.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-[#5C677D] uppercase tracking-wide mb-4">
                Related Articles
              </h3>
              <ul className="space-y-2">
                {article.relatedLinks.map((link, i) => (
                  <li key={i}>
                    <Link
                      href={link.href}
                      className="inline-flex items-center gap-2 text-[#3EB3E7] hover:text-[#2da0d4] font-medium transition-colors group"
                    >
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Still need help */}
        <div className="mt-8 bg-gradient-to-r from-[#0B1F3A] to-[#1a3454] rounded-xl p-8 text-center text-white">
          <h3 className="text-xl font-bold mb-2">Still need help?</h3>
          <p className="text-white/80 mb-6 text-sm">
            Can&apos;t find what you&apos;re looking for? Our support team is here for you.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-[#0B1F3A] rounded-md font-semibold hover:bg-[#F6F7FA] transition-colors text-sm"
          >
            Contact Support
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
