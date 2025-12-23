import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { FileText, Scale, ShoppingBag, AlertTriangle, Gavel, HelpCircle } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#3d3d35] to-[#2a2a24] text-white py-12 sm:py-16 md:py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto text-center"
            >
              <Scale className="w-12 h-12 sm:w-14 md:w-16 sm:h-14 md:h-16 mx-auto mb-4 sm:mb-6 text-white/80" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-3 sm:mb-4">Terms of Service</h1>
              <p className="text-sm sm:text-base md:text-lg text-white/80 px-2">
                Please read these terms carefully before using our services.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-10 sm:py-12 md:py-16">
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-8 sm:gap-10 md:gap-12">
              {/* Section 1 */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-3 sm:space-y-4"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#3d3d35]/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#3d3d35]" />
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">1. Acceptance of Terms</h2>
                </div>
                <div className="space-y-2 sm:space-y-3 text-gray-600 leading-relaxed text-sm sm:text-base">
                  <p>
                    By accessing and using Green Grass Store website and services, you agree to be bound by these Terms of Service and all applicable laws and regulations of the United Arab Emirates. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                  </p>
                </div>
              </motion.section>

              {/* Section 2 */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-3 sm:space-y-4"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#3d3d35]/10 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-[#3d3d35]" />
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">2. Products & Services</h2>
                </div>
                <div className="space-y-2 sm:space-y-3 text-gray-600 leading-relaxed text-sm sm:text-base">
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1 sm:space-y-2">
                    <li>All products are subject to availability</li>
                    <li>Prices are displayed in AED and may change without notice</li>
                    <li>Product images are for illustration purposes; actual products may vary slightly</li>
                    <li>We reserve the right to limit quantities or refuse orders</li>
                    <li>Orders are confirmed only after payment verification</li>
                  </ul>
                </div>
              </motion.section>

              {/* Section 3 */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-3 sm:space-y-4"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#3d3d35]/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-[#3d3d35]" />
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">3. User Responsibilities</h2>
                </div>
                <div className="space-y-2 sm:space-y-3 text-gray-600 leading-relaxed text-sm sm:text-base">
                  <p>As a user, you agree to:</p>
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1 sm:space-y-2">
                    <li>Provide accurate and complete information when making purchases</li>
                    <li>Not use the website for any unlawful purpose</li>
                    <li>Not attempt to gain unauthorized access to any part of the website</li>
                    <li>Not reproduce, duplicate, or exploit any portion of the website without permission</li>
                    <li>Maintain the confidentiality of your account credentials</li>
                  </ul>
                </div>
              </motion.section>

              {/* Section 4 */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-3 sm:space-y-4"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#3d3d35]/10 flex items-center justify-center flex-shrink-0">
                    <Gavel className="w-4 h-4 sm:w-5 sm:h-5 text-[#3d3d35]" />
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">4. Limitation of Liability</h2>
                </div>
                <div className="space-y-2 sm:space-y-3 text-gray-600 leading-relaxed text-sm sm:text-base">
                  <p>
                    Green Grass Store shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service. Our total liability shall not exceed the amount paid by you for the specific product or service giving rise to the claim.
                  </p>
                </div>
              </motion.section>

              {/* Section 5 */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-3 sm:space-y-4"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#3d3d35]/10 flex items-center justify-center flex-shrink-0">
                    <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-[#3d3d35]" />
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">5. Governing Law</h2>
                </div>
                <div className="space-y-2 sm:space-y-3 text-gray-600 leading-relaxed text-sm sm:text-base">
                  <p>
                    These terms shall be governed by and construed in accordance with the laws of the United Arab Emirates. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts of Dubai, UAE.
                  </p>
                </div>
              </motion.section>

              {/* Section 6 */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-3 sm:space-y-4"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#3d3d35]/10 flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#3d3d35]" />
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">6. Changes to Terms</h2>
                </div>
                <div className="space-y-2 sm:space-y-3 text-gray-600 leading-relaxed text-sm sm:text-base">
                  <p>
                    We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to the website. Your continued use of the website following the posting of revised terms means that you accept and agree to the changes.
                  </p>
                </div>
              </motion.section>

              {/* Contact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-gray-50 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 text-center"
              >
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Need Clarification?</h3>
                <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
                  If you have any questions about these Terms of Service, please contact us.
                </p>
                <a
                  href="/contact"
                  className="inline-flex items-center gap-2 text-[#2d5a3d] font-semibold hover:underline text-sm sm:text-base"
                >
                  Contact Us →
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;