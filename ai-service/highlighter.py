import re

TIME_PATTERNS = [
    # Giờ giấc: 9h, 9h30, 9:30, 14 giờ 30 phút, 15h chiều, 9h sáng mai...
    r'(?i)\b(\d{1,2}[h:]\d{0,2}\s*(sáng|trưa|chiều|tối)?(\s+(hôm\s+nay|ngày\s+mai|sáng\s+mai|chiều\s+nay|tối\s+nay|thứ\s+[2-7]|chủ\s+nhật))?)',
    # Buổi & ngày: sáng mai, chiều nay, tối nay, ngày mai, tuần tới, cuối tuần...
    r'(?i)\b((sáng|trưa|chiều|tối)\s+(mai|nay)|hôm\s+nay|ngày\s+mai|tuần\s+(sau|tới)|cuối\s+tuần|thứ\s+[2-7]|chủ\s+nhật)\b',
    # Hạn chót: trước 17h, trước ngày 20, hạn chót 23h59...
    r'(?i)\b(trước\s+(\d{1,2}[h:]\d{0,2}|\d{1,2}\s*(tháng\s+\d{1,2}|hôm\s+nay|ngày\s+mai|thứ\s+[2-7]))|hạn\s+chót\s+[^\,\.\;\n]+)',
    # Ngày tháng: ngày 15/10, 20-11...
    r'(?i)\b(ngày\s+\d{1,2}(/\d{1,2}(/\d{2,4})?)?|\d{1,2}/\d{1,2}(/\d{2,4})?)\b'
]

ROLE_PATTERNS = [
    # Nhân sự & Phòng ban: anh Tuấn, chị Lan, sếp Hùng, team marketing, phòng kỹ thuật...
    r'(?i)\b((anh|chị|em|bạn|thầy|cô|sếp)\s+[A-ZÀ-Ỹ][a-zà-ỹ]+(\s+[A-ZÀ-Ỹ][a-zà-ỹ]+)*)',
    r'(?i)\b((team|nhóm|phòng|ban|đội\s+ngũ)\s+[a-zà-ỹA-ZÀ-Ỹ0-9\s]+?)(?=\s+(để|vào|lúc|ở|tại|,|\.|$))',
    r'(?i)\b(khách\s+hàng|đối\s+tác|giám\s+đốc|ban\s+điều\s+hành|hội\s+đồng\s+quản\s+trị)\b'
]

ACTION_VERBS = [
    r'(?i)\b(họp\s+khẩn|họp\s+standup|họp\s+bàn\s+giao|họp\s+[a-zà-ỹ0-9\s]+?)(?=\s+(với|ở|lúc|để|,|\.|$))',
    r'(?i)\b(sửa\s+lỗi\s+[a-zà-ỹ0-9\s]+?|khắc\s+phục\s+sự\s+cố\s+[a-zà-ỹ0-9\s]+?)(?=\s+(với|ở|lúc|để|,|\.|$))',
    r'(?i)\b(chốt\s+phương\s+án\s+[a-zà-ỹ0-9\s]+?|chốt\s+danh\s+sách\s+[a-zà-ỹ0-9\s]+?)(?=\s+(với|ở|lúc|để|,|\.|$))',
    r'(?i)\b(báo\s+cáo\s+[a-zà-ỹ0-9\s]+?|ký\s+hợp\s+đồng\s+[a-zà-ỹ0-9\s]+?)(?=\s+(với|ở|lúc|để|,|\.|$))',
    r'(?i)\b(deploy\s+phiên\s+bản\s+[a-zà-ỹ0-9\.\s]+?)(?=\s+(lên|ở|lúc|,|\.|$))',
    r'(?i)\b(ôn\s+tập\s+[a-zà-ỹ0-9\s]+?|làm\s+bài\s+tập\s+[a-zà-ỹ0-9\s]+?|nộp\s+bài\s+[a-zà-ỹ0-9\s]+?)(?=\s+(môn|cho|trước|lúc|,|\.|$))',
    r'(?i)\b(mua\s+[a-zà-ỹ0-9\,\s]+?)(?=\s+(tại|ở|cho|chiều|sáng|,|\.|$))',
    r'(?i)\b(thanh\s+toán\s+hóa\s+đơn\s+[a-zà-ỹ0-9\s]+?|gửi\s+tiền\s+tiết\s+kiệm)(?=\s+(tại|ở|cho|,|\.|$))',
    r'(?i)\b(đi\s+khám\s+[a-zà-ỹ0-9\s]+?|tập\s+gym|chạy\s+bộ\s+\d+km)(?=\s+(tại|ở|lúc|,|\.|$))'
]

def extract_and_highlight(text: str) -> dict:
    """
    Tự động trích xuất các ý chính (Thời gian, Nhân sự, Hành động cốt lõi)
    và tô đậm chúng bằng Markdown **...** mượt mà, chuyên nghiệp.
    """
    if not text or not text.strip():
        return {
            "highlighted_text": text,
            "extracted_points": []
        }

    raw = text.strip()
    
    # 1. Tìm tất cả các span cần tô đậm
    spans = []

    # Quét thời gian
    for pat in TIME_PATTERNS:
        for m in re.finditer(pat, raw):
            s, e = m.start(), m.end()
            chunk = raw[s:e].strip()
            if len(chunk) > 1:
                spans.append((s, e, "time"))

    # Quét nhân sự / phòng ban
    for pat in ROLE_PATTERNS:
        for m in re.finditer(pat, raw):
            s, e = m.start(), m.end()
            chunk = raw[s:e].strip()
            if len(chunk) > 2:
                spans.append((s, e, "role"))

    # Quét hành động chính
    for pat in ACTION_VERBS:
        for m in re.finditer(pat, raw):
            s, e = m.start(), m.end()
            chunk = raw[s:e].strip()
            if len(chunk) > 3:
                spans.append((s, e, "action"))

    if not spans:
        return {
            "highlighted_text": raw,
            "extracted_points": []
        }

    # 2. Sắp xếp các span
    spans.sort(key=lambda x: (x[0], -(x[1] - x[0])))
    
    # Gộp các span bị chạm hoặc gần nhau (cách nhau <= 1 ký tự khoảng trắng)
    merged_spans = []
    curr_s, curr_e, curr_label = spans[0]
    
    for s, e, l in spans[1:]:
        if s <= curr_e + 1: # Chồng lấn hoặc liền kề
            curr_e = max(curr_e, e)
        else:
            merged_spans.append((curr_s, curr_e, curr_label))
            curr_s, curr_e, curr_label = s, e, l
    merged_spans.append((curr_s, curr_e, curr_label))

    # 3. Tạo chuỗi văn bản đã được tô đậm
    result = []
    extracted_points = []
    last_idx = 0

    for s, e, label in merged_spans:
        # Đoạn chữ trước span
        result.append(raw[last_idx:s])
        
        target_chunk = raw[s:e].strip()
        # Không bọc đúp nếu đã có **
        if target_chunk.startswith("**") and target_chunk.endswith("**"):
            result.append(target_chunk)
            extracted_points.append(target_chunk.replace("**", ""))
        else:
            result.append(f"**{target_chunk}**")
            extracted_points.append(target_chunk)
            
        last_idx = e

    result.append(raw[last_idx:])
    highlighted_text = "".join(result)

    return {
        "highlighted_text": highlighted_text,
        "extracted_points": extracted_points
    }

if __name__ == "__main__":
    sample = "Sáng mai 9h họp khẩn với anh Tuấn phòng kỹ thuật để chốt phương án sửa lỗi giật lag server, nhớ hoàn thành trước 15h chiều."
    res = extract_and_highlight(sample)
    print("Văn bản gốc:\n", sample)
    print("\nSau khi AI tô đậm:\n", res["highlighted_text"])
    print("\nCác ý chính bóc tách được:", res["extracted_points"])
