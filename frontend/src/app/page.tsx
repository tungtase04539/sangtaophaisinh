import Link from 'next/link'
import { ArrowRight, Briefcase, Shield, Zap, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="text-2xl font-bold text-white">
          Sáng Tạo Phái Sinh
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-gray-300 hover:text-white transition">
            Đăng nhập
          </Link>
          <Link href="/register">
            <Button variant="default">
              Đăng ký
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-20 pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 px-4 py-2 rounded-full text-sm mb-8">
            <Zap className="h-4 w-4" />
            Nền tảng việc làm cho AI Content
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Bản địa hóa nội dung
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"> AI Tutorial </span>
            Trung Quốc
          </h1>

          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Tham gia cộng đồng CTV chuyên dịch và quay lại các video hướng dẫn AI từ Trung Quốc sang tiếng Việt. Nhận thu nhập theo từng dự án.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button className="text-lg px-8 py-6">
                Bắt đầu ngay
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login" className="text-gray-400 hover:text-white transition">
              Đã có tài khoản? Đăng nhập
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
            <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6">
              <Briefcase className="h-7 w-7 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Nhận việc linh hoạt</h3>
            <p className="text-gray-400">
              Chọn công việc phù hợp với khả năng và thời gian của bạn. Làm việc từ xa, tự quản lý thời gian.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
            <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6">
              <Shield className="h-7 w-7 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Thanh toán đảm bảo</h3>
            <p className="text-gray-400">
              Mức giá công khai, thanh toán sau khi Manager duyệt. Hệ thống ranking thưởng cho CTV uy tín.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
            <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6">
              <Users className="h-7 w-7 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Cộng đồng hỗ trợ</h3>
            <p className="text-gray-400">
              Tham gia cộng đồng CTV, học hỏi kinh nghiệm và nhận hỗ trợ từ các thành viên khác.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Sẵn sàng bắt đầu?
          </h2>
          <p className="text-purple-100 mb-8 max-w-xl mx-auto">
            Đăng ký ngay để nhận công việc đầu tiên và bắt đầu kiếm thu nhập từ kỹ năng dịch thuật của bạn.
          </p>
          <Link href="/register">
            <Button variant="secondary" className="text-lg px-8 py-6">
              Đăng ký miễn phí
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t border-white/10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © 2024 Sáng Tạo Phái Sinh. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="#" className="hover:text-white transition">Điều khoản</Link>
            <Link href="#" className="hover:text-white transition">Bảo mật</Link>
            <Link href="#" className="hover:text-white transition">Liên hệ</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
