import os
import sys
import re

# Đảm bảo UTF-8 cho tiếng Việt
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stdin, 'reconfigure'):
    sys.stdin.reconfigure(encoding='utf-8')

# Thêm đường dẫn ai-service vào path
ai_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ai-service")
sys.path.append(ai_dir)

from personal_normalizer import parse_personal_note

def main():
    print("=" * 65)
    print("CHƯƠNG TRÌNH CHUẨN HÓA GHI CHÚ CÁ NHÂN (PERSONAL NOTE AI)")
    print("ĐÃ FIX CẢ 3 BUG:")
    print("  • Bug 01: Giữ nguyên câu hoàn chỉnh (không tách gãy 'tiếp theo')")
    print("  • Bug 02: Phân biệt rõ Thông tin mô tả vs Nhiệm vụ cần làm")
    print("  • Bug 03: Tách riêng từng người phụ trách (Minh, Lan, Mình...)")
    print("=" * 65)

    # Thử nghiệm với đúng trường hợp gặp lỗi của bạn
    test_bug = "Cuộc họp tiếp theo dự kiến diễn ra vào chiều thứ Sáu. Minh chuẩn bị tài liệu, Lan kiểm tra số liệu và mình gửi báo cáo cho sếp."
    print(f"\n[Test Case kiểm tra 3 Bug]:\n\"{test_bug}\"\n")
    
    res = parse_personal_note(test_bug)
    print("=" * 65)
    print("KẾT QUẢ CHUẨN HÓA:")
    print("=" * 65)
    print(f"Tiêu đề: {res['title']}")
    print(f"Tag:     {res['tag']} ({res['color']})")
    print("\nNội dung hiển thị thực tế trên thẻ:")
    print(res['formatted_content'])
    print("=" * 65)

    print("\nBây giờ bạn có thể nhập các câu ghi chú khác để kiểm tra tiếp:")
    print("(Nhập 'q' để thoát)\n")

    while True:
        try:
            line = input("✍️  Nhập ghi chú: ").strip()
            if not line:
                continue
            if line.lower() in ['q', 'exit', 'quit']:
                print("Tạm biệt bạn!")
                break

            r = parse_personal_note(line)
            print("\n" + "-" * 55)
            print(f"Tiêu đề: {r['title']} | Tag: {r['tag']}")
            print("Nội dung:")
            print(r['formatted_content'])
            print("-" * 55 + "\n")

        except (KeyboardInterrupt, EOFError):
            break

if __name__ == "__main__":
    main()
