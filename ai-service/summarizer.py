import re

def summarize_title(text: str) -> str:
    """
    Tóm tắt nội dung ghi chú thành Tiêu đề ngắn gọn, chuẩn xác:
    - Trích xuất: [Hành động cốt lõi] + [Đối tượng / Mục tiêu chính]
    - Tự động loại bỏ các trạng ngữ thời gian mở đầu (sáng thứ 3, 9h sáng, hôm nay...)
    - Tự động lược bỏ các câu râu ria (lên công ty sớm, nhớ hoàn thành trước...)
    - Tự động bóc tách hành động khi có câu nhờ vả/giao việc ("nói anh A làm báo cáo..." -> "Làm báo cáo...")
    """
    if not text or not text.strip():
        return "Ghi chú mới"

    # 1. Lấy câu đầu tiên hoặc dòng đầu tiên
    first_line = text.strip().split('\n')[0].strip()

    # 2. Xóa các mốc thời gian mở đầu lặp lại
    s = first_line
    for _ in range(2):
        s = re.sub(
            r'^(vào\s+)?(sáng|trưa|chiều|tối)?\s*(thứ\s+[2-7]|chủ\s+nhật|mai|nay|hôm\s+nay|ngày\s+mai|sáng\s+mai|chiều\s+nay|tối\s+nay|\d{1,2}[h:]\d{0,2}(\s*(sáng|trưa|chiều|tối))?)\s*',
            '',
            s,
            flags=re.IGNORECASE
        ).strip()
        s = re.sub(r'^\d{1,2}[h:]\d{0,2}(\s*(sáng|trưa|chiều|tối))?\s*', '', s, flags=re.IGNORECASE).strip()
        s = re.sub(r'^(vào\s+lúc|lúc)\s+\d{1,2}[h:]\d{0,2}\s*', '', s, flags=re.IGNORECASE).strip()
        s = re.sub(r'^ngày\s+\d{1,2}(/\d{1,2})?\s*', '', s, flags=re.IGNORECASE).strip()

    # 3. Loại bỏ các từ râu ria mở đầu như "lên công ty sớm", "đi làm sớm", "nhớ", "cần", "phải"
    s = re.sub(r'^(lên\s+công\s+ty\s*(sớm|muộn)?|đi\s+làm\s*(sớm|muộn)?|đến\s+văn\s+phòng\s*(sớm|muộn)?)\s*', '', s, flags=re.IGNORECASE).strip()
    s = re.sub(r'^(nhớ|cần|phải|hãy|đừng\s+quên)\s+', '', s, flags=re.IGNORECASE).strip()

    # 4. Khi câu có dạng giao việc: "nói anh/chị/em [Tên] làm gì" -> rút gọn thành "làm gì"
    s = re.sub(r'\bnói\s+(anh|chị|em|bạn)\s+[A-ZÀ-Ỹa-zà-ỹ0-9_]+\s+', '', s, flags=re.IGNORECASE).strip()

    # 5. Cắt bỏ các vế thời hạn / deadline ở cuối câu
    s = re.split(r',\s*(nhớ\s+)?(hoàn\s+thành\s+)?trước\s+\d{1,2}', s, flags=re.IGNORECASE)[0]
    s = re.split(r',\s*(hạn\s+chót|deadline)', s, flags=re.IGNORECASE)[0]
    s = re.split(r'\s+trước\s+\d{1,2}[h:]\d{0,2}', s, flags=re.IGNORECASE)[0]

    # 6. Gom cụm mục tiêu cho các cuộc họp/công việc:
    # VD: "họp khẩn với anh Tuấn phòng kỹ thuật để chốt phương án sửa lỗi giật lag server"
    # -> "Họp khẩn sửa lỗi giật lag server"
    m = re.search(
        r'^(họp[^\,]+?)\s+với\s+[^\,]+?\s+để\s+(chốt\s+phương\s+án\s+|bàn\s+về\s+|tìm\s+cách\s+)?(.+)$',
        s,
        flags=re.IGNORECASE
    )
    if m:
        action = m.group(1).strip()
        purpose = m.group(3).strip()
        s = f'{action} {purpose}'

    # 7. Xóa "Đi siêu thị" nếu có hành động "mua ..."
    s = re.sub(r'^đi\s+siêu\s+thị\s+(để\s+)?(?=mua\b)', '', s, flags=re.IGNORECASE).strip()

    # 8. Lược bớt các cụm rườm rà không cần thiết trong tiêu đề
    s = re.sub(r'\bchuẩn\s+bị\s+cho\s+(bài\s+kiểm\s+tra|kỳ\s+thi)\b', '', s, flags=re.IGNORECASE).strip()
    s = re.sub(r'\bcho\s+người\s+mới\b', '', s, flags=re.IGNORECASE).strip()
    s = re.sub(r'\bvào\s+(chiều|sáng|tối)\s+nay\b', '', s, flags=re.IGNORECASE).strip()

    # 9. Làm sạch khoảng trắng & dấu câu dư thừa
    s = re.sub(r'\s+', ' ', s).strip(' ,.;-')

    # Nếu câu vẫn còn quá dài (> 60 ký tự), lấy cụm ý chính đầu tiên
    if len(s) > 60:
        parts = re.split(r'[,;]', s)
        if len(parts[0]) >= 20:
            s = parts[0].strip()

    if not s:
        return "Ghi chú mới"

    # Viết hoa chữ cái đầu tiên
    return s[0].upper() + s[1:]
