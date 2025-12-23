import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Shield, Eye, Lock, FileText, Globe, UserCheck } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#2d5a3d] to-[#1a3d28] text-white py-12 sm:py-16 md:py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto text-center"
            >
              <Shield className="w-12 h-12 sm:w-14 md:w-16 sm:h-14 md:h-16 mx-auto mb-4 sm:mb-6 text-white/80" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-3 sm:mb-4">Privacy Policy</h1>
              <p className="text-sm sm:text-base md:text-lg text-white/80 px-2">
                Your privacy is important to us. This policy explains how we collect, use, and protect your information.
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
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#2d5a3d]/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#2d5a3d]" />
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">1. Information We Collect</h2>
                </div>
                <div className="space-y-2 sm:space-y-3 text-gray-600 leading-relaxed text-sm sm:text-base">
                  <p>We collect information you provide directly to us, including:</p>
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1 sm:space-y-2">
                    <li>Name, email address, phone number, and shipping address when you make a purchase</li>
                    <li>Payment information processed securely through our payment providers</li>
                    <li>Communication preferences and correspondence with our team</li>
                    <li>Account information if you create an account with us</li>
                  </ul>
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
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#2d5a3d]/10 flex items-center justify-center flex-shrink-0">
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-[#2d5a3d]" />
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">2. How We Use Your Information</h2>
                </div>
                <div className="space-y-2 sm:space-y-3 text-gray-600 leading-relaxed text-sm sm:text-base">
                  <p>We use the information we collect to:</p>
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1 sm:space-y-2">
                    <li>Process and fulfill your orders</li>
                    <li>Communicate with you about orders, products, and promotions</li>
                    <li>Improve our website and customer experience</li>
                    <li>Comply with legal obligations under UAE law</li>
                    <li>Prevent fraud and enhance security</li>
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
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#2d5a3d]/10 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-[#2d5a3d]" />
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">3. Data Protection</h2>
                </div>
                <div className="space-y-2 sm:space-y-3 text-gray-600 leading-relaxed text-sm sm:text-base">
                  <p>
                    We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. This includes:
                  </p>
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1 sm:space-y-2">
                    <li>SSL encryption for all data transmission</li>
                    <li>Secure payment processing through certified providers</li>
                    <li>Regular security audits and updates</li>
                    <li>Restricted access to personal information</li>
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
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#2d5a3d]/10 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-[#2d5a3d]" />
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">4. Cookies & Tracking</h2>
                </div>
                <div className="space-y-2 sm:space-y-3 text-gray-600 leading-relaxed text-sm sm:text-base">
                  <p>
                    We use cookies and similar technologies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookie settings through your browser preferences.
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
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#2d5a3d]/10 flex items-center justify-center flex-shrink-0">
                    <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#2d5a3d]" />
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">5. Your Rights</h2>
                </div>
                <div className="space-y-2 sm:space-y-3 text-gray-600 leading-relaxed text-sm sm:text-base">
                  <p>Under UAE data protection laws, you have the right to:</p>
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1 sm:space-y-2">
                    <li>Access your personal data</li>
                    <li>Request correction of inaccurate data</li>
                    <li>Request deletion of your data</li>
                    <li>Opt-out of marketing communications</li>
                    <li>Lodge a complaint with relevant authorities</li>
                  </ul>
                </div>
              </motion.section>

              {/* Contact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-gray-50 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 text-center"
              >
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Questions About Privacy?</h3>
                <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
                  Contact our privacy team at privacy@greengrassstore.com or call +971 54 775 1901
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

export default PrivacyPolicy;